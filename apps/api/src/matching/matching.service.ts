import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RunMatchingDto } from './dto/run-matching.dto';

interface HelperScore {
  helperId: string;
  score: number;
  reasoning: string;
  skillsFit: Record<string, any>;
  personalityFit: number;
  isWildcard: boolean;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
  ) {
    this.openai = new OpenAI({ apiKey: config.get('OPENAI_API_KEY') });
  }

  async runMatching(employerId: string, dto: RunMatchingDto) {
    const cacheKey = `match:${employerId}:${dto.jobId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const helpers = await this.prisma.helper.findMany({
      where: { isVetted: true, isProfileVisible: true },
      take: 50,
    });

    if (helpers.length === 0) return { results: [], total: 0 };

    // Score all helpers concurrently in batches of 10
    const BATCH_SIZE = 10;
    const batches: typeof helpers[] = [];
    for (let i = 0; i < helpers.length; i += BATCH_SIZE) {
      batches.push(helpers.slice(i, i + BATCH_SIZE));
    }

    const batchResults = await Promise.all(
      batches.map((batch) => this.scoreHelperBatch(batch, dto)),
    );

    const allScores = batchResults.flat().sort((a, b) => b.score - a.score);

    const top10 = allScores.slice(0, 10);
    // Mark 2-3 wildcards from lower ranks (interesting mismatches)
    const wildcards = allScores.slice(10, 13).map((s) => ({ ...s, isWildcard: true }));
    const finalResults = [...top10, ...wildcards];

    // Persist to DB
    await this.prisma.matchResult.deleteMany({ where: { employerId, jobId: dto.jobId } });
    await this.prisma.matchResult.createMany({
      data: finalResults.map((r, idx) => ({
        employerId,
        jobId: dto.jobId,
        helperId: r.helperId,
        score: r.score,
        reasoning: r.reasoning,
        skillsFit: r.skillsFit,
        personalityFit: r.personalityFit,
        isWildcard: r.isWildcard,
        rank: idx + 1,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      })),
    });

    const response = { results: finalResults, total: finalResults.length };
    await this.redis.set(cacheKey, JSON.stringify(response), 3600);
    return response;
  }

  private async scoreHelperBatch(helpers: any[], job: RunMatchingDto): Promise<HelperScore[]> {
    const helperDescriptions = helpers.map((h) =>
      JSON.stringify({
        id: h.id,
        nationality: h.nationality,
        yearsExp: h.yearsExperience,
        languages: h.languages,
        cooking: h.cookingTypes,
        petCare: h.hasPetCare,
        driving: h.hasDriving,
        childrenExp: h.childrenExperience,
        elderlyExp: h.elderlyExperience,
        mbti: h.mbtiType,
      }),
    );

    const prompt = `You are a domestic helper matching engine for Hong Kong.
Score each helper (0-100) for this job requirement.

JOB REQUIREMENTS:
${JSON.stringify(job)}

HELPERS TO SCORE:
${helperDescriptions.join('\n')}

Return a JSON array with this exact structure for each helper:
[{
  "helperId": "...",
  "score": 85,
  "reasoning": "Strong match because...",
  "skillsFit": {"languages": true, "cooking": true, "childcare": false},
  "personalityFit": 0.8
}]

Only return the JSON array, no other text.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.get('OPENAI_MODEL', 'gpt-4o'),
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      const scores = Array.isArray(parsed) ? parsed : parsed.results || [];
      return scores.map((s: any) => ({ ...s, isWildcard: false }));
    } catch (err) {
      this.logger.error('OpenAI scoring error', err);
      // Fallback: rule-based scoring
      return helpers.map((h) => ({
        helperId: h.id,
        score: this.ruleBasedScore(h, job),
        reasoning: 'Scored by rule-based fallback',
        skillsFit: {},
        personalityFit: 0.5,
        isWildcard: false,
      }));
    }
  }

  private ruleBasedScore(helper: any, job: RunMatchingDto): number {
    let score = 50;
    if (helper.yearsExperience >= (job.yearsExpNeeded || 0)) score += 15;
    if (job.languagesRequired?.some((l) => helper.languages.includes(l))) score += 10;
    if (job.needsPetCare && helper.hasPetCare) score += 10;
    if (job.needsDriving && helper.hasDriving) score += 10;
    if (job.nationalityPref === helper.nationality) score += 5;
    return Math.min(score, 100);
  }

  async getMatchResults(employerId: string, jobId: string) {
    const results = await this.prisma.matchResult.findMany({
      where: { employerId, jobId },
      include: {
        helper: {
          select: {
            id: true,
            fullName: true,
            nationality: true,
            yearsExperience: true,
            languages: true,
            profilePhotoUrl: true,
            mbtiType: true,
            // Never include phone field
          },
        },
      },
      orderBy: { rank: 'asc' },
    });
    return results;
  }
}
