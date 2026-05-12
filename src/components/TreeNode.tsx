import { useState, useEffect, useMemo } from 'react';
import { TreeNode } from '../types';
import { parseCSV } from '../utils/csv-parser';
import { formatNumber } from '../utils/format';
import { TFunction } from '../context/I18nContext';

// Cache for lazy-loaded children (both topics and concepts)
const topicCache = new Map<string, TreeNode[]>();

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  defaultExpandLevel?: number;
  expandedNodes?: Set<string>;
  searchResults?: any[];
  searchQuery?: string;
  t: TFunction;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({
  node,
  level,
  defaultExpandLevel,
  expandedNodes,
  searchResults,
  searchQuery,
  t,
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (expandedNodes && expandedNodes.has(node.name)) return true;
    return defaultExpandLevel ? level < defaultExpandLevel : false;
  });
  const [children, setChildren] = useState<TreeNode[]>(node.children || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const CONCEPT_PAGE_SIZE = 100;

  useEffect(() => {
    setChildren(node.children || []);
    setIsLoaded(false);
  }, [node.children]);

  useEffect(() => {
    if (expandedNodes && expandedNodes.has(node.name)) {
      setIsExpanded(true);
    }
  }, [expandedNodes, node.name]);

  const hasTopicFile = node._topic_file;
  const hasConceptFile = node._concept_file;
  const hasChildren = children.length > 0 || hasTopicFile || hasConceptFile;

  const isHighlighted = searchResults && searchResults.some(
    (r: any) => r.path.includes(node.name) || r.id === node.id
  );

  const loadChildren = async () => {
    if ((hasTopicFile || hasConceptFile) && !isLoaded && !isLoading) {
      setIsLoading(true);
      try {
        const file = hasTopicFile ? node._topic_file : node._concept_file;
        const cacheKey = file!;
        if (topicCache.has(cacheKey)) {
          setChildren(topicCache.get(cacheKey)!);
        } else {
          const res = await fetch(file!);
          const csvText = await res.text();
          const csvRows = parseCSV(csvText);

          if (hasTopicFile) {
            // Topics CSV: id, name, works_count
            const topicChildren: TreeNode[] = csvRows.map((row: any) => ({
              id: row.id,
              name: row.name,
              type: 'topic' as const,
              works_count: parseInt(row.works_count, 10) || 0,
              description: row.description || '',
              children: [],
            }));
            topicCache.set(cacheKey, topicChildren);
            setChildren(topicChildren);
          } else {
            // Concepts CSV: id, name, works_count, children_count, _concept_file
            const conceptChildren: TreeNode[] = csvRows.map((row: any) => ({
              id: row.id,
              name: row.name,
              type: parseInt(row.children_count, 10) > 0 || row._concept_file ? 'field' : 'concept',
              level: row.level ? parseInt(row.level, 10) : undefined,
              works_count: parseInt(row.works_count, 10) || 0,
              children_count: parseInt(row.children_count, 10) || 0,
              _concept_file: row._concept_file || undefined,
              children: [],
            }));
            topicCache.set(cacheKey, conceptChildren);
            setChildren(conceptChildren);
          }
        }
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load children:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleExpand = async () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded && (hasTopicFile || hasConceptFile) && !isLoaded) {
      await loadChildren();
    }
  };

  useEffect(() => {
    if (isExpanded && (hasTopicFile || hasConceptFile) && !isLoaded) {
      loadChildren();
    }
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const getIcon = () => {
    switch (node.type) {
      case 'domain': return '🌐';
      case 'field': return '📚';
      case 'subfield': return '📖';
      case 'topic': return '📄';
      case 'concept': return '💡';
      default: return node.works_count !== undefined ? '💡' : '📁';
    }
  };

  const openInOpenAlex = (e: React.MouseEvent) => {
    e.stopPropagation();
    const topicId = node.id;
    const url = topicId.startsWith('https://openalex.org/')
      ? topicId
      : `https://openalex.org/${topicId}`;
    window.open(url, '_blank');
  };

  const highlightText = (text: string, query: string | undefined) => {
    if (!query || !text) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <span className="highlight" style={{ backgroundColor: '#ffd700', color: '#000', padding: '0 2px', borderRadius: '2px' }}>
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  const filteredChildren = useMemo(() => {
    if (!hasChildren || !searchResults || searchResults.length === 0) {
      return children || [];
    }

    const topicIds = new Set<string>();
    searchResults.forEach((result: any) => { topicIds.add(result.id); });

    if (node.type === 'root') {
      const matchingDomains = new Set<string>();
      searchResults.forEach((result: any) => {
        if (result.path.length > 0) matchingDomains.add(result.path[0]);
      });
      return (node.children || []).filter(child => matchingDomains.has(child.name));
    }

    if (node.type === 'topic' || node.type === 'concept') {
      const isMatch = topicIds.has(node.id);
      return isMatch ? (node.children || []) : [];
    }

    const pathIndex = node.type === 'domain' ? 0 :
                      node.type === 'field' ? 1 :
                      node.type === 'subfield' ? 2 : -1;

    if (pathIndex === -1) {
      const validChildNames = new Set<string>();
      searchResults.forEach((result: any) => {
        const idx = result.path.indexOf(node.name);
        if (idx >= 0 && idx < result.path.length - 1) {
          validChildNames.add(result.path[idx + 1]);
        }
      });
      return (children || []).filter(child => {
        if (topicIds.has(child.id)) return true;
        return validChildNames.has(child.name);
      });
    }

    const nodeInAnyPath = searchResults.some((result: any) => {
      if (result.path.length <= pathIndex) return false;
      return result.path[pathIndex] === node.name;
    });
    if (!nodeInAnyPath) return [];

    const childPathIndex = pathIndex + 1;
    const validChildNames = new Set<string>();
    searchResults.forEach((result: any) => {
      if (result.path.length > pathIndex && result.path[pathIndex] === node.name) {
        if (result.path.length > childPathIndex) {
          validChildNames.add(result.path[childPathIndex]);
        }
      }
    });

    return (children || []).filter(child => {
      if (child.type === 'topic' || child.type === 'concept') {
        return topicIds.has(child.id);
      }
      return validChildNames.has(child.name);
    });
  }, [children, searchResults, node.name, node.type, level]);

  return (
    <div className="tree-node" style={{ marginLeft: `${level * 20}px` }} data-type={node.type}>
      <div
        className={`tree-node-header ${isHighlighted ? 'highlighted' : ''}`}
        onClick={hasChildren ? toggleExpand : undefined}
        role={hasChildren ? 'button' : undefined}
        tabIndex={0}
      >
        {hasChildren && (
          <span className="expand-icon">
            {isLoading ? '⏳' : isExpanded ? '▼' : '▶'}
          </span>
        )}
        <span className="node-icon">{getIcon()}</span>
        <span className="node-name">{highlightText(node.name, searchQuery)}</span>
        <span className="node-stats">
          {node.works_count !== undefined && (
            <span className="stat-item" title={t('worksCountTitle')}>📚 {formatNumber(node.works_count)}</span>
          )}
          {node.topic_count !== undefined && (
            <span className="stat-item" title={t('topicCountTitle')}>📄 {node.topic_count}</span>
          )}
          {node.concept_count !== undefined && (
            <span className="stat-item" title={t('conceptCountTitle')}>💡 {node.concept_count}</span>
          )}
          {node.type !== 'root' && (
            <button className="openalex-btn" onClick={openInOpenAlex} title={t('openAlexTitle')}>🔗</button>
          )}
        </span>
      </div>

      {isExpanded && filteredChildren.length > 0 && (
        <div className="tree-children">
          {filteredChildren.slice(0, visibleCount).map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              defaultExpandLevel={defaultExpandLevel}
              expandedNodes={expandedNodes}
              searchResults={searchResults}
              searchQuery={searchQuery}
              t={t}
            />
          ))}
          {filteredChildren.length > visibleCount && (
            <div style={{ marginLeft: `${(level + 1) * 20}px`, padding: '8px', textAlign: 'center' }}>
              <button
                className="toggle-btn"
                style={{ fontSize: '0.85rem', padding: '6px 16px' }}
                onClick={() => setVisibleCount(prev => prev + CONCEPT_PAGE_SIZE)}
              >
                {t('showMore', { count: filteredChildren.length - visibleCount })}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TreeNodeComponent;
