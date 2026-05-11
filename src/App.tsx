import { useState, useEffect, useCallback } from 'react';
import { TreeNode, SearchIndexItem, SearchResult } from './types';
import { parseCSV } from './utils/csv-parser';
import TreeView from './components/TreeView';
import SearchBar from './components/SearchBar';

function App() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [searchData, setSearchData] = useState<SearchIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [topicCache, setTopicCache] = useState<Map<string, TreeNode[]>>(new Map());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [treeRes, searchCsvText] = await Promise.all([
          fetch('/data/tree-skeleton.json').then(r => {
            if (!r.ok) throw new Error('Failed to load tree skeleton');
            return r.json();
          }),
          fetch('/data/search-index.csv').then(r => {
            if (!r.ok) throw new Error('Failed to load search data');
            return r.text();
          }),
        ]);

        // 解析 CSV 搜索索引
        const searchRows = parseCSV(searchCsvText).map(row => ({
          id: row.id,
          name: row.name,
          domain: row.domain,
          field: row.field,
          subfield: row.subfield,
          works_count: parseInt(row.works_count, 10) || 0,
        }));

        setTree(treeRes);
        setSearchData(searchRows);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadTopicChildren = useCallback(async (subfieldId: string, topicFile: string): Promise<TreeNode[]> => {
    if (topicCache.has(topicFile)) {
      return topicCache.get(topicFile)!;
    }

    const response = await fetch(topicFile);
    if (!response.ok) throw new Error(`Failed to load topics for ${subfieldId}`);

    // 解析 CSV topic 文件
    const csvText = await response.text();
    const topics: TreeNode[] = parseCSV(csvText).map(row => ({
      id: row.id,
      name: row.name,
      type: 'topic' as const,
      works_count: parseInt(row.works_count, 10) || 0,
      children: [],
    }));

    setTopicCache(prev => new Map(prev).set(topicFile, topics));
    return topics;
  }, [topicCache]);

  const searchTopics = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setExpandedNodes(new Set());
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();

    const matches: SearchResult[] = [];

    searchData.forEach((item) => {
      // 仅搜索 name + 层级路径（精简版，无 description/keywords）
      const searchText = `${item.name} ${item.domain} ${item.field} ${item.subfield}`.toLowerCase();

      if (searchText.includes(lowerQuery)) {
        const path = [item.domain, item.field, item.subfield, item.name].filter(Boolean);
        matches.push({
          id: item.id,
          path,
          node: {
            id: item.id,
            name: item.name,
            type: 'topic',
            works_count: item.works_count,
            children: []
          }
        });
      }
    });

    const nodesToExpand = new Set<string>();
    matches.forEach(result => {
      result.path.forEach(nodeName => {
        nodesToExpand.add(nodeName);
      });
    });

    setSearchResults(matches);
    setExpandedNodes(nodesToExpand);
    setIsSearching(false);
  }, [searchData]);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading tree data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="loading" style={{ color: '#ff6b6b' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>OpenAlex Topics Tree</h1>
        <p className="subtitle">Hierarchical view of academic topics</p>
      </header>

      <div className="search-container">
        <SearchBar
          onSearch={searchTopics}
          placeholder="Search topics, domains, fields..."
        />
        {isSearching && <div className="searching-indicator">Searching...</div>}
        {searchResults.length > 0 && !isSearching && (
          <div className="search-results-count">
            Found {searchResults.length} topic{searchResults.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <main className="main-content">
        <TreeView
          tree={tree!}
          defaultExpandLevel={searchResults.length > 0 ? undefined : 2}
          expandedNodes={expandedNodes}
          searchResults={searchResults}
          loadTopicChildren={loadTopicChildren}
          topicCache={topicCache}
        />
      </main>
    </div>
  );
}

export default App;
