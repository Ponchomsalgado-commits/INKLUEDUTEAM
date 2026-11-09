-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT NOT NULL,
    "icon" VARCHAR(40) NOT NULL DEFAULT 'star',

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_badges" (
    "student_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "streak_count" INTEGER NOT NULL DEFAULT 1,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_badges_pkey" PRIMARY KEY ("student_id","badge_id")
);

-- CreateIndex
CREATE INDEX "assignments_classroom_id_idx" ON "assignments"("classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_activity_id_classroom_id_key" ON "assignments"("activity_id", "classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "teacher_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
