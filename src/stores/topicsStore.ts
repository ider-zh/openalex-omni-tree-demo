import { createTreeStore, TreeStore } from './createTreeStore';

const addType = (node: any): any => {
  if (!node.type) {
    if (node.level === 0) node.type = 'domain';
    else if (node.level === 1) node.type = 'field';
    else node.type = 'concept';
  }
  if (node.children) node.children.forEach(addType);
  return node;
};

export const topicsStore: TreeStore = createTreeStore({
  treeUrl: '/data/tree-skeleton.json',
  searchType: 'csv-topics',
  searchUrl: '/data/search-index.csv',
  lookupUrl: '/data/lookup.csv',
});
