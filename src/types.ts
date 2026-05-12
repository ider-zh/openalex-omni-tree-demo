export interface TreeNode {
  id: string;
  name: string;
  type: 'root' | 'domain' | 'field' | 'subfield' | 'topic' | 'concept';
  works_count?: number;
  children: TreeNode[];
  _topic_file?: string;
  _concept_file?: string;
  topic_count?: number;
  concept_count?: number;
}

/** CSV 搜索索引行 */
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
  node: TreeNode;
}

/** CSV topic 行 */
export interface TopicRow {
  id: string;
  name: string;
  works_count: number;
}
