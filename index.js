const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 13100;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tracking:tracking123@cluster0.mongodb.net/dipshade_tracking';

app.use(cors());
app.use(express.json());

let db;

// Connect to MongoDB
MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db('dipshade_tracking');
  })
  .catch(error => console.error('MongoDB connection failed:', error));

app.get('/', (req, res) => {
  res.json({ status: 'Tracking server running', version: '1.0.0', database: db ? 'connected' : 'disconnected' });
});

// Track user events
app.post('/user-event', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not connected' });
    await db.collection('events').insertOne({ ...req.body, ip: req.ip, created_at: new Date() });
    res.json({ success: true });
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Track heatmap
app.post('/heatmap', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not connected' });
    await db.collection('heatmap').insertOne({ ...req.body, ip: req.ip, created_at: new Date() });
    res.json({ success: true });
  } catch (error) {
    console.error('Heatmap tracking error:', error);
    res.status(500).json({ error: 'Failed to track heatmap' });
  }
});

// Get analytics
app.get('/user-analytics', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not connected' });
    const events = await db.collection('events').find({}).toArray();
  const stats = {
    total_events: events.length,
    unique_users: new Set(events.map(e => e.user_id)).size,
    unique_sessions: new Set(events.map(e => e.session_id)).size,
    event_types: {},
    device_breakdown: {},
    conversion_funnel: { page_views: 0, downloads: 0, signups: 0, purchases: 0 }
  };

  events.forEach(event => {
    stats.event_types[event.event_type] = (stats.event_types[event.event_type] || 0) + 1;
    if (event.device_type) stats.device_breakdown[event.device_type] = (stats.device_breakdown[event.device_type] || 0) + 1;
    if (event.event_type === 'page_view') stats.conversion_funnel.page_views++;
    if (event.event_type === 'download_click') stats.conversion_funnel.downloads++;
    if (event.event_type === 'signup_attempt') stats.conversion_funnel.signups++;
    if (event.event_type === 'purchase') stats.conversion_funnel.purchases++;
  });

    res.json(stats);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Tracking server running on port ${PORT}`);
  });
}

module.exports = app;