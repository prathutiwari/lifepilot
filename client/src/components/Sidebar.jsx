import { useState, useRef } from "react";
import { updateProfile } from "../services/api";

// Fallback user icon when no picture is available
function UserAvatar({ picture, name, size = 32, className = "" }) {
  const [imgError, setImgError] = useState(false);

  if (picture && !imgError) {
    return (
      <img
        src={picture}
        alt={name}
        className={`rounded-full ring-2 ring-border ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback: user icon
  return (
    <div
      className={`rounded-full ring-2 ring-border bg-primary/20 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="text-primary"
        style={{ width: size * 0.55, height: size * 0.55 }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    </div>
  );
}

const ALL_TABS = [
  {
    id: "expenses",
    label: "Expenses",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "habits",
    label: "Habits",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "health",
    label: "Health",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: "meetings",
    label: "Meetings",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "notes",
    label: "Notes",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: "study",
    label: "Study",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "workouts",
    label: "Workouts",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

function Sidebar({ activeTab, onTabChange, user, onLogout, onUpdateUser, sidebarPrefs, onPrefsChange }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const favorites = sidebarPrefs?.favorites || [];
  const tabOrder = sidebarPrefs?.tabOrder || ALL_TABS.map((t) => t.id);

  const toggleFavorite = (id) => {
    const newFavs = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    onPrefsChange(newFavs, tabOrder);
  };

  const moveTab = (id, direction) => {
    const idx = tabOrder.indexOf(id);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= tabOrder.length) return;
    const arr = [...tabOrder];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    onPrefsChange(favorites, arr);
  };

  const startEditing = () => {
    setEditName(user.name);
    setEditingProfile(true);
  };

  const cancelEditing = () => {
    setEditingProfile(false);
    setEditName("");
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateProfile({ name: editName.trim() });
      onUpdateUser(updated);
      setEditingProfile(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setSaving(true);
      try {
        const updated = await updateProfile({ picture: base64 });
        onUpdateUser(updated);
      } catch (err) {
        console.error("Failed to upload image:", err);
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({ picture: null });
      onUpdateUser(updated);
    } catch (err) {
      console.error("Failed to remove image:", err);
    } finally {
      setSaving(false);
    }
  };

  // Sort tabs: favorites first (in order), then rest (in user order)
  const sortedTabs = [...tabOrder]
    .filter((id) => ALL_TABS.some((t) => t.id === id))
    .map((id) => ALL_TABS.find((t) => t.id === id));

  // Add any missing tabs (in case new ones were added)
  ALL_TABS.forEach((t) => { if (!sortedTabs.find((s) => s.id === t.id)) sortedTabs.push(t); });

  const favTabs = sortedTabs.filter((t) => favorites.includes(t.id));
  const otherTabs = sortedTabs.filter((t) => !favorites.includes(t.id));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-shrink-0 flex-col bg-surface-light border-r border-border relative"
        style={{ width: '220px' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2" style={{ padding: '16px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-text">LifePilot</span>
        </div>

        {/* Tabs */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '12px 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {favTabs.length > 0 && (
              <>
                {favTabs.map((tab) => (
                  <TabButton key={tab.id} tab={tab} activeTab={activeTab} onTabChange={onTabChange} isFavorite onToggleFavorite={toggleFavorite} onMove={moveTab} />
                ))}
                <div className="border-b border-border" style={{ margin: '6px 12px' }} />
              </>
            )}
            {otherTabs.map((tab) => (
              <TabButton key={tab.id} tab={tab} activeTab={activeTab} onTabChange={onTabChange} isFavorite={false} onToggleFavorite={toggleFavorite} onMove={moveTab} />
            ))}
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid var(--color-border)', position: 'relative' }}>
          <button
            onClick={() => setShowProfile((p) => !p)}
            className="w-full flex items-center gap-2 rounded-lg hover:bg-surface-lighter transition-colors"
            style={{ padding: '6px' }}
          >
            <UserAvatar picture={user.picture} name={user.name} size={32} />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-medium text-text truncate">{user.name}</p>
              <p className="text-xs text-text-muted/60 truncate">{user.email}</p>
            </div>
            <svg className={`w-3.5 h-3.5 text-text-muted transition-transform ${showProfile ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          </button>

          {showProfile && (
            <div className="absolute bottom-full left-3 right-3 bg-surface-light border border-border rounded-xl shadow-xl overflow-hidden" style={{ marginBottom: '8px' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
                {editingProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Avatar with upload */}
                    <div className="flex items-center" style={{ gap: '12px' }}>
                      <div className="relative group/avatar">
                        <UserAvatar picture={user.picture} name={user.name} size={48} />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                          disabled={saving}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                          </svg>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-primary hover:text-primary-light transition-colors text-left"
                          disabled={saving}
                        >
                          Upload photo
                        </button>
                        {user.picture && (
                          <button
                            onClick={handleRemoveImage}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors text-left"
                            disabled={saving}
                          >
                            Remove photo
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Name input */}
                    <div>
                      <label className="text-xs text-text-muted" style={{ marginBottom: '4px', display: 'block' }}>Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                        style={{ padding: '8px 10px' }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveProfile(); if (e.key === "Escape") cancelEditing(); }}
                        autoFocus
                      />
                    </div>
                    {/* Save / Cancel */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving || !editName.trim()}
                        className="flex-1 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50"
                        style={{ padding: '7px 0' }}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 text-xs font-medium border border-border text-text-muted hover:text-text rounded-lg transition-colors"
                        style={{ padding: '7px 0' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center" style={{ gap: '10px' }}>
                    <UserAvatar picture={user.picture} name={user.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text truncate">{user.name}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: '6px' }}>
                {!editingProfile && (
                  <button onClick={startEditing} className="w-full flex items-center gap-2 text-left rounded-lg text-text-muted hover:bg-surface-lighter hover:text-text transition-colors" style={{ padding: '10px 12px' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                    <span className="text-sm font-medium">Edit Profile</span>
                  </button>
                )}
                <button onClick={() => { setShowProfile(false); setEditingProfile(false); onLogout(); }} className="w-full flex items-center gap-2 text-left rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" style={{ padding: '10px 12px' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-light border-t border-border z-40 flex items-center justify-around" style={{ padding: '4px 0', paddingBottom: '5px' }}>
        {sortedTabs.slice(0, 5).map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center transition-colors ${activeTab === tab.id ? "text-primary-light" : "text-text-muted"}`}
            style={{ padding: '4px 6px' }}
          >
            {tab.icon}
            <span className="text-[9px] font-medium" style={{ marginTop: '1px' }}>{tab.label}</span>
          </button>
        ))}
        {/* More button */}
        <button
          onClick={() => setShowMobileMenu((s) => !s)}
          className={`flex flex-col items-center transition-colors ${showMobileMenu ? "text-primary-light" : "text-text-muted"}`}
          style={{ padding: '4px 6px' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          <span className="text-[9px] font-medium" style={{ marginTop: '1px' }}>More</span>
        </button>
      </nav>

      {/* Mobile More Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-50" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-surface-light border-t border-border rounded-t-2xl" style={{ padding: '20px', paddingBottom: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {sortedTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { onTabChange(tab.id); setShowMobileMenu(false); }}
                  className={`flex flex-col items-center rounded-xl transition-colors ${activeTab === tab.id ? "bg-primary/15 text-primary-light" : "text-text-muted"}`}
                  style={{ padding: '12px 4px' }}
                >
                  {tab.icon}
                  <span className="text-[10px] font-medium" style={{ marginTop: '4px' }}>{tab.label}</span>
                </button>
              ))}
            </div>
            {/* User + Logout */}
            <div className="border-t border-border" style={{ paddingTop: '12px' }}>
              {editingProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Avatar with upload */}
                  <div className="flex items-center" style={{ gap: '12px' }}>
                    <div className="relative" onClick={() => fileInputRef.current?.click()}>
                      <UserAvatar picture={user.picture} name={user.name} size={44} />
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-primary hover:text-primary-light transition-colors text-left"
                        disabled={saving}
                      >
                        Upload photo
                      </button>
                      {user.picture && (
                        <button
                          onClick={handleRemoveImage}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors text-left"
                          disabled={saving}
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Name input */}
                  <div>
                    <label className="text-xs text-text-muted" style={{ marginBottom: '4px', display: 'block' }}>Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                      style={{ padding: '8px 10px' }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveProfile(); if (e.key === "Escape") cancelEditing(); }}
                      autoFocus
                    />
                  </div>
                  {/* Save / Cancel */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving || !editName.trim()}
                      className="flex-1 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50"
                      style={{ padding: '8px 0' }}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex-1 text-xs font-medium border border-border text-text-muted hover:text-text rounded-lg transition-colors"
                      style={{ padding: '8px 0' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <UserAvatar picture={user.picture} name={user.name} size={32} />
                    <div>
                      <p className="text-xs font-medium text-text">{user.name}</p>
                      <p className="text-xs text-text-muted/60">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center" style={{ gap: '8px' }}>
                    <button onClick={startEditing} className="text-xs text-primary border border-primary/30 rounded-lg" style={{ padding: '6px 10px' }}>Edit</button>
                    <button onClick={() => { setShowMobileMenu(false); onLogout(); }} className="text-xs text-red-400 border border-red-500/30 rounded-lg" style={{ padding: '6px 12px' }}>Logout</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({ tab, activeTab, onTabChange, isFavorite, onToggleFavorite, onMove }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="group relative flex items-center" onMouseLeave={() => setShowActions(false)}>
      <button
        onClick={() => onTabChange(tab.id)}
        className={`w-full flex items-center gap-3 rounded-lg text-left transition-all ${
          activeTab === tab.id
            ? "bg-primary/15 text-primary-light"
            : "text-text-muted hover:bg-surface-lighter hover:text-text"
        }`}
        style={{ padding: '10px 12px' }}
      >
        {tab.icon}
        <span className="text-sm font-medium flex-1">{tab.label}</span>
        {isFavorite && <span className="text-amber-400 text-xs">★</span>}
      </button>

      {/* Actions trigger */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowActions((s) => !s); }}
        className="absolute right-1 opacity-0 group-hover:opacity-100 text-text-muted/50 hover:text-text-muted transition-all"
        style={{ padding: '4px' }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
      </button>

      {/* Actions dropdown */}
      {showActions && (
        <div className="absolute right-0 top-full bg-surface-light border border-border rounded-lg shadow-xl z-50 overflow-hidden" style={{ minWidth: '140px' }}>
          <button onClick={() => { onToggleFavorite(tab.id); setShowActions(false); }} className="w-full flex items-center gap-2 text-left text-xs text-text-muted hover:bg-surface-lighter hover:text-text" style={{ padding: '8px 12px' }}>
            <span>{isFavorite ? "★" : "☆"}</span>
            <span>{isFavorite ? "Remove favorite" : "Add to favorites"}</span>
          </button>
          <button onClick={() => { onMove(tab.id, -1); setShowActions(false); }} className="w-full flex items-center gap-2 text-left text-xs text-text-muted hover:bg-surface-lighter hover:text-text" style={{ padding: '8px 12px' }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
            <span>Move up</span>
          </button>
          <button onClick={() => { onMove(tab.id, 1); setShowActions(false); }} className="w-full flex items-center gap-2 text-left text-xs text-text-muted hover:bg-surface-lighter hover:text-text" style={{ padding: '8px 12px' }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            <span>Move down</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
