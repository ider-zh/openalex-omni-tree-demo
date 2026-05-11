import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'public', 'data');

const skeletonFile = path.join(dataDir, 'tree-skeleton.json');
const topicsDir = path.join(dataDir, 'topics');
const treeFile = path.join(dataDir, 'topics-tree.json');

// If skeleton already exists and has topic files, skip
if (fs.existsSync(skeletonFile) && fs.existsSync(topicsDir)) {
  const topicCount = fs.readdirSync(topicsDir).length;
  if (topicCount > 0) {
    console.log(`Data already split: ${topicCount} topic files found. Skipping.`);
    console.log(`Skeleton: ${skeletonFile} (${(fs.statSync(skeletonFile).size / 1024).toFixed(1)} KB)`);
    console.log('Done!');
    process.exit(0);
  }
}

if (!fs.existsSync(treeFile)) {
  console.error('Error: topics-tree.json not found. Run npm run process-data first.');
  process.exit(1);
}

const tree = JSON.parse(fs.readFileSync(treeFile, 'utf8'));

if (!fs.existsSync(topicsDir)) {
  fs.mkdirSync(topicsDir, { recursive: true });
}

// Build skeleton: keep domain -> field -> subfield, strip topic children
function buildSkeleton(node) {
  const skeleton = {
    id: node.id,
    name: node.name,
    type: node.type,
    works_count: node.works_count,
    topic_count: node.topic_count,
    children: []
  };

  if (node.type === 'subfield' && node.children && node.children.length > 0) {
    // Save topic children as separate file
    const fileName = getSafeFileName(node.id) + '.json';
    const filePath = path.join(topicsDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(node.children), 'utf8');

    // Replace children with empty array, add _topic_file reference
    skeleton._topic_file = `/data/topics/${fileName}`;
    skeleton.children = [];
    skeleton.topic_count = node.children.length;
  } else if (node.children && node.children.length > 0) {
    skeleton.children = node.children.map(child => buildSkeleton(child));
  }

  return skeleton;
}

function getSafeFileName(id) {
  // e.g. "https://openalex.org/subfields/2202" -> "subfields_2202"
  return id.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_');
}

const skeleton = buildSkeleton(tree);

fs.writeFileSync(skeletonFile, JSON.stringify(skeleton), 'utf8');

// Count files
const topicFiles = fs.readdirSync(topicsDir);
console.log(`Skeleton: ${skeletonFile} (${(fs.statSync(skeletonFile).size / 1024).toFixed(1)} KB)`);
console.log(`Topic files: ${topicFiles.length} files in ${topicsDir}`);
console.log('Done!');
