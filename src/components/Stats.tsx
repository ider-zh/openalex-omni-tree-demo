interface StatsProps {
  totalTopics: number;
  totalWorks: number;
}

export function Stats({ totalTopics, totalWorks }: StatsProps) {
  return (
    <div className="stats-container">
      <div className="stat-item">
        <span className="stat-value">{totalTopics.toLocaleString()}</span>
        <span className="stat-label">Total Topics</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{totalWorks.toLocaleString()}</span>
        <span className="stat-label">Total Works</span>
      </div>
    </div>
  );
}
