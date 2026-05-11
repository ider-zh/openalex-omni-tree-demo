import { useState } from 'react';
import { TreeNode } from '../types';

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  defaultExpandLevel?: number;
  expandedNodes?: Set<string>;
  searchResults?: any[];
  loadTopicChildren?: (subfieldId: string, topicFile: string) => Promise<TreeNode[]>;
  topicCache?: Map<string, TreeNode[]>;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({
  node,
  level,
  defaultExpandLevel,
  expandedNodes,
  searchResults,
  loadTopicChildren,
  topicCache
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (expandedNodes && expandedNodes.has(node.name)) {
      return true;
    }
    return defaultExpandLevel ? level < defaultExpandLevel : false;
  });
  const [children, setChildren] = useState<TreeNode[]>(node.children || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const hasTopicFile = node._topic_file && loadTopicChildren;
  const hasChildren = children.length > 0 || hasTopicFile;
  
  const isHighlighted = searchResults && searchResults.some(r => 
    r.path.includes(node.name) || r.id === node.id
  );

  const toggleExpand = async () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded && hasTopicFile && !isLoaded) {
      setIsLoading(true);
      try {
        const topicChildren = await loadTopicChildren!(node.id, node._topic_file!);
        setChildren(topicChildren);
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load topic children:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getIcon = () => {
    switch (node.type) {
      case 'domain':
        return '🌐';
      case 'field':
        return '📚';
      case 'subfield':
        return '📖';
      case 'topic':
        return '📄';
      default:
        return '📁';
    }
  };

  return (
    <div className="tree-node" style={{ marginLeft: `${level * 20}px` }} data-type={node.type}>
      <div 
        className={`tree-node-header ${isHighlighted ? 'highlighted' : ''}`}
        onClick={hasChildren ? toggleExpand : undefined}
        role={hasChildren ? "button" : undefined}
        tabIndex={0}
      >
        {hasChildren && (
          <span className="expand-icon">
            {isLoading ? '⏳' : isExpanded ? '▼' : '▶'}
          </span>
        )}
        <span className="node-icon">{getIcon()}</span>
        <span className="node-name">{node.name}</span>
        {node.works_count !== undefined && (
          <span className="works-count">({node.works_count.toLocaleString()})</span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="tree-children">
          {children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              defaultExpandLevel={defaultExpandLevel}
              expandedNodes={expandedNodes}
              searchResults={searchResults}
              loadTopicChildren={loadTopicChildren}
              topicCache={topicCache}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNodeComponent;
