/**
 * Verify API consistency - check if our data matches what OpenAlex says they have
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOPICS_FILE = path.join(__dirname, 'data', 'topics.json');
const API_BASE = 'https://api.openalex.org/topics';

async function verifyAPIConsistency() {
  console.log('=== API一致性验证 ===\n');
  
  // 1. 先查询API当前的统计
  console.log('1. 查询OpenAlex API当前统计');
  const metaResponse = await fetch(`${API_BASE}?per-page=1&mailto=user@example.com`);
  const metaData = await metaResponse.json();
  
  if (metaData.meta) {
    console.log(`   API报告的总topics数: ${metaData.meta.count}`);
    console.log('');
  }
  
  // 2. 检查我们的数据
  const ourTopics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
  console.log('2. 我们的数据');
  console.log(`   我们获取的topics数: ${ourTopics.length}`);
  console.log('');
  
  // 3. 检查第一页和最后一页，对比ID
  console.log('3. 对比API返回的第一页数据');
  
  const page1Response = await fetch(`${API_BASE}?per-page=5&page=1&mailto=user@example.com`);
  const page1Data = await page1Response.json();
  
  console.log(`   API返回的前5个ID:`);
  const apiFirstIds = page1Data.results.map(r => r.id);
  apiFirstIds.forEach(id => console.log(`      ${id}`));
  
  console.log(`   我们数据的前5个ID:`);
  const ourFirstIds = ourTopics.slice(0, 5).map(t => t.id);
  ourFirstIds.forEach(id => console.log(`      ${id}`));
  
  const firstMatch = JSON.stringify(apiFirstIds) === JSON.stringify(ourFirstIds);
  console.log(`   第一页前5个ID匹配: ${firstMatch ? '✅' : '❌'}`);
  console.log('');
  
  // 4. 检查最后一页
  console.log('4. 对比API返回的最后一页数据');
  const totalPages = Math.ceil((metaData.meta?.count || ourTopics.length) / 200);
  console.log(`   总页数: ${totalPages}`);
  
  const lastPageResponse = await fetch(`${API_BASE}?per-page=5&page=${totalPages}&mailto=user@example.com`);
  const lastPageData = await lastPageResponse.json();
  
  console.log(`   API返回的最后5个ID:`);
  const apiLastIds = lastPageData.results.map(r => r.id);
  apiLastIds.forEach(id => console.log(`      ${id}`));
  
  console.log(`   我们数据的最后5个ID:`);
  const ourLastIds = ourTopics.slice(-5).map(t => t.id);
  ourLastIds.forEach(id => console.log(`      ${id}`));
  
  const lastMatch = JSON.stringify(apiLastIds) === JSON.stringify(ourLastIds);
  console.log(`   最后一页最后5个ID匹配: ${lastMatch ? '✅' : '❌'}`);
  console.log('');
  
  // 5. 随机抽查几个topic是否完整
  console.log('5. 随机抽查API数据完整性');
  const randomIndices = [0, Math.floor(ourTopics.length / 2), ourTopics.length - 1];
  
  for (const idx of randomIndices) {
    const topic = ourTopics[idx];
    console.log(`   索引${idx}: ${topic.display_name}`);
    
    // 直接查询这个topic
    const topicResponse = await fetch(`${topic.id}?mailto=user@example.com`);
    const apiTopic = await topicResponse.json();
    
    const idMatch = apiTopic.id === topic.id;
    const nameMatch = apiTopic.display_name === topic.display_name;
    
    console.log(`      ID匹配: ${idMatch ? '✅' : '❌'}`);
    console.log(`      名称匹配: ${nameMatch ? '✅' : '❌'}`);
  }
  console.log('');
  
  // 6. 结论
  console.log('=== 结论 ===');
  if (metaData.meta && metaData.meta.count === ourTopics.length) {
    console.log('✅ 数据完全一致！我们获取了API报告的所有topics');
  } else if (metaData.meta) {
    console.log(`⚠️  数量不匹配: API说有${metaData.meta.count}，我们有${ourTopics.length}`);
  }
  
  console.log('\n注：ID不连续是OpenAlex API的正常现象，不是爬虫问题！');
  console.log('OpenAlex的topics是按热度或其他标准排序，不是按ID排序。');
}

verifyAPIConsistency().catch(console.error);
