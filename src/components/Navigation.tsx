import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Home, Library, LayoutGrid, Zap, Search, Bell, Settings, Check, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar() {
  const [hovered, setHovered] = useState(false);

  const navItems = [
    { id: 'home', name: 'Inicio', path: '/', icon: Home },
    { id: 'library', name: 'Biblioteca', path: '/library', icon: Library },
    { id: 'genres', name: 'Géneros', path: '/genres', icon: LayoutGrid },
  ];

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "hidden md:flex h-screen fixed left-0 top-0 bg-surface-low border-r-4 border-primary shadow-2xl flex-col pt-8 pb-28 z-40 transition-all duration-300",
        hovered ? "w-64" : "w-20"
      )}
    >
      {/* Logo */}
<div className="mb-8 group cursor-pointer flex items-center justify-center">
  <Link to="/" className={cn(
    "flex items-center transition-all duration-300",
    hovered ? "gap-3 px-6 justify-start w-full" : "justify-center w-full"
  )}>
    
    <img 
      src="/public/logo.png" 
      alt="Logo midnight cruise" 
      className={cn(
        "transition-all duration-300 object-contain",
        hovered ? "w-10 h-10" : "w-12 h-12"
      )}
    />

    {hovered && (
      <h1 className="text-xl font-black text-primary font-headline tracking-tighter whitespace-nowrap">
        Midnight Cruise
      </h1>
    )}
  </Link>
</div>

      {/* Nav */}
      <nav className="flex-grow space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            title={!hovered ? item.name : ""}
            className={({ isActive }) => cn(
              "w-full flex items-center gap-4 py-4 transition-all duration-300 font-headline uppercase tracking-widest text-xs",
              hovered ? "px-6 justify-start" : "justify-center px-0",
              isActive
                ? "text-primary border-l-4 border-primary bg-surface-high"
                : "text-secondary hover:bg-surface-high/50 hover:text-primary"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {hovered && item.name}
          </NavLink>
        ))}
      </nav>


    </aside>
  );
}

interface TopNavProps {
  onSearch: (query: string) => void;
}

export function TopNav({ onSearch }: TopNavProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  };

  const notifications = [
    { id: 1, title: 'Nueva curaduría', desc: 'Ecos de Medianoche ha sido actualizada.', time: '2h', type: 'update' },
    { id: 2, title: 'Suscripción Premium', desc: 'Tu plan familiar ha sido activado.', time: '5h', type: 'success' },
    { id: 3, title: 'Artista en vivo', desc: 'Neon Horizon está transmitiendo ahora.', time: '1d', type: 'live' },
  ];

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] h-20 z-50 bg-background/80 backdrop-blur-xl flex justify-between items-center px-8">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/60 transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Buscar música, artistas o álbumes..." 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyUp={handleSearch}
            className="w-full bg-surface-high/50 border-none rounded-full py-2.5 pl-12 pr-4 text-sm text-on-surface focus:ring-2 ring-primary/50 transition-all placeholder:text-secondary/40 outline-none"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6 ml-6">
        <nav className="hidden lg:flex items-center gap-6 mr-6">
          <NavLink 
            to="/genres"
            className={({ isActive }) => cn(
              "text-sm font-headline tracking-tight transition-colors uppercase font-bold px-2 py-1",
              isActive ? "text-primary border-b-2 border-primary" : "text-secondary hover:text-primary"
            )}
          >
            Géneros
          </NavLink>
          <NavLink 
            to="/radio"
            className={({ isActive }) => cn(
              "text-sm font-headline tracking-tight transition-colors uppercase font-bold px-2 py-1",
              isActive ? "text-primary border-b-2 border-primary" : "text-secondary hover:text-primary"
            )}
          >
            Radio
          </NavLink>
        </nav>
        
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "p-2 rounded-full transition-colors relative",
              showNotifications ? "bg-primary/10 text-primary" : "text-secondary hover:text-primary hover:bg-surface-high/50"
            )}
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-surface-low border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface-high/20">
                <h3 className="font-bold text-sm">Notificaciones</h3>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest">3 nuevas</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0 group">
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        n.type === 'update' ? "bg-primary/20 text-primary" : 
                        n.type === 'success' ? "bg-green-500/20 text-green-400" : 
                        "bg-red-500/20 text-red-400"
                      )}>
                        {n.type === 'update' ? <Clock className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold mb-0.5 group-hover:text-primary transition-colors">{n.title}</p>
                        <p className="text-[10px] text-secondary line-clamp-2">{n.desc}</p>
                        <span className="text-[9px] text-secondary/40 mt-1 block uppercase font-bold">{n.time} atrás</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-3 text-[10px] uppercase tracking-widest font-bold text-secondary hover:text-primary hover:bg-white/5 transition-all">
                Ver todas las notificaciones
              </button>
            </div>
          )}

          <NavLink 
            to="/settings"
            className={({ isActive }) => cn(
              "p-2 rounded-full transition-colors",
              isActive ? "bg-primary/10 text-primary" : "text-secondary hover:text-primary hover:bg-surface-high/50"
            )}
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </NavLink>
          <NavLink 
            to="/profile"
            className={({ isActive }) => cn(
              "w-10 h-10 rounded-full overflow-hidden border-2 transition-all",
              isActive ? "border-primary" : "border-primary/20 hover:border-primary"
            )}
            title="Mi Perfil"
          >
            <img 
              src="https://picsum.photos/seed/user/100/100" 
              alt="User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </NavLink>
        </div>
      </div>
    </header>
  );
}
