import { useState } from 'react';
import { TreeNode } from '../types';

type TreeType = 'topics' | 'concepts';

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  defaultExpandLevel?: number;
  expandedNodes?: Set<string>;
  searchResults?: any[];
  loadItemChildren?: (subfieldId: string, filePath: string) => Promise<TreeNode[]>;
  itemCache?: Map<string, TreeNode[]>;
  treeType?: TreeType;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({
  node,
  level,
  defaultExpandLevel,
  expandedNodes,
  searchResults,
  loadItemChildren,
  itemCache,
  treeType = 'topics'
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

  const fileProperty = treeType === 'topics' ? '_topic_file' : '_concept_file';
  const hasItemFile = node[fileProperty] && loadItemChildren;
  const hasChildren = children.length > 0 || hasItemFile;
  
  const isHighlighted = searchResults && searchResults.some(r => 
    r.path.includes(node.name) || r.id === node.id
  );

  const toggleExpand = async () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded && hasItemFile && !isLoaded) {
      setIsLoading(true);
      try {
        const filePath = treeType === 'topics' ? node._topic_file : node._concept_file;
        const itemChildren = await loadItemChildren!(node.id, filePath!);
        setChildren(itemChildren);
        setIsLoaded(true);
      } catch (err) {
        console.error(`Failed to load ${treeType} children:`, err);
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
      case 'concept':
        return '💡';
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
              loadItemChildren={loadItemChildren}
              itemCache={itemCache}
              treeType={treeType}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreeNodeComponent;
