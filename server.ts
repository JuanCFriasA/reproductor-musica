/**
 * server.ts  –  Midnight Cruise API v2
 * npx tsx server.ts
 */
import express, { Request, Response, NextFunction } from 'express';
import cors    from 'cors';
import { createPool, Pool } from 'mysql2/promise';
import bcrypt  from 'bcryptjs';
import jwt     from 'jsonwebtoken';
import dotenv  from 'dotenv';

dotenv.config();

const PORT       = Number(process.env.API_PORT)  || 4000;
const JWT_SECRET = process.env.JWT_SECRET        || 'change_in_prod';
const ORIGIN     = process.env.APP_URL           || 'http://localhost:3000';

const pool: Pool = createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'midnight_cruise',
  waitForConnections: true,
  connectionLimit: 10,
});

const app = express();
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// ── Auth middleware ────────────────────────────────────
interface AR extends Request { userId?: number; }
function authenticate(req: AR, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token required' });
  try {
    const p = jwt.verify(h.slice(7), JWT_SECRET) as { userId: number };
    req.userId = p.userId;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// helper: push a notification
async function pushNotification(
  userId: number, type: string, title: string, body: string,
  fromUser?: number, link?: string
) {
  await pool.execute(
    `INSERT INTO notifications (user_id, type, title, body, from_user, link)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, type, title, body, fromUser ?? null, link ?? null]
  );
}

// ══════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  if (password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const [r] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username.trim(), email.toLowerCase().trim(), hash]
    ) as any;
    const token = jwt.sign({ userId: r.insertId }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: r.insertId, username: username.trim(), email: email.toLowerCase(), avatarUrl: null, displayName: null } });
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email o usuario ya en uso' });
    console.error(e); res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]) as any;
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });
    const u = rows[0];
    if (!await bcrypt.compare(password, u.password_hash)) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ userId: u.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: u.id, username: u.username, email: u.email, avatarUrl: u.avatar_url, displayName: u.display_name } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error del servidor' }); }
});

app.get('/api/auth/me', authenticate, async (req: AR, res) => {
  const [rows] = await pool.execute(
    'SELECT id, username, email, avatar_url AS avatarUrl, display_name AS displayName, bio, created_at FROM users WHERE id = ?',
    [req.userId]
  ) as any;
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(rows[0]);
});

// ══════════════════════════════════════════════════════
// PROFILE / SETTINGS
// ══════════════════════════════════════════════════════
app.put('/api/profile', authenticate, async (req: AR, res) => {
  const { displayName, bio, avatarUrl } = req.body;
  try {
    await pool.execute(
      'UPDATE users SET display_name = ?, bio = ?, avatar_url = ? WHERE id = ?',
      [displayName ?? null, bio ?? null, avatarUrl ?? null, req.userId]
    );
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar_url AS avatarUrl, display_name AS displayName, bio FROM users WHERE id = ?',
      [req.userId]
    ) as any;
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error del servidor' }); }
});

app.put('/api/profile/password', authenticate, async (req: AR, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'Contraseña inválida' });
  try {
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.userId]) as any;
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!await bcrypt.compare(currentPassword, rows[0].password_hash))
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.userId]);
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error del servidor' }); }
});

// ══════════════════════════════════════════════════════
// LIKES
// ══════════════════════════════════════════════════════
app.get('/api/likes', authenticate, async (req: AR, res) => {
  const [rows] = await pool.execute(
    `SELECT track_id AS id, track_title AS title, artist, album,
            cover_url AS cover, audio_url AS audioUrl,
            is_youtube AS isYouTube, duration, liked_at
     FROM liked_tracks WHERE user_id = ? ORDER BY liked_at DESC`,
    [req.userId]
  ) as any;
  res.json(rows.map((r: any) => ({ ...r, isYouTube: r.isYouTube === 1 })));
});

app.post('/api/likes', authenticate, async (req: AR, res) => {
  const { id, title, artist, album, cover, audioUrl, isYouTube, duration } = req.body;
  if (!id) return res.status(400).json({ error: 'Track ID requerido' });
  await pool.execute(
    `INSERT INTO liked_tracks (user_id,track_id,track_title,artist,album,cover_url,audio_url,is_youtube,duration)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE liked_at = CURRENT_TIMESTAMP`,
    [req.userId, id, title, artist, album, cover, audioUrl, isYouTube ? 1 : 0, duration || 0]
  );
  res.json({ success: true });
});

app.delete('/api/likes/:trackId', authenticate, async (req: AR, res) => {
  await pool.execute('DELETE FROM liked_tracks WHERE user_id = ? AND track_id = ?', [req.userId, req.params.trackId]);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════
// STATS / HISTORY
// ══════════════════════════════════════════════════════
app.post('/api/stats/play', authenticate, async (req: AR, res) => {
  const { trackId, title, artist, album, coverUrl, isYouTube } = req.body;
  if (!trackId) return res.status(400).json({ error: 'trackId requerido' });
  await pool.execute(
    `INSERT INTO listening_history (user_id,track_id,track_title,artist,album,cover_url,is_youtube)
     VALUES (?,?,?,?,?,?,?)`,
    [req.userId, trackId, title, artist, album, coverUrl, isYouTube ? 1 : 0]
  );
  res.json({ success: true });
});

app.get('/api/stats', authenticate, async (req: AR, res) => {
  try {
    const [topSongs] = await pool.execute(
      `SELECT track_id AS trackId, track_title AS title, artist, album,
              cover_url AS cover, COUNT(*) AS playCount
       FROM listening_history WHERE user_id = ?
       GROUP BY track_id,track_title,artist,album,cover_url ORDER BY playCount DESC LIMIT 10`,
      [req.userId]
    ) as any;
    const [topArtists] = await pool.execute(
      `SELECT artist, COUNT(*) AS playCount FROM listening_history WHERE user_id = ?
       GROUP BY artist ORDER BY playCount DESC LIMIT 5`,
      [req.userId]
    ) as any;
    const [topAlbums] = await pool.execute(
      `SELECT album, artist, COUNT(*) AS playCount FROM listening_history WHERE user_id = ?
       GROUP BY album,artist ORDER BY playCount DESC LIMIT 5`,
      [req.userId]
    ) as any;
    const [totals] = await pool.execute(
      `SELECT COUNT(*) AS totalPlays, COUNT(DISTINCT track_id) AS uniqueSongs,
              COUNT(DISTINCT artist) AS uniqueArtists
       FROM listening_history WHERE user_id = ?`,
      [req.userId]
    ) as any;
    const { totalPlays, uniqueSongs, uniqueArtists } = totals[0];
    const minutes = Math.round(totalPlays * 3.5);
    res.json({ topSongs, topArtists, topAlbums, totalPlays, uniqueSongs, uniqueArtists,
      estimatedHours: Math.floor(minutes/60), estimatedMinutes: minutes%60 });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error del servidor' }); }
});

app.get('/api/history', authenticate, async (req: AR, res) => {
  const [rows] = await pool.execute(
    `SELECT track_id AS id, track_title AS title, artist, album,
            cover_url AS cover, played_at AS playedAt
     FROM listening_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 30`,
    [req.userId]
  ) as any;
  res.json(rows);
});

// ══════════════════════════════════════════════════════
// NOW PLAYING (social)
// ══════════════════════════════════════════════════════
app.put('/api/now-playing', authenticate, async (req: AR, res) => {
  const { trackId, trackTitle, artist, coverUrl } = req.body;
  await pool.execute(
    `INSERT INTO now_playing (user_id,track_id,track_title,artist,cover_url)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE track_id=?,track_title=?,artist=?,cover_url=?,updated_at=NOW()`,
    [req.userId, trackId, trackTitle, artist, coverUrl,
                 trackId, trackTitle, artist, coverUrl]
  );
  res.json({ success: true });
});

app.delete('/api/now-playing', authenticate, async (req: AR, res) => {
  await pool.execute('DELETE FROM now_playing WHERE user_id = ?', [req.userId]);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════
// FRIENDS
// ══════════════════════════════════════════════════════

// Search users by username
app.get('/api/users/search', authenticate, async (req: AR, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  const [rows] = await pool.execute(
    `SELECT id, username, avatar_url AS avatarUrl, display_name AS displayName
     FROM users WHERE username LIKE ? AND id != ? LIMIT 10`,
    [`%${q}%`, req.userId]
  ) as any;
  res.json(rows);
});

// Send friend request
app.post('/api/friends/request', authenticate, async (req: AR, res) => {
  const { toUserId } = req.body;
  if (!toUserId) return res.status(400).json({ error: 'toUserId requerido' });
  try {
    // Check not already friends
    const [existing] = await pool.execute(
      `SELECT id FROM friendships WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?)`,
      [req.userId, toUserId, toUserId, req.userId]
    ) as any;
    if (existing.length) return res.status(409).json({ error: 'Ya son amigos' });

    await pool.execute(
      `INSERT INTO friend_requests (from_user, to_user) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE status='pending', created_at=NOW()`,
      [req.userId, toUserId]
    );

    // Get sender username for notification
    const [senderRows] = await pool.execute('SELECT username FROM users WHERE id=?', [req.userId]) as any;
    const senderName = senderRows[0]?.username || 'Alguien';
    await pushNotification(toUserId, 'friend_request', 'Nueva solicitud de amistad',
      `${senderName} quiere ser tu amigo`, req.userId);

    res.json({ success: true });
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Solicitud ya enviada' });
    console.error(e); res.status(500).json({ error: 'Error del servidor' });
  }
});

// Get pending requests I received
app.get('/api/friends/requests', authenticate, async (req: AR, res) => {
  const [rows] = await pool.execute(
    `SELECT fr.id, fr.from_user AS fromUserId, fr.created_at,
            u.username, u.avatar_url AS avatarUrl, u.display_name AS displayName
     FROM friend_requests fr
     JOIN users u ON u.id = fr.from_user
     WHERE fr.to_user = ? AND fr.status = 'pending'`,
    [req.userId]
  ) as any;
  res.json(rows);
});

// Accept / reject request
app.put('/api/friends/request/:id', authenticate, async (req: AR, res) => {
  const { action } = req.body; // 'accept' | 'reject'
  const reqId = req.params.id;
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM friend_requests WHERE id=? AND to_user=? AND status="pending"',
      [reqId, req.userId]
    ) as any;
    if (!rows.length) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const fr = rows[0];

    if (action === 'accept') {
      await pool.execute('UPDATE friend_requests SET status="accepted" WHERE id=?', [reqId]);
      // Create bidirectional friendship (lower id first)
      const [a, b] = [Math.min(fr.from_user, fr.to_user), Math.max(fr.from_user, fr.to_user)];
      await pool.execute(
        'INSERT IGNORE INTO friendships (user_a, user_b) VALUES (?,?)', [a, b]
      );
      // Notify the requester
      const [meRows] = await pool.execute('SELECT username FROM users WHERE id=?', [req.userId]) as any;
      await pushNotification(fr.from_user, 'friend_accepted',
        'Solicitud aceptada', `${meRows[0]?.username} aceptó tu solicitud`, req.userId);
    } else {
      await pool.execute('UPDATE friend_requests SET status="rejected" WHERE id=?', [reqId]);
    }
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error del servidor' }); }
});

// Get my friends list
app.get('/api/friends', authenticate, async (req: AR, res) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.avatar_url AS avatarUrl, u.display_name AS displayName,
            np.track_title, np.artist, np.cover_url AS cover, np.updated_at AS lastSeen
     FROM friendships f
     JOIN users u ON u.id = IF(f.user_a = ?, f.user_b, f.user_a)
     LEFT JOIN now_playing np ON np.user_id = u.id
     WHERE f.user_a = ? OR f.user_b = ?
     ORDER BY np.updated_at DESC`,
    [req.userId, req.userId, req.userId]
  ) as any;
  res.json(rows);
});

