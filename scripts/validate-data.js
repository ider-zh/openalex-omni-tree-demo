/**
 * Validate data completeness and check for anomalies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOPICS_FILE = path.join(__dirname, 'data', 'topics.json');
const TREE_FILE = path.join(__dirname, 'data', 'topics-tree.json');
const SEARCH_INDEX_FILE = path.join(__dirname, 'data', 'search-index.json');

function validateData() {
  console.log('=== Data Validation Report ===\n');
  
  // Load data files
  const rawTopics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf8'));
  const treeData = JSON.parse(fs.readFileSync(TREE_FILE, 'utf8'));
  const searchIndex = JSON.parse(fs.readFileSync(SEARCH_INDEX_FILE, 'utf8'));
  
  // 1. Basic counts
  console.log('1. Basic Statistics:');
  console.log(`   Raw topics count: ${rawTopics.length}`);
  console.log(`   Search index count: ${searchIndex.length}`);
  
  // 2. Check for missing or incomplete fields in raw topics
  console.log('\n2. Checking for incomplete records in raw topics:');
  let missingId = 0;
  let missingDisplayName = 0;
  let missingDescription = 0;
  let missingDomain = 0;
  let missingField = 0;
  let missingSubfield = 0;
  let missingKeywords = 0;
  let emptyKeywords = 0;
  
  rawTopics.forEach(topic => {
    if (!topic.id) missingId++;
    if (!topic.display_name) missingDisplayName++;
    if (!topic.description) missingDescription++;
    if (!topic.domain || !topic.domain.display_name) missingDomain++;
    if (!topic.field || !topic.field.display_name) missingField++;
    if (!topic.subfield || !topic.subfield.display_name) missingSubfield++;
    if (!topic.keywords) missingKeywords++;
    if (topic.keywords && topic.keywords.length === 0) emptyKeywords++;
  });
  
  console.log(`   Missing ID: ${missingId}`);
  console.log(`   Missing display_name: ${missingDisplayName}`);
  console.log(`   Missing description: ${missingDescription}`);
  console.log(`   Missing domain: ${missingDomain}`);
  console.log(`   Missing field: ${missingField}`);
  console.log(`   Missing subfield: ${missingSubfield}`);
  console.log(`   Missing keywords: ${missingKeywords}`);
  console.log(`   Empty keywords array: ${emptyKeywords}`);
  
  // 3. Check for duplicate topics
  console.log('\n3. Checking for duplicates:');
  const ids = rawTopics.map(t => t.id);
  const uniqueIds = new Set(ids);
  console.log(`   Unique IDs: ${uniqueIds.size}`);
  console.log(`   Duplicates: ${ids.length - uniqueIds.size}`);
  
  // 4. Check tree structure completeness
  console.log('\n4. Tree Structure Analysis:');
  let domainCount = 0;
  let fieldCount = 0;
  let subfieldCount = 0;
  let topicCount = 0;
  
  function countNodes(node, level = 0) {
    if (level === 1) domainCount++;
    if (level === 2) fieldCount++;
    if (level === 3) subfieldCount++;
    if (level === 4) topicCount++;
    
    if (node.children) {
      if (Array.isArray(node.children)) {
        node.children.forEach(child => countNodes(child, level + 1));
      } else {
        Object.values(node.children).forEach(child => countNodes(child, level + 1));
      }
    }
  }
  
  countNodes(treeData);
  console.log(`   Domains: ${domainCount}`);
  console.log(`   Fields: ${fieldCount}`);
  console.log(`   Subfields: ${subfieldCount}`);
  console.log(`   Topics: ${topicCount}`);
  
  // 5. Verify search index completeness
  console.log('\n5. Search Index Verification:');
  const topicsInIndex = new Set(searchIndex.map(item => item.id));
  const topicsInRaw = new Set(rawTopics.map(t => t.id));
  
  // Check if all raw topics are in search index
  let missingInIndex = 0;
  rawTopics.forEach(topic => {
    if (!topicsInIndex.has(topic.id)) {
      missingInIndex++;
      console.log(`   ⚠️  Missing in search index: ${topic.id} - ${topic.display_name}`);
    }
  });
  console.log(`   Raw topics missing in search index: ${missingInIndex}`);
  
  // Check if all search index items have complete data
  let incompleteInIndex = 0;
  searchIndex.forEach(item => {
    if (!item.name || !item.domain || !item.field || !item.subfield) {
      incompleteInIndex++;
      console.log(`   ⚠️  Incomplete search index entry: ${JSON.stringify(item)}`);
    }
  });
  console.log(`   Incomplete search index entries: ${incompleteInIndex}`);
  
  // 6. Distribution check
  console.log('\n6. Domain Distribution:');
  const domainDist = {};
  rawTopics.forEach(topic => {
    const domain = topic.domain?.display_name || 'Unknown';
    domainDist[domain] = (domainDist[domain] || 0) + 1;
  });
  Object.entries(domainDist).forEach(([domain, count]) => {
    console.log(`   ${domain}: ${count} (${(count / rawTopics.length * 100).toFixed(1)}%)`);
  });
  
  // 7. Check for anomalies
  console.log('\n7. Anomaly Check:');
  const anomalies = [];
  
  // Check for topics with very short descriptions
  rawTopics.forEach(topic => {
    if (topic.description && topic.description.length < 50) {
      anomalies.push(`Short description for ${topic.display_name}: ${topic.description.substring(0, 50)}...`);
    }
  });
  
  if (anomalies.length > 0) {
    console.log(`   Found ${anomalies.length} potential anomalies:`);
    anomalies.slice(0, 10).forEach(a => console.log(`   ⚠️  ${a}`));
    if (anomalies.length > 10) {
      console.log(`   ... and ${anomalies.length - 10} more`);
    }
  } else {
    console.log('   No anomalies detected.');
  }
  
  // Summary
  console.log('\n=== Summary ===');
  const hasIssues = missingDisplayName + missingDescription + missingDomain + 
                    missingField + missingSubfield + missingInIndex > 0;
  
  if (!hasIssues) {
    console.log('✅ Data collection appears COMPLETE with no missing fields.');
    console.log(`   Total topics: ${rawTopics.length}`);
    console.log(`   All topics have required fields (id, name, description, domain, field, subfield)`);
    console.log(`   Tree structure contains: ${domainCount} domains, ${fieldCount} fields, ${subfieldCount} subfields, ${topicCount} topics`);
  } else {
    console.log('⚠️  Some issues detected. Please review the report above.');
  }
}

validateData();
