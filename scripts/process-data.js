/**
 * Process raw topics data into tree structure
 * Structure: domain → field → subfield → topic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, 'data', 'topics.json');
const TREE_OUTPUT = path.join(__dirname, 'data', 'topics-tree.json');
const SEARCH_INDEX_OUTPUT = path.join(__dirname, 'data', 'search-index.json');

function buildTree(topics) {
  console.log('Building tree structure from topics data...');
  
  const tree = {
    id: 'root',
    name: 'OpenAlex Topics',
    type: 'root',
    works_count: 0,
    topic_count: 0,
    children: {}
  };
  
  topics.forEach(topic => {
    // Extract hierarchy
    const domain = topic.domain?.display_name || 'Unknown Domain';
    const domainId = topic.domain?.id || domain;
    const field = topic.field?.display_name || 'Unknown Field';
    const fieldId = topic.field?.id || field;
    const subfield = topic.subfield?.display_name || 'Unknown Subfield';
    const subfieldId = topic.subfield?.id || subfield;
    const topicName = topic.display_name || 'Unknown Topic';
    const topicId = topic.id;
    const topicWorksCount = topic.works_count || 0;
    
    // Build path: domain → field → subfield → topic
    let domainNode = tree.children[domainId];
    if (!domainNode) {
      domainNode = {
        id: domainId,
        name: domain,
        type: 'domain',
        works_count: 0,
        topic_count: 0,
        children: {}
      };
      tree.children[domainId] = domainNode;
    }
    
    let fieldNode = domainNode.children[fieldId];
    if (!fieldNode) {
      fieldNode = {
        id: fieldId,
        name: field,
        type: 'field',
        works_count: 0,
        topic_count: 0,
        children: {}
      };
      domainNode.children[fieldId] = fieldNode;
    }
    
    let subfieldNode = fieldNode.children[subfieldId];
    if (!subfieldNode) {
      subfieldNode = {
        id: subfieldId,
        name: subfield,
        type: 'subfield',
        works_count: 0,
        topic_count: 0,
        children: {}
      };
      fieldNode.children[subfieldId] = subfieldNode;
    }
    
    // Add topic
    if (!subfieldNode.children[topicId]) {
      subfieldNode.children[topicId] = {
        id: topicId,
        name: topicName,
        type: 'topic',
        description: topic.description || topic.topic_description || '',
        works_count: topicWorksCount,
        topic_count: 1,
        keywords: topic.keywords || [],
        children: {}
      };
    }
  });
  
  // Calculate total counts for all nodes (works_count from API is undefined, need to calculate)
  calculateCounts(tree);
  
  console.log('Tree structure built successfully!');
  return tree;
}

function calculateCounts(node) {
  // Recursively calculate topic_count and works_count for all nodes
  const children = Object.values(node.children || {});
  
  if (children.length === 0) {
    // Leaf node (topic)
    node.topic_count = 1;
    return {
      topic_count: 1,
      works_count: node.works_count || 0
    };
  }
  
  // Non-leaf node: calculate recursively from children
  let totalTopics = 0;
  let totalWorks = 0;
  
  children.forEach(child => {
    const childCounts = calculateCounts(child);
    totalTopics += childCounts.topic_count;
    totalWorks += childCounts.works_count;
  });
  
  node.topic_count = totalTopics;
  node.works_count = totalWorks;
  
  return {
    topic_count: totalTopics,
    works_count: totalWorks
  };
}

function convertToArray(tree) {
  // Convert the nested object structure to array-based structure for easier frontend consumption
  function nodeToArray(node) {
    const children = Object.values(node.children || {});
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      description: node.description,
      works_count: node.works_count,
      topic_count: node.topic_count,
      keywords: node.keywords,
      children: children.map(nodeToArray)
    };
  }
  
  return nodeToArray(tree);
}

function buildSearchIndex(topics) {
  console.log('Building search index...');
  
  const index = topics.map(topic => ({
    id: topic.id,
    name: topic.display_name,
    description: topic.description || topic.topic_description || '',
    keywords: topic.keywords || [],
    domain: topic.domain?.display_name || '',
    field: topic.field?.display_name || '',
    subfield: topic.subfield?.display_name || '',
    works_count: topic.works_count || 0
  }));
  
  console.log(`Search index built with ${index.length} entries`);
  return index;
}

function getTreeStats(tree) {
  let domainCount = 0;
  let fieldCount = 0;
  let subfieldCount = 0;
  let topicCount = 0;
  
  function countNodes(node) {
    if (node.type === 'domain') domainCount++;
    if (node.type === 'field') fieldCount++;
    if (node.type === 'subfield') subfieldCount++;
    if (node.type === 'topic') topicCount++;
    
    Object.values(node.children || {}).forEach(countNodes);
  }
  
  countNodes(tree);
  
  return {
    domains: domainCount,
    fields: fieldCount,
    subfields: subfieldCount,
    topics: topicCount
  };
}

// Main processing
try {
  // Read raw data
  console.log(`Reading topics from: ${INPUT_FILE}`);
  const topicsData = fs.readFileSync(INPUT_FILE, 'utf8');
  const topics = JSON.parse(topicsData);
  
  console.log(`Loaded ${topics.length} topics`);
  
  // Build tree
  const tree = buildTree(topics);
  
  // Get stats
  const stats = getTreeStats(tree);
  console.log('\nTree Statistics:');
  console.log(`  Domains: ${stats.domains}`);
  console.log(`  Fields: ${stats.fields}`);
  console.log(`  Subfields: ${stats.subfields}`);
  console.log(`  Topics: ${stats.topics}`);
  
  // Convert to array format
  const treeArray = convertToArray(tree);
  
  // Save tree
  fs.writeFileSync(TREE_OUTPUT, JSON.stringify(treeArray, null, 2), 'utf8');
  console.log(`\nTree saved to: ${TREE_OUTPUT}`);
  
  // Build and save search index
  const searchIndex = buildSearchIndex(topics);
  fs.writeFileSync(SEARCH_INDEX_OUTPUT, JSON.stringify(searchIndex, null, 2), 'utf8');
  console.log(`Search index saved to: ${SEARCH_INDEX_OUTPUT}`);
  
  console.log('\nData processing completed successfully!');
  
} catch (error) {
  console.error('Error during processing:', error);
  process.exit(1);
}
