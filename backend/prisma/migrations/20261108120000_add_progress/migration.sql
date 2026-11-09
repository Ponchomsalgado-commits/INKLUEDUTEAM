-- CreateTable
CREATE TABLE "progress" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total_preguntas" INTEGER NOT NULL,
    "content_version" INTEGER NOT NULL,
    "client_attempt_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_answers" (
    "id" TEXT NOT NULL,
    "progress_id" TEXT NOT NULL,
    "pregunta_id" TEXT NOT NULL,
    "opcion_id" INTEGER NOT NULL,
    "correcta" BOOLEAN NOT NULL,

    CONSTRAINT "progress_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "progress_student_id_client_attempt_id_key" ON "progress"("student_id", "client_attempt_id");

-- CreateIndex
CREATE INDEX "progress_activity_id_idx" ON "progress"("activity_id");

-- CreateIndex
CREATE INDEX "progress_answers_progress_id_idx" ON "progress_answers"("progress_id");

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "teacher_activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_answers" ADD CONSTRAINT "progress_answers_progress_id_fkey" FOREIGN KEY ("progress_id") REFERENCES "progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
