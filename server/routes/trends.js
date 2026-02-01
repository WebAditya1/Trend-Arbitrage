const express = require('express');
const router = express.Router();
const { getTopTrends, fetchAndScoreTrends, clusterTrendsByKeywords } = require('../services/scoring');

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const minScore = parseFloat(req.query.minScore) || 0;
    const clustered = req.query.clustered === 'true';
    
    const trends = await getTopTrends(limit, minScore);
    
    if (clustered) {
      const clusters = clusterTrendsByKeywords(trends);
      return res.json({
        trends,
        clusters,
        count: trends.length,
        clusterCount: clusters.length,
      });
    }
    
    res.json({
      trends,
      count: trends.length,
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    console.log('Manual refresh triggered');
    const trends = await fetchAndScoreTrends();
    res.json({
      message: 'Trends refreshed successfully',
      count: trends.length,
    });
  } catch (error) {
    console.error('Error refreshing trends:', error);
    res.status(500).json({ error: 'Failed to refresh trends' });
  }
});

router.get('/sources/:source', async (req, res) => {
  try {
    const source = req.params.source;
    const limit = parseInt(req.query.limit) || 50;
    
    const trends = await getTopTrends(limit * 2, 0);
    const filteredTrends = trends
      .filter(t => t.source === source)
      .slice(0, limit);
    
    res.json({
      trends: filteredTrends,
      count: filteredTrends.length,
      source,
    });
  } catch (error) {
    console.error('Error fetching trends by source:', error);
    res.status(500).json({ error: 'Failed to fetch trends by source' });
  }
});

router.get('/clusters', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const minScore = parseFloat(req.query.minScore) || 0;
    
    const trends = await getTopTrends(limit, minScore);
    const clusters = clusterTrendsByKeywords(trends);
    
    res.json({
      clusters,
      count: clusters.length,
      totalTrends: trends.length,
    });
  } catch (error) {
    console.error('Error fetching clusters:', error);
    res.status(500).json({ error: 'Failed to fetch clusters' });
  }
});

module.exports = router;