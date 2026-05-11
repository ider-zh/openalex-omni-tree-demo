import { useState, useEffect, useCallback } from 'react';
import { TreeNode, SearchResult } from './types';
import TreeView from './components/TreeView';
import SearchBar from './components/SearchBar';
import treeData from '../data/topics-tree.json';
import searchData from '../data/search-index.json';

function App() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load tree data
    setTree(treeData as TreeNode);
  }, []);

  const searchTopics = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setExpandedNodes(new Set());
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();
    
    // Search through the search index
    const matches: SearchResult[] = [];
    
    searchData.forEach((item: any) => {
      const searchText = `${item.name} ${item.description} ${item.keywords?.join(' ')} ${item.domain} ${item.field} ${item.subfield}`.toLowerCase();
      
      if (searchText.includes(lowerQuery)) {
        // Build the path from root to this topic
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

    // Expand nodes that are in the search results path
    const nodesToExpand = new Set<string>();
    matches.forEach(result => {
      result.path.forEach(nodeName => {
        nodesToExpand.add(nodeName);
      });
    });

    setSearchResults(matches);
    setExpandedNodes(nodesToExpand);
    setIsSearching(false);
  }, []);

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
        {tree ? (
          <TreeView 
            tree={tree}
            defaultExpandLevel={searchResults.length > 0 ? undefined : 2}
            expandedNodes={expandedNodes}
            searchResults={searchResults}
          />
        ) : (
          <div className="loading">Loading tree data...</div>
        )}
      </main>
    </div>
  );
}

export default App;
