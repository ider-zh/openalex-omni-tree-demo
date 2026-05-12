export interface TreeNode {
  id: string;
  name: string;
  type: 'root' | 'domain' | 'field' | 'subfield' | 'topic' | 'concept';
  level?: number;
  works_count?: number;
  children: TreeNode[];
  _topic_file?: string;
  _concept_file?: string;
  topic_count?: number;
  concept_count?: number;
  children_count?: number;
  description?: string;
  /** Concepts tree has a .tree array at root level */
  tree?: TreeNode[];
}

/** CSV search index row */
export interface SearchIndexItem {
  id: string;
  name: string;
  domain: string;
  field: string;
  subfield: string;
  works_count: number;
}

export interface SearchResult {
  id: string;
  path: string[];
  node?: TreeNode;
  level?: number;
}

/** CSV topic row */
export interface TopicRow {
  id: string;
  name: string;
  works_count: number;
}
