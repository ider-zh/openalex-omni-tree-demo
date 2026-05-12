import { TFunction } from '../context/I18nContext';

interface SearchContainerProps {
  treeType: 'topics' | 'concepts';
  t: TFunction;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleSearch: () => void;
  handleClear: () => void;
  isSearching: boolean;
  searchResults: any[];
  searchLoaded: boolean;
}

const SearchContainer: React.FC<SearchContainerProps> = ({
  treeType, t, searchQuery, setSearchQuery, handleSearch, handleClear,
  isSearching, searchResults, searchLoaded,
}) => {
  const isConcepts = treeType === 'concepts';

  return (
    <div className="search-container">
      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          placeholder={isConcepts ? t('searchConceptsPlaceholder') : t('searchPlaceholder')}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">{t('searchButton')}</button>
        {searchQuery && <button onClick={handleClear} className="clear-button">✕</button>}
      </div>
      {isSearching && (
        <div className="searching-indicator">
          {!searchLoaded ? t('loadingSearchIndex') : t('searching')}
        </div>
      )}
      {searchResults.length > 0 && !isSearching && (
        <div className="search-results-count">
          {isConcepts
            ? t('foundConcepts', { count: searchResults.length })
            : t('foundTopics', { count: searchResults.length })}
        </div>
      )}
    </div>
  );
};

export default SearchContainer;
