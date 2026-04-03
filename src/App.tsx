/**
 * src/App.tsx  v5 - Final Navigation fix
 */
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Zap, User as UserIcon } from 'lucide-react';
import { PlayerProvider, usePlayer } from './PlayerContext';
import { AuthProvider, useAuth, API_BASE } from './AuthContext';
import { 
  ClerkProvider, 
  AuthenticateWithRedirectCallback 
} from '@clerk/clerk-react';
import { Sidebar, TopNav } from './components/Navigation';
import { Player } from './components/Player';
import { RightSidebar } from './components/RightSidebar';
import { HomeView } from './components/HomeView';
import { GenresView } from './components/GenresView';
import { LibraryView } from './components/LibraryView';
import { NowPlayingView } from './components/NowPlayingView';
import { SearchView } from './components/SearchView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';

// ── Profile view ──────────────────────────────
function ProfileView() {
  const { user, token, isLoggedIn } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(setStats).catch(() => {});
  }, [token]);

  return (
    <div className="max-w-4xl space-y-12">
      <div className="flex items-end gap-8 pb-8 border-b border-white/10">
        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary flex items-center justify-center bg-surface-high/30 relative group">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center">
              <UserIcon className="w-20 h-20 text-primary/40" />
            </div>
          )}
        </div>
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">
            {isLoggedIn ? 'Perfil del Usuario' : 'Visitante'}
          </span>
          <h2 className="text-5xl font-headline font-black uppercase tracking-tighter mt-2">
            {user?.displayName || user?.username || 'Curador Nocturno'}
          </h2>
          {stats && (
            <p className="text-secondary mt-3 flex items-center gap-4">
              <span className="font-bold text-on-surface">{stats.uniqueSongs} Canciones</span>
              <span className="w-1 h-1 bg-secondary/30 rounded-full" />
              <span className="font-bold text-on-surface">{stats.uniqueArtists} Artistas</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { value: stats ? `${stats.estimatedHours}h ${stats.estimatedMinutes}m` : '--', label: 'Tiempo de Escucha' },
          { value: stats ? stats.totalPlays : '--', label: 'Reproducciones' },
          { value: stats?.topArtists?.[0]?.artist || '--', label: 'Artista Top' },
        ].map(({ value, label }) => (
          <div key={label} className="bg-surface-high/30 p-6 rounded-3xl border border-white/5 text-center">
            <h4 className="text-2xl font-black text-primary mb-1 truncate">{value}</h4>
            <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Radio view ────────────────────────────────
function RadioView() {
  const [stations, setStations] = useState<any[]>([]);
  const { playTrack } = usePlayer();

  useEffect(() => {
    fetch('https://de1.api.radio-browser.info/json/stations/bycountry/dominican%20republic')
      .then(r => r.json())
      .then(data => setStations(data.filter((s: any) => s.url_resolved && s.name).slice(0, 24)))
      .catch(console.error);
  }, []);

  const playStation = (station: any) => playTrack({
    id: station.stationuuid, title: station.name, artist: 'Radio En Vivo',
    album: station.tags?.split(',')[0] || 'Internet Radio',
    cover: station.favicon || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc',
    audioUrl: station.url_resolved, isRadio: true, isYouTube: false, duration: 0,
  });

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
          <button key={station.stationuuid} onClick={() => playStation(station)}
            className="group p-4 bg-surface-high/40 rounded-2xl hover:bg-surface-high transition-all hover:scale-105 text-center">
            {station.favicon
              ? <img src={station.favicon} alt={station.name} className="w-12 h-12 mx-auto mb-2 object-contain" />
              : <div className="w-12 h-12 mx-auto mb-2 bg-primary/20 rounded-full flex items-center justify-center"><Zap className="w-5 h-5 text-primary" /></div>
            }
            <p className="text-xs font-bold line-clamp-2 group-hover:text-primary transition-colors">{station.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── App Container (Shell Logic) ────────────────
function AppInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout, user } = useAuth();
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const handleSearch = (q: string) => navigate(`/search?q=${encodeURIComponent(q)}`);
  const handleGenreClick = (g: string) => handleSearch(g);

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary/30 relative">
      {/* Shell is only visible for non-auth pages */}
      {!isAuthPage && (
        <>
          <Sidebar />
          <TopNav 
            onSearch={handleSearch} 
            onLoginClick={() => navigate('/login')}
            isLoggedIn={isLoggedIn} 
            user={user} 
            onLogout={logout} 
          />
          <RightSidebar />
        </>
      )}

      {/* Main Content Area */}
      <main className={!isAuthPage ? 'md:ml-20 lg:mr-80 pt-24 pb-32 px-6 md:px-12 min-h-screen relative' : 'w-full h-screen overflow-hidden'}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname + (isAuthPage ? '' : location.search)}
            initial={{ opacity: 0, y: isAuthPage ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isAuthPage ? 0 : -10 }}
            transition={{ duration: 0.35 }}
            className="w-full h-full"
          >
            <Routes location={location}>
              <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/register" element={<RegisterView />} />
              <Route path="/" element={<HomeView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/genres" element={<GenresView onGenreClick={handleGenreClick} />} />
              <Route path="/radio" element={<RadioView />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="/search" element={<SearchView query={new URLSearchParams(location.search).get('q') || ''} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {!isAuthPage && (
        <>
          <Player onExpand={() => setIsPlayerExpanded(true)} />
          <AnimatePresence>
            {isPlayerExpanded && <NowPlayingView onClose={() => setIsPlayerExpanded(false)} />}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ── Root App Component ────────────────────────
export default function App() {
  return (
    <ClerkProvider 
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''}
      fallbackRedirectUrl="/"
      signInUrl="/login"
      signUpUrl="/register"
    >
      <AuthProvider>
        <PlayerProvider>
          <Router>
            <AppInner />
          </Router>
        </PlayerProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}