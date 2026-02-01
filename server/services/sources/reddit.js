const axios = require('axios');
const cheerio = require('cheerio');

async function fetchRedditTrends() {
  const trends = [];
  
  try {
    const risingUrl = 'https://www.reddit.com/r/all/rising.json?limit=50';
    const response = await axios.get(risingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (response.data && response.data.data && response.data.data.children) {
      const posts = response.data.data.children;
      
      for (const post of posts) {
        const data = post.data;
        
        const score = data.score || 0;
        const comments = data.num_comments || 0;
        const upvoteRatio = data.upvote_ratio || 0.5;
        const created = data.created_utc;
        const ageInHours = (Date.now() / 1000 - created) / 3600;
        
        if (ageInHours < 6) {
          trends.push({
            title: data.title,
            url: `https://reddit.com${data.permalink}`,
            source: 'reddit',
            metadata: {
              subreddit: data.subreddit,
              score,
              comments,
              upvoteRatio,
              ageInHours: Math.round(ageInHours * 10) / 10,
              author: data.author,
            },
            engagement: score + (comments * 2),
            keywords: extractKeywords(data.title),
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Reddit trends:', error.message);
  }

  return trends;
}

function extractKeywords(title) {
  if (!title) return [];
  
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);
  
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  return words.slice(0, 5);
}

module.exports = { fetchRedditTrends };
