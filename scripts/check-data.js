// Quick check of data
import { readFileSync } from 'fs';

const t = JSON.parse(readFileSync('./data/topics-tree.json', 'utf8'));

console.log('Root works:', t.works_count);
console.log('Root topics:', t.topic_count);
console.log('First domain:', t.children[0]?.name);
console.log('  - works:', t.children[0]?.works_count);
console.log('  - topics:', t.children[0]?.topic_count);
console.log('First field:', t.children[0]?.children[0]?.name);
console.log('  - works:', t.children[0]?.children[0]?.works_count);
console.log('  - topics:', t.children[0]?.children[0]?.topic_count);
console.log('First subfield:', t.children[0]?.children[0]?.children[0]?.name);
console.log('  - works:', t.children[0]?.children[0]?.children[0]?.works_count);
console.log('  - topics:', t.children[0]?.children[0]?.children[0]?.topic_count);
console.log('First topic:', t.children[0]?.children[0]?.children[0]?.children[0]?.name);
console.log('  - works:', t.children[0]?.children[0]?.children[0]?.children[0]?.works_count);
console.log('  - topics:', t.children[0]?.children[0]?.children[0]?.children[0]?.topic_count);
