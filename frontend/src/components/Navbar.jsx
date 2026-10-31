import React from "react";
import { Github, Headphones, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navClass = ({ isActive }) =>
  `relative px-1 py-2 text-sm font-medium transition ${
    isActive ? "text-primary" : "text-secondary hover:text-primary"
  }`;


function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-base/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <div className="glow-cyan rounded-2xl border border-cyan/20 bg-cyan/10 p-2 text-cyan">
            <Headphones size={20} />
          </div>
          <div>
            <div className="font-syne text-2xl font-bold tracking-[0.08em] text-primary">ALM</div>
            <div className="text-xs uppercase tracking-[0.22em] text-secondary">Audio Language Model</div>
          </div>
        </NavLink>

        <nav className="flex items-center gap-6">
          <NavLink to="/" className={navClass}>
            {({ isActive }) => (
              <span className="relative">
                Analyze
                {isActive ? <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-cyan" /> : null}
              </span>
            )}
          </NavLink>
          <NavLink to="/history" className={navClass}>
            {({ isActive }) => (
              <span className="relative">
                History
                {isActive ? <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-cyan" /> : null}
              </span>
            )}
          </NavLink>
          <span className="hidden max-w-40 truncate text-xs text-secondary sm:block" title={user.email}>
            {user.email}
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-secondary transition hover:text-primary"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-secondary transition hover:scale-[1.02] hover:text-primary"
            aria-label="GitHub"
          >
            <Github size={18} />
          </a>
        </nav>
      </div>
    </header>
  );
}


export default Navbar;
