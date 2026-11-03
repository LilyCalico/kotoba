-- CreateTable
CREATE TABLE "rate_limit_counters" (
    "key" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("key","window_start")
);

-- CreateIndex
CREATE INDEX "rate_limit_counters_window_start_idx" ON "rate_limit_counters"("window_start");

-- EnableRowLevelSecurity
-- ポリシーを置かず、Supabase の Data API（anon / authenticated ロール）からは読み書きできなくする。
-- api はテーブルの所有者のロールで接続するため、RLS の対象にならない。
ALTER TABLE "rate_limit_counters" ENABLE ROW LEVEL SECURITY;
