import { Topic } from '../types';

interface TopicDetailProps {
  topic: Topic | null;
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
        <h4 className="topic-title">{topic.display_name}</h4>
        
        {topic.description && (
          <p className="topic-description">{topic.description}</p>
        )}

        <div className="topic-meta">
          {topic.domain && (
            <div className="meta-row">
              <span className="meta-label">Domain:</span>
              <span className="meta-value">{topic.domain}</span>
            </div>
          )}
          {topic.field && (
            <div className="meta-row">
              <span className="meta-label">Field:</span>
              <span className="meta-value">{topic.field}</span>
            </div>
          )}
          {topic.subfield && (
            <div className="meta-row">
              <span className="meta-label">Subfield:</span>
              <span className="meta-value">{topic.subfield}</span>
            </div>
          )}
          {topic.works_count !== undefined && (
            <div className="meta-row">
              <span className="meta-label">Works Count:</span>
              <span className="meta-value">{topic.works_count.toLocaleString()}</span>
            </div>
          )}
        </div>

        {topic.keywords && topic.keywords.length > 0 && (
          <div className="keywords-section">
            <h5>Keywords</h5>
            <div className="keywords-list">
              {topic.keywords.map((keyword: string, index: number) => (
                <span key={index} className="keyword-badge">{keyword}</span>
              ))}
            </div>
          </div>
        )}

        <div className="topic-links">
          <a href={`https://openalex.org/${topic.id}`} target="_blank" rel="noopener noreferrer">
            View on OpenAlex
          </a>
        </div>
      </div>
    </div>
  );
}
