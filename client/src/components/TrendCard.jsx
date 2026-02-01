import React from 'react';

const TrendCard = ({ trend }) => {
  const getSourceColor = (source) => {
    const colors = {
      reddit: '#FF4500',
      hackernews: '#FF6600',
      github: '#24292e',
      rss: '#0066CC',
      producthunt: '#DA552F',
    };
    return colors[source] || '#666';
  };

  const formatScore = (score) => {
    return score.toFixed(2);
  };

  const formatAge = (ageInHours) => {
    if (ageInHours < 1) return `${Math.round(ageInHours * 60)}m ago`;
    if (ageInHours < 24) return `${Math.round(ageInHours)}h ago`;
    return `${Math.round(ageInHours / 24)}d ago`;
  };

  return (
    <div className="trend-card">
      <div className="trend-header">
        <span 
          className="source-badge" 
          style={{ backgroundColor: getSourceColor(trend.source) }}
        >
          {trend.source.toUpperCase()}
        </span>
        <span className="rising-score">
          🔥 {formatScore(trend.risingScore)}
        </span>
      </div>
      
      <h3 className="trend-title">
        <a 
          href={trend.url} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {trend.title}
        </a>
      </h3>
      
      <div className="trend-metrics">
        <span className="metric">
          Engagement: {Math.round(trend.engagement)}
        </span>
        {trend.metadata.ageInHours && (
          <span className="metric">
            Age: {formatAge(trend.metadata.ageInHours)}
          </span>
        )}
      </div>
      
      {trend.metadata.subreddit && (
        <div className="trend-meta">
          r/{trend.metadata.subreddit} • 
          {trend.metadata.score} upvotes • 
          {trend.metadata.comments} comments
        </div>
      )}
      
      {trend.metadata.score && !trend.metadata.subreddit && (
        <div className="trend-meta">
          {trend.metadata.score} points • 
          {trend.metadata.comments} comments
        </div>
      )}
      
      {trend.metadata.stars && (
        <div className="trend-meta">
          {trend.metadata.stars} stars • 
          {trend.metadata.forks} forks • 
          {trend.metadata.language || 'N/A'}
        </div>
      )}
      
      {trend.metadata.votes !== undefined && (
        <div className="trend-meta">
          {trend.metadata.votes} votes • 
          {trend.metadata.comments} comments
          {trend.metadata.tagline && ` • ${trend.metadata.tagline}`}
        </div>
      )}
      
      {trend.keywords && trend.keywords.length > 0 && (
        <div className="trend-keywords">
          {trend.keywords.map((keyword, idx) => (
            <span key={idx} className="keyword-tag">
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendCard;
