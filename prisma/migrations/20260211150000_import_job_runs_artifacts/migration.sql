-- CreateTable
CREATE TABLE "import_job_runs" (
    "id" UUID NOT NULL,
    "import_job_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_job_artifacts" (
    "id" UUID NOT NULL,
    "import_job_id" UUID NOT NULL,
    "import_job_run_id" UUID,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_job_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_job_runs_import_job_id_created_at_idx" ON "import_job_runs"("import_job_id", "created_at");

-- CreateIndex
CREATE INDEX "import_job_runs_organization_id_created_at_idx" ON "import_job_runs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "import_job_runs_status_idx" ON "import_job_runs"("status");

-- CreateIndex
CREATE INDEX "import_job_artifacts_import_job_id_created_at_idx" ON "import_job_artifacts"("import_job_id", "created_at");

-- CreateIndex
CREATE INDEX "import_job_artifacts_import_job_run_id_idx" ON "import_job_artifacts"("import_job_run_id");

-- CreateIndex
CREATE INDEX "import_job_artifacts_organization_id_created_at_idx" ON "import_job_artifacts"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "import_job_artifacts_kind_idx" ON "import_job_artifacts"("kind");

-- AddForeignKey
ALTER TABLE "import_job_runs" ADD CONSTRAINT "import_job_runs_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_runs" ADD CONSTRAINT "import_job_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_runs" ADD CONSTRAINT "import_job_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_artifacts" ADD CONSTRAINT "import_job_artifacts_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_artifacts" ADD CONSTRAINT "import_job_artifacts_import_job_run_id_fkey" FOREIGN KEY ("import_job_run_id") REFERENCES "import_job_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_artifacts" ADD CONSTRAINT "import_job_artifacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_artifacts" ADD CONSTRAINT "import_job_artifacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
