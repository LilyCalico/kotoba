import { expect, test } from "@playwright/test";

test("トップページが表示される", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("相対パス /api/v1 が api サービスに届く", async ({ request }) => {
  // web と api はどちらも未知のパスに 404 を返すため、状態コードでは区別できない。
  // 応答を組み立てたサーバーは X-Powered-By に表れる。
  const proxied = await request.get("/api/v1/__wiring__");
  expect(proxied.headers()["x-powered-by"]).toBe("Express");

  const notProxied = await request.get("/__wiring__");
  expect(notProxied.headers()["x-powered-by"]).toBe("Next.js");
});
