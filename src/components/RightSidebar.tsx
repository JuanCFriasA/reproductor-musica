/**
 * src/components/RightSidebar.tsx  v2
 * – Real playback queue (add / remove)
 * – Friends activity (what they're listening to, polled every 10 s)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, ListMusic, Users, Headphones } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePlayer } from '../PlayerContext';
import { useAuth, API_BASE } from '../AuthContext';
import type { Friend } from '../types';

export function RightSidebar() {
  const { playTrack, currentTrack, queue, removeFromQueue, addToQueue } = usePlayer();
  const { token, isLoggedIn } = useAuth();
  const [tab,     setTab]     = useState<'queue' | 'friends'>('queue');
  const [friends, setFriends] = useState<Friend[]>([]);

  // Poll friends activity every 10 s
  const fetchActivity = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/friends/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFriends(await res.json());
    } catch { /* offline */ }
  }, [token]);

  useEffect(() => {
    fetchActivity();
    const id = setInterval(fetchActivity, 10_000);
    return () => clearInterval(id);
  }, [fetchActivity]);

  function timeAgo(d: string) {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    return `${Math.floor(diff/3600)}h`;
  }

  return (
    <aside className="hidden lg:flex h-screen w-80 fixed right-0 top-0 bg-background border-l border-white/5 flex-col pt-24 pb-28 z-40">
      <div className="px-5 flex flex-col h-full overflow-hidden">

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-high/30 p-1 rounded-2xl mb-6 flex-shrink-0">
          <button onClick={() => setTab('queue')}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              tab === 'queue' ? 'bg-primary text-background' : 'text-secondary hover:text-primary')}>
            <ListMusic className="w-3.5 h-3.5" /> Cola
          </button>
          <button onClick={() => setTab('friends')}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative',
              tab === 'friends' ? 'bg-primary text-background' : 'text-secondary hover:text-primary')}>
            <Users className="w-3.5 h-3.5" /> Amigos
            {friends.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-[8px] font-black text-white flex items-center justify-center border-2 border-background">
                {friends.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Queue ──────────────────────────── */}
        {tab === 'queue' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h3 className="font-headline font-bold text-sm">Lo que sigue</h3>
              {queue.length > 0 && (
                <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                  {queue.length} en cola
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              <AnimatePresence initial={false}>
                {queue.map((track, i) => (
                  <motion.div key={track.id + i}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 group"
                  >
                    <div className="relative w-11 h-11 flex-shrink-0 cursor-pointer" onClick={() => playTrack(track)}>
                      <img src={track.cover} alt={track.title}
                        className="w-full h-full rounded-lg object-cover shadow" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Play className="w-4 h-4 text-primary fill-current" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playTrack(track)}>
                      <h4 className="text-xs font-bold truncate group-hover:text-primary transition-colors">{track.title}</h4>
                      <p className="text-[10px] text-on-surface-variant truncate">{track.artist}</p>
                    </div>
                    <button onClick={() => removeFromQueue(i)}
                      className="flex-shrink-0 text-secondary/20 hover:text-red-400 transition-colors p-1" title="Quitar">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {queue.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant/25">
                  <ListMusic className="w-10 h-10 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest text-center">
                    Cola vacía
                  </p>
                  <p className="text-[10px] mt-1 text-center px-4">
                    Las canciones relacionadas aparecerán aquí automáticamente
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Friends Activity ──────────────── */}
        {tab === 'friends' && (
          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="font-headline font-bold text-sm mb-3 flex-shrink-0">Escuchando ahora</h3>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              {friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant/25">
                  <Headphones className="w-10 h-10 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest text-center">
                    {isLoggedIn ? 'Ningún amigo activo' : 'Inicia sesión para ver amigos'}
                  </p>
                  {isLoggedIn && (
                    <p className="text-[10px] mt-1 text-center px-4 opacity-70">
                      Agrega amigos en Configuración → Amigos
                    </p>
                  )}
                </div>
              ) : (
                friends.map((f, i) => (
                  <motion.div key={f.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-surface-high/20 rounded-2xl border border-white/5"
                  >
                    <div className="relative flex-shrink-0">
                      <img src={f.avatarUrl || `https://picsum.photos/seed/${f.username}/100/100`}
                        className="w-10 h-10 rounded-full object-cover border-2 border-green-500/50" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{f.displayName || f.username}</p>
                      {f.trackTitle && (
                        <>
                          <p className="text-[10px] text-primary font-bold truncate">🎵 {f.trackTitle}</p>
                          <p className="text-[9px] text-secondary truncate">{f.artist}</p>
                        </>
                      )}
                    </div>
                    <span className="text-[9px] text-secondary/40 uppercase font-bold flex-shrink-0">
                      {f.lastSeen ? timeAgo(f.lastSeen) : ''}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}