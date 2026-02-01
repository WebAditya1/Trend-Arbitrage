import React from 'react';
import TrendCard from './TrendCard';

const ClusterCard = ({ cluster }) => {
  return (
    <div className="cluster-card">
      <div className="cluster-header">
        <div className="cluster-title">
          <span className="buzzword-badge">{cluster.buzzword || 'Trend Cluster'}</span>
          <span className="cluster-score">🔥 {cluster.clusterScore.toFixed(2)}</span>
        </div>
        <div className="cluster-keywords">
          {cluster.keywords && cluster.keywords.length > 0 && (
            <div className="keywords-list">
              {cluster.keywords.map((keyword, idx) => (
                <span key={idx} className="keyword-badge">
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="cluster-meta">
          {cluster.trends.length} related trend{cluster.trends.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="cluster-trends">
        {cluster.trends.map((trend, index) => (
          <div key={`${trend.url}-${index}`} className="cluster-trend-item">
            <TrendCard trend={trend} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClusterCard;
