## 非機能要件

- 英語 README（アーキテクチャ図、トレードオフ、AI 統制の設計判断を記載）
- ユニットテスト（解答判定ロジック中心）+ E2E 数本（Playwright）
- CI/CD: GitHub Actions（lint / test / deploy。deploy 時に Prisma migration を実行）
- 依存関係更新: Renovate による自動アップデート PR
  - モノレポ全体（`apps/web`, `apps/api`, `packages/shared`）を対象に、関連パッケージをグループ化（例: NestJS 系、Prisma 系をそれぞれ 1PR に）
  - patch/minor は CI グリーンで自動マージ、major は手動レビュー
- アクセシビリティ: 下記「アクセシビリティ」節を参照（European Accessibility Act 準拠を意識）
- パフォーマンス: Lighthouse / Core Web Vitals を計測し README に数値を記載
- i18n: UI は ja / en
- 開発規約: CLAUDE.md をリポジトリに配置。意味単位の小さいコミット + Co-Authored-By
- AI 品質: 解答判定 AI・はい/いいえ応答の eval セットをリポジトリに置く。CI での実行タイミングは、プロンプト/eval 関連パスを変更する PR のみ（paths フィルタ）+ nightly で全件実行（実 API 呼び出しのコストと flakiness を全 PR に乗せない）
