/**
 * src/components/Navigation.tsx  v2
 * – Notifications polled from API every 20 s
 * – Unread count badge
 * – Mark individual / all as read
 * – Clear all
 * – Friend request accept/reject inline
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home, Library, LayoutGrid, Search, Bell,
  Settings, LogOut, Check, X, UserPlus, Music,
  CheckCheck, Trash2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, API_BASE } from '../AuthContext';
import type { User } from '../AuthContext';
import type { Notification } from '../types';

// ── Sidebar ───────────────────────────────────────────
export function Sidebar() {
  const [hovered, setHovered] = useState(false);
  const navItems = [
    { id: 'home',    name: 'Inicio',     path: '/',        icon: Home },
    { id: 'library', name: 'Biblioteca', path: '/library', icon: Library },
    { id: 'genres',  name: 'Géneros',    path: '/genres',  icon: LayoutGrid },
  ];

  return (
    <aside
      onMouseEnter={() => setHovered(false)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'hidden md:flex h-screen fixed left-0 top-0 bg-surface-low border-r-4 border-primary shadow-2xl flex-col pt-8 pb-28 z-40 transition-all duration-300',
        hovered ? 'w-64' : 'w-20',
      )}
    >
      <div className="mb-8 flex items-center justify-center">
        <Link to="/" className={cn('flex items-center transition-all duration-300', hovered ? 'gap-3 px-6 justify-start w-full' : 'justify-center w-full')}>
          <img src="/logo.png" alt="Logo" className={cn('transition-all duration-300 object-contain', hovered ? 'w-10 h-10' : 'w-12 h-12')} />
          {hovered && <h1 className="text-xl font-black text-primary font-headline tracking-tighter whitespace-nowrap">Midnight Cruise</h1>}
        </Link>
      </div>
      <nav className="flex-grow space-y-1">
        {navItems.map(item => (
          <NavLink key={item.id} to={item.path} title={!hovered ? item.name : ''}
            className={({ isActive }) => cn(
              'w-full flex items-center gap-4 py-4 transition-all duration-300 font-headline uppercase tracking-widest text-xs',
              hovered ? 'px-6 justify-start' : 'justify-center px-0',
              isActive ? 'text-primary border-l-4 border-primary bg-surface-high' : 'text-secondary hover:bg-surface-high/50 hover:text-primary',
            )}>
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {hovered && item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// ── TopNav ────────────────────────────────────────────
interface TopNavProps {
  onSearch:     (q: string) => void;
  onLoginClick?: () => void;
  isLoggedIn?:  boolean;
  user?:        User | null;
  onLogout?:    () => void;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return 'ahora';
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}

const notifIcon: Record<string, React.ReactNode> = {
  friend_request: <UserPlus className="w-4 h-4" />,
  friend_accepted: <Check  className="w-4 h-4" />,
  system:          <Bell   className="w-4 h-4" />,
  new_track:       <Music  className="w-4 h-4" />,
};
const notifColor: Record<string, string> = {
  friend_request:  'bg-primary/20 text-primary',
  friend_accepted: 'bg-green-500/20 text-green-400',
  system:          'bg-secondary/20 text-secondary',
  new_track:       'bg-blue-500/20 text-blue-400',
};

export function TopNav({ onSearch, onLoginClick, isLoggedIn, user, onLogout }: TopNavProps) {
  const { token } = useAuth();
  const [searchValue,    setSearchValue]   = useState('');
  const [showNotifs,     setShowNotifs]    = useState(false);
  const [showUserMenu,   setShowUserMenu]  = useState(false);
  const [notifications,  setNotifications] = useState<Notification[]>([]);
  const [unread,         setUnread]        = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Fetch notifications ──────────────────────
  const fetchNotifs = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API_BASE}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnread(data.unread);
    } catch { /* offline */ }
  }, [token]);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 20_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // ── Close on outside click ───────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifs(false); setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Helpers ──────────────────────────────────
  const markRead = async (id: number) => {
    if (!token) return;
    await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    setNotifications(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(p => Math.max(0, p - 1));
  };

  const markAllRead = async () => {
    if (!token) return;
    await fetch(`${API_BASE}/api/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const clearAll = async () => {
    if (!token) return;
    await fetch(`${API_BASE}/api/notifications`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    setNotifications([]); setUnread(0);
  };

  const handleFriendRequest = async (notif: Notification, action: 'accept' | 'reject') => {
    if (!token) return;
    // Find the request id via /api/friends/requests and match from_user
    try {
      const res = await fetch(`${API_BASE}/api/friends/requests`, { headers: { Authorization: `Bearer ${token}` } });
      const reqs = await res.json();
      const req = reqs.find((r: any) => r.fromUserId === notif.fromUsername);
      if (req) {
        await fetch(`${API_BASE}/api/friends/request/${req.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action }),
        });
      }
    } catch { /* silent */ }
    await markRead(notif.id);
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) onSearch(searchValue.trim());
  };

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-5rem)] h-20 z-50 bg-background/80 backdrop-blur-xl flex justify-between items-center px-8">

      {/* Search */}
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/60 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar música, artistas o álbumes..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyUp={handleSearch}
            className="w-full bg-surface-high/50 rounded-full py-2.5 pl-12 pr-4 text-sm text-on-surface focus:ring-2 ring-primary/50 placeholder:text-secondary/40 outline-none border-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-5 ml-6" ref={panelRef}>
        {/* Radio */}
        <nav className="hidden lg:flex items-center gap-5 mr-2">
          {[{ label: 'Radio', path: '/radio' }].map(({ label, path }) => (
            <NavLink key={path} to={path} className={({ isActive }) =>
              cn('text-sm font-headline tracking-tight transition-colors uppercase font-bold px-2 py-1',
                isActive ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-primary')}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(p => !p); setShowUserMenu(false); }}
            className={cn('p-2 rounded-full transition-colors relative', showNotifs ? 'bg-primary/10 text-primary' : 'text-secondary hover:text-primary hover:bg-surface-high/50')}
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-background text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-background">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Notifications panel */}
          {showNotifs && (
            <div className="absolute top-12 right-0 w-96 bg-surface-low border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50">
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 bg-surface-high/30 border-b border-white/5">
                <h3 className="font-bold text-sm">Notificaciones</h3>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} title="Marcar todas como leídas"
                      className="text-secondary/60 hover:text-primary transition-colors">
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAll} title="Borrar todas"
                      className="text-secondary/60 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-on-surface-variant/30">
                    <Bell className="w-10 h-10 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest">Sin notificaciones</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markRead(n.id)}
                      className={cn(
                        'px-5 py-4 border-b border-white/5 last:border-0 group cursor-pointer transition-colors',
                        n.isRead ? 'opacity-60 hover:opacity-80' : 'hover:bg-white/5',
                        !n.isRead && 'bg-primary/5',
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', notifColor[n.type] || 'bg-surface-high text-secondary')}>
                          {n.fromAvatar
                            ? <img src={n.fromAvatar} className="w-full h-full rounded-full object-cover" />
                            : notifIcon[n.type]
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-xs font-bold group-hover:text-primary transition-colors truncate">{n.title}</p>
                            <span className="text-[9px] text-secondary/40 uppercase font-bold whitespace-nowrap flex-shrink-0">{timeAgo(n.created_at)}</span>
                          </div>
                          <p className="text-[11px] text-secondary line-clamp-2 mt-0.5">{n.body}</p>

                          {/* Inline actions for friend requests */}
                          {n.type === 'friend_request' && !n.isRead && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={e => { e.stopPropagation(); handleFriendRequest(n, 'accept'); }}
                                className="flex items-center gap-1 px-3 py-1 bg-primary text-background text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                              >
                                <Check className="w-3 h-3" /> Aceptar
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); handleFriendRequest(n, 'reject'); }}
                                className="flex items-center gap-1 px-3 py-1 bg-surface-high text-secondary text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" /> Ignorar
                              </button>
                            </div>
                          )}
                        </div>
                        {!n.isRead && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

 

        {/* User / Login */}
        {isLoggedIn && user ? (
          <div className="relative">
            <button
              onClick={() => { setShowUserMenu(p => !p); setShowNotifs(false); }}
              className={cn('w-10 h-10 rounded-full overflow-hidden border-2 transition-all',
                showUserMenu ? 'border-primary' : 'border-primary/20 hover:border-primary')}
            >
              <img src={user.avatarUrl || `https://picsum.photos/seed/${user.username}/100/100`}
                alt={user.username} className="w-full h-full object-cover" />
            </button>

            {showUserMenu && (
              <div className="absolute top-12 right-0 w-48 bg-surface-low border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/5">
                  <p className="text-xs font-bold truncate">{user.username}</p>
                  <p className="text-[10px] text-secondary truncate">{user.email}</p>
                </div>
                <NavLink to="/profile" onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-3 text-xs hover:bg-white/5 transition-colors">
                  Ver perfil
                </NavLink>
                <NavLink to="/settings" onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-3 text-xs hover:bg-white/5 transition-colors">
                  Configuración
                </NavLink>
                <button onClick={() => { onLogout?.(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs hover:bg-white/5 transition-colors text-red-400">
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onLoginClick}
            className="px-5 py-2 bg-primary text-background font-black text-xs uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/20">
            Entrar
          </button>
        )}
      </div>
    </header>
  );
}