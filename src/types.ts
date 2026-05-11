export interface TreeNode {
  id: string;
  name: string;
  type: 'root' | 'domain' | 'field' | 'subfield' | 'topic';
  description?: string;
  works_count?: number;
  keywords?: string[];
  children: TreeNode[];
}

export interface SearchIndexItem {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  domain: string;
  field: string;
  subfield: string;
  works_count: number;
}

export interface SearchResult {
  id: string;
  path: string[];
  node: TreeNode;
}
