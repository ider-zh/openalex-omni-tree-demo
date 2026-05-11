import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'public', 'data');

const treeFile = path.join(dataDir, 'topics-tree.json');
const tree = JSON.parse(fs.readFileSync(treeFile, 'utf8'));

const topicsDir = path.join(dataDir, 'topics');
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

const skeletonFile = path.join(dataDir, 'tree-skeleton.json');
fs.writeFileSync(skeletonFile, JSON.stringify(skeleton), 'utf8');

// Count files
const topicFiles = fs.readdirSync(topicsDir);
console.log(`Skeleton: ${skeletonFile} (${(fs.statSync(skeletonFile).size / 1024).toFixed(1)} KB)`);
console.log(`Topic files: ${topicFiles.length} files in ${topicsDir}`);
console.log('Done!');
