import { TreeNode } from '../types';
import TreeNodeComponent from './TreeNode';

type TreeType = 'topics' | 'concepts';

interface TreeViewProps {
  tree: TreeNode;
  defaultExpandLevel?: number;
  expandedNodes?: Set<string>;
  searchResults?: any[];
  loadItemChildren?: (subfieldId: string, filePath: string) => Promise<TreeNode[]>;
  itemCache?: Map<string, TreeNode[]>;
  treeType?: TreeType;
}

const TreeView: React.FC<TreeViewProps> = ({
  tree,
  defaultExpandLevel = 2,
  expandedNodes,
  searchResults,
  loadItemChildren,
  itemCache,
  treeType = 'topics'
}) => {
  return (
    <div className="tree-view">
      <TreeNodeComponent
        node={tree}
        level={0}
        defaultExpandLevel={defaultExpandLevel}
        expandedNodes={expandedNodes}
        searchResults={searchResults}
        loadItemChildren={loadItemChildren}
        itemCache={itemCache}
        treeType={treeType}
      />
    </div>
  );
};

export default TreeView;
