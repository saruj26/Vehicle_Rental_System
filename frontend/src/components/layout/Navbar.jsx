import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Car, Menu, X, Moon, Sun, Heart, Bell, LayoutDashboard, LogOut, User as UserIcon, Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import api from '@/lib/api';
import { cn, initials } from '@/lib/utils';

const dashboardPath = (role) =>
  role === 'admin' ? '/admin' : role === 'owner' ? '/owner' : '/dashboard';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    api
      .get('/notifications/unread-count')
      .then(({ data }) => setUnread(data.data.unread))
      .catch(() => {});
  }, [user]);

  const links = [
    { to: '/vehicles', label: 'Browse' },
    { to: '/vehicles?sort=trending', label: 'Trending' },
    { to: '/compare', label: 'Compare' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-lg dark:bg-slate-950/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Car className="h-5 w-5" />
          </span>
          <span className="text-lg">Rent<span className="text-brand-600">Wheels</span></span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800',
                  isActive && 'text-brand-600')
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={toggle} className="btn-ghost h-9 w-9 !px-0" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user ? (
            <>
              <Link to="/wishlist" className="btn-ghost hidden h-9 w-9 !px-0 sm:inline-flex" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>
              <Link to="/notifications" className="relative btn-ghost hidden h-9 w-9 !px-0 sm:inline-flex">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {user.avatar?.url ? <img src={user.avatar.url} alt="" className="h-8 w-8 rounded-full object-cover" /> : initials(user.name)}
                  </span>
                </button>
                {menu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-56 animate-scale-in rounded-xl border bg-white p-1.5 shadow-lg dark:bg-slate-900">
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <p className="truncate text-xs capitalize text-slate-500">{user.role}</p>
                      </div>
                      <hr className="my-1" />
                      <MenuItem to={dashboardPath(user.role)} icon={LayoutDashboard} onClick={() => setMenu(false)}>Dashboard</MenuItem>
                      <MenuItem to="/profile" icon={UserIcon} onClick={() => setMenu(false)}>Profile</MenuItem>
                      <MenuItem to="/wishlist" icon={Heart} onClick={() => setMenu(false)}>Wishlist</MenuItem>
                      <button
                        onClick={() => { setMenu(false); logout(); navigate('/'); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Link to="/auth" className="btn-primary ml-1 hidden sm:inline-flex">Sign in</Link>
          )}

          <button className="btn-ghost h-9 w-9 !px-0 md:hidden" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t bg-white p-3 md:hidden dark:bg-slate-950">
          <Link to="/vehicles" onClick={() => setOpen(false)} className="btn-outline mb-2 w-full">
            <Search className="h-4 w-4" /> Browse vehicles
          </Link>
          {links.map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link to="/auth" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full">Sign in</Link>
          )}
        </div>
      )}
    </header>
  );
}

function MenuItem({ to, icon: Icon, children, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
      <Icon className="h-4 w-4" /> {children}
    </Link>
  );
}
