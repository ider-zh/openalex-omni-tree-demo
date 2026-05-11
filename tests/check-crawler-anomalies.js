/**
 * Detailed crawler anomaly check script
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOPICS_FILE = path.join(__dirname, 'data', 'topics.json');
const STATS_FILE = path.join(__dirname, 'data', 'stats.json');

async function detailedCheck() {
  console.log('=== 详细爬虫异常检查 ===\n');
  
  // Load the data
  const topics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
  const stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  
  console.log('1. 基础信息检查');
  console.log(`   总topics数: ${topics.length}`);
  console.log(`   抓取时间: ${stats.fetchedAt}`);
  console.log('');
  
  // 2. 检查topic ID的连续性和完整性
  console.log('2. Topic ID检查');
  const ids = topics.map(t => t.id);
  const openalexIds = ids.map(id => {
    const match = id.match(/T(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }).filter(x => x !== null);
  
  console.log(`   有效ID数: ${openalexIds.length}`);
  
  const minId = Math.min(...openalexIds);
  const maxId = Math.max(...openalexIds);
  console.log(`   最小ID: T${minId}`);
  console.log(`   最大ID: T${maxId}`);
  
  // 检查ID是否有间隙
  const idSet = new Set(openalexIds);
  let gaps = [];
  for (let i = minId; i <= maxId; i++) {
    if (!idSet.has(i)) {
      gaps.push(i);
    }
  }
  
  console.log(`   可能缺少的ID数: ${gaps.length}`);
  if (gaps.length > 0 && gaps.length <= 20) {
    console.log(`   缺少的ID: ${gaps.map(id => `T${id}`).join(', ')}`);
  } else if (gaps.length > 20) {
    console.log(`   缺少的ID过多，不显示具体ID`);
  }
  console.log('');
  
  // 3. 检查分页是否正常
  console.log('3. 分页完整性验证');
  console.log(`   预期总页数: 23`);
  console.log(`   预期每页200，最后一页116`);
  console.log(`   总数据: 22*200 + 116 = 4516`);
  console.log(`   实际获取: ${topics.length}`);
  console.log(`   匹配: ${topics.length === 4516 ? '✅' : '❌'}`);
  console.log('');
  
  // 4. 按ID范围检查可能的分页断点
  console.log('4. 分页断点检查');
  console.log(`   检查每200个topic的连续性`);
  
  let potentialIssues = [];
  for (let i = 0; i < topics.length - 1; i++) {
    const id1 = openalexIds[i];
    const id2 = openalexIds[i + 1];
    
    // 如果ID跳变超过10，可能有问题
    if (id2 - id1 > 10) {
      potentialIssues.push({
        index: i,
        id1: id1,
        id2: id2,
        name1: topics[i].display_name,
        name2: topics[i + 1].display_name
      });
    }
  }
  
  if (potentialIssues.length > 0) {
    console.log(`   发现 ${potentialIssues.length} 个潜在的ID跳变`);
    potentialIssues.slice(0, 10).forEach(issue => {
      console.log(`   索引${issue.index}: T${issue.id1} → T${issue.id2} (差 ${issue.id2 - issue.id1})`);
      console.log(`      "${issue.name1}" → "${issue.name2}"`);
    });
    if (potentialIssues.length > 10) {
      console.log(`   ...还有 ${potentialIssues.length - 10} 个`);
    }
  } else {
    console.log('   ✅ 无明显ID跳变');
  }
  console.log('');
  
  // 5. 检查每一页的数据数量
  console.log('5. 模拟分页检查');
  console.log(`   假设每页200个topic:`);
  
  let pages = [];
  for (let p = 0; p < 23; p++) {
    const start = p * 200;
    const end = Math.min(start + 200, topics.length);
    const pageTopics = topics.slice(start, end);
    pages.push({
      page: p + 1,
      count: pageTopics.length,
      expected: p < 22 ? 200 : 116
    });
  }
  
  let pageMismatch = false;
  pages.forEach(pageInfo => {
    const ok = pageInfo.count === pageInfo.expected;
    if (!ok) pageMismatch = true;
    console.log(`   第${pageInfo.page}页: 期望${pageInfo.expected}，实际${pageInfo.count} ${ok ? '✅' : '❌'}`);
  });
  
  if (!pageMismatch) {
    console.log('   ✅ 所有页面数据数量匹配');
  }
  console.log('');
  
  // 6. 数据字段完整性检查
  console.log('6. 详细字段完整性检查');
  const fieldChecks = {
    id: 0,
    display_name: 0,
    description: 0,
    keywords: 0,
    domain: 0,
    'domain.id': 0,
    'domain.display_name': 0,
    field: 0,
    'field.id': 0,
    'field.display_name': 0,
    subfield: 0,
    'subfield.id': 0,
    'subfield.display_name': 0,
    works_count: 0
  };
  
  topics.forEach((topic, idx) => {
    if (!topic.id) fieldChecks.id++;
    if (!topic.display_name) fieldChecks.display_name++;
    if (!topic.description) fieldChecks.description++;
    if (!topic.keywords) fieldChecks.keywords++;
    if (!topic.domain) fieldChecks.domain++;
    if (!topic.domain?.id) fieldChecks['domain.id']++;
    if (!topic.domain?.display_name) fieldChecks['domain.display_name']++;
    if (!topic.field) fieldChecks.field++;
    if (!topic.field?.id) fieldChecks['field.id']++;
    if (!topic.field?.display_name) fieldChecks['field.display_name']++;
    if (!topic.subfield) fieldChecks.subfield++;
    if (!topic.subfield?.id) fieldChecks['subfield.id']++;
    if (!topic.subfield?.display_name) fieldChecks['subfield.display_name']++;
    if (typeof topic.works_count !== 'number') fieldChecks.works_count++;
  });
  
  let allOk = true;
  Object.entries(fieldChecks).forEach(([field, count]) => {
    if (count > 0) {
      allOk = false;
      console.log(`   ❌ ${field}: ${count} 个缺失`);
    }
  });
  
  if (allOk) {
    console.log('   ✅ 所有字段完整无缺失');
  }
  console.log('');
  
  // 7. 检查是否有重复的topic
  console.log('7. 重复检查');
  const idMap = new Map();
  let duplicates = [];
  
  topics.forEach((topic, idx) => {
    if (idMap.has(topic.id)) {
      duplicates.push({
        id: topic.id,
        index1: idMap.get(topic.id),
        index2: idx,
        name: topic.display_name
      });
    }
    idMap.set(topic.id, idx);
  });
  
  if (duplicates.length > 0) {
    console.log(`   ❌ 发现 ${duplicates.length} 个重复ID:`);
    duplicates.slice(0, 10).forEach(dup => {
      console.log(`      ${dup.id} (索引${dup.index1}, ${dup.index2}): ${dup.name}`);
    });
    if (duplicates.length > 10) {
      console.log(`      ...还有 ${duplicates.length - 10} 个`);
    }
  } else {
    console.log('   ✅ 无重复topic');
  }
  console.log('');
  
  // 8. 随机抽查一些topic的数据完整性
  console.log('8. 随机抽查');
  const randomIndices = [];
  for (let i = 0; i < 5; i++) {
    randomIndices.push(Math.floor(Math.random() * topics.length));
  }
  
  randomIndices.forEach(idx => {
    const topic = topics[idx];
    console.log(`   索引${idx}: ${topic.display_name}`);
    console.log(`      ID: ${topic.id}`);
    console.log(`      Domain: ${topic.domain?.display_name} (${topic.domain?.id})`);
    console.log(`      Field: ${topic.field?.display_name} (${topic.field?.id})`);
    console.log(`      Subfield: ${topic.subfield?.display_name} (${topic.subfield?.id})`);
    console.log(`      Keywords: ${topic.keywords?.length || 0} 个`);
    console.log(`      Works count: ${topic.works_count?.toLocaleString() || 0}`);
  });
  console.log('');
  
  // 9. 总体结论
  console.log('=== 结论 ===');
  const totalIssues = potentialIssues.length + duplicates.length + Object.values(fieldChecks).reduce((a, b) => a + b, 0);
  
  if (totalIssues === 0 && topics.length === 4516) {
    console.log('✅ 爬虫过程无异常！数据完整且正确。');
    console.log('   - 所有页面数据正常获取');
    console.log('   - 所有topic字段完整');
    console.log('   - 无重复数据');
    console.log('   - 数量完全匹配预期 (4516)');
  } else {
    console.log('⚠️  发现一些潜在问题，请检查上面的报告');
  }
}

detailedCheck().catch(console.error);
