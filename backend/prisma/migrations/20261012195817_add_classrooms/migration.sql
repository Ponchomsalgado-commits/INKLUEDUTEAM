-- CreateEnum
CREATE TYPE "ClassroomType" AS ENUM ('GRUPO', 'INDIVIDUAL');

-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "join_code" TEXT NOT NULL,
    "type" "ClassroomType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_members" (
    "classroom_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classroom_members_pkey" PRIMARY KEY ("classroom_id","student_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_join_code_key" ON "classrooms"("join_code");

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_members" ADD CONSTRAINT "classroom_members_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_members" ADD CONSTRAINT "classroom_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
