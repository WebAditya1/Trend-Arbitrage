import React from 'react';
import ClusterCard from './ClusterCard';

const ClusterList = ({ clusters, loading }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading clusters...</p>
      </div>
    );
  }

  if (!clusters || clusters.length === 0) {
    return (
      <div className="empty-state">
        <p>No trend clusters found. Try refreshing or adjusting filters.</p>
        <p className="empty-hint">Clusters group related trends together based on keywords and topic similarity.</p>
      </div>
    );
  }

  return (
    <div className="cluster-list">
      {clusters.map((cluster, index) => (
        <ClusterCard key={`cluster-${index}`} cluster={cluster} />
      ))}
    </div>
  );
};

export default ClusterList;
