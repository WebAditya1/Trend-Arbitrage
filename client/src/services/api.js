import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const trendsAPI = {
  getTrends: async (limit = 50, minScore = 0, clustered = false) => {
    const response = await api.get('/trends', {
      params: { limit, minScore, clustered },
    });
    return response.data;
  },
  
  refreshTrends: async () => {
    const response = await api.post('/trends/refresh');
    return response.data;
  },
  
  getTrendsBySource: async (source, limit = 50) => {
    const response = await api.get(`/trends/sources/${source}`, {
      params: { limit },
    });
    return response.data;
  },
  
  getClusters: async (limit = 50, minScore = 0) => {
    const response = await api.get('/trends/clusters', {
      params: { limit, minScore },
    });
    return response.data;
  },
};

export default api;
