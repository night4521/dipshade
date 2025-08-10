const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 13100;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Tracking server running', version: '1.0.0' });
});

const USER_EVENTS_FILE = '/tmp/user_events.json';
const HEATMAP_FILE = '/tmp/heatmap_data.json';

function loadData(file) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return [];
}

function saveData(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Track user events
app.post('/user-event', (req, res) => {
  const events = loadData(USER_EVENTS_FILE);
  events.push({ ...req.body, ip: req.ip, created_at: new Date() });
  saveData(USER_EVENTS_FILE, events);
  res.json({ success: true });
});

// Track heatmap
app.post('/heatmap', (req, res) => {
  const heatmapData = loadData(HEATMAP_FILE);
  heatmapData.push({ ...req.body, ip: req.ip, created_at: new Date() });
  saveData(HEATMAP_FILE, heatmapData);
  res.json({ success: true });
});

// Get analytics
app.get('/user-analytics', (req, res) => {
  const events = loadData(USER_EVENTS_FILE);
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
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Tracking server running on port ${PORT}`);
  });
}

module.exports = app;