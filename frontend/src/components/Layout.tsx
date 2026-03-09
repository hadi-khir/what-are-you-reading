import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { SearchModal } from "./SearchModal";
import type { UserBook } from "../types";

interface LayoutProps {
  children: React.ReactNode;
  onBookAdded?: (userBook: UserBook) => void;
}

export function Layout({ children, onBookAdded }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentYear = new Date().getFullYear();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "font-ui text-sm transition-colors duration-150 pb-0.5",
      isActive
        ? "text-ink border-b border-wood"
        : "text-ink-muted hover:text-ink border-b border-transparent",
    ].join(" ");

  return (
    <div className="min-h-screen" style={{ background: "#F5EDD6" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "rgba(245,237,214,0.95)",
          backdropFilter: "blur(8px)",
          borderColor: "rgba(139,94,60,0.2)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link
            to="/"
            className="font-display font-semibold text-ink hover:text-wood transition-colors flex-shrink-0"
            style={{ fontSize: 20 }}
          >
            Bookshelf
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-4 min-w-0">
            {user && (
              <NavLink to={`/profile/${user.username}`} className={navLinkClass}>
                My Shelf
              </NavLink>
            )}
            <NavLink to="/feed" className={navLinkClass}>
              Feed
            </NavLink>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-ui transition-all duration-150"
              style={{ background: "#8B5E3C", color: "#FFF8F0" }}
            >
              <span>+</span>
              <span className="hidden sm:inline">Add book</span>
            </button>
            <button
              onClick={handleLogout}
              className="hidden sm:block text-ink-muted hover:text-ink text-xs font-ui transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>

      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onAdded={(ub) => {
            onBookAdded?.(ub);
            setShowSearch(false);
          }}
          currentYear={currentYear}
        />
      )}
    </div>
  );
}
