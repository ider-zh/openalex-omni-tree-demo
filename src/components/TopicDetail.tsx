import { TreeNode } from '../types';

interface TopicDetailProps {
  topic: TreeNode | null;
}

export function TopicDetail({ topic }: TopicDetailProps) {
  if (!topic) {
    return (
      <div className="detail-panel">
        <h3>Topic Details</h3>
        <div className="topic-detail">
          <p>Select a topic to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-panel">
      <h3>Topic Details</h3>
      <div className="topic-detail">
        <h4 className="topic-title">{topic.name}</h4>

        <div className="topic-meta">
          {topic.works_count !== undefined && (
            <div className="meta-row">
              <span className="meta-label">Works Count:</span>
              <span className="meta-value">{topic.works_count.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="topic-links">
          <a href={`https://openalex.org/${topic.id}`} target="_blank" rel="noopener noreferrer">
            View on OpenAlex
          </a>
        </div>
      </div>
    </div>
  );
}
