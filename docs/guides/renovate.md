# Renovate の設定手順

依存関係の更新 PR を自動で作り、安全なものは自動でマージさせる。方針は [`docs/specifications/non-functional-requirements.md`](../specifications/non-functional-requirements.md) の「依存関係更新」節が定める。

## 1. GitHub App を入れる

Renovate はホスト版の GitHub App を使う。自前でワークフローを回す構成は取らない。

1. https://github.com/apps/renovate を開き、**Install** を押す
2. 対象を **Only select repositories** にして、このリポジトリを選ぶ
3. インストール直後に Renovate が Onboarding PR（`Configure Renovate`）を作る

Onboarding PR には検出した依存と、初回に作られる予定の PR の一覧が載る。**この PR をマージするまで Renovate は更新 PR を作らない。** マージすると `renovate.json` がリポジトリに入り、以降はその内容で動く。

## 2. 全体の方針を書く

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "dependencyDashboard": true,
  "mode": "full",
  "timezone": "Europe/Stockholm",
  "schedule": ["at any time"],
  "labels": ["dependencies"],
  "minimumReleaseAge": "7 days",
  "vulnerabilityAlerts": {
    "addLabels": ["security"],
    "schedule": ["at any time"]
  }
}
```

| キー | 意味 |
| --- | --- |
| `extends: ["config:recommended"]` | 標準プリセット。個別ルールはこの上に重ねる |
| `dependencyDashboard` | 待機中・失敗中の更新を一覧する Issue を立てる。PR 数の上限に達した分もここに出る |
| `mode: "full"` | PR と Issue を通常どおり作る。`silent` にするとダッシュボードのみになる |
| `timezone` | `schedule` の解釈に使うタイムゾーン |
| `schedule: ["at any time"]` | 時間帯を絞らない。絞る場合は `["after 9am on monday"]` のように書く |
| `labels` | 作成する PR に付けるラベル |
| `minimumReleaseAge: "7 days"` | 公開から 7 日未満のバージョンは対象にしない。公開直後に取り下げられたリリースを踏まない |
| `vulnerabilityAlerts` | 脆弱性由来の更新は `minimumReleaseAge` を待たず即時に出し、`security` ラベルを付ける |

## 3. 自動マージの範囲を決める

`packageRules` に、パッケージの条件と適用する設定を並べる。

```json
"packageRules": [
  {
    "description": "Automerge patch updates (devDependencies only)",
    "matchDepTypes": ["devDependencies"],
    "matchUpdateTypes": ["patch"],
    "automerge": true,
    "automergeType": "pr",
    "automergeStrategy": "squash"
  },
  {
    "description": "Automerge @types/* for minor/patch updates",
    "matchPackageNames": ["/^@types//"],
    "matchUpdateTypes": ["minor", "patch"],
    "automerge": true,
    "automergeType": "pr",
    "automergeStrategy": "squash"
  },
  {
    "description": "Automerge linters (minor/patch only)",
    "matchPackageNames": ["/eslint/", "/prettier/", "/stylelint/"],
    "matchUpdateTypes": ["minor", "patch"],
    "automerge": true,
    "automergeType": "pr",
    "automergeStrategy": "squash"
  },
  {
    "description": "eslint-config-next must be updated in lockstep with next — never automerge",
    "matchPackageNames": ["eslint-config-next"],
    "automerge": false
  }
]
```

押さえる点が 3 つある。

**`packageRules` は後ろが勝つ。** 上から順に評価し、条件に一致したルールの設定を順次上書きする。`eslint-config-next` は 3 番目のルール（`/eslint/` に一致）で自動マージ対象になるため、それを打ち消すルールを**最後に**置いている。順序を入れ替えると効かなくなる。

**正規表現はスラッシュで囲む。** `matchPackageNames` の値は、`/^@types//` のようにスラッシュで囲んだ場合のみ正規表現として扱われる。囲まない `@types/node` は完全一致になる。

**`automergeType: "pr"` は CI の成功が前提。** Renovate は PR を作り、必須ステータスチェックが通ってからマージする。チェックが必須に設定されていなければ、CI の結果を待たずにマージされる。

## 4. ブランチ保護を設定する

