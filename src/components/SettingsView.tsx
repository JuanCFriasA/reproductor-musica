/**
 * src/components/SettingsView.tsx
 * Functional settings:
 *  – Avatar URL (preview before save)
 *  – Display name & bio
 *  – Password change
 *  – Friends: search users, send request, manage list
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, X, UserPlus, Trash2, Search, Camera, Key, User as UserIcon, Users } from 'lucide-react';
import { useAuth, API_BASE } from '../AuthContext';
import { cn } from '../lib/utils';

// ── Small section header ──────────────────────
function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-primary">{label}</h3>
    </div>
  );
}

// ── Toast ─────────────────────────────────────
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={cn(
      'fixed bottom-32 left-1/2 -translate-x-1/2 z-[80] px-6 py-3 rounded-full text-sm font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2',
      ok ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-red-500/20 border border-red-500/50 text-red-400',
    )}>
      {ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {msg}
    </div>
  );
}

export function SettingsView() {
  const { user, token, login } = useAuth();
  const [tab, setTab]   = useState<'profile' | 'security' | 'friends'>('profile');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  if (!user || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <UserIcon className="w-16 h-16 text-secondary/20" />
        <p className="text-secondary">Inicia sesión para acceder a la configuración</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <h2 className="text-3xl font-headline font-black uppercase tracking-tighter">Configuración</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-high/30 p-1 rounded-2xl w-fit">
        {([['profile', 'Perfil', UserIcon], ['security', 'Seguridad', Key], ['friends', 'Amigos', Users]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all',
              tab === id ? 'bg-primary text-background shadow-md' : 'text-secondary hover:text-primary')}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile'   && <ProfileTab   token={token} user={user} showToast={showToast} />}
      {tab === 'security'  && <SecurityTab  token={token}             showToast={showToast} />}
      {tab === 'friends'   && <FriendsTab   token={token}             showToast={showToast} />}
    </div>
  );
}

// ══════════════════════════════════════════════
// Profile Tab
// ══════════════════════════════════════════════
function ProfileTab({ token, user, showToast }: any) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio,         setBio]         = useState(user.bio || '');
  const [avatarUrl,   setAvatarUrl]   = useState(user.avatarUrl || '');
  const [preview,     setPreview]     = useState(user.avatarUrl || '');
  const [saving,      setSaving]      = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: displayName || null, bio: bio || null, avatarUrl: avatarUrl || null }),
      });
      if (!res.ok) throw new Error();
      showToast('Perfil actualizado');
      // Update local user object
      window.dispatchEvent(new Event('mc:profile-updated'));
    } catch {
      showToast('Error al guardar', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <section className="bg-surface-low/40 rounded-3xl p-8 border border-white/5">
        <SectionTitle icon={Camera} label="Foto de perfil" />
        <div className="flex items-start gap-6">
          <div className="relative flex-shrink-0 w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 flex items-center justify-center bg-surface-high/30">
            {preview ? (
              <img
                src={preview}
                alt="avatar"
                onError={() => setPreview('')}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-primary/40" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-secondary block">
              URL de la imagen
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://ejemplo.com/mi-foto.jpg"
              className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              onClick={() => setPreview(avatarUrl)}
              className="text-xs text-primary font-bold hover:underline"
            >
              Vista previa
            </button>
          </div>
        </div>
      </section>

      {/* Info */}
      <section className="bg-surface-low/40 rounded-3xl p-8 border border-white/5 space-y-5">
        <SectionTitle icon={UserIcon} label="Información" />

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
            Nombre de usuario
          </label>
          <input
            value={user.username}
            disabled
            className="w-full bg-surface-high/20 border border-white/5 rounded-2xl px-4 py-3 text-sm text-secondary cursor-not-allowed"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
            Nombre para mostrar
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-secondary block mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Cuéntanos algo sobre ti..."
            rows={3}
            maxLength={500}
            className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
          />
          <p className="text-[10px] text-secondary/40 mt-1 text-right">{bio.length}/500</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 bg-primary text-background font-black text-xs uppercase tracking-widest rounded-full hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Guardar cambios
        </button>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════
// Security Tab
// ══════════════════════════════════════════════
function SecurityTab({ token, showToast }: any) {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [saving,   setSaving]   = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) return showToast('Las contraseñas no coinciden', false);
    if (next.length < 6)  return showToast('Mínimo 6 caracteres', false);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Contraseña actualizada');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar contraseña', false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-surface-low/40 rounded-3xl p-8 border border-white/5">
      <SectionTitle icon={Key} label="Cambiar contraseña" />
      <form onSubmit={handleChange} className="space-y-4">
        {[
          { label: 'Contraseña actual', value: current, set: setCurrent },
          { label: 'Nueva contraseña',  value: next,    set: setNext },
          { label: 'Confirmar nueva',   value: confirm, set: setConfirm },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary block mb-2">{label}</label>
            <input
              type="password"
              value={value}
              onChange={e => set(e.target.value)}
              required
              className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        ))}
        <button type="submit" disabled={saving}
          className="w-full py-3.5 bg-primary text-background font-black text-xs uppercase tracking-widest rounded-full hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
          Actualizar contraseña
        </button>
      </form>
    </section>
  );
}

