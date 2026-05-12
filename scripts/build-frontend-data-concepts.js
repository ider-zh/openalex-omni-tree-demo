/**
 * build-frontend-data-concepts.js
 * 从 OpenAlex concepts gz 文件生成前端精简数据（CSV 归一化版）
 *
 * 数据来源：scripts/data/concepts/ 下的 gz 文件（JSON Lines 格式）
 * 输出：public/data/concepts/
 *   ├── tree-skeleton.json    骨架（L0 展开，L1+ 通过 _concept_file 懒加载）
 *   ├── lookup.csv            归一化查找表（cid,name,level）
 *   ├── search-index.csv      CSV 搜索索引（cid,name,lid,works_count,pids）
 *   └── concept-children/     每概念一个 CSV 文件（子节点列表）
 *
 * 归一化设计：
 *   - 每个概念分配短 ID: C1, C2, ...（按 level 顺序 + works_count 降序）
 *   - lookup.csv: cid → name, level（前端还原名称用）
 *   - search-index.csv: pids 列存储直接父级 ID 列表（支持多继承）
 *   - 前端通过 pids + lookup.csv 递归构建显示路径
 *   - 消除 ancestors 文本数组冗余（从 ~11MB 降至 ~2MB）
 *
 * 用法: node scripts/build-frontend-data-concepts.js
 */

import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.join(__dirname, 'data/concepts');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data', 'concepts');
const CHILDREN_DIR = path.join(OUTPUT_DIR, 'concept-children');

// === 路径配置 ===
const TREE_SKELETON_FILE = path.join(OUTPUT_DIR, 'tree-skeleton.json');
const LOOKUP_FILE = path.join(OUTPUT_DIR, 'lookup.csv');
const SEARCH_INDEX_FILE = path.join(OUTPUT_DIR, 'search-index.csv');

// === CSV 工具函数 ===
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

function compactId(url) {
  if (!url || typeof url !== 'string') return url;
  const match = url.match(/\/([^\/]+)$/);
  return match ? match[1] : url;
}

function makeLevelId(level) {
  return `L${level}`;
}

function getSafeFileName(id) {
  const match = id.match(/\/([^\/]+)$/);
  return `concept-${match ? match[1] : id}`;
}

