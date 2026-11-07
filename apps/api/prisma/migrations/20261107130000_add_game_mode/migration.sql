-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('guess_word', 'guess_meaning');

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "mode" "GameMode" NOT NULL DEFAULT 'guess_word';

