const axios = require('axios');

async function fetchGitHubTrends() {
  const trends = [];
  
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];
    
    const searchUrl = `https://api.github.com/search/repositories?q=created:>${dateStr}&sort=stars&order=desc&per_page=50`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TrendArbitrage/1.0',
        ...(process.env.GITHUB_TOKEN && {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        })
      }
    });

    if (response.data && response.data.items) {
      const repos = response.data.items;
      const now = Date.now();
      
      for (const repo of repos) {
        const createdAt = new Date(repo.created_at).getTime();
        const ageInHours = (now - createdAt) / (1000 * 60 * 60);
        
        if (ageInHours < 168 && repo.stargazers_count > 0) {
          const stars = repo.stargazers_count;
          const forks = repo.forks_count;
          const watchers = repo.watchers_count;
          
          trends.push({
            title: `${repo.full_name}: ${repo.description || 'No description'}`,
            url: repo.html_url,
            source: 'github',
            metadata: {
              fullName: repo.full_name,
              stars,
              forks,
              watchers,
              language: repo.language,
              ageInHours: Math.round(ageInHours * 10) / 10,
              owner: repo.owner.login,
            },
            engagement: stars + (forks * 2) + watchers,
            keywords: extractKeywords(repo.name + ' ' + (repo.description || '')),
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching GitHub trends:', error.message);
    if (error.response && error.response.status === 403) {
      console.log('GitHub API rate limit reached. Consider adding GITHUB_TOKEN to .env');
    }
  }

  return trends;
}

function extractKeywords(text) {
  if (!text) return [];
  
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'for', 'from', 'github', 'repo', 'repository']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return words.slice(0, 5);
}

module.exports = { fetchGitHubTrends };
