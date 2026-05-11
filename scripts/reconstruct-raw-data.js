/**
 * reconstruct-raw-data.js
 * 一次性辅助脚本：从现有 search-index.json 重建 scripts/data/topics.json
 * 用于在尚未运行爬虫时，从已有的前端数据反推原始格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEARCH_INDEX = path.join(__dirname, '..', 'public', 'data', 'search-index.json');
const OUTPUT_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'topics.json');

// 短ID → 还原URL
function expandId(id) {
  if (!id || id === 'root') return id;
  if (id.startsWith('T')) return `https://openalex.org/${id}`;
  return id; // 已经是短格式，保持
}

function main() {
  if (!fs.existsSync(SEARCH_INDEX)) {
    console.error(`search-index.json not found at ${SEARCH_INDEX}`);
    process.exit(1);
  }

  const searchIndex = JSON.parse(fs.readFileSync(SEARCH_INDEX, 'utf8'));
  console.log(`Loaded ${searchIndex.length} entries from search-index.json`);

  // 重建 topics.json 原始格式
  const topics = searchIndex.map(item => ({
    id: expandId(item.id),
    display_name: item.name,
    description: item.description || '',
    keywords: item.keywords || [],
    works_count: item.works_count || 0,
    domain: { id: `https://openalex.org/domains/${item.domain}`, display_name: item.domain },
    field: { id: `https://openalex.org/fields/${item.field}`, display_name: item.field },
    subfield: { id: `https://openalex.org/subfields/${item.subfield}`, display_name: item.subfield }
  }));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(topics, null, 2), 'utf8');
  console.log(`Reconstructed ${topics.length} topics → ${OUTPUT_FILE}`);
  console.log(`Size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)} MB`);
}

main();
