# OpenAlex Topics Tree

An interactive hierarchical tree visualization of OpenAlex academic topics with multi-language support and dark/light theme switching.

[English](#english) | [中文](#chinese) | [日本語](#japanese)

---

## English

### 🌳 What is This?

OpenAlex Topics Tree is a web application that visualizes the hierarchical structure of academic topics from [OpenAlex](https://openalex.org/), a fully open catalog of the global research system.

### ✨ Features

- **Hierarchical Tree View**: Browse topics in a 4-level hierarchy (Domain → Field → Subfield → Topic)
- **Search & Filter**: Quickly find topics by name with highlighted matches
- **Multi-language Support**: English, 中文 (Chinese), 日本語 (Japanese)
- **Theme Switching**: Dark mode and light mode with smooth transitions
- **Statistics**: View works count and topic count for each node
- **OpenAlex Integration**: Click the 🔗 button to view related scholarly works on OpenAlex
- **Responsive Design**: Works on desktop and mobile devices

### 📊 Data Structure

Topics are organized in a hierarchical structure:

| Level | Icon | Description | Example |
|-------|------|-------------|---------|
| Domain | 🌐 | Broad research area | Physical Sciences |
| Field | 📚 | Major discipline | Engineering |
| Subfield | 📖 | Specialized area | Artificial Intelligence |
| Topic | 📄 | Specific concept | Machine Learning |

- **4,516** unique topics across all research domains
- **392.5M** total scholarly works indexed

### 🚀 Getting Started

#### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

#### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/openalex-topics-tree.git
cd openalex-topics-tree

# Install dependencies
npm install
```

#### Development

```bash
# Start development server (Vite)
npm run dev

# Start production server (simple Node.js server)
npm run serve
```

The app will be available at `http://localhost:3000` (production) or `http://localhost:5173` (development).

#### Data Management

```bash
# Crawl topics from OpenAlex API
npm run crawl

# Process raw data into tree structure
npm run process-data

# Run both crawl and process
npm run data

# Validate data integrity
npm run validate
```

### 🌐 Deployment

#### Deploy to Cloudflare Pages

1. Fork/Clone this repository to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
3. Connect your GitHub repository
4. Configure build settings:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click "Save and Deploy"

#### Manual Deployment

```bash
# Build for production
npm run build

# The dist/ directory contains the production-ready files
```

### 🛠️ Project Structure

```
openalex-topics-tree/
├── index.html              # Single-file React app (CDN-based)
├── data/
│   ├── topics.json         # Raw topics data from OpenAlex
│   ├── topics-tree.json    # Hierarchical tree structure
│   ├── search-index.json   # Search index for quick lookup
│   └── stats.json          # Data statistics
├── crawler.js              # Script to crawl OpenAlex API
├── process-data.js         # Script to process raw data into tree
├── server.cjs              # Simple production server
├── validate-data.js        # Data validation script
└── package.json            # Project configuration
```

### 📝 Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run serve` | Start simple Node.js server |
| `npm run crawl` | Crawl topics from OpenAlex |
| `npm run process-data` | Process data into tree structure |
| `npm run data` | Run crawl and process-data |
| `npm run validate` | Validate data integrity |
| `npm run check-data` | Check data statistics |

### 🔗 Related Links

- [OpenAlex](https://openalex.org/)
- [OpenAlex API Documentation](https://docs.openalex.org/)
- [OpenAlex Topics API](https://docs.openalex.org/api/entities/topics)

### 📄 License

MIT License

---

## 中文

### 🌳 这是什么？

OpenAlex 主题树是一个 Web 应用，用于可视化来自 [OpenAlex](https://openalex.org/) 的学术主题层级结构。OpenAlex 是一个完全开放的全球研究系统目录。

### ✨ 功能特性

- **层级树形视图**：按 4 级层级结构浏览主题（领域 → 学科 → 子领域 → 主题）
- **搜索与过滤**：快速按名称查找主题并高亮匹配结果
- **多语言支持**：English、中文、日本語
- **主题切换**：暗夜模式和亮色模式，支持平滑过渡
- **统计信息**：查看每个节点的作品数量和主题数量
- **OpenAlex 集成**：点击 🔗 按钮在 OpenAlex 上查看相关学术作品
- **响应式设计**：支持桌面和移动设备

### 🚀 快速开始

#### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

#### 安装

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/openalex-topics-tree.git
cd openalex-topics-tree

# 安装依赖
npm install
```

#### 开发

```bash
# 启动开发服务器 (Vite)
npm run dev

# 启动生产服务器 (简单 Node.js 服务器)
npm run serve
```

#### 数据管理

```bash
# 从 OpenAlex API 爬取主题
npm run crawl

# 将原始数据处理为树形结构
npm run process-data

# 同时运行爬取和处理
npm run data
```

### 🌐 部署

#### 部署到 Cloudflare Pages

1. Fork/克隆此仓库到 GitHub
2. 前往 [Cloudflare 控制台](https://dash.cloudflare.com/) → Pages
3. 连接你的 GitHub 仓库
4. 配置构建设置：
   - **框架预设**：无
   - **构建命令**：`npm run build`
   - **构建输出目录**：`dist`
5. 点击"保存并部署"

---

## 日本語

### 🌳 これは何？

OpenAlex Topics Tree は、[OpenAlex](https://openalex.org/)（完全にオープンなグローバル研究システムカタログ）からの学術トピックの階層構造を可視化する Web アプリケーションです。

### ✨ 機能

- **階層ツリービュー**：4 段階の階層でトピックを閲覧（ドメイン → フィールド → サブフィールド → トピック）
- **検索とフィルタ**：名前でトピックを素早く検索し、一致した結果をハイライト
- **多言語サポート**：English、中文、日本語
- **テーマ切り替え**：ダークモードとライトモード、スムーズなトランジション
- **統計情報**：各ノードの作品数とトピック数を表示
- **OpenAlex 統合**：🔗 ボタンをクリックして OpenAlex で関連作品を表示

### 🚀 クイックスタート

#### 前提条件

- Node.js >= 18.0.0
- npm >= 9.0.0

#### インストール

```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/openalex-topics-tree.git
cd openalex-topics-tree

# 依存関係をインストール
npm install
```

#### 開発

```bash
# 開発サーバーを起動 (Vite)
npm run dev

# 本番サーバーを起動 (簡易 Node.js サーバー)
npm run serve
```

### 🌐 デプロイ

#### Cloudflare Pages へのデプロイ

1. このリポジトリを GitHub にフォーク/クローン
2. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → Pages にアクセス
3. GitHub リポジトリを接続
4. ビルド設定を構成：
   - **フレームワークプリセット**：なし
   - **ビルドコマンド**：`npm run build`
   - **ビルド出力ディレクトリ**：`dist`
5. 「保存してデプロイ」をクリック

---

## 📄 License / 许可证 / ライセンス

MIT License

Copyright (c) 2024 OpenAlex Topics Tree

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
