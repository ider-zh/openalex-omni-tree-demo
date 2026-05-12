import { useState, useEffect, useCallback } from 'react';
import { TreeNode, SearchIndexItem, SearchResult } from './types';
import { parseCSV } from './utils/csv-parser';
import TreeView from './components/TreeView';
import SearchBar from './components/SearchBar';

type TreeType = 'topics' | 'concepts';

function App() {
  const [treeType, setTreeType] = useState<TreeType>('topics');
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [treeVersion, setTreeVersion] = useState<string>('');
  const [treeGeneratedAt, setTreeGeneratedAt] = useState<string>('');
  const [searchData, setSearchData] = useState<SearchIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [itemCache, setItemCache] = useState<Map<string, TreeNode[]>>(new Map());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const dataPath = treeType === 'topics' ? '' : '/concepts';
        const [treeRes, searchCsvText] = await Promise.all([
          fetch(`/data${dataPath}/tree-skeleton.json`).then(r => {
            if (!r.ok) throw new Error(`Failed to load ${treeType} tree skeleton`);
            return r.json();
          }),
          fetch(`/data${dataPath}/search-index.csv`).then(r => {
            if (!r.ok) throw new Error(`Failed to load ${treeType} search data`);
            return r.text();
          }),
        ]);

        if (treeRes.version) {
          setTreeVersion(treeRes.version);
        }
        if (treeRes.generated_at) {
          setTreeGeneratedAt(treeRes.generated_at);
        }

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
        setSearchResults([]);
        setExpandedNodes(new Set());
        setItemCache(new Map());
        setLoading(false);
      } catch (err: any) {
        setError(err.message || `Failed to load ${treeType} data`);
        setLoading(false);
      }
    };

    loadData();
  }, [treeType]);

  const loadItemChildren = useCallback(async (subfieldId: string, filePath: string): Promise<TreeNode[]> => {
    if (itemCache.has(filePath)) {
      return itemCache.get(filePath)!;
    }

    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Failed to load ${treeType} for ${subfieldId}`);

    const csvText = await response.text();
    const items: TreeNode[] = parseCSV(csvText).map(row => ({
      id: row.id,
      name: row.name,
      type: treeType === 'topics' ? 'topic' as const : 'concept' as const,
      works_count: parseInt(row.works_count, 10) || 0,
      children: [],
    }));

    setItemCache(prev => new Map(prev).set(filePath, items));
    return items;
  }, [itemCache, treeType]);

  const search = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setExpandedNodes(new Set());
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();

    const matches: SearchResult[] = [];

    searchData.forEach((item) => {
      const searchText = `${item.name} ${item.domain} ${item.field} ${item.subfield}`.toLowerCase();

      if (searchText.includes(lowerQuery)) {
        const path = [item.domain, item.field, item.subfield, item.name].filter(Boolean);
        matches.push({
          id: item.id,
          path,
          node: {
            id: item.id,
            name: item.name,
            type: treeType === 'topics' ? 'topic' : 'concept',
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
  }, [searchData, treeType]);

  const getTitle = () => {
    return treeType === 'topics' ? 'Topics' : 'Concepts';
  };

  const getSubtitle = () => {
    return treeType === 'topics'
      ? 'Hierarchical view of academic topics'
      : 'Hierarchical view of academic concepts';
  };

  const getPlaceholder = () => {
    return treeType === 'topics'
      ? 'Search topics, domains, fields...'
      : 'Search concepts, domains, fields...';
  };

  const getResultLabel = () => {
    const itemType = treeType === 'topics' ? 'topic' : 'concept';
    return `${treeType === 'topics' ? 'Found' : 'Found'} ${searchResults.length} ${itemType}${searchResults.length !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading {getTitle().toLowerCase()} tree data...</div>
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
        <h1>OpenAlex {getTitle()} Tree</h1>
        <p className="subtitle">{getSubtitle()}</p>
        {(treeVersion || treeGeneratedAt) && (
          <div className="data-version">
            Data version: {treeVersion || 'N/A'}
            {treeGeneratedAt && ` (Generated: ${new Date(treeGeneratedAt).toLocaleString()})`}
          </div>
        )}
        <div className="tree-type-toggle">
          <button
            className={`toggle-btn ${treeType === 'topics' ? 'active' : ''}`}
            onClick={() => setTreeType('topics')}
          >
            Topics
          </button>
          <button
            className={`toggle-btn ${treeType === 'concepts' ? 'active' : ''}`}
            onClick={() => setTreeType('concepts')}
          >
            Concepts
          </button>
        </div>
      </header>

      <div className="search-container">
        <SearchBar
          onSearch={search}
          placeholder={getPlaceholder()}
        />
        {isSearching && <div className="searching-indicator">Searching...</div>}
        {searchResults.length > 0 && !isSearching && (
          <div className="search-results-count">
            {getResultLabel()}
          </div>
        )}
      </div>

      <main className="main-content">
        <TreeView
          tree={tree!}
          defaultExpandLevel={searchResults.length > 0 ? undefined : 2}
          expandedNodes={expandedNodes}
          searchResults={searchResults}
          loadItemChildren={loadItemChildren}
          itemCache={itemCache}
          treeType={treeType}
        />
      </main>
    </div>
  );
}

export default App;
