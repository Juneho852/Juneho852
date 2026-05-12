-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EMPLOYER', 'HELPER', 'BROKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'MATCHED', 'INTERVIEW_SCHEDULED', 'OFFER_MADE', 'HIRED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProxySessionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'DELETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "phoneIv" TEXT,
    "companyName" TEXT,
    "district" TEXT,
    "stripeCustomerId" TEXT,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "searchLimit" INTEGER NOT NULL DEFAULT 10,
    "plan" TEXT NOT NULL DEFAULT 'basic',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Helper" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneIv" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "languages" TEXT[],
    "cookingTypes" TEXT[],
    "hasPetCare" BOOLEAN NOT NULL DEFAULT false,
    "hasDriving" BOOLEAN NOT NULL DEFAULT false,
    "childrenExperience" INTEGER NOT NULL DEFAULT 0,
    "elderlyExperience" INTEGER NOT NULL DEFAULT 0,
    "mbtiType" TEXT,
    "profilePhotoUrl" TEXT,
    "documentUrls" TEXT[],
    "isVetted" BOOLEAN NOT NULL DEFAULT false,
    "aiVettingScore" DOUBLE PRECISION,
    "aiMatchScore" DOUBLE PRECISION,
    "isProfileVisible" BOOLEAN NOT NULL DEFAULT false,
    "brokerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Helper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyName" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "phone" TEXT,
    "phoneIv" TEXT,
    "stripeAccountId" TEXT,
    "stripeOnboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "payoutHoldDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "yearsExpNeeded" INTEGER NOT NULL,
    "numChildren" INTEGER NOT NULL DEFAULT 0,
    "numElderly" INTEGER NOT NULL DEFAULT 0,
    "languagesRequired" TEXT[],
    "cookingRequired" TEXT[],
    "needsPetCare" BOOLEAN NOT NULL DEFAULT false,
    "needsDriving" BOOLEAN NOT NULL DEFAULT false,
    "nationalityPref" TEXT,
    "mbtiProfile" JSONB,
    "budgetMin" INTEGER NOT NULL,
    "budgetMax" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "skillsFit" JSONB NOT NULL,
    "personalityFit" DOUBLE PRECISION NOT NULL,
    "isWildcard" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "brokerId" TEXT,
    "jobId" TEXT,
    "stripePaymentIntentId" TEXT NOT NULL,
    "stripeTransferId" TEXT,
    "amount" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "brokerAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'hkd',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "capturedAt" TIMESTAMP(3),
    "transferredAt" TIMESTAMP(3),
    "hireConfirmedAt" TIMESTAMP(3),
    "refundedAmount" INTEGER,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "paymentId" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProxySession" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "twilioSessionSid" TEXT NOT NULL,
    "proxyNumber" TEXT NOT NULL,
    "ttlSeconds" INTEGER NOT NULL,
    "status" "ProxySessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProxySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "brokerId" TEXT,
    "jobId" TEXT,
    "type" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "docusignEnvelopeId" TEXT,
    "pdfUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_userId_key" ON "Employer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Helper_userId_key" ON "Helper"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Broker_userId_key" ON "Broker"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Broker_licenseNumber_key" ON "Broker"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobId_helperId_key" ON "JobApplication"("jobId", "helperId");

-- CreateIndex
CREATE INDEX "MatchResult_employerId_jobId_idx" ON "MatchResult"("employerId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ProxySession_twilioSessionSid_key" ON "ProxySession"("twilioSessionSid");

-- CreateIndex
CREATE INDEX "ProxySession_employerId_helperId_idx" ON "ProxySession"("employerId", "helperId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Helper" ADD CONSTRAINT "Helper_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Helper" ADD CONSTRAINT "Helper_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broker" ADD CONSTRAINT "Broker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "Helper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "Helper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxySession" ADD CONSTRAINT "ProxySession_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxySession" ADD CONSTRAINT "ProxySession_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "Helper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
