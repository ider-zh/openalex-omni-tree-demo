import { TreeNode } from '../types';
import TreeNodeComponent from './TreeNode';

interface TreeViewProps {
  tree: TreeNode;
  defaultExpandLevel?: number;
  expandedNodes?: Set<string>;
  searchResults?: any[];
}

const TreeView: React.FC<TreeViewProps> = ({
  tree,
  defaultExpandLevel = 2,
  expandedNodes,
  searchResults
}) => {
  return (
    <div className="tree-view">
      <TreeNodeComponent
        node={tree}
        level={0}
        defaultExpandLevel={defaultExpandLevel}
        expandedNodes={expandedNodes}
        searchResults={searchResults}
      />
    </div>
  );
};

export default TreeView;
