import { createTreeStore, TreeStore } from './createTreeStore';

const addType = (node: any): any => {
  if (!node.type) {
    if (node.level === 0) node.type = 'domain';
    else if (node.level === 1) node.type = 'field';
    else node.type = 'concept';
  }
  // Ensure _concept_file is preserved and children array exists
  if (!node.children) node.children = [];
  if (node.children) node.children.forEach(addType);
  return node;
};

export const conceptsStore: TreeStore = createTreeStore({
  treeUrl: '/data/concepts/tree-skeleton.json',
  searchType: 'csv-concepts',
  searchUrl: '/data/concepts/search-index.csv',
  lookupUrl: '/data/concepts/lookup.csv',
  transformTree: (raw: any) => {
    // Recursively add type to all nodes in the tree array
    raw.tree.forEach(addType);
    return raw;
  },
});
