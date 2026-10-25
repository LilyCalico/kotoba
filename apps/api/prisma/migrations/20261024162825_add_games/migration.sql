-- CreateEnum
CREATE TYPE "UiLocale" AS ENUM ('ja', 'en');

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL,
    "word_id" TEXT NOT NULL,
    "locale" "UiLocale" NOT NULL,
    "hints_revealed" INTEGER NOT NULL,
    "history" JSONB NOT NULL,
    "result" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "games_expires_at_idx" ON "games"("expires_at");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EnableRowLevelSecurity
-- ポリシーを置かず、Supabase の Data API（anon / authenticated ロール）からは読み書きできなくする。
-- api はテーブルの所有者のロールで接続するため、RLS の対象にならない。
ALTER TABLE "games" ENABLE ROW LEVEL SECURITY;
