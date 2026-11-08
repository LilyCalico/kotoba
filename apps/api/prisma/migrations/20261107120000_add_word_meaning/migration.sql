-- AlterTable
-- 既存の行は空のオブジェクトで埋めて列を足し、既定値は残さない。中身は seed で書き込む。
ALTER TABLE "words" ADD COLUMN     "meaning" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "words" ALTER COLUMN "meaning" DROP DEFAULT;
