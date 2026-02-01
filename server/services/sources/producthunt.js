const axios = require('axios');
const cheerio = require('cheerio');

async function fetchProductHuntTrends() {
  const trends = [];
  
  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    
    const apiEndpoints = [
      `https://www.producthunt.com/frontend/ecosystem/products?day=${dateStr}`,
      'https://www.producthunt.com/frontend/ecosystem/products',
      'https://api.producthunt.com/v2/api/graphql'
    ];
    
    for (const apiUrl of apiEndpoints) {
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://www.producthunt.com/',
            'Origin': 'https://www.producthunt.com'
          },
          timeout: 5000
        });
        
        let products = [];
        
        if (Array.isArray(response.data)) {
          products = response.data;
        } else if (response.data.posts) {
          products = Array.isArray(response.data.posts) ? response.data.posts : [response.data.posts];
        } else if (response.data.data && response.data.data.posts) {
          products = Array.isArray(response.data.data.posts) ? response.data.data.posts : [response.data.data.posts];
        } else if (response.data.edges) {
          products = response.data.edges.map(edge => edge.node || edge);
        }
        
        if (products.length > 0) {
          products.slice(0, 20).forEach((product, index) => {
            const estimatedAgeHours = index * 2;
            const name = product.name || product.title || product.slug || '';
            const tagline = product.tagline || product.description || product.summary || '';
            const votes = product.votes_count || product.votes || product.votesCount || 0;
            const comments = product.comments_count || product.comments || product.commentsCount || 0;
            const slug = product.slug || '';
            const website = product.website || product.url || '';
            
            if (name && name.length > 2) {
              trends.push({
                title: `${name}${tagline ? `: ${tagline}` : ''}`,
                url: website || `https://www.producthunt.com/posts/${slug}`,
                source: 'producthunt',
                metadata: {
                  productName: name,
                  tagline: tagline,
                  votes,
                  comments,
                  ageInHours: Math.round(estimatedAgeHours * 10) / 10,
                  rank: index + 1,
                },
                engagement: votes + (comments * 3),
                keywords: extractKeywords(name + ' ' + tagline),
              });
            }
          });
          
          if (trends.length > 0) break;
        }
      } catch (apiError) {
        continue;
      }
    }
    
    if (trends.length === 0) {
      try {
        const htmlUrl = 'https://www.producthunt.com/';
        const htmlResponse = await axios.get(htmlUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        const $ = cheerio.load(htmlResponse.data);
        const scriptTags = $('script').toArray();
        
        for (const script of scriptTags) {
          const scriptContent = $(script).html() || '';
          if (scriptContent.includes('posts') || scriptContent.includes('product')) {
            try {
              const jsonMatch = scriptContent.match(/\{[\s\S]*"posts"[\s\S]*\}/);
              if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.posts || data.data?.posts) {
                  const products = data.posts || data.data.posts || [];
                  products.slice(0, 20).forEach((product, index) => {
                    const estimatedAgeHours = index * 2;
                    const name = product.name || product.title || '';
                    const tagline = product.tagline || product.description || '';
                    const votes = product.votes_count || product.votes || 0;
                    const comments = product.comments_count || product.comments || 0;
                    
                    if (name) {
                      trends.push({
                        title: `${name}${tagline ? `: ${tagline}` : ''}`,
                        url: product.website || `https://www.producthunt.com/posts/${product.slug || ''}`,
                        source: 'producthunt',
                        metadata: {
                          productName: name,
                          tagline: tagline,
                          votes,
                          comments,
                          ageInHours: Math.round(estimatedAgeHours * 10) / 10,
                        },
                        engagement: votes + (comments * 3),
                        keywords: extractKeywords(name + ' ' + tagline),
                      });
                    }
                  });
                  break;
                }
              }
            } catch (parseError) {
              continue;
            }
          }
        }
      } catch (htmlError) {
      }
    }
  } catch (error) {
    console.error('Error fetching Product Hunt trends:', error.message);
  }

  return trends;
}

function extractKeywords(text) {
  if (!text) return [];
  
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'from', 'about', 'into', 'through', 'during', 'including', 'against', 'among', 'throughout', 'despite', 'towards', 'upon', 'concerning', 'product', 'hunt', 'new', 'app', 'tool']);
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  return words.slice(0, 5);
}

module.exports = { fetchProductHuntTrends };
