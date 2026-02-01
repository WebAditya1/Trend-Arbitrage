const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser({
  customFields: {
    item: ['media:content', 'content:encoded']
  }
});

const RSS_FEEDS = [
  'https://techcrunch.com/feed/',
  'https://www.theverge.com/rss/index.xml',
  'https://feeds.feedburner.com/oreilly/radar',
];

async function fetchRSSTrends() {
  const trends = [];
  
  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const now = Date.now();
      
      if (feed && feed.items) {
        for (const item of feed.items.slice(0, 20)) {
          const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : now;
          const ageInHours = (now - pubDate) / (1000 * 60 * 60);
          
          if (ageInHours < 24 && item.title && item.link) {
            const baseEngagement = 10;
            const recencyBonus = Math.max(0, 24 - ageInHours);
            
            trends.push({
              title: item.title,
              url: item.link,
              source: 'rss',
              metadata: {
                feedTitle: feed.title,
                feedUrl,
                pubDate: item.pubDate,
                ageInHours: Math.round(ageInHours * 10) / 10,
                contentSnippet: item.contentSnippet ? item.contentSnippet.substring(0, 200) : '',
              },
              engagement: baseEngagement + recencyBonus,
              keywords: extractKeywords(item.title + ' ' + (item.contentSnippet || '')),
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching RSS feed ${feedUrl}:`, error.message);
    }
  }

  return trends;
}

function extractKeywords(text) {
  if (!text) return [];
  
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'from', 'about', 'into', 'through', 'during', 'including', 'against', 'among', 'throughout', 'despite', 'towards', 'upon', 'concerning', 'to', 'of', 'in', 'for', 'on', 'at', 'by', 'with', 'about', 'into', 'through', 'during', 'including', 'against', 'among', 'throughout', 'despite', 'towards', 'upon', 'concerning']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  return words.slice(0, 5);
}

module.exports = { fetchRSSTrends };
