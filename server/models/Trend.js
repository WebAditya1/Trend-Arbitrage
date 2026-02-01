const mongoose = require('mongoose');

const trendSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['reddit', 'hackernews', 'github', 'rss', 'producthunt'],
    index: true,
  },
  risingScore: {
    type: Number,
    required: true,
    index: true,
  },
  engagement: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  firstSeen: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  keywords: [String],
}, {
  timestamps: true,
});

trendSchema.index({ risingScore: -1, lastUpdated: -1 });
trendSchema.index({ source: 1, risingScore: -1 });

const Trend = mongoose.model('Trend', trendSchema);

module.exports = Trend;
