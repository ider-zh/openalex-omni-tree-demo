import { useState, useEffect, useCallback } from 'react';
import { TreeStore } from '../stores/createTreeStore';
import HeroSection from './HeroSection';
import SearchContainer from './SearchContainer';
import TreeView from './TreeView';
import { TFunction } from '../context/I18nContext';

interface TreePageProps {
  treeType: 'topics' | 'concepts';
  store: TreeStore;
  t: TFunction;
  switchTreeType: (type: string) => void;
  currentType: string;
}

const TreePage: React.FC<TreePageProps> = ({ treeType, store, t, switchTreeType, currentType }) => {
  const [tree, setTree] = useState(store.treeData);
  const [dataVersion, setDataVersion] = useState(store.dataVersion);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCounter, setSearchCounter] = useState(0);

  useEffect(() => {
    store.loadTree().then(() => {
      setTree(store.treeData);
      setDataVersion(store.dataVersion);
    });
  }, [store]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setExpandedNodes(new Set());
      return;
    }
    setIsSearching(true);
    const { results, expandedNodes: nodes } = await store.search(searchQuery);
    setSearchResults(results);
    setExpandedNodes(nodes);
    setSearchCounter(c => c + 1);
    setIsSearching(false);
  }, [searchQuery, store]);

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setExpandedNodes(new Set());
  };

  return (
    <div>
      <HeroSection
        treeType={treeType}
        t={t}
        dataVersion={dataVersion}
        switchTreeType={switchTreeType}
        currentType={currentType}
      />
      <SearchContainer
        treeType={treeType}
        t={t}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        handleClear={handleClear}
        isSearching={isSearching}
        searchResults={searchResults}
        searchLoaded={store.searchLoaded}
      />
      <main id="tree-content" className="main-content">
        {tree ? (
          <TreeView
            key={treeType + '-' + searchCounter}
            tree={tree}
            defaultExpandLevel={searchResults.length > 0 ? undefined : treeType === 'concepts' ? 1 : 2}
            expandedNodes={expandedNodes}
            searchResults={searchResults}
            searchQuery={searchQuery}
            t={t}
          />
        ) : (
          <div className="loading">{t('loading')}</div>
        )}
      </main>
    </div>
  );
};

export default TreePage;
