import { createTreeStore, TreeStore } from './createTreeStore';

const addType = (node: any): any => {
  // Legacy OpenAlex Concepts use numeric concept levels and ancestor/parent
  // relationships. Do not relabel level 0/1 as Domain/Field, which are terms
  // from the newer Topics taxonomy.
  if (!node.type || node.type === 'domain' || node.type === 'field' || node.type === 'subfield') {
    node.type = 'concept';
  }

  // Ensure _concept_file is preserved and children array exists.
  if (!node.children) node.children = [];
  node.children.forEach(addType);
  return node;
};

export const conceptsStore: TreeStore = createTreeStore({
  treeUrl: '/data/concepts/tree-skeleton.json',
  searchType: 'csv-concepts',
  searchUrl: '/data/concepts/search-index.csv',
  lookupUrl: '/data/concepts/lookup.csv',
  transformTree: (raw: any) => {
    // Keep every legacy taxonomy node typed as a Concept; `level` carries the
    // hierarchy depth (0..5) without pretending it is Topics taxonomy.
    raw.tree.forEach(addType);
    return raw;
  },
});
