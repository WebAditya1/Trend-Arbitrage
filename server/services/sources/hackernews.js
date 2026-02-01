const axios = require('axios');

async function fetchHackerNewsTrends() {
  const trends = [];
  
  try {
    const newStoriesResponse = await axios.get('https://hacker-news.firebaseio.com/v0/newstories.json');
    const storyIds = newStoriesResponse.data.slice(0, 100);
    
    const storyPromises = storyIds.map(id => 
      axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then(res => res.data)
        .catch(() => null)
    );
    
    const stories = (await Promise.all(storyPromises))
      .filter(story => story && story.type === 'story' && !story.deleted);
    
    const now = Date.now() / 1000;
    
    for (const story of stories) {
      const ageInHours = (now - story.time) / 3600;
      
      if (ageInHours < 6 && story.title && story.url) {
        const score = story.score || 0;
        const descendants = story.descendants || 0;
        
        trends.push({
          title: story.title,
          url: story.url,
          source: 'hackernews',
          metadata: {
            hnId: story.id,
            score,
            comments: descendants,
            ageInHours: Math.round(ageInHours * 10) / 10,
            by: story.by,
          },
          engagement: score + (descendants * 2),
          keywords: extractKeywords(story.title),
        });
      }
    }
  } catch (error) {
    console.error('Error fetching Hacker News trends:', error.message);
  }

  return trends;
}

function extractKeywords(title) {
  if (!title) return [];
  
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'show', 'hn']);
  
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  return words.slice(0, 5);
}

module.exports = { fetchHackerNewsTrends };
