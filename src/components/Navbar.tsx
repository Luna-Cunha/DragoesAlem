import { Link, useLocation } from 'react-router-dom';
import { Database, Moon, Plus, Shield, Sun, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Navbar() {
  const { compendium, siteDarkMode, toggleSiteDarkMode } = useApp();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <header className="bg-[#121518] text-white border-b-2 border-[#e40712] sticky top-0 z-30 no-print shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/characters" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-[#e40712] flex items-center justify-center shadow group-hover:bg-[#c50610] transition">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <div className="font-display font-extrabold text-sm tracking-wider uppercase">
                Dragões Além
              </div>
              <div className="text-[10px] text-slate-400 tracking-widest uppercase">
                Character Tools
              </div>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
            <Link
              to="/characters"
              className={`px-3 py-2 rounded flex items-center gap-1.5 transition ${
                location.pathname === '/characters'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              My Characters
            </Link>
            <Link
              to="/characters/builder"
              className={`px-3 py-2 rounded flex items-center gap-1.5 transition ${
                isActive('/characters/builder')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Create A Character
            </Link>
            <Link
              to="/setup"
              className={`px-3 py-2 rounded flex items-center gap-1.5 transition ${
                isActive('/setup')
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Data Source
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSiteDarkMode}
            className="p-2 rounded bg-white/5 border border-white/15 text-slate-200 hover:border-[#88bcd6] cursor-pointer transition"
            title={siteDarkMode ? 'Switch to Light Mode' : 'Switch to Stylus Dark Mode'}
            aria-label="Toggle site dark mode"
          >
            {siteDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-sky-300" />}
          </button>
          {compendium ? (
            <Link
              to="/setup"
              className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-white/5 border border-white/15 text-slate-200 text-[11px] font-medium hover:border-[#e40712] transition"
              title={`Imported from ${compendium.meta.sourceUrl}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {compendium.meta.counts.classes} Classes · {compendium.meta.counts.spells} Spells
            </Link>
          ) : (
            <Link
              to="/setup"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#e40712]/20 border border-[#e40712]/60 text-red-200 text-[11px] font-bold uppercase"
            >
              <Database className="w-3 h-3" />
              Import Data Required
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
