-- CreateEnum
CREATE TYPE "JobState" AS ENUM ('SCHEDULED', 'CANCELED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScheduleMode" AS ENUM ('BACKFILL', 'INCREMENTAL');

-- CreateTable
CREATE TABLE "JobSchedule" (
    "name" VARCHAR(255) NOT NULL,
    "state" "JobState" NOT NULL DEFAULT E'SCHEDULED',
    "scheduleMode" "ScheduleMode" NOT NULL,
    "cursor" VARCHAR(255) NOT NULL,
    "limit" INTEGER NOT NULL,
    "currentFailCount" INTEGER NOT NULL DEFAULT 0,
    "previousScheduledAt" TIMESTAMP(6),
    "scheduledAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "JobSchedule_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "note" TEXT NOT NULL,
    "state" "JobState" NOT NULL,
    "info" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobSchedule_scheduledAt_idx" ON "JobSchedule"("scheduledAt");

-- CreateIndex
CREATE INDEX "JobSchedule_cursor_idx" ON "JobSchedule"("cursor");

-- CreateIndex
CREATE INDEX "JobSchedule_state_idx" ON "JobSchedule"("state");

-- CreateIndex
CREATE INDEX "JobLog_name_idx" ON "JobLog"("name");

-- AddForeignKey
ALTER TABLE "JobLog" ADD CONSTRAINT "JobLog_name_fkey" FOREIGN KEY ("name") REFERENCES "JobSchedule"("name") ON DELETE RESTRICT ON UPDATE CASCADE;