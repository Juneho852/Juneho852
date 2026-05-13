// Shared TypeScript types across API and Web

export type UserRole = 'EMPLOYER' | 'HELPER' | 'BROKER' | 'ADMIN';
export type JobStatus = 'DRAFT' | 'ACTIVE' | 'MATCHED' | 'INTERVIEW_SCHEDULED' | 'OFFER_MADE' | 'HIRED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FAILED';
export type ContractType = 'SSA' | 'ID407' | 'ESCROW_RELEASE';

export interface HelperPublicProfile {
  id: string;
  fullName: string;
  nationality: string;
  yearsExperience: number;
  languages: string[];
  cookingTypes: string[];
  hasPetCare: boolean;
  hasDriving: boolean;
  mbtiType?: string;
  profilePhotoUrl?: string;
  isVetted: boolean;
  aiVettingScore?: number;
  // NOTE: phone is NEVER included in public profile
}

export interface MatchResult {
  helperId: string;
  helper?: HelperPublicProfile;
  score: number;
  reasoning: string;
  skillsFit: Record<string, boolean>;
  personalityFit: number;
  isWildcard: boolean;
  rank: number;
}

export interface JobRequirements {
  title: string;
  yearsExpNeeded: number;
  numChildren: number;
  numElderly: number;
  languagesRequired: string[];
  cookingRequired: string[];
  needsPetCare: boolean;
  needsDriving: boolean;
  nationalityPref?: string;
  budgetMin: number;
  budgetMax: number;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface ProxySession {
  sessionId: string;
  proxyNumber: string;  // +852 virtual — NEVER the real number
  expiresAt: string;
}
