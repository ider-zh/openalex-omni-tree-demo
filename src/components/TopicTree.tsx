import { useState } from 'react';
import { TreeNode } from '../types';

interface TopicTreeProps {
  topics: TreeNode[];
  selectedTopic: TreeNode | null;
  onSelectTopic: (topic: TreeNode) => void;
}

interface TreeNodeProps {
  topic: TreeNode;
  isSelected: boolean;
  onSelect: (topic: TreeNode) => void;
}

function TreeNodeItem({ topic, isSelected, onSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="tree-node">
      <div
        className={`tree-node-header ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(topic)}
      >
        <span className="expand-icon" onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="topic-name">{topic.name}</span>
        {topic.works_count !== undefined && (
          <span className="works-count">{topic.works_count.toLocaleString()}</span>
        )}
      </div>
      {isExpanded && topic.children.length > 0 && (
        <div className="tree-node-content">
          {topic.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              topic={child}
              isSelected={false}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TopicTree({ topics, selectedTopic, onSelectTopic }: TopicTreeProps) {
  if (topics.length === 0) {
    return (
      <div className="tree-container">
        <div className="empty-state">No topics found</div>
      </div>
    );
  }

  return (
    <div className="tree-container">
      <div className="tree-view">
        {topics.map((topic) => (
          <TreeNodeItem
            key={topic.id}
            topic={topic}
            isSelected={selectedTopic?.id === topic.id}
            onSelect={onSelectTopic}
          />
        ))}
      </div>
    </div>
  );
}
