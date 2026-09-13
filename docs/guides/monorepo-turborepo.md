# モノレポと Turborepo の設定手順

Next.js と NestJS を 1 つのリポジトリに同居させ、共有パッケージを挟む構成を組み立てる手順。採用理由は [ADR 0001](../adr/0001-turborepo-as-task-runner.md) を参照する。

## 前提

パッケージを分けるのは構成上の必然による。NestJS は `experimentalDecorators` と `emitDecoratorMetadata` を有効にした tsconfig を要求し、DI がコンパイル後に残る型メタデータに依存する。Next.js は Turbopack / SWC の経路でビルドされ、この設定を共有できない。`package.json` と `tsconfig.json` をアプリごとに分けた時点でモノレポになる。

最終的な配置は次のとおり。

```
kotoba/
├─ apps/web/         Next.js（App Router）
├─ apps/api/         NestJS（REST）
├─ packages/shared/  型・zod スキーマ
├─ package.json      ワークスペースルート
├─ pnpm-workspace.yaml
├─ turbo.json
└─ vercel.json
```

## 1. ワークスペースを定義する

`pnpm-workspace.yaml` の `packages` に、ワークスペースとして扱うディレクトリの glob を書く。ここに一致し、かつ `package.json` を持つディレクトリがワークスペースになる。

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## 2. ルートの package.json をワークスペースルートにする

ルートはアプリではない。満たす条件は 3 つ。

- **アプリの依存を持たない。** `next` や `@nestjs/core` はそれぞれのワークスペースに置く
- **scripts は `turbo run` への転送にする。** 実体は各ワークスペースの scripts が持つ
- **`packageManager` はルートだけに書く。** リポジトリ全体で 1 つの pnpm バージョンを使う

```json
{
  "name": "kotoba",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": { "turbo": "^2" },
  "packageManager": "pnpm@10.28.0"
}
```

## 3. 既存のアプリを apps/web へ移す

履歴を残すため `git mv` を使う。`git` が追跡していないファイル（`next-env.d.ts` は `.gitignore` の対象）は通常の `mv` で移す。

```bash
mkdir -p apps/web
for f in app public next.config.ts tsconfig.json eslint.config.mjs postcss.config.mjs package.json; do
  git mv "$f" apps/web/"$f"
done
mv next-env.d.ts apps/web/
rm -rf .next
```

移したあと `apps/web/package.json` を 2 点直す。

- `name` をスコープ付きに変える（`@kotoba/web`）
- `packageManager` を削除する。ルートに移したため

## 4. .gitignore の先頭スラッシュを外す

**モノレポ化で最も見落としやすい箇所。** 先頭のスラッシュは「リポジトリルート限定」を意味するため、そのままでは `apps/web/node_modules` や `apps/api/dist` が無視されない。

```diff
-/node_modules
-/.next/
+node_modules
+.next/
+dist/
+.turbo
```

`dist/`（NestJS と共有パッケージの出力）と `.turbo`（Turborepo のキャッシュ）も対象に加える。

## 5. 共有パッケージを作る

**ビルド成果物を配る形にする。** `main` に TypeScript のソースを直接指定してはいけない。NestJS は `nest build` でコンパイルしたうえで `node dist/main.js` として実行するため、実行時に `.ts` は解決できない。

```json
{
  "name": "@kotoba/shared",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  },
  "scripts": { "build": "tsc", "typecheck": "tsc --noEmit" },
  "dependencies": { "zod": "^4" },
  "devDependencies": { "typescript": "^6" }
}
```

