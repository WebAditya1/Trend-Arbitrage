const Trend = require('../models/Trend');
const { fetchRedditTrends } = require('./sources/reddit');
const { fetchHackerNewsTrends } = require('./sources/hackernews');
const { fetchGitHubTrends } = require('./sources/github');
const { fetchRSSTrends } = require('./sources/rss');
const { fetchProductHuntTrends } = require('./sources/producthunt');

async function fetchAndScoreTrends() {
  console.log('Fetching trends from all sources...');
  
  const [redditTrends, hnTrends, githubTrends, rssTrends, productHuntTrends] = await Promise.all([
    fetchRedditTrends(),
    fetchHackerNewsTrends(),
    fetchGitHubTrends(),
    fetchRSSTrends(),
    fetchProductHuntTrends(),
  ]);

  const allTrends = [
    ...redditTrends,
    ...hnTrends,
    ...githubTrends,
    ...rssTrends,
    ...productHuntTrends,
  ];

  console.log(`Fetched ${allTrends.length} total trends from all sources`);

  const scoredTrends = allTrends.map(trend => ({
    ...trend,
    risingScore: calculateRisingScore(trend),
  }));

  for (const trend of scoredTrends) {
    await saveOrUpdateTrend(trend);
  }

  console.log(`Processed and saved ${scoredTrends.length} trends`);
  
  return scoredTrends;
}

function calculateRisingScore(trend) {
  const { engagement, metadata } = trend;
  const normalizedEngagement = Math.min(engagement / 10000, 1) * 100;
  const engagementScore = normalizedEngagement * 0.5;
  const ageInHours = metadata.ageInHours || 24;
  const recencyBonus = ageInHours < 1 ? 20 : 
                       ageInHours < 3 ? 15 : 
                       ageInHours < 6 ? 10 : 
                       ageInHours < 12 ? 5 : 0;
  const recencyScore = recencyBonus * 0.3;
  
  let sourceBonus = 0;
  if (trend.source === 'reddit') {
    const upvoteRatio = metadata.upvoteRatio || 0.5;
    sourceBonus = upvoteRatio * 10;
  } else if (trend.source === 'hackernews') {
    const commentRatio = metadata.comments > 0 && metadata.score > 0 
      ? metadata.comments / metadata.score 
      : 0;
    sourceBonus = Math.min(commentRatio * 5, 10);
  } else if (trend.source === 'github') {
    sourceBonus = Math.min(metadata.stars / 10, 10);
  } else if (trend.source === 'rss') {
    sourceBonus = 5;
  } else if (trend.source === 'producthunt') {
    const votes = metadata.votes || 0;
    sourceBonus = Math.min(votes / 5, 10);
  }
  const sourceScore = sourceBonus * 0.2;
  
  const risingScore = (engagementScore + recencyScore + sourceScore);
  
  return Math.round(risingScore * 100) / 100;
}

async function saveOrUpdateTrend(trendData) {
  try {
    const existingTrend = await Trend.findOne({ url: trendData.url });
    
    if (existingTrend) {
      existingTrend.risingScore = trendData.risingScore;
      existingTrend.engagement = trendData.engagement;
      existingTrend.metadata = trendData.metadata;
      existingTrend.keywords = trendData.keywords;
      existingTrend.lastUpdated = new Date();
      await existingTrend.save();
    } else {
      await Trend.create({
        title: trendData.title,
        url: trendData.url,
        source: trendData.source,
        risingScore: trendData.risingScore,
        engagement: trendData.engagement,
        metadata: trendData.metadata,
        keywords: trendData.keywords,
      });
    }
  } catch (error) {
    console.error(`Error saving trend ${trendData.url}:`, error.message);
  }
}

async function getTopTrends(limit = 50, minScore = 0) {
  return await Trend.find({ risingScore: { $gte: minScore } })
    .sort({ risingScore: -1, lastUpdated: -1 })
    .limit(limit);
}

function clusterTrendsByKeywords(trends) {
  const clusters = [];
  const processed = new Set();
  
  for (let i = 0; i < trends.length; i++) {
    if (processed.has(i)) continue;
    
    const cluster = [trends[i]];
    processed.add(i);
    
    for (let j = i + 1; j < trends.length; j++) {
      if (processed.has(j)) continue;
      
      const keywords1 = new Set(trends[i].keywords || []);
      const keywords2 = new Set(trends[j].keywords || []);
      
      const intersection = [...keywords1].filter(k => keywords2.has(k));
      const keywordMatch = intersection.length >= 1;
      
      const titleSimilarity = calculateTitleSimilarity(trends[i].title, trends[j].title);
      const titleMatch = titleSimilarity > 0.3;
      
      if (keywordMatch || titleMatch) {
        cluster.push(trends[j]);
        processed.add(j);
      }
    }
    
    if (cluster.length > 1) {
      cluster.sort((a, b) => b.risingScore - a.risingScore);
      
      clusters.push({
        keywords: findCommonKeywords(cluster),
        trends: cluster,
        clusterScore: cluster.reduce((sum, t) => sum + t.risingScore, 0) / cluster.length,
        buzzword: generateBuzzword(cluster),
      });
    }
  }
  
  return clusters.sort((a, b) => b.clusterScore - a.clusterScore);
}

function calculateTitleSimilarity(title1, title2) {
  if (!title1 || !title2) return 0;
  
  const words1 = new Set(title1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(title2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);
  
  return intersection.length / union.size;
}

function generateBuzzword(cluster) {
  const commonKeywords = findCommonKeywords(cluster);
  if (commonKeywords.length > 0) {
    return commonKeywords[0].charAt(0).toUpperCase() + commonKeywords[0].slice(1);
  }
  
  const allWords = {};
  cluster.forEach(trend => {
    const words = (trend.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 4);
    words.forEach(word => {
      allWords[word] = (allWords[word] || 0) + 1;
    });
  });
  
  const topWord = Object.entries(allWords)
    .sort(([_, a], [__, b]) => b - a)[0];
  
  return topWord ? topWord[0].charAt(0).toUpperCase() + topWord[0].slice(1) : 'Trend';
}

function findCommonKeywords(trends) {
  if (trends.length === 0) return [];
  
  const keywordCounts = {};
  
  for (const trend of trends) {
    for (const keyword of trend.keywords || []) {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    }
  }
  
  const threshold = Math.ceil(trends.length / 2);
  return Object.entries(keywordCounts)
    .filter(([_, count]) => count >= threshold)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 5)
    .map(([keyword, _]) => keyword);
}

module.exports = {
  fetchAndScoreTrends,
  calculateRisingScore,
  getTopTrends,
  clusterTrendsByKeywords,
};