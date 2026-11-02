import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = 3000;
const API_PORT = 3001;
const GEMINI_STUB_PORT = 3002;

const WEB_URL = `http://localhost:${WEB_PORT}`;
const API_ORIGIN = `http://localhost:${API_PORT}`;
const GEMINI_STUB_ORIGIN = `http://localhost:${GEMINI_STUB_PORT}`;

const isCI = Boolean(process.env.CI);

/** next dev / nest start はワークスペースのルートから起動する。 */
const REPO_ROOT = "..";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  // CI では失敗箇所をログに出しつつ、成果物として残す HTML も併せて書き出す。
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["html", { open: "never" }]],

  use: {
    // web と api は同一ホストに載る。テストは本番と同じ相対パスだけを使う。
    baseURL: WEB_URL,
    trace: "on-first-retry",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      // Gemini API の代わり。決まった規則で入力を分類し、実際の API とキーなしで E2E を流す。
      command: "node gemini-stub.js",
      port: GEMINI_STUB_PORT,
      env: { GEMINI_STUB_PORT: String(GEMINI_STUB_PORT) },
      reuseExistingServer: !isCI,
    },
    {
      command: "pnpm --filter @kotoba/api dev",
      cwd: REPO_ROOT,
      // api の Gemini の接続先をスタブへ向ける。キーはスタブが見ないため、空でなければ何でもよい。
      env: { GEMINI_API_KEY: "e2e-stub", GEMINI_BASE_URL: GEMINI_STUB_ORIGIN },
      // api のルートはすべて POST で、GET にはどのパスも 404 を返す。Playwright が 2xx を待つ
      // url ではなく、ポートが接続を受け付けたことだけを待つ port を使う。
      port: API_PORT,
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @kotoba/web dev",
      cwd: REPO_ROOT,
      url: WEB_URL,
      env: { API_PROXY_ORIGIN: API_ORIGIN },
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
});