// === 读取所有概念数据 ===
function readAllConcepts() {
  console.log('Reading all concept data files...');
  
  const manifestPath = path.join(RAW_DIR, 'manifest');
  if (!fs.existsSync(manifestPath)) {
    console.error('Error: manifest not found in', RAW_DIR);
    process.exit(1);
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const conceptMap = new Map();
  let totalRaw = 0;
  
  manifest.entries.forEach((entry, index) => {
    const urlParts = entry.url.split('/');
    const dateDir = urlParts[urlParts.length - 2];
    const gzFile = path.join(RAW_DIR, dateDir, 'part_000.gz');
    
    if (!fs.existsSync(gzFile)) {
      console.warn(`  Skipping missing file: ${gzFile}`);
      return;
    }
    
    console.log(`  [${index + 1}/${manifest.entries.length}] Reading ${dateDir} (${entry.meta.record_count} records)...`);
    const data = fs.readFileSync(gzFile);
    const decompressed = zlib.gunzipSync(data);
    const text = decompressed.toString();
    const lines = text.split('\n').filter(line => line.trim());
    totalRaw += lines.length;
    
    lines.forEach(line => {
      const concept = JSON.parse(line);
      conceptMap.set(concept.id, concept);
    });
  });
  
  console.log(`\nTotal raw records: ${totalRaw}`);
  console.log(`Unique concepts: ${conceptMap.size}`);
  
  return Array.from(conceptMap.values());
}

// === 构建查找表 ===
function buildLookupTables(concepts) {
  console.log('Building lookup tables...');
  
  const conceptMap = new Map();
  const levelGroups = new Map();
  
  concepts.forEach(c => {
    if (!levelGroups.has(c.level)) {
      levelGroups.set(c.level, []);
    }
    levelGroups.get(c.level).push(c);
    
    conceptMap.set(c.id, {
      id: c.id,
      name: c.display_name,
      level: c.level,
      works_count: c.works_count,
      ancestors: c.ancestors || [],
      _children_ids: []
    });
  });
  
  console.log(`  Built concept map for ${concepts.length} concepts`);
  return { conceptMap };
}

// === 构建概念树（基于 ancestors 找直接父级） ===
function buildConceptTree(concepts, conceptMap) {
  console.log('Building concept hierarchy...');
  
  concepts.forEach(concept => {
    if (!concept.ancestors || concept.ancestors.length === 0) return;
    
    const directParentLevel = concept.level - 1;
    const directParents = concept.ancestors.filter(a => a.level === directParentLevel);
    
    directParents.forEach(parent => {
      const parentNode = conceptMap.get(parent.id);
      if (parentNode) {
        parentNode._children_ids.push(concept.id);
      }
    });
  });
  
  const rootNodes = Array.from(conceptMap.values()).filter(n => n.level === 0);
  console.log(`Built tree with ${rootNodes.length} root nodes`);
  return rootNodes;
}

// === 生成 lookup.csv ===
function buildLookupCSV(conceptMap) {
  console.log('Generating lookup CSV...');
  
  const lines = ['id,name,level'];
  
  const entries = [];
  for (const [origId, node] of conceptMap) {
    entries.push([node.id, node.name, node.level]);
  }
  
  entries.sort((a, b) => a[1].localeCompare(b[1]));
  
  entries.forEach(([id, name, level]) => {
    lines.push(csvLine([id, name, level]));
  });
  
  return lines.join('\n');
}

// === 生成搜索索引 CSV ===
function buildSearchIndex(concepts, conceptMap) {
  console.log('Building search index (CSV)...');
  
  const lines = ['id,name,level,works_count,pids'];
  
  concepts.forEach(c => {
    const directParents = (c.ancestors || [])
      .filter(a => a.level === c.level - 1)
      .map(a => a.id)
      .filter(Boolean);
    
    const pids = directParents.join(';');
    
    lines.push(csvLine([
      c.id,
      c.display_name,
      c.level,
      c.works_count || 0,
      pids
    ]));
  });
  
  console.log(`Search index: ${concepts.length} entries`);
  return lines.join('\n');
}

// === 创建子节点 CSV 文件 ===
function createChildCSVFile(node, conceptMap, childrenDir) {
  if (!node._children_ids || node._children_ids.length === 0) return undefined;
  
  const fileName = getSafeFileName(node.id) + '.csv';
  const filePath = path.join(childrenDir, fileName);
  
  if (fs.existsSync(filePath)) {
    return `/data/concepts/concept-children/${fileName}`;
  }
  
  const lines = ['id,name,level,works_count,children_count,_concept_file'];
  
  const sortedIds = [...node._children_ids].sort((a, b) => {
    const ca = conceptMap.get(a);
    const cb = conceptMap.get(b);
    return (cb?.works_count || 0) - (ca?.works_count || 0);
  });
  
  sortedIds.forEach(childId => {
    const c = conceptMap.get(childId);
    if (!c) return;
    
    const grandchildrenCount = (c._children_ids || []).length;
    let fileRef = '';
    
    if (grandchildrenCount > 0) {
      const grandFile = createChildCSVFile(c, conceptMap, childrenDir);
      fileRef = grandFile || '';
    }
    
    lines.push(csvLine([
      c.id,
      c.name,
      c.level,
      c.works_count || 0,
      grandchildrenCount,
      fileRef
    ]));
  });
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return `/data/concepts/concept-children/${fileName}`;
}

// === 生成树骨架 ===
function buildSkeleton(rootNodes, conceptMap, childrenDir) {
  console.log('Building tree skeleton...');
  
  const result = [];
  
  rootNodes.forEach(node => {
    const skel = {
      id: node.id,
      name: node.name,
      level: node.level,
      works_count: node.works_count,
      children_count: node._children_ids.length
    };
    
    if (node._children_ids && node._children_ids.length > 0) {
      skel.children = node._children_ids.map(childId => {
        const child = conceptMap.get(childId);
        if (!child) return null;
        
        const grandchildrenCount = (child._children_ids || []).length;
        const result = {
          id: child.id,
          name: child.name,
          level: child.level,
          works_count: child.works_count || 0,
          children_count: grandchildrenCount
        };
        
        if (grandchildrenCount > 0) {
          result._concept_file = createChildCSVFile(child, conceptMap, childrenDir);
        }
        return result;
      }).filter(Boolean);
    }
    
    result.push(skel);
  });
  
  return result;
}

// === 主流程 ===
function main() {
  console.log('='.repeat(60));
  console.log('Build Concepts Frontend Data');
  console.log('='.repeat(60));
  
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`Error: Raw data not found at ${RAW_DIR}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(CHILDREN_DIR)) {
    fs.mkdirSync(CHILDREN_DIR, { recursive: true });
  } else {
    const oldFiles = fs.readdirSync(CHILDREN_DIR);
    for (const f of oldFiles) {
      fs.unlinkSync(path.join(CHILDREN_DIR, f));
    }
    console.log(`Cleaned ${oldFiles.length} old concept files`);
  }
  
  [LOOKUP_FILE, SEARCH_INDEX_FILE, TREE_SKELETON_FILE].forEach(f => {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      console.log(`Removed old ${path.basename(f)}`);
    }
  });
  
  const concepts = readAllConcepts();
  
  const { conceptMap } = buildLookupTables(concepts);
  
  const rootNodes = buildConceptTree(concepts, conceptMap);
  
  console.log('\nGenerating lookup CSV...');
  const lookupCsv = buildLookupCSV(conceptMap);
  fs.writeFileSync(LOOKUP_FILE, lookupCsv, 'utf8');
  const lookupSize = (fs.statSync(LOOKUP_FILE).size / 1024).toFixed(2);
  console.log(`  ${LOOKUP_FILE} (${lookupSize} KB, ${concepts.length} entries)`);
  
  console.log('\nGenerating search index CSV...');
  const searchCsv = buildSearchIndex(concepts, conceptMap);
  fs.writeFileSync(SEARCH_INDEX_FILE, searchCsv, 'utf8');
  const searchSize = (fs.statSync(SEARCH_INDEX_FILE).size / 1024).toFixed(2);
  console.log(`  ${SEARCH_INDEX_FILE} (${searchSize} KB, ${concepts.length} entries)`);
  
  console.log('\nBuilding tree skeleton (L0 inline, L1+ via CSV files)...');
  const treeSkeleton = buildSkeleton(rootNodes, conceptMap, CHILDREN_DIR);
  
  const skeleton = {
    version: new Date().toISOString(),
    processed_at: new Date().toISOString(),
    total_concepts: concepts.length,
    tree: treeSkeleton
  };
  
  fs.writeFileSync(TREE_SKELETON_FILE, JSON.stringify(skeleton), 'utf8');
  const skelSize = (fs.statSync(TREE_SKELETON_FILE).size / 1024).toFixed(2);
  console.log(`  ${TREE_SKELETON_FILE} (${skelSize} KB, ${rootNodes.length} roots)`);
  
  const childrenFiles = fs.readdirSync(CHILDREN_DIR).filter(f => f.endsWith('.csv'));
  const childrenTotalSize = childrenFiles.reduce((sum, f) =>
    sum + fs.statSync(path.join(CHILDREN_DIR, f)).size, 0
  );
  
  const levelCounts = {};
  concepts.forEach(c => {
    levelCounts[c.level] = (levelCounts[c.level] || 0) + 1;
  });
  
  const stats = {
    total_concepts: concepts.length,
    processed_at: new Date().toISOString(),
    levels: levelCounts,
    files_generated: childrenFiles.length + 3
  };
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'stats.json'), JSON.stringify(stats, null, 2), 'utf8');
  
  console.log(`\nChildren CSV files: ${childrenFiles.length} (${(childrenTotalSize / 1024).toFixed(1)} KB)`);
  
  console.log('\nConcepts by level:');
  Object.entries(stats.levels)
    .sort((a, b) => a[0] - b[0])
    .forEach(([level, count]) => {
      console.log(`  Level ${level}: ${count} concepts`);
    });
  
  const fileSizeBuckets = { '<1KB': 0, '1-2KB': 0, '2-5KB': 0, '>5KB': 0 };
  childrenFiles.forEach(f => {
    const sz = fs.statSync(path.join(CHILDREN_DIR, f)).size;
    if (sz < 1024) fileSizeBuckets['<1KB']++;
    else if (sz < 2048) fileSizeBuckets['1-2KB']++;
    else if (sz < 5120) fileSizeBuckets['2-5KB']++;
    else fileSizeBuckets['>5KB']++;
  });
  console.log('\nFile size distribution:');
  Object.entries(fileSizeBuckets).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  
  console.log('\n' + '='.repeat(60));
  console.log('Size Summary:');
  console.log(`  lookup.csv:       ${lookupSize} KB`);
  console.log(`  search-index.csv: ${searchSize} KB`);
  console.log(`  children CSV:     ${(childrenTotalSize / 1024).toFixed(1)} KB`);
  
  const totalSize = fs.statSync(LOOKUP_FILE).size + 
                    fs.statSync(SEARCH_INDEX_FILE).size + 
                    fs.statSync(TREE_SKELETON_FILE).size + 
                    childrenTotalSize;
  console.log(`\nTotal frontend data: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('Build complete!');
  console.log('='.repeat(60));
}

main();
