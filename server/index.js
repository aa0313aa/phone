const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

const DATA_DIR = path.join(__dirname, '..', 'assets', 'data');
const STORE_FILE = path.join(DATA_DIR, 'reservations-store.json');
const FALLBACK_FILE = path.join(DATA_DIR, 'reservations.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static site
app.use(express.static(path.join(__dirname, '..')));

// Simple GET: return stored reservations (store file preferred, else fallback)
app.get('/api/reservations', (req, res) => {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const data = JSON.parse(raw || '[]');
      return res.json(data);
    }
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf8');
      // the repo's reservations.json contains markdown fences in some copies; try to extract JSON
      const m = raw.match(/\[([\s\S]*)\]/m);
      if (m) {
        try {
          const obj = JSON.parse(m[0]);
          return res.json(obj);
        } catch (e) {
          // fallback: attempt to eval
        }
      }
      // last resort: return empty array
      return res.json([]);
    }
    return res.json([]);
  } catch (err) {
    console.error('GET /api/reservations error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Simple POST: append reservation to store file
app.post('/api/reservations', (req, res) => {
  try {
    const payload = req.body || {};
    // Basic validation
    if (!payload.region) return res.status(400).json({ success: false, error: 'region_required' });

    const now = new Date();
    const record = {
      region: String(payload.region || '').slice(0, 60),
      datetime: payload.datetime || now.toISOString().replace('T', ' ').slice(0, 16),
      name: payload.name || '',
      phone: payload.phone || '',
      method: payload.method || '',
      status: payload.status || '접수완료'
    };

    // Read existing
    let data = [];
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      try { data = JSON.parse(raw || '[]'); } catch (e) { data = []; }
    }

    // prepend new record
    data.unshift(record);
    // keep last 200
    data = data.slice(0, 200);

    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /api/reservations error', err);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
