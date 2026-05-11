// Check original topic data for works_count
import { readFileSync } from 'fs';

const topics = JSON.parse(readFileSync('./data/topics.json', 'utf8'));

console.log('First topic works_count:', topics[0].works_count);
console.log('First topic domain works_count:', topics[0].domain?.works_count);
console.log('First topic field works_count:', topics[0].field?.works_count);
console.log('First topic subfield works_count:', topics[0].subfield?.works_count);

console.log('\nSample domain works_count:');
const domainWorks = {};
topics.slice(0, 100).forEach(t => {
  const d = t.domain?.display_name || 'Unknown';
  if (!domainWorks[d]) {
    domainWorks[d] = t.domain?.works_count;
  }
});
Object.entries(domainWorks).forEach(([d, w]) => console.log(`  ${d}: ${w}`));
