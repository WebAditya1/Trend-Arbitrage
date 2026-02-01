import React, { useState, useEffect } from 'react';
import { trendsAPI } from './services/api';
import TrendList from './components/TrendList';
import ClusterList from './components/ClusterList';
import './App.css';

function App() {
  const [trends, setTrends] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [viewMode, setViewMode] = useState('trends'); // 'trends' or 'clusters'

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const data = await trendsAPI.getTrends(50, minScore);
      setTrends(data.trends || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching trends:', error);
      alert('Failed to fetch trends. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const data = await trendsAPI.getClusters(50, minScore);
      setClusters(data.clusters || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching clusters:', error);
      alert('Failed to fetch clusters. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await trendsAPI.refreshTrends();
      if (viewMode === 'trends') {
        await fetchTrends();
      } else {
        await fetchClusters();
      }
    } catch (error) {
      console.error('Error refreshing trends:', error);
      alert('Failed to refresh trends.');
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (viewMode === 'trends') {
      fetchTrends();
    } else {
      fetchClusters();
    }
    const interval = setInterval(() => {
      if (viewMode === 'trends') {
        fetchTrends();
      } else {
        fetchClusters();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [minScore, viewMode]);

  // Fetch trends by source (only in trends mode)
  useEffect(() => {
    if (viewMode === 'trends') {
      if (sourceFilter === 'all') {
        fetchTrends();
      } else {
        const fetchBySource = async () => {
          try {
            setLoading(true);
            const data = await trendsAPI.getTrendsBySource(sourceFilter, 50);
            setTrends(data.trends || []);
          } catch (error) {
            console.error('Error fetching trends by source:', error);
          } finally {
            setLoading(false);
          }
        };
        fetchBySource();
      }
    }
  }, [sourceFilter, viewMode]);

  const filteredTrends = trends.filter(trend => {
    if (sourceFilter === 'all') return true;
    return trend.source === sourceFilter;
  });

  return (
    <div className="App">
      <header className="App-header">
        <h1>Trend Arbitrage</h1>
        <p className="subtitle">Discover emerging trends before they hit mainstream</p>
      </header>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="view-mode">View Mode:</label>
          <select
            id="view-mode"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="trends">Individual Trends</option>
            <option value="clusters">Trend Clusters (Buzzwords)</option>
          </select>
        </div>

        {viewMode === 'trends' && (
          <div className="control-group">
            <label htmlFor="source-filter">Filter by Source:</label>
            <select
              id="source-filter"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
            <option value="all">All Sources</option>
            <option value="reddit">Reddit</option>
            <option value="producthunt">Product Hunt</option>
            <option value="hackernews">Hacker News</option>
            <option value="github">GitHub</option>
            <option value="rss">RSS Feeds</option>
            </select>
          </div>
        )}

        {viewMode === 'trends' && (
          <div className="control-group">
            <label htmlFor="min-score">Min Rising Score:</label>
            <input
              id="min-score"
              type="number"
              min="0"
              step="0.1"
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}
        {viewMode === 'clusters' && (
          <div className="control-group">
            <label htmlFor="min-score">Min Cluster Score:</label>
            <input
              id="min-score"
              type="number"
              min="0"
              step="0.1"
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        <button
          className="refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Trends'}
        </button>
      </div>

      {lastUpdated && (
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      <div className="stats">
        {viewMode === 'trends' ? (
          <>
            <span>Showing {filteredTrends.length} trends</span>
            {filteredTrends.length > 0 && (
              <span>
                Top score: {filteredTrends[0].risingScore.toFixed(2)}
              </span>
            )}
          </>
        ) : (
          <>
            <span>Showing {clusters.length} trend clusters</span>
            {clusters.length > 0 && (
              <span>
                Top cluster score: {clusters[0].clusterScore.toFixed(2)}
              </span>
            )}
          </>
        )}
      </div>

      {viewMode === 'trends' ? (
        <TrendList trends={filteredTrends} loading={loading} />
      ) : (
        <ClusterList clusters={clusters} loading={loading} />
      )}
    </div>
  );
}

export default App;
