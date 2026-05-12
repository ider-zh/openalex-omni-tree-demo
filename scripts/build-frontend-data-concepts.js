/**
 * build-frontend-data-concepts.js
 * 从 OpenAlex concepts gz 文件生成前端精简数据
 *
 * 数据来源：scripts/data/concepts/ 下的 gz 文件（JSON Lines 格式）
 * 输出：public/data/concepts/
 *   - tree-skeleton.json（骨架）
 *   - concept-children/（子节点文件）
 *   - search-index.json（搜索索引）
 *   - stats.json（统计信息）
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

function compactId(url) {
  if (!url || typeof url !== 'string') return url;
  const match = url.match(/\/([^\/]+)$/);
  return match ? match[1] : url;
}

// Read ALL gz files and merge by ID (deduplicate)
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

// Build concept hierarchy from flat list using ancestors
function buildConceptTree(concepts) {
  console.log('Building concept hierarchy...');
  
  const conceptMap = new Map();
  concepts.forEach(c => {
    conceptMap.set(c.id, {
      id: c.id,
      name: c.display_name,
      level: c.level,
      works_count: c.works_count,
      _children_ids: []
    });
  });
  
  concepts.forEach(concept => {
    if (!concept.ancestors || concept.ancestors.length === 0) {
      return;
    }
    
    const directParentLevel = concept.level - 1;
    const directParent = concept.ancestors.find(a => a.level === directParentLevel);
    
    if (directParent) {
      const parentNode = conceptMap.get(directParent.id);
      if (parentNode) {
        parentNode._children_ids.push(concept.id);
      }
    }
  });
  
  const rootNodes = Array.from(conceptMap.values()).filter(n => n.level === 0);
  console.log(`Built tree with ${rootNodes.length} root nodes`);
  return { rootNodes, conceptMap };
}

function getSafeFileName(id) {
  const match = id.match(/C(\d+)$/);
  return match ? `concept-${match[1]}` : `concept-${Buffer.from(id).toString('base64url')}`;
}

// Build tree skeleton (only level 0-1, rest as lazy-load files)
function buildSkeleton(node, conceptMap) {
  const skeleton = {
    id: node.id,
    name: node.name,
    level: node.level,
    works_count: node.works_count
  };
  
  if (node._children_ids && node._children_ids.length > 0) {
    skeleton.children_count = node._children_ids.length;
    
    if (node.level === 0) {
      skeleton.children = node._children_ids.map(childId => {
        const child = conceptMap.get(childId);
        return {
          id: child.id,
          name: child.name,
          level: child.level,
          works_count: child.works_count,
          children_count: child._children_ids.length,
          _concept_file: child._children_ids.length ? createChildFile(child, conceptMap) : undefined
        };
      });
    }
  }
  
  return skeleton;
}

function createChildFile(node, conceptMap) {
  if (!node._children_ids || node._children_ids.length === 0) return undefined;
  
  const fileName = getSafeFileName(node.id) + '.json';
  const filePath = path.join(CHILDREN_DIR, fileName);
  
  const childData = node._children_ids.map(childId => {
    const c = conceptMap.get(childId);
    return {
      id: c.id,
      name: c.name,
      level: c.level,
      works_count: c.works_count,
      children_count: c._children_ids.length,
      _concept_file: c._children_ids.length ? getSafeFileName(c.id) + '.json' : undefined
    };
  });
  
  fs.writeFileSync(filePath, JSON.stringify(childData), 'utf8');
  
  return `/data/concepts/concept-children/${fileName}`;
}

// Build search index (flat list for searching with ancestor paths)
function buildSearchIndex(concepts) {
  console.log('Building search index...');
  
  return concepts.map(c => {
    const ancestors = (c.ancestors || [])
      .sort((a, b) => a.level - b.level)
      .map(a => a.display_name);
    
    return {
      id: compactId(c.id),
      name: c.display_name,
      level: c.level,
      works_count: c.works_count,
      path: ancestors
    };
  });
}

function main() {
  console.log('='.repeat(60));
  console.log('Build Concepts Frontend Data (from gz files)');
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
  
  const concepts = readAllConcepts();
  
  const { rootNodes, conceptMap } = buildConceptTree(concepts);
  
  console.log('\nBuilding tree skeleton...');
  const skeleton = {
    version: new Date().toISOString(),
    processed_at: new Date().toISOString(),
    total_concepts: concepts.length,
    tree: rootNodes.map(root => buildSkeleton(root, conceptMap))
  };
  
  const skeletonPath = path.join(OUTPUT_DIR, 'tree-skeleton.json');
  fs.writeFileSync(skeletonPath, JSON.stringify(skeleton), 'utf8');
  console.log(`Tree skeleton: ${(fs.statSync(skeletonPath).size / 1024).toFixed(2)} KB`);
  
  const searchIndex = buildSearchIndex(concepts);
  const searchIndexPath = path.join(OUTPUT_DIR, 'search-index.json');
  fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex), 'utf8');
  console.log(`Search index: ${(fs.statSync(searchIndexPath).size / 1024 / 1024).toFixed(2)} MB (${searchIndex.length} entries)`);
  
  const stats = {
    total_concepts: concepts.length,
    processed_at: new Date().toISOString(),
    levels: {},
    files_generated: 0
  };
  
  concepts.forEach(c => {
    stats.levels[c.level] = (stats.levels[c.level] || 0) + 1;
  });
  
  const childrenFiles = fs.readdirSync(CHILDREN_DIR).length;
  stats.files_generated = childrenFiles + 2;
  
  const statsPath = path.join(OUTPUT_DIR, 'stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf8');
  
  console.log(`\nStats saved`);
  console.log(`Children files: ${childrenFiles}`);
  
  console.log('\nConcepts by level:');
  Object.entries(stats.levels)
    .sort((a, b) => a[0] - b[0])
    .forEach(([level, count]) => {
      console.log(`  Level ${level}: ${count} concepts`);
    });
  
  const totalSize = fs.statSync(skeletonPath).size + fs.statSync(searchIndexPath).size;
  console.log(`\nTotal frontend data: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('Build complete!');
  console.log('='.repeat(60));
}

main();
