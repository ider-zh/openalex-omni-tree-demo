import { TFunction } from '../context/I18nContext';

interface HeroSectionProps {
  treeType: 'topics' | 'concepts';
  t: TFunction;
  switchTreeType: (type: string) => void;
  currentType: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ treeType, t, switchTreeType, currentType }) => {
  const isConcepts = treeType === 'concepts';

  return (
    <section className="hero-section">
      <h1 className="hero-title">{isConcepts ? t('conceptsTitle') : t('topicsTitle')}</h1>
      <p className="hero-subtitle">{isConcepts ? t('conceptsSubtitle') : t('topicsSubtitle')}</p>

      <div className="tree-type-toggle">
        <button
          className={`toggle-btn ${currentType === 'topics' ? 'active' : ''}`}
          onClick={() => switchTreeType('topics')}
        >
          Topics
        </button>
        <button
          className={`toggle-btn ${currentType === 'concepts' ? 'active' : ''}`}
          onClick={() => switchTreeType('concepts')}
        >
          Concepts
        </button>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <h3>📚 {t('whatIsOpenAlex')}</h3>
          <p>{t('openAlexDesc')}</p>
          <p>{t('learnMore')} <a href="https://openalex.org" target="_blank" style={{ color: 'var(--text-accent)' }}>openalex.org</a></p>
        </div>

        <div className="info-card">
          <h3>🏷️ {isConcepts ? t('whatAreConcepts') : t('whatAreTopics')}</h3>
          <p>{isConcepts ? t('conceptsDesc') : t('topicsDesc')}</p>
          <ul>
            <li>{isConcepts ? t('conceptFeature1') : t('topicFeature1')}</li>
            <li>{isConcepts ? t('conceptFeature2') : t('topicFeature2')}</li>
            <li>{isConcepts ? t('conceptFeature3') : t('topicFeature3')}</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>🌳 {t('treeStructure')}</h3>
          <p>{isConcepts ? t('conceptsTreeDesc') : t('topicsTreeDesc')}</p>
          <div className="hierarchy-visual">
            {isConcepts ? (
              <>
                <div className="hierarchy-level"><span className="level-icon">🌐</span>{t('hierarchyConceptsLevel0')}</div>
                <div className="hierarchy-level"><span className="level-icon">📚</span>{t('hierarchyConceptsLevel1')}</div>
                <div className="hierarchy-level"><span className="level-icon">📖</span>{t('hierarchyConceptsLevel2')}</div>
                <div className="hierarchy-level"><span className="level-icon">📄</span>{t('hierarchyConceptsLevel3')}</div>
                <div className="hierarchy-level sub-level">{t('hierarchyConceptsLevel4')}</div>
                <div className="hierarchy-level sub-level">{t('hierarchyConceptsLevel5')}</div>
              </>
            ) : (
              <>
                <div className="hierarchy-level"><span className="level-icon">🌐</span>{t('hierarchyDomain')}</div>
                <div className="hierarchy-level"><span className="level-icon">📚</span>{t('hierarchyField')}</div>
                <div className="hierarchy-level"><span className="level-icon">📖</span>{t('hierarchySubfield')}</div>
                <div className="hierarchy-level"><span className="level-icon">📄</span>{t('hierarchyTopic')}</div>
              </>
            )}
          </div>
        </div>

        <div className="info-card">
          <h3>🔍 {t('howToUse')}</h3>
          <p>{t('howToUseDesc')}</p>
          <ul>
            <li>{t('usageTip1')}</li>
            <li>{t('usageTip2')}</li>
            <li>{t('usageTip3')}</li>
          </ul>
        </div>
      </div>

      <a
        href="#tree-content"
        className="jump-button"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('tree-content')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        ↓ {isConcepts ? t('conceptsJumpButton') : t('jumpButton')}
      </a>
    </section>
  );
};

export default HeroSection;
