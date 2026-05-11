import { useState, useEffect, useCallback } from 'react';
import { TreeNode, SearchResult } from './types';
import TreeView from './components/TreeView';
import SearchBar from './components/SearchBar';

function App() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [searchData, setSearchData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [treeRes, searchRes] = await Promise.all([
          fetch('/data/topics-tree.json').then(r => {
            if (!r.ok) throw new Error('Failed to load tree data');
            return r.json();
          }),
          fetch('/data/search-index.json').then(r => {
            if (!r.ok) throw new Error('Failed to load search data');
            return r.json();
          }),
        ]);

        setTree(treeRes);
        setSearchData(searchRes);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const searchTopics = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setExpandedNodes(new Set());
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();
    
    const matches: SearchResult[] = [];
    
    searchData.forEach((item: any) => {
      const searchText = `${item.name} ${item.description} ${item.keywords?.join(' ')} ${item.domain} ${item.field} ${item.subfield}`.toLowerCase();
      
      if (searchText.includes(lowerQuery)) {
        const path = [item.domain, item.field, item.subfield, item.name].filter(Boolean);
        matches.push({
          id: item.id,
          path,
          node: {
            id: item.id,
            name: item.name,
            type: 'topic',
            description: item.description,
            works_count: item.works_count,
            keywords: item.keywords,
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
          placeholder="Search topics, keywords, domains..."
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
        />
      </main>
    </div>
  );
}

export default App;
