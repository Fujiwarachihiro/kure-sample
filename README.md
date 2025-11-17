# 呉市ジェネリック医薬品使用状況ダッシュボード

呉市オープンデータAPIを使用したジェネリック医薬品使用状況の可視化ダッシュボードのサンプルプロジェクトです。!!!!!

## 📊 概要

このリポジトリでは、[呉市オープンデータAPI](https://api.expolis.cloud/docs/opendata/t/kure)のジェネリック医薬品データを活用したダッシュボードの実装例を2つ提供しています。

## 🔗 API情報

- **ベースURL**: `https://api.expolis.cloud/opendata/t/kure/v1`
- **エンドポイント**: `/generic-drug?year_month=YYYY-MM`
- **ドキュメント**: https://api.expolis.cloud/docs/opendata/t/kure

## 📁 プロジェクト構成

### 1. Web API版

**ディレクトリ**: [`web-api/`](./web-api/)

Web APIから直接データを取得してダッシュボードを表示します。

- リアルタイムでAPIからデータ取得
- アクセストークンによる認証
- 集計月を選択して表示

👉 [Web API版の詳細はこちら](./web-api/README.md)

### 2. CSVアップロード版

**ディレクトリ**: [`csv-load/`](./csv-load/)

ローカルのCSVファイルをアップロードしてダッシュボードを表示します。

- サーバー不要で動作
- ブラウザでCSVファイルを開いて可視化
- オフラインでも利用可能

👉 [CSVアップロード版の詳細はこちら](./csv-load/README.md)

## ✨ 主な機能

両バージョンとも以下の機能を提供します：

- **サマリーカード**: 先発品・後発品の種類数、総数量、平均薬価差
- **使用数量トップ10**: 後発品医薬品の使用数量グラフ
- **薬価比較**: 先発品と後発品の薬価比較グラフ
- **数量分布**: 後発品医薬品別の数量分布
- **詳細テーブル**: 全データの表形式表示

## 🛠️ 技術スタック

- HTML5
- CSS3
- JavaScript (ES6+)
- [Chart.js](https://www.chartjs.org/) v4.4.0

## 🚀 クイックスタート

### Web API版を使う場合

```bash
cd web-api
python3 -m http.server 8000
or
python -m http.server 8000
# ブラウザで http://localhost:8000/ を開く
```

### CSVアップロード版を使う場合

```bash
cd csv-load
# index.html をブラウザで直接開く
```
## 🔗 関連リンク

- [呉市オープンデータ API ドキュメント](https://api.expolis.cloud/docs/opendata/t/kure)
- [Chart.js 公式ドキュメント](https://www.chartjs.org/)
