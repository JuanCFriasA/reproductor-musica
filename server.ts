/**
 * server.ts  –  Midnight Cruise API
 * Run: npx tsx server.ts
 * Listens on http://localhost:4000
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createPool, Pool } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// ── Config ────────────────────────────────────
const PORT       = Number(process.env.API_PORT)  || 4000;
const JWT_SECRET = process.env.JWT_SECRET        || 'change_this_in_production';
const ORIGIN     = process.env.APP_URL           || 'http://localhost:3000';

// ── DB Pool ───────────────────────────────────
const pool: Pool = createPool({
  host:             process.env.DB_HOST     || 'localhost',
  port:             Number(process.env.DB_PORT) || 3306,
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',
  database:         process.env.DB_NAME     || 'midnight_cruise',
  waitForConnections: true,
  connectionLimit:  10,
});

// ── Express App ───────────────────────────────
const app = express();
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());

// ── Auth Middleware ───────────────────────────
interface AuthRequest extends Request {
  userId?: number;
}

async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token required' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// =============================================
// AUTH
// =============================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username.trim(), email.toLowerCase().trim(), hash]
    ) as any;
    const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: { id: result.insertId, username: username.trim(), email: email.toLowerCase(), avatarUrl: null }
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email or username already in use' });
    }
    console.error('[register]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]
    ) as any;
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatar_url }
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar_url AS avatarUrl, created_at FROM users WHERE id = ?',
      [req.userId]
    ) as any;
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[me]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =============================================
// LIKES
// =============================================

// GET /api/likes
app.get('/api/likes', authenticate, async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT track_id AS id, track_title AS title, artist, album,
              cover_url AS cover, audio_url AS audioUrl,
              is_youtube AS isYouTube, duration, liked_at
       FROM liked_tracks WHERE user_id = ? ORDER BY liked_at DESC`,
      [req.userId]
    ) as any;
    res.json(rows.map((r: any) => ({ ...r, isYouTube: r.isYouTube === 1 })));
  } catch (err) {
    console.error('[get likes]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/likes
app.post('/api/likes', authenticate, async (req: AuthRequest, res) => {
  const { id, title, artist, album, cover, audioUrl, isYouTube, duration } = req.body;
  if (!id) return res.status(400).json({ error: 'Track ID required' });
  try {
    await pool.execute(
      `INSERT INTO liked_tracks
         (user_id, track_id, track_title, artist, album, cover_url, audio_url, is_youtube, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE liked_at = CURRENT_TIMESTAMP`,
      [req.userId, id, title, artist, album, cover, audioUrl, isYouTube ? 1 : 0, duration || 0]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[like]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/likes/:trackId
app.delete('/api/likes/:trackId', authenticate, async (req: AuthRequest, res) => {
  try {
    await pool.execute(
      'DELETE FROM liked_tracks WHERE user_id = ? AND track_id = ?',
      [req.userId, req.params.trackId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[unlike]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =============================================
// STATS / HISTORY
// =============================================

// POST /api/stats/play  –  record a song play
app.post('/api/stats/play', authenticate, async (req: AuthRequest, res) => {
  const { trackId, title, artist, album, coverUrl, isYouTube } = req.body;
  if (!trackId) return res.status(400).json({ error: 'trackId required' });
  try {
    await pool.execute(
      `INSERT INTO listening_history
         (user_id, track_id, track_title, artist, album, cover_url, is_youtube)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.userId, trackId, title, artist, album, coverUrl, isYouTube ? 1 : 0]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[play]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats  –  aggregated user stats
app.get('/api/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const [topSongs] = await pool.execute(
      `SELECT track_id AS trackId, track_title AS title, artist, album,
              cover_url AS cover, COUNT(*) AS playCount
       FROM listening_history WHERE user_id = ?
       GROUP BY track_id, track_title, artist, album, cover_url
       ORDER BY playCount DESC LIMIT 10`,
      [req.userId]
    ) as any;

    const [topArtists] = await pool.execute(
      `SELECT artist, COUNT(*) AS playCount
       FROM listening_history WHERE user_id = ?
       GROUP BY artist ORDER BY playCount DESC LIMIT 5`,
      [req.userId]
    ) as any;

    const [topAlbums] = await pool.execute(
      `SELECT album, artist, COUNT(*) AS playCount
       FROM listening_history WHERE user_id = ?
       GROUP BY album, artist ORDER BY playCount DESC LIMIT 5`,
      [req.userId]
    ) as any;

    const [totals] = await pool.execute(
      `SELECT COUNT(*) AS totalPlays,
              COUNT(DISTINCT track_id) AS uniqueSongs,
              COUNT(DISTINCT artist)   AS uniqueArtists
       FROM listening_history WHERE user_id = ?`,
      [req.userId]
    ) as any;

    const { totalPlays, uniqueSongs, uniqueArtists } = totals[0];
    const minutes = Math.round(totalPlays * 3.5);

    res.json({
      topSongs,
      topArtists,
      topAlbums,
      totalPlays,
      uniqueSongs,
      uniqueArtists,
      estimatedHours:   Math.floor(minutes / 60),
      estimatedMinutes: minutes % 60,
    });
  } catch (err) {
    console.error('[stats]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/history  –  recent plays
app.get('/api/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT track_id AS id, track_title AS title, artist, album,
              cover_url AS cover, played_at AS playedAt
       FROM listening_history WHERE user_id = ?
       ORDER BY played_at DESC LIMIT 30`,
      [req.userId]
    ) as any;
    res.json(rows);
  } catch (err) {
    console.error('[history]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Start ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎵  Midnight Cruise API  →  http://localhost:${PORT}`);
});