自動マージを安全に成立させるには、GitHub 側の設定が要る。

1. Settings → Branches → Add branch ruleset
2. 対象ブランチに `develop` と `main` を指定する
3. **Require status checks to pass** を有効にし、`.github/workflows/ci.yml` のジョブ `ci` を必須にする

これで CI が落ちた更新は自動マージされず、Dependency Dashboard に滞留する。

## 5. 対象ブランチを確認する

Renovate は既定でリポジトリのデフォルトブランチに対して PR を作る。このリポジトリのデフォルトブランチは `main` だが、開発は `develop` で進めるため、対象を明示する。

```json
"baseBranchPatterns": ["develop"]
```

かつての `baseBranches` は非推奨で、指定すると設定検証が `Config migration necessary` を警告する。

## モノレポでの挙動

Renovate は `pnpm-workspace.yaml` を読み、各ワークスペースの `package.json` を検出する。ワークスペース構成のための追加設定は要らない。

既定では 1 パッケージにつき 1 つの PR が作られる。バージョンを揃えて動かす必要があるパッケージ群では、これが問題になる。`@nestjs/core` は同じバージョンの `@nestjs/common` を peer dependency として要求するため、片方だけを上げた木では CI が落ちる。`prisma`（CLI）と `@prisma/client`（実行時）も一致していなければ生成物と食い違う。

同じ `groupName` を与えたパッケージは 1 つの PR にまとまり、揃った状態で 1 回だけ CI が走る。

```json
{
  "description": "Group NestJS packages — they must move in lockstep",
  "matchPackageNames": ["/^@nestjs//"],
  "groupName": "nestjs"
},
{
  "description": "Group Prisma packages — CLI and client must match",
  "matchPackageNames": ["prisma", "@prisma/client"],
  "groupName": "prisma"
}
```

`config:recommended` に含まれる `group:monorepos` プリセットが、よく知られたモノレポ由来のパッケージ群（`react` と `react-dom` など）を既にまとめる。プリセットの対象に含まれるかどうかに依存させたくないものは、上記のように明示する。

グルーピングのルールは `packageRules` の先頭側に置く。末尾には、自動マージを打ち消すルールだけを残す。

## 動作を確認する

- **Dependency Dashboard**: Issue 一覧に `Dependency Dashboard` が立つ。チェックボックスを操作すると、その更新の PR 作成を即時に要求できる
- **ログ**: https://developer.mend.io/ でリポジトリを選ぶと、実行ログと各依存の判定理由を確認できる
- **設定の検証**: `npx --yes --package renovate -- renovate-config-validator` で `renovate.json` の構文を検査する

## つまずきポイント

### 更新 PR が 1 つも来ない

**症状**: インストール済みなのに PR が作られない。

**原因**: Onboarding PR が未マージ。または `minimumReleaseAge` の 7 日を満たすバージョンがまだない。

**対処**: Onboarding PR をマージする。急ぐ場合は Dependency Dashboard のチェックボックスから個別に要求する。

### 自動マージされずに PR が残る

**症状**: 自動マージ対象のはずの PR がマージされない。

**原因**: 必須ステータスチェックが失敗している、またはブランチ保護で承認が必須になっている。

**対処**: CI の失敗を直す。レビュー承認を必須にしている場合、自動マージは成立しないため、自動マージ対象のパスでは承認要件を外す。

### 意図しないパッケージが自動マージされる

**症状**: 手動レビューしたいパッケージが自動でマージされた。

**原因**: `packageRules` の順序。後ろのルールが前の設定を上書きする。

**対処**: 除外したいパッケージのルールを配列の末尾に置く。

### 正規表現が一致しない

**症状**: `matchPackageNames` に書いたパターンが効かない。

**原因**: スラッシュで囲んでいないため、完全一致として扱われている。

**対処**: `/^@nestjs//` のようにスラッシュで囲む。

### PR が想定と違うブランチに向く

**症状**: `develop` で開発しているのに、PR が `main` に向く。

**原因**: `baseBranches` が未指定のため、デフォルトブランチが対象になっている。

**対処**: `renovate.json` に `"baseBranchPatterns": ["develop"]` を加える。
