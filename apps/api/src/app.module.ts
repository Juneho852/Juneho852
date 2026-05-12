import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MatchingModule } from './matching/matching.module';
import { PaymentsModule } from './payments/payments.module';
import { CommunicationsModule } from './communications/communications.module';
import { DocumentsModule } from './documents/documents.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    MatchingModule,
    PaymentsModule,
    CommunicationsModule,
    DocumentsModule,
    JobsModule,
  ],
})
export class AppModule {}
