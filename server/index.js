const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const trendsRoutes = require('./routes/trends');
const { fetchAndScoreTrends } = require('./services/scoring');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trend-arbitrage', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/trends', trendsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled trend fetch...');
  try {
    await fetchAndScoreTrends();
  } catch (error) {
    console.error('Error in scheduled trend fetch:', error);
  }
});

fetchAndScoreTrends().catch(err => console.error('Initial fetch error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
