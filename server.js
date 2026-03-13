/**
 * VM Forge — Node.js Server
 * Proxied Proxmox API — kein CORS-Problem
 */

const express  = require('express');
const fetch    = require('node-fetch');
const https    = require('https');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Proxmox selbstsignierte Zertifikate erlauben
const agent = new https.Agent({ rejectUnauthorized: false });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Hilfsfunktion: Proxmox API aufrufen ──────────────────────────
async function proxmoxFetch(pveUrl, pveToken, method, apiPath, body) {
  const url = `${pveUrl}/api2/json${apiPath}`;
  const opts = {
    method,
    agent,
    headers: {
      'Authorization': `PVEAPIToken=${pveToken}`,
      'Content-Type':  'application/json',
    },
  };
  if (body && (method === 'POST' || method === 'PUT')) {
    opts.body = JSON.stringify(body);
  }
  const r = await fetch(url, opts);
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch(e) { throw new Error(`Proxmox antwortete nicht mit JSON: ${text.slice(0,200)}`); }
  if (!r.ok) {
    const msg = json?.errors ? Object.values(json.errors).join(', ') : (json?.message || `HTTP ${r.status}`);
    throw new Error(msg);
  }
  return json.data;
}

// ── Middleware: Zugangsdaten aus Header holen ────────────────────
function getCredentials(req) {
  const pveUrl   = req.headers['x-pve-url'];
  const pveToken = req.headers['x-pve-token'];
  if (!pveUrl || !pveToken) throw new Error('x-pve-url und x-pve-token Header fehlen');
  return { pveUrl: pveUrl.replace(/\/$/, ''), pveToken };
}

// ── GET /api/proxy/* → Proxmox GET ──────────────────────────────
app.get('/api/proxy/*', async (req, res) => {
  try {
    const { pveUrl, pveToken } = getCredentials(req);
    const apiPath = '/' + req.params[0] + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
    const data = await proxmoxFetch(pveUrl, pveToken, 'GET', apiPath);
    res.json({ data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/proxy/* → Proxmox POST ────────────────────────────
app.post('/api/proxy/*', async (req, res) => {
  try {
    const { pveUrl, pveToken } = getCredentials(req);
    const apiPath = '/' + req.params[0];
    const data = await proxmoxFetch(pveUrl, pveToken, 'POST', apiPath, req.body);
    res.json({ data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/proxy/* → Proxmox DELETE ────────────────────────
app.delete('/api/proxy/*', async (req, res) => {
  try {
    const { pveUrl, pveToken } = getCredentials(req);
    const apiPath = '/' + req.params[0];
    const data = await proxmoxFetch(pveUrl, pveToken, 'DELETE', apiPath);
    res.json({ data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Health Check ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', uptime: process.uptime() });
});

// ── Fallback → index.html ────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n⚡ VM Forge läuft auf http://localhost:${PORT}`);
  console.log(`   Proxmox API Proxy aktiv — kein CORS nötig\n`);
});
