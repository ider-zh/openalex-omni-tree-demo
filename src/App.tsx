import { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './context/I18nContext';
import { useTheme } from './hooks/useTheme';
import { topicsStore } from './stores/topicsStore';
import { conceptsStore } from './stores/conceptsStore';
import TreePage from './components/TreePage';

type TreeType = 'topics' | 'concepts';

function AppContent() {
  const { lang, setLang, t } = useI18n();
  const { theme, setTheme } = useTheme();

  const [treeType, setTreeType] = useState<TreeType>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash === 'concepts' ? 'concepts' : 'topics';
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setTreeType(hash === 'concepts' ? 'concepts' : 'topics');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const switchTreeType = (type: string) => {
    if (type === treeType) return;
    window.location.hash = type;
  };

  const store = treeType === 'topics' ? topicsStore : conceptsStore;

  return (
    <div className="app">
      <div className="settings-bar">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="lang-dropdown"
          title={t('languageLabel')}
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
          <option value="ja">日本語</option>
        </select>
        <button
          className="setting-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={t('themeLabel')}
        >
          {theme === 'dark' ? `☀️ ${t('lightTheme')}` : `🌙 ${t('darkTheme')}`}
        </button>
      </div>
      <TreePage
        treeType={treeType}
        store={store}
        t={t}
        switchTreeType={switchTreeType}
        currentType={treeType}
      />
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

export default App;
