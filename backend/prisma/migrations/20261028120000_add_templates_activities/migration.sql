-- CreateTable
CREATE TABLE "game_templates" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "skin" VARCHAR(40) NOT NULL,
    "display_name" VARCHAR(80) NOT NULL,
    "schema_json" JSONB NOT NULL,

    CONSTRAINT "game_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_activities" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "content_json" JSONB NOT NULL,
    "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content_version" INTEGER NOT NULL DEFAULT 1,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_templates_type_skin_key" ON "game_templates"("type", "skin");

-- CreateIndex
CREATE INDEX "teacher_activities_teacher_id_idx" ON "teacher_activities"("teacher_id");

-- AddForeignKey
ALTER TABLE "teacher_activities" ADD CONSTRAINT "teacher_activities_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_activities" ADD CONSTRAINT "teacher_activities_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "game_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;