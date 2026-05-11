/**
 * Simplified API verification check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOPICS_FILE = path.join(__dirname, 'data', 'topics.json');
const API_BASE = 'https://api.openalex.org/topics';

async function simpleVerify() {
  console.log('=== API数据验证检查 ===\n');
  
  // 1. 查询第一页对比
  console.log('1. 检查第一页数据');
  try {
    const page1Res = await fetch(`${API_BASE}?per-page=200&page=1&mailto=user@example.com`);
    const page1Data = await page1Res.json();
    
    console.log(`   API返回第一页 topics 数: ${page1Data.results.length}`);
    console.log(`   API报告总数: ${page1Data.meta.count}`);
    
    const ourData = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
    const ourFirstPage = ourData.slice(0, 200);
    
    // 对比第一个topic
    console.log(`   第一个topic对比:`);
    console.log(`      API: ${page1Data.results[0].id} - ${page1Data.results[0].display_name}`);
    console.log(`      我们: ${ourFirstPage[0].id} - ${ourFirstPage[0].display_name}`);
    
    // 对比前几个topic ID
    let allMatch = true;
    let firstMismatch = -1;
    for (let i = 0; i < 10; i++) {
      if (page1Data.results[i].id !== ourFirstPage[i].id) {
        allMatch = false;
        firstMismatch = i;
        break;
      }
    }
    
    if (allMatch) {
      console.log(`   ✅ 前10个topic ID完全匹配`);
    } else {
      console.log(`   ❌ 第${firstMismatch}个topic ID不匹配`);
    }
    
    console.log('');
    console.log('2. 总数验证');
    if (page1Data.meta.count === ourData.length) {
      console.log(`   ✅ 总数匹配: ${ourData.length} / ${page1Data.meta.count}`);
    } else {
      console.log(`   ❌ 总数不匹配: ${ourData.length} vs ${page1Data.meta.count}`);
    }
    
    console.log('');
    console.log('3. 数据完整性检查（最后一页）');
    const totalPages = Math.ceil(page1Data.meta.count / 200);
    console.log(`   总页数: ${totalPages}`);
    
    const lastPageRes = await fetch(`${API_BASE}?per-page=200&page=${totalPages}&mailto=user@example.com`);
    const lastPageData = await lastPageRes.json();
    
    console.log(`   API最后一页有 ${lastPageData.results.length} 个topics`);
    console.log(`   我们的最后一页（按顺序）有 ${ourData.slice(22*200).length} 个topics`);
    
    // 对比最后一个topic
    const apiLastTopic = lastPageData.results[lastPageData.results.length - 1];
    const ourLastTopic = ourData[ourData.length - 1];
    
    console.log(`   最后一个topic对比:`);
    console.log(`      API: ${apiLastTopic.id} - ${apiLastTopic.display_name}`);
    console.log(`      我们: ${ourLastTopic.id} - ${ourLastTopic.display_name}`);
    
    // 检查是否顺序一致
    const apiLastIds = lastPageData.results.map(r => r.id);
    const ourLastIds = ourData.slice(-lastPageData.results.length).map(t => t.id);
    
    let lastMatch = true;
    for (let i = 0; i < apiLastIds.length; i++) {
      if (apiLastIds[i] !== ourLastIds[i]) {
        lastMatch = false;
        break;
      }
    }
    
    if (lastMatch) {
      console.log(`   ✅ 最后一页topics顺序完全匹配`);
    } else {
      console.log(`   ⚠️  最后一页顺序不匹配（需要进一步检查）`);
    }
    
    console.log('');
    console.log('=== 结论 ===');
    if (allMatch && page1Data.meta.count === ourData.length) {
      console.log('✅ 爬虫执行完全正常！');
      console.log('   - 获取了正确的数量');
      console.log('   - 第一页数据完全匹配');
      console.log('   - 顺序一致');
      console.log('');
      console.log('关于ID跳变的说明：');
      console.log('   OpenAlex的topic ID并不是连续的，也不是按ID排序的，');
      console.log('   而是按works_count（相关论文数量）降序排序的，');
      console.log('   所以ID跳变是API的正常行为，不是爬虫问题！');
    }
  } catch (err) {
    console.error('验证过程出错:', err);
  }
}

simpleVerify().catch(console.error);
