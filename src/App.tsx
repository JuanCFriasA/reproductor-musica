/**
 * src/App.tsx
 * – Wraps the app with AuthProvider
 * – Adds AuthModal (login / register) triggered from the top nav avatar
 * – All existing routes preserved
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Zap, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { PlayerProvider } from './PlayerContext';
import { AuthProvider, useAuth } from './AuthContext';
import { Sidebar, TopNav } from './components/Navigation';
import { Player } from './components/Player';
import { RightSidebar } from './components/RightSidebar';
import { HomeView } from './components/HomeView';
import { GenresView } from './components/GenresView';
import { LibraryView } from './components/LibraryView';
import { NowPlayingView } from './components/NowPlayingView';
import { SearchView } from './components/SearchView';
import { Track } from './types';
import { usePlayer } from './PlayerContext';

// ── Static views (unchanged) ──────────────────
function SettingsView() {
  return (
    <div className="max-w-2xl space-y-12">
      <h2 className="text-3xl font-headline font-black uppercase tracking-tighter">Configuración</h2>
      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">Cuenta</h3>
          <div className="space-y-4">
            {['Perfil Público', 'Privacidad', 'Notificaciones de correo'].map(item => (
              <div key={item} className="flex justify-between items-center py-4 border-b border-white/5">
                <span className="text-secondary">{item}</span>
                <button className="text-xs uppercase font-bold text-primary hover:underline">Editar</button>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6">Reproducción</h3>
          <div className="flex justify-between items-center py-4 border-b border-white/5">
            <span className="text-secondary">Calidad de Audio</span>
            <span className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-full">ALTA FIDELIDAD</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileView() {
  const { user, isLoggedIn, token } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:4000/api/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => {});
  }, [token]);

  return (
    <div className="max-w-4xl space-y-12">
      <div className="flex items-end gap-8 pb-8 border-b border-white/10">
        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary">
          <img
            src={user?.avatarUrl || 'https://picsum.photos/seed/user/200/200'}
            alt="User profile"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">
            {isLoggedIn ? 'Perfil del Usuario' : 'Visitante'}
          </span>
          <h2 className="text-6xl font-headline font-black uppercase tracking-tighter mt-2">
            {user?.username || 'Curador Nocturno'}
          </h2>
          {stats && (
            <p className="text-secondary mt-4 flex items-center gap-4">
              <span className="font-bold text-on-surface">{stats.uniqueSongs} Canciones</span>
              <span className="w-1 h-1 bg-secondary/30 rounded-full" />
              <span className="font-bold text-on-surface">{stats.uniqueArtists} Artistas</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-high/30 p-6 rounded-3xl border border-white/5 text-center">
          <h4 className="text-2xl font-black text-primary mb-1">
            {stats ? `${stats.estimatedHours}h ${stats.estimatedMinutes}m` : '--'}
          </h4>
          <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Tiempo de Escucha</p>
        </div>
        <div className="bg-surface-high/30 p-6 rounded-3xl border border-white/5 text-center">
          <h4 className="text-2xl font-black text-primary mb-1">
            {stats ? stats.totalPlays : '--'}
          </h4>
          <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Reproducciones</p>
        </div>
        <div className="bg-surface-high/30 p-6 rounded-3xl border border-white/5 text-center">
          <h4 className="text-2xl font-black text-primary mb-1">
            {stats?.topArtists?.[0]?.artist || '--'}
          </h4>
          <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Artista Top</p>
        </div>
      </div>

      {/* Top Songs */}
      {stats?.topSongs?.length > 0 && (
        <div>
          <h3 className="text-xl font-bold font-headline mb-6">Tus canciones más escuchadas</h3>
          <div className="space-y-3">
            {stats.topSongs.slice(0, 5).map((song: any, i: number) => (
              <div key={song.trackId} className="flex items-center gap-4 p-3 bg-surface-low/30 rounded-2xl border border-white/5">
                <span className="text-2xl font-black text-primary/40 w-8">{i + 1}</span>
                <img src={song.cover} alt="" className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{song.title}</p>
                  <p className="text-xs text-secondary truncate">{song.artist}</p>
                </div>
                <span className="text-xs text-primary font-bold">{song.playCount}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RadioView() {
  const [stations, setStations] = useState<any[]>([]);
  const { playTrack } = usePlayer();

  useEffect(() => {
    fetch('https://de1.api.radio-browser.info/json/stations/bycountry/dominican%20republic')
      .then(r => r.json())
      .then(data => setStations(data.filter((s: any) => s.url_resolved && s.name).slice(0, 24)))
      .catch(console.error);
  }, []);

  const playStation = (station: any) => {
    playTrack({
      id:        station.stationuuid,
      title:     station.name,
      artist:    'Radio En Vivo',
      album:     station.tags?.split(',')[0] || 'Internet Radio',
      cover:     station.favicon || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc',
      audioUrl:  station.url_resolved,
      isRadio:   true,
      isYouTube: false,
      duration:  0,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-headline font-black uppercase tracking-tighter">Radio Dominicana</h2>
          <p className="text-secondary text-sm">Estaciones en vivo 🇩🇴</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {stations.map(station => (
          <button
            key={station.stationuuid}
            onClick={() => playStation(station)}
            className="group p-4 bg-surface-high/40 rounded-2xl hover:bg-surface-high transition-all hover:scale-105 text-center"
          >
            {station.favicon
              ? <img src={station.favicon} alt={station.name} className="w-12 h-12 mx-auto mb-2 object-contain" />
              : (
                <div className="w-12 h-12 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
              )
            }
            <p className="text-xs font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {station.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Auth Modal ─────────────────────────────────
interface AuthModalProps {
  onClose: () => void;
}

function AuthModal({ onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode,       setMode]       = useState<'login' | 'register'>('login');
  const [username,   setUsername]   = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-surface-low border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-headline font-black uppercase tracking-tighter">
              {mode === 'login' ? 'Bienvenido' : 'Crear cuenta'}
            </h2>
            <p className="text-secondary text-xs mt-1">
              {mode === 'login' ? 'Accede a tu colección nocturna' : 'Únete a Midnight Cruise'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-secondary hover:text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
                Nombre de usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="curador_nocturno"
                required
                className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-primary transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-background font-black uppercase text-xs tracking-widest rounded-full hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-xs text-secondary mt-6">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-primary font-bold hover:underline"
          >
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── Main Layout ────────────────────────────────
function MainLayout() {
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [showAuthModal,    setShowAuthModal]    = useState(false);
  const { isLoggedIn, logout, user }            = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleGenreClick = (genre: string) => handleSearch(genre);

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary/30">
      <Sidebar />
      <TopNav
        onSearch={handleSearch}
        onLoginClick={() => setShowAuthModal(true)}
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={logout}
      />
      <RightSidebar />

      <main className="md:ml-64 lg:mr-80 pt-24 pb-32 px-6 md:px-12 max-w-[1400px] mx-auto overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Routes location={location}>
              <Route path="/"        element={<HomeView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/genres"  element={<GenresView onGenreClick={handleGenreClick} />} />
              <Route path="/radio"   element={<RadioView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="/profile"  element={<ProfileView />} />
              <Route
                path="/search"
                element={<SearchView query={new URLSearchParams(location.search).get('q') || ''} />}
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <Player onExpand={() => setIsPlayerExpanded(true)} />

      <AnimatePresence>
        {isPlayerExpanded && <NowPlayingView onClose={() => setIsPlayerExpanded(false)} />}
        {showAuthModal    && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Root ──────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Router>
          <MainLayout />
        </Router>
      </PlayerProvider>
    </AuthProvider>
  );
}