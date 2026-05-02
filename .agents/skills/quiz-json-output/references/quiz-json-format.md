# Quiz JSON Format

このリポジトリのクイズアプリは、1 ファイル 1 セットの JSON を読みます。

## Top-Level

```json
{
  "title": "Practice 01",
  "description": "基礎用語の確認",
  "questions": []
}
```

## Question Shape

```json
{
  "questionNumber": 1,
  "type": "single",
  "prompt": "問題文",
  "options": [
    { "id": "A", "text": "選択肢 A" },
    { "id": "B", "text": "選択肢 B" }
  ],
  "correctAnswers": ["A"],
  "explanation": "正解理由。\\n\\n- 補足1\\n- 補足2"
}
```

## Canonical Template

新規作成時は、まずこの雛形を複製してから埋めてください。

```json
{
  "title": "Practice 01",
  "description": "短い説明",
  "questions": [
    {
      "questionNumber": 1,
      "type": "single",
      "prompt": "問題文",
      "options": [
        { "id": "A", "text": "選択肢 A" },
        { "id": "B", "text": "選択肢 B" },
        { "id": "C", "text": "選択肢 C" },
        { "id": "D", "text": "選択肢 D" }
      ],
      "correctAnswers": ["A"],
      "explanation": "正解理由"
    }
  ]
}
```

## Invalid Keys

次のキーはこのアプリでは使いません。

- `source_file`
- `total_questions`
- `id`
- `question`
- `correct`

また、`options` を次のような連想オブジェクトで作ってはいけません。

```json
{
  "A": "選択肢A",
  "B": "選択肢B"
}
```

必ず配列にしてください。

## Rules

- `title`: 空でない文字列
- `description`: 空でない文字列
- `questions`: 1 件以上
- トップレベルで許可されるキーは `title` / `description` / `questions` のみ
- `questionNumber`: 正の整数で一意
- `type`: `single` / `multiple` / `ordering`
- `options`: 2 件以上
- `options[].id`: 空でない文字列。セット内ではなく問題内で一意
- `correctAnswers`: 1 件以上で、必ず `options[].id` に含まれる
- `explanation`: 空でない Markdown 文字列
- 問題オブジェクトで許可されるキーは `questionNumber` / `type` / `selectionCount` / `prompt` / `options` / `correctAnswers` / `explanation` のみ

## Type-Specific Rules

### `single`

- `correctAnswers.length === 1`
- `selectionCount` を付けるなら `1`

### `multiple`

- `selectionCount` は必須ではないが、付けるなら `correctAnswers.length` と一致させる
- ユーザーに選ばせる数を `prompt` に自然文で書く

### `ordering`

- `correctAnswers.length === options.length`
- `selectionCount` を付けるなら `options.length`
- `correctAnswers` の順番がそのまま正解順

## Authoring Guidance

- 間違い選択肢は、紛らわしいが明確に誤りなものにする
- 解説は Markdown で書いてよい。通常は 1 から 3 文、必要なら短い箇条書きまで
- 1 問ごとの難易度差はあってよいが、同一セットでは主題を揃える
- 同じ facts を少し言い換えただけの重複問題は避ける
