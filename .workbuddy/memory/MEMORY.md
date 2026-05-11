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
- **`src/` React 版** = 开发版（Vite 构建），但 Vite 构建只包含 index.html 内容
- 修改前端逻辑时，必须同时更新 index.html 中的内嵌代码，否则改动不生效

### 注意
- 原始数据需先运行爬虫或用 `scripts/reconstruct-raw-data.js` 从现有数据重建
- 文件名使用 `safeFileName()` 确保无空格和特殊字符

### 后续扩展
新增数据集时: 新建爬虫脚本(Step1) + 在 build-frontend-data 注册处理逻辑(Step2)
