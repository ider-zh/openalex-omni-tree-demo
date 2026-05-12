# 项目记忆

## 数据两层架构 (2026-05-11)

### 2步管线
1. **Step 1 (爬虫)**: `npm run crawl` → `scripts/data/topics.json` (原始数据，保持原样)
2. **Step 2 (构建)**: `npm run build-data` → `public/data/` (前端精简数据)
   - `tree-skeleton.json` — 归一化短ID的树骨架 (41.5KB)
   - `lookup.csv` — domain/field/subfield ID→名称映射表 (9.7KB, 274条)
   - `search-index.csv` — 归一化CSV搜索索引 (271KB, id,name,did,fid,sid,works_count)
   - `topics/s_*.csv` — 每 subfield 一个 CSV (221KB, 仅 id,name,works_count)

### 数据归一化设计
- **目的**: search-index.csv 中 domain/field/subfield 文本占 51.4% 数据量，大量重复
- **方案**: 用短 ID (D1/F1/S1) 替代文本，通过 lookup.csv 还原
- **映射**: 4 domain → D1-D4, 26 field → F1-F26, 244 subfield → S1-S244
- **前端**: loadData() 并行加载 lookup.csv，构建 lookupMap 对象，解析 search-index 时用 lookupMap[id] 还原名称
- **tree-skeleton.json** 节点 ID 也使用归一化短 ID (D1/F1/S1)

### 压缩效果
- 旧 JSON: 8.1MB → CSV: 760KB (90.6% 缩减)
- 归一化后: search-index 488KB → 271KB (-44.4%, 节省 217KB)
- lookup.csv 新增 9.7KB，净节省约 207KB

### 边界情况
- 8 个 subfield 同名但属于不同 field（如 Genetics 同时属于 Medicine 和 Biochemistry）
- lookup.csv 按唯一名称存储（244 条），field 上下文由 search-index 的 fid 列提供
- tree-skeleton 中同一 subfield 在不同 field 下会出现两次（252 个节点 vs 244 个唯一名称）

### 关键文件
- `scripts/build-frontend-data.js` — 统一的 Step 2 脚本（含归一化、验证逻辑）
- `index.html` — **实际运行的前端代码**（内嵌完整 JS，非 src/App.tsx）
- 已删除: process-data.js, split-data.js

### ⚠️ 双代码源注意
- **`index.html` 内嵌版** = 实际使用的版本（包含 i18n、主题切换等完整功能）
- **`src/` React 版** = 开发版（Vite 构建），但不再用于生产构建
- 修改前端逻辑时，**只需更新 index.html 中的内嵌代码**
- 构建流程: `npm run build` → `scripts/build-copy.cjs` (复制 index.html + public/ → dist/)

### 注意
- 原始数据需先运行爬虫或用 `scripts/reconstruct-raw-data.js` 从现有数据重建
- 文件名使用 `safeFileName()` 确保无空格和特殊字符

### 后续扩展
新增数据集时: 新建爬虫脚本(Step1) + 在 build-frontend-data 注册处理逻辑(Step2)

## Concepts 数据架构 (2026-05-11)

### 数据特点
- OpenAlex Concepts API **不返回 ancestors 字段**（始终 null），无法构建父子树
- 只能按 Level (0-5) 分组展示，每级一个 CSV 懒加载
- 各级数量: L0(38), L1(568), L2(27605), L3(27640), L4(12994), L5(6181) = 75026 总计

### 2步管线
1. **Step 1 (爬虫)**: `npm run crawl:concepts` → `scripts/data/concepts.json`
2. **Step 2 (构建)**: `npm run build-data:concepts` → `public/data/concepts/`
   - `tree-skeleton.json` — 6 个 Level 节点 (L0-L5)，每个带 _concept_file
   - `lookup.csv` — Level ID→名称映射 (6条)
   - `search-index.csv` — 全量搜索索引 (75026条, 2.6MB, id,name,level,works_count)
   - `concepts/level0~5.csv` — 6 个懒加载 CSV (总计 6MB)

### 前端路由
- Hash 路由: `#topics` / `#concepts`，独立加载，数据互不干扰
- Topics 和 Concepts 各自只加载一次（模块级缓存变量）
- 切换时通过 `window.location.hash` 触发，支持浏览器前进/后退

### 数据加载策略
- **两阶段加载**：tree skeleton (<2KB) 立即渲染，search-index.csv 按需加载
- `loadTopicsTree()` / `loadConceptsTree()` 只加载 tree skeleton
- `ensureSearchData(type)` 在首次搜索时才加载 search-index.csv
- 搜索状态提示：未加载搜索索引时显示 "Loading search index..."

### 概念列表分页
- 大概念列表分页显示，默认显示 100 条
- "Show more" 按钮加载更多 (每页 100 条)
- concepts `defaultExpandLevel=1`（只展开 Level 节点标题）
- topics `defaultExpandLevel=2`（展开到 field 层）

### 搜索
- Concepts 搜索路径: `[levelGroupName, conceptName]`
- 结果限制 200 条，避免加载大 CSV
- levelGroupName 与树骨架节点 name 一致（如 "Level 0 (Top-level concepts)"）
