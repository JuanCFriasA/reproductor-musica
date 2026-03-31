/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { PlayerProvider } from './PlayerContext';
import { Sidebar, TopNav } from './components/Navigation';
import { Player } from './components/Player';
import { RightSidebar } from './components/RightSidebar';
import { HomeView } from './components/HomeView';
import { GenresView } from './components/GenresView';
import { LibraryView } from './components/LibraryView';
import { NowPlayingView } from './components/NowPlayingView';
import { SearchView } from './components/SearchView';
import { Track } from './types';

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
  return (
    <div className="max-w-4xl space-y-12">
      <div className="flex items-end gap-8 pb-8 border-b border-white/10">
        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary">
          <img src="https://picsum.photos/seed/user/200/200" alt="User profile" className="w-full h-full object-cover" />
        </div>
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Perfil del Usuario</span>
          <h2 className="text-6xl font-headline font-black uppercase tracking-tighter mt-2">Curador Nocturno</h2>
          <p className="text-secondary mt-4 flex items-center gap-4">
            <span className="font-bold text-on-surface">12 Listas de reproducción</span>
            <span className="w-1 h-1 bg-secondary/30 rounded-full" />
            <span className="font-bold text-on-surface">248 Seguidores</span>
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-high/30 p-6 rounded-3xl border border-white/5 text-center">
          <h4 className="text-2xl font-black text-primary mb-1">48h</h4>
          <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Tiempo de Escucha</p>
        </div>
        <div className="bg-surface-high/30 p-6 rounded-3xl border border-white/5 text-center">
          <h4 className="text-2xl font-black text-primary mb-1">1.2k</h4>
          <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Canciones Guardadas</p>
        </div>
        <div className="bg-surface-high/30 p-6 rounded-3xl border border-white/5 text-center">
          <h4 className="text-2xl font-black text-primary mb-1">Top 1%</h4>
          <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Oyente de Jazz</p>
        </div>
      </div>
    </div>
  );
}

function RadioView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
        <Zap className="w-12 h-12 text-primary" />
      </div>
      <h2 className="text-4xl font-headline font-black uppercase tracking-tighter">Estación de Radio</h2>
      <p className="text-secondary max-w-md">Transmitiendo las mejores curadurías de medianoche. Conéctate con el flujo musical en vivo.</p>
      <button className="px-8 py-3 bg-primary text-background font-bold rounded-full uppercase tracking-widest text-xs hover:scale-105 transition-transform">Conectar ahora</button>
    </div>
  );
}

function MainLayout() {
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleGenreClick = (genre: string) => {
    handleSearch(genre);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary/30">
      <Sidebar />
      <TopNav onSearch={handleSearch} />
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

      <Player onExpand={() => setIsPlayerExpanded(true)} />

      <AnimatePresence>
        {isPlayerExpanded && (
          <NowPlayingView onClose={() => setIsPlayerExpanded(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <Router>
        <MainLayout />
      </Router>
    </PlayerProvider>
  );
}
