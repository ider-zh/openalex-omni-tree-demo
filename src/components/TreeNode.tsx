import { useState } from 'react';
import { TreeNode } from '../types';

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  defaultExpandLevel?: number;
  expandedNodes?: Set<string>;
  searchResults?: any[];
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({
  node,
  level,
  defaultExpandLevel,
  expandedNodes,
  searchResults
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (expandedNodes && expandedNodes.has(node.name)) {
      return true;
    }
    return defaultExpandLevel ? level < defaultExpandLevel : false;
  });

  const hasChildren = node.children && node.children.length > 0;
  
  // Check if this node is in the search results path
  const isHighlighted = searchResults && searchResults.some(r => 
    r.path.includes(node.name) || r.id === node.id
  );

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
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
            {isExpanded ? '▼' : '▶'}
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
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              defaultExpandLevel={defaultExpandLevel}
              expandedNodes={expandedNodes}
              searchResults={searchResults}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNodeComponent;
