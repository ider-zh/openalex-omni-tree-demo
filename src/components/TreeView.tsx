import { useMemo } from 'react';
import { TreeNode } from '../types';
import TreeNodeComponent from './TreeNode';
import { TFunction } from '../context/I18nContext';

interface TreeViewProps {
  tree: TreeNode;
  defaultExpandLevel?: number;
  expandedNodes?: Set<string>;
  searchResults?: any[];
  searchQuery?: string;
  t: TFunction;
}

const TreeView: React.FC<TreeViewProps> = ({
  tree,
  defaultExpandLevel = 2,
  expandedNodes,
  searchResults,
  searchQuery,
  t,
}) => {
  // If tree has a .tree array (concepts format), create a proper root node
  const rootNodes = useMemo(() => {
    if (tree.tree && Array.isArray(tree.tree)) {
      return tree.tree as TreeNode[];
    }
    return null;
  }, [tree]);

  // Concepts format: root object is not a valid TreeNode, render .tree items directly
  if (rootNodes) {
    return (
      <div className="tree-view">
        {rootNodes.map((root: TreeNode) => (
          <TreeNodeComponent
            key={root.id}
            node={root}
            level={0}
            defaultExpandLevel={defaultExpandLevel}
            expandedNodes={expandedNodes}
            searchResults={searchResults}
            searchQuery={searchQuery}
            t={t}
          />
        ))}
      </div>
    );
  }

  // Topics format: tree is a single valid root TreeNode
  return (
    <div className="tree-view">
      <TreeNodeComponent
        node={tree}
        level={0}
        defaultExpandLevel={defaultExpandLevel}
        expandedNodes={expandedNodes}
        searchResults={searchResults}
        searchQuery={searchQuery}
        t={t}
      />
    </div>
  );
};

export default TreeView;