// Remove friend
app.delete('/api/friends/:friendId', authenticate, async (req: AR, res) => {
  const fid = Number(req.params.friendId);
  const [a, b] = [Math.min(req.userId!, fid), Math.max(req.userId!, fid)];
  await pool.execute('DELETE FROM friendships WHERE user_a=? AND user_b=?', [a, b]);
  res.json({ success: true });
});

// Friends activity (what they're playing NOW)
app.get('/api/friends/activity', authenticate, async (req: AR, res) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.avatar_url AS avatarUrl,
            np.track_title AS trackTitle, np.artist, np.cover_url AS cover,
            np.updated_at AS updatedAt
     FROM friendships f
     JOIN users u ON u.id = IF(f.user_a=?,f.user_b,f.user_a)
     JOIN now_playing np ON np.user_id = u.id
     WHERE (f.user_a=? OR f.user_b=?)
       AND np.updated_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
     ORDER BY np.updated_at DESC`,
    [req.userId, req.userId, req.userId]
  ) as any;
  res.json(rows);
});

// ══════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════
app.get('/api/notifications', authenticate, async (req: AR, res) => {
  const [rows] = await pool.execute(
    `SELECT n.id, n.type, n.title, n.body, n.link, n.is_read AS isRead, n.created_at,
            u.username AS fromUsername, u.avatar_url AS fromAvatar
     FROM notifications n
     LEFT JOIN users u ON u.id = n.from_user
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC LIMIT 30`,
    [req.userId]
  ) as any;
  const unread = (rows as any[]).filter(r => !r.isRead).length;
  res.json({ notifications: rows.map((r: any) => ({ ...r, isRead: r.isRead === 1 })), unread });
});

app.put('/api/notifications/read-all', authenticate, async (req: AR, res) => {
  await pool.execute('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.userId]);
  res.json({ success: true });
});

app.put('/api/notifications/:id/read', authenticate, async (req: AR, res) => {
  await pool.execute('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [req.params.id, req.userId]);
  res.json({ success: true });
});

app.delete('/api/notifications', authenticate, async (req: AR, res) => {
  await pool.execute('DELETE FROM notifications WHERE user_id=?', [req.userId]);
  res.json({ success: true });
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => console.log(`🎵  Midnight Cruise API  →  http://localhost:${PORT}`));