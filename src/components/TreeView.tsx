import { TreeNode } from '../types';
import TreeNodeComponent from './TreeNode';

interface TreeViewProps {
  tree: TreeNode;
  defaultExpandLevel?: number;
  expandedNodes?: Set<string>;
  searchResults?: any[];
  loadTopicChildren?: (subfieldId: string, topicFile: string) => Promise<TreeNode[]>;
  topicCache?: Map<string, TreeNode[]>;
}

const TreeView: React.FC<TreeViewProps> = ({
  tree,
  defaultExpandLevel = 2,
  expandedNodes,
  searchResults,
  loadTopicChildren,
  topicCache
}) => {
  return (
    <div className="tree-view">
      <TreeNodeComponent
        node={tree}
        level={0}
        defaultExpandLevel={defaultExpandLevel}
        expandedNodes={expandedNodes}
        searchResults={searchResults}
        loadTopicChildren={loadTopicChildren}
        topicCache={topicCache}
      />
    </div>
  );
};

export default TreeView;
