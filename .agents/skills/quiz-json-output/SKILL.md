---
name: quiz-json-output
description: Generate quiz-set JSON for this repository's browser quiz app from a document or URL. Use when the user wants source material converted into `title` / `description` / `questions` JSON, and validate the output with the bundled validator before returning it.
---

# Quiz JSON Output

このスキルは、このリポジトリのクイズアプリが読める JSON を作るためのものです。

## When To Use

- ユーザーが文書、メモ、Markdown、Web ページ、または URL からクイズ JSON を作りたいとき
- 出力をそのまま `src/data/*.json` に置ける形式へ揃えたいとき
- 生成した JSON がアプリ想定どおりか検証したいとき

## Output Contract

出力は JSON オブジェクト 1 件です。トップレベルは次の形に固定します。

```json
{
  "title": "Practice 01",
  "description": "短い説明",
  "questions": []
}
```

各問題は次のキーを持ちます。

- `questionNumber`: 1 以上の整数。セット内で一意
- `type`: `single` / `multiple` / `ordering`
- `selectionCount`: 任意。`multiple` と `ordering` では、実際に選ばせる個数と一致させる
- `prompt`: 問題文
- `options`: `{ "id": "A", "text": "..." }` の配列
- `correctAnswers`: 正答 option id の配列
- `explanation`: 採点後に見せる Markdown 文字列

詳細ルールは `references/quiz-json-format.md` を参照してください。

## Workflow

1. ソースを読む
   URL の場合はブラウズして内容を読む。文書が会話に貼られている場合はその内容だけを使う。
2. 出題範囲を絞る
   事実確認しやすい内容だけで問題化する。曖昧な推測は問題にしない。
3. 問題を組み立てる
   既定は `single`。複数正答が自然なときだけ `multiple`、順序そのものが論点のときだけ `ordering` を使う。
4. JSON を出力する
   ユーザーが別形式を明示しない限り、説明文を混ぜず JSON 本体だけを返す。
5. 検証する
   返す前に必ず次を実行する。ルート `package.json` には依存しません。

```bash
node .agents/skills/quiz-json-output/scripts/validate-quiz-json.mjs path/to/file.json
```

ファイルを作らずに確認したい場合は標準入力でもよいです。

```bash
pbpaste | node .agents/skills/quiz-json-output/scripts/validate-quiz-json.mjs --stdin
```

## Authoring Rules

- `options[].id` は `A`, `B`, `C` のような短い識別子にする
- `single` は `correctAnswers` を 1 件にする
- `multiple` は `selectionCount === correctAnswers.length` に揃える
- `ordering` は `correctAnswers` を正しい順序で並べる
- `ordering` は全選択肢を並べ替える問題として作る
- `explanation` は Markdown を使ってよい。箇条書き、強調、コード、リンクは許容する
- 問題文と解説は日本語で簡潔に書く

## Validation

バリデータは次を確認します。

- トップレベル構造
- 各フィールドの型と必須性
- `questionNumber` と `options[].id` の一意性
- `correctAnswers` と `options` の整合性
- `selectionCount` と問題形式の整合性

バリデータが失敗したら、JSON を直してから返してください。
