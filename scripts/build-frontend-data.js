/**
 * build-frontend-data.js
 * 统一的 Step 2 脚本：从原始数据生成前端精简数据
 *
 * Layer 1 (输入): scripts/data/topics.json — 爬虫原始数据
 * Layer 2 (输出): public/data/ — 前端精简数据
 *   ├── tree-skeleton.json  紧凑树骨架（精简 ID）
 *   ├── lookup.csv           归一化查找表（type,id,name）
 *   ├── search-index.csv    CSV 搜索索引（name + 路径 ID）
 *   └── topics/             每 subfield 一个 CSV 文件
 *       ├── s_2202.csv
 *       └── ...
 *
 * 数据归一化：
 *   domain/field/subfield 在 search-index.csv 中以短 ID (D1,F1,S1) 代替文本
 *   前端通过 lookup.csv 将 ID 还原为名称
 *   冗余从 51.4% 降至接近 0
 *
 * 用法: node scripts/build-frontend-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === 路径配置 ===
const RAW_DATA = path.join(__dirname, 'data', 'topics.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');
const TOPICS_DIR = path.join(OUTPUT_DIR, 'topics');

const TREE_SKELETON_FILE = path.join(OUTPUT_DIR, 'tree-skeleton.json');
const LOOKUP_FILE = path.join(OUTPUT_DIR, 'lookup.csv');
const SEARCH_INDEX_FILE = path.join(OUTPUT_DIR, 'search-index.csv');

// === ID 精简 ===
function compactId(url) {
  if (!url || typeof url !== 'string') return url;
  const match = url.match(/\/([^\/]+)$/);
  return match ? match[1] : url;
}

// === 安全文件名（移除空格和特殊字符） ===
function safeFileName(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
}

// === CSV 编码 (RFC 4180) ===
function csvEscape(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function csvLine(fields) {
  return fields.map(csvEscape).join(',');
}

// === 归一化：构建 domain/field/subfield 的短 ID 映射 ===
function buildLookupTables(topics) {
  console.log('Building lookup tables (normalization)...');

  // 按唯一名称分配短 ID
  // domain/field/subfield 的 name 在 OpenAlex 中各自全局唯一
  // （subfield 在不同 field 下可能同名，但 lookup 只需存储唯一名称，
  //   field 上下文由 search-index.csv 的 fid 列提供）
  const domainMap = new Map();   // domainName → shortId (D1, D2, ...)
  const fieldMap = new Map();    // fieldName → shortId (F1, F2, ...)
  const subfieldMap = new Map(); // subfieldName → shortId (S1, S2, ...)

  // 按树层级遍历顺序分配 ID，确保确定性且与树骨架一致
  const hierarchy = new Map(); // domainName → Map<fieldName → Set<subfieldName>>

  // 第一遍：收集层级结构
  for (const topic of topics) {
    const domainName = topic.domain?.display_name || 'Unknown Domain';
    const fieldName = topic.field?.display_name || 'Unknown Field';
    const subfieldName = topic.subfield?.display_name || 'Unknown Subfield';

    if (!hierarchy.has(domainName)) {
      hierarchy.set(domainName, new Map());
    }
    const domainFields = hierarchy.get(domainName);
    if (!domainFields.has(fieldName)) {
      domainFields.set(fieldName, new Set());
    }
    domainFields.get(fieldName).add(subfieldName);
  }

  // 第二遍：按层级遍历顺序分配短 ID
  // 这样 D1=第一个 domain, F1=第一个 domain 下的第一个 field, ...
  for (const [domainName, fields] of hierarchy) {
    if (!domainMap.has(domainName)) {
      domainMap.set(domainName, `D${domainMap.size + 1}`);
    }
    for (const [fieldName, subfields] of fields) {
      if (!fieldMap.has(fieldName)) {
        fieldMap.set(fieldName, `F${fieldMap.size + 1}`);
      }
      for (const subfieldName of subfields) {
        if (!subfieldMap.has(subfieldName)) {
          subfieldMap.set(subfieldName, `S${subfieldMap.size + 1}`);
        }
      }
    }
  }

  console.log(`  Domains: ${domainMap.size}, Fields: ${fieldMap.size}, Subfields: ${subfieldMap.size}`);

  return { domainMap, fieldMap, subfieldMap, hierarchy };
}

// === 生成 lookup.csv ===
function buildLookupCSV(lookupTables) {
  const { domainMap, fieldMap, subfieldMap } = lookupTables;
  const lines = ['type,id,name'];

  // Domains
  for (const [name, id] of domainMap) {
    lines.push(csvLine(['domain', id, name]));
  }

  // Fields
  for (const [name, id] of fieldMap) {
    lines.push(csvLine(['field', id, name]));
  }

  // Subfields
  for (const [name, id] of subfieldMap) {
    lines.push(csvLine(['subfield', id, name]));
  }

  return lines.join('\n');
}

// === 构建树骨架 ===
function buildTree(topics, lookupTables) {
  console.log('Building tree structure...');

  const { domainMap, fieldMap, subfieldMap, hierarchy } = lookupTables;
  const tree = {
    id: 'root',
    name: 'OpenAlex Topics',
    type: 'root',
    works_count: 0,
    topic_count: 0,
    children: {}
  };

  for (const topic of topics) {
    const domainName = topic.domain?.display_name || 'Unknown Domain';
    const domainId = domainMap.get(domainName) || compactId(topic.domain?.id || domainName);
    const fieldName = topic.field?.display_name || 'Unknown Field';
    const fieldId = fieldMap.get(fieldName) || compactId(topic.field?.id || fieldName);
    const subfieldName = topic.subfield?.display_name || 'Unknown Subfield';
    const subfieldId = subfieldMap.get(subfieldName) || compactId(topic.subfield?.id || subfieldName);
    const topicId = compactId(topic.id);
    const topicName = topic.display_name || 'Unknown Topic';
    const topicWorksCount = topic.works_count || 0;

    // Domain
    let domainNode = tree.children[domainId];
    if (!domainNode) {
      domainNode = { id: domainId, name: domainName, type: 'domain', works_count: 0, topic_count: 0, children: {} };
      tree.children[domainId] = domainNode;
    }

    // Field
    let fieldNode = domainNode.children[fieldId];
    if (!fieldNode) {
      fieldNode = { id: fieldId, name: fieldName, type: 'field', works_count: 0, topic_count: 0, children: {} };
      domainNode.children[fieldId] = fieldNode;
    }

    // Subfield
    let subfieldNode = fieldNode.children[subfieldId];
    if (!subfieldNode) {
      subfieldNode = { id: subfieldId, name: subfieldName, type: 'subfield', works_count: 0, topic_count: 0, children: {} };
      fieldNode.children[subfieldId] = subfieldNode;
    }

    // Topic (叶节点：只保留 id, name, works_count)
    subfieldNode.children[topicId] = {
      id: topicId,
      name: topicName,
      works_count: topicWorksCount
    };
  }

  // 递归计算 works_count 和 topic_count
  calculateCounts(tree);

  console.log('Tree structure built!');
  return tree;
}

function calculateCounts(node) {
  const children = Object.values(node.children || {});

  if (children.length === 0) {
    return { topic_count: 1, works_count: node.works_count || 0 };
  }

  let totalTopics = 0;
  let totalWorks = 0;

  for (const child of children) {
    const counts = calculateCounts(child);
    totalTopics += counts.topic_count;
    totalWorks += counts.works_count;
  }

  node.topic_count = totalTopics;
  node.works_count = totalWorks;

  return { topic_count: totalTopics, works_count: totalWorks };
}

// === 树骨架 → 前端 JSON（剥离 topic 叶节点） ===
function buildSkeleton(node) {
  const skeleton = {
    id: node.id,
    name: node.name,
    type: node.type,
    works_count: node.works_count,
    topic_count: node.topic_count,
    children: []
  };

  if (node.type === 'subfield') {
    const topics = Object.values(node.children || {});
    if (topics.length > 0) {
      const fileName = `s_${safeFileName(node.id)}.csv`;
      const filePath = path.join(TOPICS_DIR, fileName);

      const lines = ['id,name,works_count'];
      for (const t of topics) {
        lines.push(csvLine([t.id, t.name, t.works_count]));
      }
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

      skeleton._topic_file = `/data/topics/${fileName}`;
      skeleton.topic_count = topics.length;
    }
    skeleton.children = [];
  } else if (node.children && Object.keys(node.children).length > 0) {
    skeleton.children = Object.values(node.children).map(buildSkeleton);
  }

  return skeleton;
}

// === 构建搜索索引 CSV（归一化版本：用短 ID 替代文本） ===
function buildSearchIndex(topics, lookupTables) {
  console.log('Building search index (normalized CSV)...');

  const { domainMap, fieldMap, subfieldMap } = lookupTables;

  // 列名：did/fid/sid 代替 domain/field/subfield 文本
  const lines = ['id,name,did,fid,sid,works_count'];

  for (const topic of topics) {
    const domainName = topic.domain?.display_name || '';
    const fieldName = topic.field?.display_name || '';
    const subfieldName = topic.subfield?.display_name || '';

    const did = domainMap.get(domainName) || '';
    const fid = fieldMap.get(fieldName) || '';
    const sid = subfieldMap.get(subfieldName) || '';

    lines.push(csvLine([
      compactId(topic.id),
      topic.display_name || '',
      did,
      fid,
      sid,
      topic.works_count || 0
    ]));
  }

  console.log(`Search index: ${topics.length} entries (normalized)`);
  return lines.join('\n');
}

// === 统计信息 ===
function getTreeStats(tree) {
  let domainCount = 0, fieldCount = 0, subfieldCount = 0, topicCount = 0;

  function countNodes(node) {
    const type = node.type;
    if (type === 'domain') domainCount++;
    else if (type === 'field') fieldCount++;
    else if (type === 'subfield') subfieldCount++;
    else if (type === 'topic') topicCount++;

    for (const child of Object.values(node.children || {})) {
      countNodes(child);
    }
  }

  countNodes(tree);
  return { domains: domainCount, fields: fieldCount, subfields: subfieldCount, topics: topicCount };
}

// === 数据完整性验证 ===
function verifyData(topics, lookupTables) {
  console.log('\nVerifying data integrity...');

  const { domainMap, fieldMap, subfieldMap } = lookupTables;
  let errors = 0;

  // 检查 1: 每个 topic 的 domain/field/subfield 都能在 lookup 中找到
  for (const topic of topics) {
    const domainName = topic.domain?.display_name || '';
    const fieldName = topic.field?.display_name || '';
    const subfieldName = topic.subfield?.display_name || '';

    if (!domainMap.has(domainName)) {
      console.error(`  ERROR: domain "${domainName}" not in lookup (topic ${compactId(topic.id)})`);
      errors++;
    }
    if (!fieldMap.has(fieldName)) {
      console.error(`  ERROR: field "${fieldName}" not in lookup (topic ${compactId(topic.id)})`);
      errors++;
    }
    if (!subfieldMap.has(subfieldName)) {
      console.error(`  ERROR: subfield "${subfieldName}" not in lookup (topic ${compactId(topic.id)})`);
      errors++;
    }
  }

  // 检查 2: lookup 表中 ID 唯一性
  const allIds = new Set();
  for (const [, id] of domainMap) {
    if (allIds.has(id)) { console.error(`  ERROR: duplicate ID ${id}`); errors++; }
    allIds.add(id);
  }
  for (const [, id] of fieldMap) {
    if (allIds.has(id)) { console.error(`  ERROR: duplicate ID ${id}`); errors++; }
    allIds.add(id);
  }
  for (const [, id] of subfieldMap) {
    if (allIds.has(id)) { console.error(`  ERROR: duplicate ID ${id}`); errors++; }
    allIds.add(id);
  }

  // 检查 3: lookup 表行数与唯一值数一致
  if (domainMap.size !== 4) { console.error(`  WARNING: expected 4 domains, got ${domainMap.size}`); }
  if (fieldMap.size !== 26) { console.error(`  WARNING: expected 26 fields, got ${fieldMap.size}`); }
  if (subfieldMap.size !== 244) { console.error(`  WARNING: expected 244 subfields, got ${subfieldMap.size}`); }

  if (errors === 0) {
    console.log('  All checks passed!');
  } else {
    console.error(`  ${errors} error(s) found!`);
  }

  return errors === 0;
}

// === 主流程 ===
function main() {
  console.log('='.repeat(60));
  console.log('Build Frontend Data — Step 2 of 2-step pipeline');
  console.log('  (with domain/field/subfield normalization)');
  console.log('='.repeat(60));

  // 1. 读取原始数据
  if (!fs.existsSync(RAW_DATA)) {
    console.error(`Error: Raw data not found at ${RAW_DATA}`);
    console.error('Run "npm run crawl" first (Step 1).');
    process.exit(1);
  }

  const topics = JSON.parse(fs.readFileSync(RAW_DATA, 'utf8'));
  console.log(`Loaded ${topics.length} topics from raw data`);

  // 2. 确保输出目录存在
  if (!fs.existsSync(TOPICS_DIR)) {
    fs.mkdirSync(TOPICS_DIR, { recursive: true });
  } else {
    // 清空旧的 topic 文件
    const oldFiles = fs.readdirSync(TOPICS_DIR);
    for (const f of oldFiles) {
      fs.unlinkSync(path.join(TOPICS_DIR, f));
    }
    console.log(`Cleaned ${oldFiles.length} old topic files`);
  }

  // 清理旧的 lookup 文件
  if (fs.existsSync(LOOKUP_FILE)) {
    fs.unlinkSync(LOOKUP_FILE);
    console.log('Removed old lookup.csv');
  }

  // 3. 构建归一化查找表
  const lookupTables = buildLookupTables(topics);

  // 4. 数据完整性验证
  verifyData(topics, lookupTables);

  // 5. 构建树（使用归一化 ID）
  const tree = buildTree(topics, lookupTables);
  const stats = getTreeStats(tree);
  console.log(`\nTree Statistics:`);
  console.log(`  Domains:   ${stats.domains}`);
  console.log(`  Fields:    ${stats.fields}`);
  console.log(`  Subfields: ${stats.subfields}`);
  console.log(`  Topics:    ${stats.topics}`);

  // 6. 生成树骨架 JSON
  console.log('\nGenerating tree skeleton...');
  const skeleton = buildSkeleton(tree);
  fs.writeFileSync(TREE_SKELETON_FILE, JSON.stringify(skeleton), 'utf8');
  const skelSize = (fs.statSync(TREE_SKELETON_FILE).size / 1024).toFixed(1);
  console.log(`  ${TREE_SKELETON_FILE} (${skelSize} KB)`);

  // 7. 生成 lookup.csv
  console.log('\nGenerating lookup CSV...');
  const lookupCsv = buildLookupCSV(lookupTables);
  fs.writeFileSync(LOOKUP_FILE, lookupCsv, 'utf8');
  const lookupSize = (fs.statSync(LOOKUP_FILE).size / 1024).toFixed(1);
  console.log(`  ${LOOKUP_FILE} (${lookupSize} KB)`);

  // 8. 生成搜索索引 CSV（归一化版本）
  console.log('\nGenerating search index CSV (normalized)...');
  const searchCsv = buildSearchIndex(topics, lookupTables);
  fs.writeFileSync(SEARCH_INDEX_FILE, searchCsv, 'utf8');
  const searchSize = (fs.statSync(SEARCH_INDEX_FILE).size / 1024).toFixed(1);
  console.log(`  ${SEARCH_INDEX_FILE} (${searchSize} KB)`);

  // 9. 统计 topic CSV 文件
  const topicFiles = fs.readdirSync(TOPICS_DIR).filter(f => f.endsWith('.csv'));
  const topicTotalSize = topicFiles.reduce((sum, f) => sum + fs.statSync(path.join(TOPICS_DIR, f)).size, 0);
  console.log(`\n  ${topicFiles.length} topic CSV files (${(topicTotalSize / 1024).toFixed(1)} KB total)`);

  // 10. 对比优化效果
  console.log('\n' + '='.repeat(60));
  console.log('Optimization Summary:');
  console.log(`  lookup.csv:       ${lookupSize} KB (new)`);
  console.log(`  search-index.csv: ${searchSize} KB (was 488 KB)`);
  const savedKB = (488 - parseFloat(searchSize)).toFixed(1);
  const savedPct = ((1 - parseFloat(searchSize) / 488) * 100).toFixed(1);
  console.log(`  Saved:            ${savedKB} KB (${savedPct}%)`);

  const totalSize = fs.statSync(TREE_SKELETON_FILE).size
    + fs.statSync(LOOKUP_FILE).size
    + fs.statSync(SEARCH_INDEX_FILE).size
    + topicTotalSize;
  console.log(`\nTotal frontend data: ${(totalSize / 1024).toFixed(1)} KB`);
  console.log('Build complete!');
  console.log('='.repeat(60));
}

main();
