import React from 'react';
import TrendCard from './TrendCard';

const TrendList = ({ trends, loading }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading trends...</p>
      </div>
    );
  }

  if (!trends || trends.length === 0) {
    return (
      <div className="empty-state">
        <p>No trends found. Try refreshing or adjusting filters.</p>
      </div>
    );
  }

  return (
    <div className="trend-list">
      {trends.map((trend, index) => (
        <TrendCard key={`${trend.url}-${index}`} trend={trend} />
      ))}
    </div>
  );
};

export default TrendList;
