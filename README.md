# ⬡ CollabSpace — Real-time Collaboration App

> Aplikasi kolaborasi real-time dengan Document Editor dan Whiteboard. Mirip Notion + Figma.  
> Dibangun dengan React + Vite (frontend) dan Node.js + Socket.io (backend).

---

## 🔥 Fitur

- **Document Editor** — Rich text editing dengan TipTap + Yjs CRDT (conflict-free)
- **Whiteboard/Canvas** — Draw shapes, freehand pen, resize & drag via Konva.js
- **Live Presence** — Lihat siapa saja yang online di room secara real-time
- **Live Cursor** — Cursor semua user terlihat di canvas
- **Auto-save** — Dokumen tersimpan otomatis ke PostgreSQL setiap 2 detik
- **Invite System** — Bagikan room dengan invite code 8 karakter
- **Auth** — Register/login dengan JWT, atau join sebagai guest

---

## 🏗️ Arsitektur

```
Client (React + Vite)
  ↕ WebSocket (Socket.io) + REST API
Server (Node.js + Express)
  ├── PostgreSQL — data persisten (users, rooms, docs, shapes)
  └── Redis     — presence real-time & session
```

**Conflict Resolution:** Menggunakan **Yjs (CRDT)** — dua user edit dokumen bersamaan akan di-merge otomatis tanpa konflik.

---

## ⚡ Cara Setup & Menjalankan

### 1. Prasyarat

Pastikan sudah terinstall:
- Node.js v18+
- PostgreSQL (local atau pakai [Railway](https://railway.app))
- Redis (local atau pakai [Upstash](https://upstash.com) — gratis)

### 2. Clone & Install

```bash
git clone https://github.com/username/collab-app.git
cd collab-app

# Install dependencies server
cd server && npm install

# Install dependencies client
cd ../client && npm install
```

### 3. Setup Environment Server

```bash
cd server
cp .env.example .env
```

Edit file `.env`:
```env
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/collab_app
REDIS_URL=redis://localhost:6379
JWT_SECRET=isi_dengan_string_random_minimal_32_karakter
CLIENT_URL=http://localhost:5173
```

### 4. Buat Database PostgreSQL

```bash
# Masuk ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE collab_app;
\q
```

> Schema tabel akan dibuat **otomatis** saat server pertama kali dijalankan.

### 5. Jalankan Server

```bash
cd server
npm run dev
# → Server berjalan di http://localhost:3001
```

### 6. Jalankan Client

```bash
cd client
npm run dev
# → Client berjalan di http://localhost:5173
```

### 7. Buka di Browser

Buka `http://localhost:5173`, daftar akun, buat room, dan coba buka di **tab/browser berbeda** untuk melihat kolaborasi real-time!

---

## 📁 Struktur Project

```
collab-app/
├── server/
│   └── src/
│       ├── index.js              ← Entry point
│       ├── services/
│       │   ├── db.js             ← PostgreSQL + auto-migrate
│       │   └── redis.js          ← Redis + presence helpers
│       ├── middleware/
│       │   └── auth.js           ← JWT auth (REST + Socket)
│       ├── routes/
│       │   ├── auth.js           ← Register, Login, Me
│       │   └── rooms.js          ← CRUD rooms + join
│       └── socket/
│           ├── index.js          ← Socket.io init
│           └── handlers/
│               ├── presence.js   ← Cursor & focus tracking
│               ├── document.js   ← Yjs CRDT sync
│               └── canvas.js     ← Shapes sync
└── client/
    └── src/
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   └── RoomPage.jsx
        ├── components/
        │   ├── editor/
        │   │   ├── CollabEditor.jsx   ← TipTap + Yjs
        │   │   └── EditorToolbar.jsx
        │   ├── canvas/
        │   │   ├── CollabCanvas.jsx   ← Konva.js + Socket.io
        │   │   └── CanvasToolbar.jsx
        │   └── shared/
        │       └── PresenceBar.jsx    ← Online users avatars
        ├── hooks/
        │   ├── useSocket.js           ← WebSocket manager
        │   └── useCollabDoc.js        ← Yjs doc sync
        └── stores/
            └── index.js              ← Zustand state (auth + room)
```

---

## 🌐 Deploy ke Production

### Backend → Railway
1. Push ke GitHub
2. Buat project baru di [Railway](https://railway.app)
3. Tambahkan service: Node.js, PostgreSQL, Redis
4. Set environment variables
5. Railway otomatis deploy setiap push ke main

### Frontend → Vercel
```bash
cd client
npm run build
# Upload folder dist/ ke Vercel, atau connect GitHub repo
```

Update `VITE_API_URL` di Vercel ke URL Railway backend.

---

## 🧠 Konsep Teknis Penting

### Yjs CRDT (Conflict Resolution)
Yjs menggunakan algoritma CRDT (Conflict-free Replicated Data Type). Setiap operasi edit direpresentasikan sebagai binary update yang bisa di-merge secara deterministik — tidak peduli urutan datangnya. Hasilnya: tidak ada "last write wins" yang kasar.

### Socket.io Room
Setiap "collaboration room" adalah Socket.io room. Pesan hanya di-broadcast ke user dalam room yang sama.

### Redis Presence
Data siapa yang online disimpan di Redis Hash dengan key `presence:{roomId}`. Lebih cepat dari PostgreSQL untuk data yang sering berubah.

---

## 📌 Lisensi

MIT — bebas digunakan dan dimodifikasi.
