# ScrumFestMapViewer

イベントの開催地を地図上で可視化するビューアです。Leaflet.jsを使用して、日本全国で開催されるスクラムフェスの位置と詳細情報を表示します。

## デモサイト

GitHub Pages はこちらで閲覧できます：
https://kawaguti.github.io/ScrumFestMapViewer/


## データファイル
all-events.md がデータファイルです。スクラムフェスの情報を入れています。
このファイルの規約は docs/markdown-export-specification.md にあります。
プロジェクトをフォークして、このマークダウンファイルを入れ換えれば他のイベントに対応できるのではないかと思います。

なお、スクラムフェスのファイルのメンテナンスはこちらのプロジェクトで生成したサイトで行っています。
https://github.com/kawaguti/ScrumFestMap


## 機能

- インタラクティブな地図表示（Leaflet.js）
- 地図の初期表示とGoogle Maps風マーカー表示
- イベント一覧表示（動的タイトル設定）
- 最適化された詳細情報ポップアップ表示（横並びレイアウト）
- 直近未来イベントの自動選択・表示
- 重複マーカーの統合表示とリスト選択
- カスタムMarkdownパーサー（タイトル・セクション解析）
- レスポンシブレイアウト対応（スマートフォン向け最適化UI）

## 使用技術

- Leaflet.js
- Bootstrap 5
- Marked.js
- HTML5/CSS3/JavaScript

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 著作権表示

Copyright (c) 2024 kawaguti

## 謝辞

このプロジェクトは以下のオープンソースソフトウェアを使用しています：

- [OpenStreetMap](https://www.openstreetmap.org/copyright) - 地図データ © OpenStreetMap contributors
- [Leaflet](https://leafletjs.com/) - BSD-2-Clause License
- [Bootstrap](https://getbootstrap.com/) - MIT License
- [Marked](https://marked.js.org/) - MIT License
