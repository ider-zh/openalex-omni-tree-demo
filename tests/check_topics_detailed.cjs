const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'topics.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('=== 数据完整性检查报告 ===\n');

// 1. 验证 topic 数量
const topicCount = data.length;
console.log('1. Topic 总数:', topicCount);
if (topicCount === 4516) {
    console.log('   ✓ 数量正确 (4516)');
} else {
    console.log(`   ✗ 数量不正确, 期望: 4516, 实际: ${topicCount}`);
}

// 2. 检查必填字段
const requiredFields = ['id', 'display_name', 'description', 'keywords', 'subfield', 'field', 'domain'];
const missingFields = {};
const nullValueIssues = {};
const emptyStringIssues = {};
const typeIssues = [];

requiredFields.forEach(field => {
    missingFields[field] = 0;
    nullValueIssues[field] = [];
    emptyStringIssues[field] = [];
});

// 3. 遍历每个 topic 检查
data.forEach((topic, index) => {
    requiredFields.forEach(field => {
        if (!(field in topic)) {
            missingFields[field]++;
        } else {
            const value = topic[field];
            if (value === null) {
                nullValueIssues[field].push(topic.id);
            } else if (typeof value === 'string' && value === '') {
                emptyStringIssues[field].push(topic.id);
            }
            
            // 检查类型
            if (field === 'domain' && typeof value !== 'string' && typeof value !== 'number') {
                typeIssues.push({ id: topic.id, type: typeof value, value: JSON.stringify(value).substring(0, 50) });
            }
        }
    });
});

console.log('\n2. 字段缺失统计 (Topic 不包含该字段):');
let hasMissing = false;
requiredFields.forEach(field => {
    if (missingFields[field] > 0) {
        console.log(`   ${field}: ${missingFields[field]} 个 topic 缺失`);
        hasMissing = true;
    }
});
if (!hasMissing) {
    console.log('   ✓ 所有必填字段都存在');
}

console.log('\n3. Null 值问题:');
let hasNull = false;
requiredFields.forEach(field => {
    if (nullValueIssues[field].length > 0) {
        console.log(`   ${field}: ${nullValueIssues[field].length} 个 null 值`);
        console.log(`      示例 ID: ${nullValueIssues[field].slice(0, 3).join(', ')}`);
        hasNull = true;
    }
});
if (!hasNull) {
    console.log('   ✓ 没有 null 值');
}

console.log('\n4. 空字符串问题:');
let hasEmpty = false;
requiredFields.forEach(field => {
    if (emptyStringIssues[field].length > 0) {
        console.log(`   ${field}: ${emptyStringIssues[field].length} 个空字符串`);
        console.log(`      示例 ID: ${emptyStringIssues[field].slice(0, 3).join(', ')}`);
        hasEmpty = true;
    }
});
if (!hasEmpty) {
    console.log('   ✓ 没有空字符串');
}

// 5. 统计每个域的 topics 数量
console.log('\n5. 各 Domain 的 Topic 数量统计:');
const domainStats = {};
data.forEach(topic => {
    const domain = topic.domain;
    const domainKey = typeof domain === 'object' ? JSON.stringify(domain) : domain;
    domainStats[domainKey] = (domainStats[domainKey] || 0) + 1;
});

const sortedDomains = Object.entries(domainStats).sort((a, b) => b[1] - a[1]);
sortedDomains.forEach(([domain, count]) => {
    console.log(`   ${domain}: ${count}`);
});
console.log(`\n   总计: ${data.length}`);

// 6. 检查 ID 唯一性
console.log('\n6. 检查 ID 唯一性:');
const ids = data.map(t => t.id);
const uniqueIds = new Set(ids);
if (ids.length === uniqueIds.size) {
    console.log('   ✓ 所有 ID 都是唯一的');
} else {
    console.log(`   ✗ 发现 ${ids.length - uniqueIds.size} 个重复 ID`);
}

// 7. 类型检查
console.log('\n7. 数据类型检查:');
if (typeIssues.length > 0) {
    console.log(`   发现 ${typeIssues.length} 个 domain 字段类型异常:`);
    typeIssues.slice(0, 5).forEach(issue => {
        console.log(`      ID: ${issue.id}, 类型: ${issue.type}, 值: ${issue.value}`);
    });
} else {
    console.log('   ✓ domain 字段类型正常');
}

// 8. 查看样例数据
console.log('\n8. 样例数据 (前3个 topic):');
data.slice(0, 3).forEach((topic, i) => {
    console.log(`\n   Topic ${i + 1}:`);
    console.log(`      ID: ${topic.id}`);
    console.log(`      display_name: ${topic.display_name}`);
    console.log(`      domain 类型: ${typeof topic.domain}, 值: ${typeof topic.domain === 'object' ? JSON.stringify(topic.domain) : topic.domain}`);
    console.log(`      field 类型: ${typeof topic.field}, 值: ${typeof topic.field === 'object' ? JSON.stringify(topic.field) : topic.field}`);
    console.log(`      subfield 类型: ${typeof topic.subfield}, 值: ${typeof topic.subfield === 'object' ? JSON.stringify(topic.subfield) : topic.subfield}`);
});

// 9. 总结
console.log('\n=== 总结 ===');
const totalIssues = Object.values(missingFields).reduce((a, b) => a + b, 0) +
                   Object.values(nullValueIssues).reduce((a, b) => a + b.length, 0) +
                   Object.values(emptyStringIssues).reduce((a, b) => a + b.length, 0) +
                   typeIssues.length;

if (totalIssues === 0) {
    console.log('✓ 数据完整性检查通过，没有发现问题');
} else {
    console.log(`✗ 发现 ${totalIssues} 个问题`);
}
