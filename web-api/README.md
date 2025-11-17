# 呉市国民健康保険 ジェネリック医薬品使用状況ダッシュボード

呉市オープンデータAPIを使用して、ジェネリック医薬品の使用状況を可視化するダッシュボードです。

## 🚀 ローカルでの使い方

1. python -m http.server 8000 or python3 -m http.server 8000
2. http://localhost:8000/
3. アクセストークンを入力
4. 集計月を選択
5. 「データ取得」ボタンをクリック

注意：内部でWeb APIからデータを取得するプログラムの実行には、サーバの起動が必要ため
Pythonの標準機能であるサーバ起動機能を一時的に使用する

ポイント：ブラウザのセキュリティをためサーバを起動しているが、Google Chromeなどの場合拡張機能で一時的にセキュリティ機能を避けることができる   
自己責任で拡張機能を使用することを薦める  
拡張機能：https://chromewebstore.google.com/detail/moesif-origincors-changer/digfbfaphojjndkpccljibejjbppifbc?hl=ja&pli=1  
拡張機能でEnable CORSを使用している時はブラウザでindex.htmlを直接開いてもAPIが利用できる

## ✨ 機能

- **サマリーカード**: 先発品・後発品の種類数、総数量、平均薬価差を表示
- **使用数量トップ10**: 後発品医薬品の使用数量をグラフ化
- **薬価比較**: 先発品と後発品の薬価を比較
- **数量分布**: 後発品医薬品別の数量分布を可視化
- **詳細テーブル**: 全データを表形式で表示
- **CSVエクスポート**: テーブルの内容をCSVでダウンロード可能
- **KPI追加**: 総推定削減額（先発→後発の差分合計）と後発品使用率を表示

## 🛠️ 技術スタック

- HTML5
- CSS3
- JavaScript (ES6+)
- [Chart.js](https://www.chartjs.org/) v4.4.0
- python（サーバ用）

## 📡 API仕様

- **ベースURL**: `https://api.expolis.cloud/opendata/t/kure/v1`
- **エンドポイント**: `/generic-drug?year_month=YYYY-MM`
- **認証**: `ecp-api-token` ヘッダーにアクセストークンを設定

## 新機能（2025-11-17）

- ダッシュボードに「総推定削減額」と「後発品使用率」を追加しました。
- 表示方法を切り替え（最安のみ / 全て / トップN）してデータを絞り込めます。
- テーブルをCSVでエクスポートできます。

## ブラウザ対応

- Chrome（推奨）

## トラブルシュート
1. OSError: [Errno 48] Address already in use  
```python3 -m http.server 8000```の実行時に上記のようなエラーが出たら8000=>8001や8002に変える  
すでにポートが使用されているようなので、起動するポートを変えることで避ける  
番号を変えた場合はブラウザのアクセス先も変更する必要があるhttp://localhost:8000/

