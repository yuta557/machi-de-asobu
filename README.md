# まちであそぶ、をつくる｜Playable City 入門ワークショップ（宇治NEXT）

静的サイト。ビルド不要で、このフォルダの中身をそのまま公開できます。

## 構成

```
site/
├─ index.html          ページ本体（74KB）
├─ README.md           このファイル
└─ assets/
   ├─ hero-illustration.webp   ヒーロー背景のイラスト（1672×940）
   ├─ hero-title.webp          タイトルロゴ（1524×830・透過）
   ├─ hero-facts.webp          DATE / PLACE / WHO / FEE / TIME（1935×463・透過）
   ├─ colorshift-kv.webp       Color Shift Walk のキービジュアル（980×957）
   ├─ step-01〜05.webp         仕組みの連番写真（各560×310前後）
   ├─ ogp.jpg                  SNS共有用（1200×630）
   └─ apple-touch-icon.png     iOSホーム画面用（180×180）
```

外部から読み込むのは Google Fonts のみ（Zen Maru Gothic / Zen Kaku Gothic New / Yusei Magic / Yomogi / IBM Plex Mono / Outfit）。
JavaScript・CSS はすべて index.html に含まれています。

## 公開手順

1. `site/` の中身（index.html と assets/）をサーバーのドキュメントルートに置く
2. `https://<ドメイン>/` で表示を確認
3. 公開URLが決まったら index.html の `og:image` を絶対URLに変更する

```html
<!-- 変更前 -->
<meta property="og:image" content="assets/ogp.jpg">
<!-- 変更後 -->
<meta property="og:image" content="https://example.com/assets/ogp.jpg">
```

LINE や X などは相対パスを解決しないサービスがあるため、この1行だけは公開ドメインでの絶対URLを推奨します。`apple-touch-icon` も同様に絶対URLにできます。

## 差し替えのしかた

画像を差し替えるときは、同じファイル名・同じ縦横比で上書きしてください。位置と大きさは画面幅に対する割合で指定しているため、CSSの変更は不要です。

| ファイル | 縦横比 | 備考 |
|---|---|---|
| hero-illustration.webp | 1672 : 940 | 文字の入っていない状態の絵 |
| hero-title.webp | 1524 : 830 | 背景透過。白背景の場合は白抜きが必要 |
| hero-facts.webp | 1935 : 463 | 同上 |

文言だけを直す場合は index.html を編集してください。実施概要・FAQ・フッター・メタ情報はすべてHTMLのテキストです（ヒーローの情報帯のみ画像）。

## 更新が必要な箇所（2026年9月時点で未確定）

- 日程：「2026年9月下旬の週末」→ 確定日
- 申込方法：フォーム開設後、`実施概要` の申込方法とヘッダー「参加する」のリンク先
- `og:image` の絶対URL

## 動作の要点

- オープニング（色鉛筆の足あと）は初回表示時のみ。クリック・キー入力・スクロールでスキップ可。OSの「視差効果を減らす」設定ではオープニング自体を表示しません
- 体験版ボードは画面内に入ったときだけ描画します（IntersectionObserver）
- ヒーロー以外の画像は `loading="lazy"`
- ページ内リンクはスムーススクロールし、URLのハッシュも更新するため、セクション単位で共有できます