// ══════════════════════════════════════════════
// Friends Tab
// ══════════════════════════════════════════════
function FriendsTab({ token, showToast }: any) {
  const [searchQ,    setSearchQ]    = useState('');
  const [results,    setResults]    = useState<any[]>([]);
  const [friends,    setFriends]    = useState<any[]>([]);
  const [pending,    setPending]    = useState<any[]>([]);
  const [searching,  setSearching]  = useState(false);
  const [sentIds,    setSentIds]    = useState<Set<number>>(new Set());

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const loadFriends = useCallback(async () => {
    const [f, p] = await Promise.all([
      fetch(`${API_BASE}/api/friends`,         { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/api/friends/requests`,{ headers }).then(r => r.json()).catch(() => []),
    ]);
    setFriends(f); setPending(p);
  }, [token]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res  = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(searchQ)}`, { headers });
      setResults(await res.json());
    } finally { setSearching(false); }
  };

  const sendRequest = async (userId: number) => {
    const res = await fetch(`${API_BASE}/api/friends/request`, {
      method: 'POST', headers, body: JSON.stringify({ toUserId: userId }),
    });
    if (res.ok) { setSentIds(p => new Set(p).add(userId)); showToast('Solicitud enviada'); }
    else { const d = await res.json(); showToast(d.error || 'Error', false); }
  };

  const acceptRequest = async (id: number) => {
    await fetch(`${API_BASE}/api/friends/request/${id}`, { method: 'PUT', headers, body: JSON.stringify({ action: 'accept' }) });
    showToast('Amigo aceptado 🎉');
    loadFriends();
  };

  const removeFriend = async (fid: number) => {
    await fetch(`${API_BASE}/api/friends/${fid}`, { method: 'DELETE', headers });
    showToast('Amigo eliminado');
    loadFriends();
  };

  const isFriend = (id: number) => friends.some((f: any) => f.id === id);

  return (
    <div className="space-y-6">
      {/* Pending requests */}
      {pending.length > 0 && (
        <section className="bg-primary/10 rounded-3xl p-6 border border-primary/20">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
            Solicitudes pendientes ({pending.length})
          </h4>
          <div className="space-y-3">
            {pending.map((req: any) => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-background/40 rounded-2xl">
                <img src={req.avatarUrl || `https://picsum.photos/seed/${req.username}/100/100`}
                  className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{req.displayName || req.username}</p>
                  <p className="text-xs text-secondary">@{req.username}</p>
                </div>
                <button onClick={() => acceptRequest(req.id)}
                  className="px-4 py-2 bg-primary text-background text-xs font-black uppercase rounded-full hover:scale-105 transition-transform">
                  Aceptar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search users */}
      <section className="bg-surface-low/40 rounded-3xl p-8 border border-white/5">
        <SectionTitle icon={Search} label="Buscar usuarios" />
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyUp={e => e.key === 'Enter' && doSearch()}
            placeholder="Buscar por nombre de usuario..."
            className="flex-1 bg-surface-high/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button onClick={doSearch} disabled={searching}
            className="px-5 py-3 bg-primary text-background font-black text-xs uppercase rounded-2xl hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-surface-high/30 rounded-2xl border border-white/5">
                <img src={u.avatarUrl || `https://picsum.photos/seed/${u.username}/100/100`}
                  className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{u.displayName || u.username}</p>
                  <p className="text-xs text-secondary">@{u.username}</p>
                </div>
                {isFriend(u.id) ? (
                  <span className="text-xs text-green-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" />Amigos</span>
                ) : sentIds.has(u.id) ? (
                  <span className="text-xs text-secondary font-bold">Enviado</span>
                ) : (
                  <button onClick={() => sendRequest(u.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary/20 text-primary text-xs font-bold rounded-full hover:bg-primary hover:text-background transition-all">
                    <UserPlus className="w-3.5 h-3.5" /> Agregar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Friends list */}
      <section className="bg-surface-low/40 rounded-3xl p-8 border border-white/5">
        <SectionTitle icon={Users} label={`Mis amigos (${friends.length})`} />
        {friends.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant/30">
            <Users className="w-12 h-12 mx-auto mb-3" />
            <p className="text-sm">Aún no tienes amigos. ¡Busca personas arriba!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((f: any) => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-surface-high/30 rounded-2xl border border-white/5">
                <div className="relative">
                  <img src={f.avatarUrl || `https://picsum.photos/seed/${f.username}/100/100`}
                    className="w-11 h-11 rounded-full object-cover" />
                  {f.track_title && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{f.displayName || f.username}</p>
                  {f.track_title
                    ? <p className="text-[10px] text-primary truncate">🎵 {f.track_title} · {f.artist}</p>
                    : <p className="text-[10px] text-secondary">Sin actividad reciente</p>
                  }
                </div>
                <button onClick={() => removeFriend(f.id)}
                  className="text-secondary/30 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}