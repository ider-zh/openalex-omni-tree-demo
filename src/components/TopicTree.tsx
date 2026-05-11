import { useState } from 'react';
import { Topic } from '../types';

interface TopicTreeProps {
  topics: Topic[];
  selectedTopic: Topic | null;
  onSelectTopic: (topic: Topic) => void;
}

interface TreeNodeProps {
  topic: Topic;
  isSelected: boolean;
  onSelect: (topic: Topic) => void;
}

function TreeNode({ topic, isSelected, onSelect }: TreeNodeProps) {
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
        <span className="topic-name">{topic.display_name}</span>
        <span className="works-count">{topic.works_count}</span>
      </div>
      {isExpanded && (
        <div className="tree-node-content">
          <div className="topic-info">
            {topic.domain && <span className="info-item">Domain: {topic.domain}</span>}
            {topic.field && <span className="info-item">Field: {topic.field}</span>}
            {topic.subfield && <span className="info-item">Subfield: {topic.subfield}</span>}
          </div>
          {topic.keywords && topic.keywords.length > 0 && (
            <div className="keywords">
              {topic.keywords.slice(0, 5).map((keyword: string, index: number) => (
                <span key={index} className="keyword-tag">{keyword}</span>
              ))}
            </div>
          )}
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
          <TreeNode
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
