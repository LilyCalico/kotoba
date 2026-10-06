-- CreateEnum
CREATE TYPE "Language" AS ENUM ('sv', 'ja');

-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('noun', 'verb', 'adjective', 'phrase');

-- CreateTable
CREATE TABLE "words" (
    "id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "word" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "part_of_speech" "PartOfSpeech" NOT NULL,
    "frequency" INTEGER NOT NULL,
    "accepted_answers" TEXT[],
    "definition" JSONB NOT NULL,
    "teaser" JSONB NOT NULL,
    "hints" JSONB NOT NULL,
    "literal" JSONB,
    "note" JSONB,
    "example" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "words_language_idx" ON "words"("language");