tsconfig は `rootDir` と `outDir` を明示し、`declaration` を有効にする。

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "node16",
    "moduleResolution": "node16",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "declaration": true
  },
  "include": ["src/**/*.ts"]
}
```

ESM のため、相対 import には拡張子を付ける。**ソースが `game.ts` でも `.js` と書く**（TypeScript はコンパイル後の姿で解決する）。

```typescript
// packages/shared/src/index.ts
export * from "./game.js";
```

## 6. NestJS アプリを作る

`package.json` に `"type": "module"` を置く。NestJS 12 は ESM で配布されており、CommonJS からは読めない。

tsconfig で押さえる項目は次のとおり。

| 設定 | 理由 |
| --- | --- |
| `experimentalDecorators` / `emitDecoratorMetadata` | `@Module()` `@Injectable()` と DI の解決に要る |
| `module` / `moduleResolution`: `node16` | 旧来の `node`（node10）は TypeScript 6 で非推奨 |
| `rootDir: "./src"` | TypeScript 6 は出力ディレクトリ構造の明示を要求する |
| `types: ["node"]` | 指定しないと `process` が解決できない |

公開ルーティングで割り当てた接頭辞は、アプリ側で受ける。Vercel Services はサービスに元のリクエストパスをそのまま渡すため、`/api/v1/games` は `/games` に縮まらない。

```typescript
// apps/api/src/main.ts
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("api/v1");
await app.listen(process.env.PORT ?? 3001);
```

## 7. 共有パッケージを繋ぐ

`workspace:` プロトコルは npm レジストリを見ず、リポジトリ内のワークスペースを指す。zsh では `*` が展開されるためクォートする。

```bash
pnpm --filter @kotoba/web add "@kotoba/shared@workspace:*"
pnpm --filter @kotoba/api add "@kotoba/shared@workspace:*"
```

実体はシンボリックリンクになる。

```
apps/web/node_modules/@kotoba/shared -> ../../../../packages/shared
```

## 8. Turborepo を入れる

ルートに追加する。

```bash
pnpm add -w -D turbo
```

`turbo.json` を置く。

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

各キーの意味は次のとおり。

| キー | 意味 |
| --- | --- |
| `dependsOn: ["^build"]` | `^` は「自身が依存するワークスペースの同名タスク」。順序は各 `package.json` の依存から導出されるため、実行順をここに書かない |
| `outputs` | キャッシュ対象のパス。ヒット時はここに書かれた成果物が復元される |
| `!.next/cache/**` | 先頭の `!` は除外。Next.js の内部キャッシュを取り込むとキャッシュエントリが肥大する |
| `cache: false` | 開発サーバーは実行のたびに結果が変わるため、キャッシュしない |
| `persistent: true` | 終了しないタスクである宣言。これがないと後続タスクの実行を待ち続ける |

## 9. 動作を確認する

```bash
pnpm install
pnpm build            # 1 回目。全ワークスペースをビルドする
pnpm build            # 2 回目。>>> FULL TURBO と表示される
```

タスクグラフとキャッシュの判定はドライランで検査できる。

```bash
pnpm exec turbo run build --dry=json
```

`@kotoba/api#build` と `@kotoba/web#build` の `dependencies` に `@kotoba/shared#build` が現れていれば、順序の導出が効いている。

## 10. CI を確認する

`.github/workflows/ci.yml` はルートで `pnpm install --frozen-lockfile` / `pnpm lint` / `pnpm build` を実行する。ルートの scripts が `turbo run` への転送になったため、ワークフローの変更は要らない。`lint` スクリプトを持たないワークスペースは Turborepo が自動で飛ばす。

## 日常のコマンド

| やること | コマンド |
| --- | --- |
| 依存のインストール | `pnpm install`（ルートで 1 回） |
| 全体のビルド | `pnpm build` |
| web と api の同時起動 | `pnpm dev` |
| 特定ワークスペースに依存を追加 | `pnpm --filter @kotoba/web add <pkg>` |
| 特定ワークスペースのスクリプト実行 | `pnpm --filter @kotoba/api build` |
| ワークスペース内の CLI 実行 | `pnpm --filter @kotoba/api exec nest build` |
| ルート自身に依存を追加 | `pnpm add -w -D <pkg>` |

## つまずきポイント

### 依存がルートに入ってしまう

**症状**: `pnpm add motion` を実行したのに、アプリから解決できない。

**原因**: `--filter` のない `pnpm add` はルートの `package.json` に追加する。ルートの依存はアプリの `node_modules` には現れない。

**対処**: `pnpm --filter <workspace> add <pkg>` を使う。ルート自身に入れる場合のみ `-w` を付ける。

### 共有パッケージの変更が反映されない

**症状**: `packages/shared` を編集したのに、アプリの挙動が変わらない。

**原因**: シンボリックリンクが指しているのは `dist` であり、`src` ではない。

**対処**: `pnpm build`（`dependsOn` により `packages/shared` が先にビルドされる）を実行する。

### 型は通るのに実行時に解決できない

**症状**: `tsc --noEmit` は成功するが、`node dist/main.js` が共有パッケージを解決できない。

**原因**: 共有パッケージの `main` が TypeScript のソースを指している。

**対処**: 手順 5 のとおり `dist` を指す形にし、`turbo.json` の `dependsOn: ["^build"]` で先にビルドされることを保証する。この 2 つはセットで機能する。

### ERR_MODULE_NOT_FOUND が出る

**症状**: ESM のパッケージで、相対 import が実行時に解決できない。

**原因**: ESM は相対 import の拡張子を省略できない。

**対処**: `from "./game.js"` のように拡張子を付ける。ソースが `.ts` でも指定は `.js` にする。

### キャッシュヒットしたのに成果物がない

**症状**: ビルドは成功と表示されるのに、出力ディレクトリが空。

**原因**: `turbo.json` の `outputs` に成果物のパスが含まれていない。Turborepo は指定されたパスしか保存・復元しない。

**対処**: `outputs` にパスを追加する。復旧は `pnpm build --force` でキャッシュを無視して再実行する。

### turbo が開発サーバーで止まる

**症状**: `pnpm dev` を実行すると、開発サーバーは立ち上がるが後続のタスクに進まない。

**原因**: `dev` タスクに `persistent: true` がない。

**対処**: `turbo.json` の `dev` に `"persistent": true` と `"cache": false` を指定する。

### zsh で workspace:* が解釈されない

**症状**: `zsh: no matches found: @kotoba/shared@workspace:*`

**原因**: zsh が `*` をグロブとして展開しようとする。

**対処**: 引数全体をクォートする。`pnpm --filter @kotoba/web add "@kotoba/shared@workspace:*"`
