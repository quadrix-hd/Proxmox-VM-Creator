# VM Forge — Installationsanleitung

## Voraussetzungen

- Node.js 18+ installiert
- Zugriff auf den Server (SSH)
- Proxmox API Token (wird in der App eingegeben)

---

## 1. Node.js installieren (falls noch nicht vorhanden)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version   # sollte v20.x zeigen
```

---

## 2. VM Forge auf den Server kopieren

**Option A — per SCP vom eigenen PC:**
```bash
scp -r vm-forge/ root@DEINE-SERVER-IP:/opt/vm-forge
```

**Option B — direkt auf dem Server erstellen:**
```bash
mkdir -p /opt/vm-forge/public
cd /opt/vm-forge
# Dateien manuell erstellen (server.js, package.json, public/index.html)
```

---

## 3. Abhängigkeiten installieren

```bash
cd /opt/vm-forge
npm install
```

---

## 4. Starten (zum Testen)

```bash
node server.js
# → VM Forge läuft auf http://localhost:3000
```

Im Browser öffnen: `http://DEINE-SERVER-IP:3000`

---

## 5. Als Dienst einrichten mit PM2 (läuft dauerhaft, startet nach Reboot neu)

```bash
# PM2 global installieren
npm install -g pm2

# VM Forge mit PM2 starten
cd /opt/vm-forge
pm2 start ecosystem.config.js

# PM2 beim Systemstart aktivieren
pm2 startup
pm2 save

# Status prüfen
pm2 status
pm2 logs vm-forge
```

---

## 6. Port ändern (optional)

Standard ist Port **3000**. Zum Ändern:

```bash
# In ecosystem.config.js die PORT-Zeile anpassen:
PORT: 8080   # oder ein anderer Port

# Danach neu starten:
pm2 restart vm-forge
```

---

## 7. Nützliche PM2-Befehle

```bash
pm2 status              # Übersicht aller laufenden Apps
pm2 restart vm-forge    # VM Forge neu starten
pm2 stop vm-forge       # VM Forge stoppen
pm2 logs vm-forge       # Live-Logs anzeigen
pm2 logs vm-forge --lines 50  # Letzte 50 Zeilen
```

---

## 8. Proxmox API Token erstellen

Im Proxmox Web-Interface:

1. **Datacenter → Permissions → API Tokens → Add**
2. User: `root@pam`
3. Token ID: `vmforge` (oder beliebig)
4. **Privilege Separation: deaktivieren** (damit der Token alle Rechte hat)
5. Token Secret kopieren und sicher aufbewahren

Im VM Forge Panel eingeben:
- **Token ID:** `root@pam!vmforge`
- **Token Secret:** das kopierte UUID

---

## 9. Firewall (optional)

Falls eine Firewall aktiv ist, Port 3000 freigeben:

```bash
# UFW
ufw allow 3000/tcp

# iptables
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

## Verzeichnisstruktur

```
/opt/vm-forge/
├── server.js            ← Node.js Express Server
├── package.json         ← Abhängigkeiten
├── ecosystem.config.js  ← PM2 Konfiguration
└── public/
    └── index.html       ← Web-Oberfläche
```

---

## Troubleshooting

**Port bereits belegt:**
```bash
lsof -i :3000
# oder Port in ecosystem.config.js ändern
```

**Verbindung zu Proxmox schlägt fehl:**
- Proxmox URL erreichbar? `curl -k https://PROXMOX-IP:8006/api2/json/version`
- Token korrekt? Token ID Format: `user@realm!tokenid`
- Proxmox und VM Forge im selben Netzwerk?

**PM2 App startet nicht:**
```bash
pm2 logs vm-forge --err
```
