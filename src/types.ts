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

export interface Topic {
  id: string;
  display_name: string;
  description?: string;
  keywords?: string[];
  works_count?: number;
  domain?: string;
  field?: string;
  subfield?: string;
}

export interface ApiResponse {
  results: Topic[];
  meta: {
    count: number;
  };
}
