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
          <div className="meta-row">
            <span className="meta-label">Domain:</span>
            <span className="meta-value">{topic.domain.display_name}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Field:</span>
            <span className="meta-value">{topic.field.display_name}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Subfield:</span>
            <span className="meta-value">{topic.subfield.display_name}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Works Count:</span>
            <span className="meta-value">{topic.works_count.toLocaleString()}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Updated:</span>
            <span className="meta-value">{new Date(topic.updated_date).toLocaleDateString()}</span>
          </div>
        </div>

        {topic.keywords.length > 0 && (
          <div className="keywords-section">
            <h5>Keywords</h5>
            <div className="keywords-list">
              {topic.keywords.map((keyword, index) => (
                <span key={index} className="keyword-badge">{keyword}</span>
              ))}
            </div>
          </div>
        )}

        <div className="topic-links">
          {topic.ids.wikipedia && (
            <a href={topic.ids.wikipedia} target="_blank" rel="noopener noreferrer">
              Wikipedia
            </a>
          )}
          <a href={topic.ids.openalex} target="_blank" rel="noopener noreferrer">
            OpenAlex
          </a>
        </div>
      </div>
    </div>
  );
}
