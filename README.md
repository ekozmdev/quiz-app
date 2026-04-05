# Quiz App

JSON の問題セットをブラウザで解ける React + Vite アプリです。

## できること

- `src/data` 直下の `.json` を自動で読み込む
- `single` / `multiple` / `ordering` の 3 形式に対応する
- `explanation` を Markdown として表示する
- GitHub Pages へ GitHub Actions 経由で公開できる

## データ運用

- ローカルで追加する問題 JSON は `src/data/*.json` に置く
- `src/data/*.json` は `.gitignore` 対象
- ただし GitHub Pages 用の公開サンプルとして `src/data/sample-pages.json` だけはコミット対象
- JSON 形式の検証は次で実行できる

```bash
node .agents/skills/quiz-json-output/scripts/validate-quiz-json.mjs path/to/file.json
```

## ローカル起動

```bash
npm install
npm run dev
```

## GitHub Pages 公開手順

前提:

- リポジトリに push できること
- リポジトリで GitHub Actions と GitHub Pages を使えること

手順:

1. このリポジトリを GitHub に push する
2. GitHub で対象リポジトリを開く
3. `Settings` -> `Pages` を開く
4. `Build and deployment` の `Source` を `GitHub Actions` にする
5. デフォルトブランチが `main` であることを確認する
6. そのブランチへ push する
7. `Actions` タブで `Deploy to GitHub Pages` ワークフローが成功するのを待つ
8. `Settings` -> `Pages` に表示される公開 URL を開く

補足:

- このリポジトリには `.github/workflows/deploy.yml` を追加してあります
- Vite の `base` は `vite.config.ts` で GitHub Actions 環境から自動計算します
- ユーザーサイトやカスタムドメインで `base` を `/` に固定したい場合は、build 時に `BASE_PATH=/` を与えて上書きできます

例:

```bash
BASE_PATH=/ npm run build
```

## React アプリを作って GitHub Pages に出す最短手順

このリポジトリと同じ流れで新規作成する場合:

1. `npm create vite@latest` で React + TypeScript アプリを作る
2. 依存を入れる
3. `npm run dev` でローカル確認する
4. `vite.config.ts` で GitHub Pages 用の `base` を設定する
5. `.github/workflows/deploy.yml` を追加する
6. GitHub の `Settings` -> `Pages` で `Source: GitHub Actions` を選ぶ
7. `main` ブランチへ push する
8. Actions 成功後に Pages の URL を確認する

## 公式ドキュメント

- GitHub Pages の公開元設定: [GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- GitHub Pages のカスタムワークフロー: [GitHub Docs](https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- Vite の静的デプロイ: [Vite Docs](https://vite.dev/guide/static-deploy.html#github-pages)
