import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { AuthShell } from "../components/AuthShell";

const CARD_SHADOW = "0 1px 3px rgba(28,16,8,0.12), 0 0 0 1px rgba(139,94,60,0.12)";

const inputStyle: React.CSSProperties = {
  borderColor: "rgba(139,94,60,0.25)",
  background: "#FFF8F0",
};

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {/* Main form card */}
      <div
        className="rounded-sm overflow-hidden"
        style={{ background: "#FFFDF8", boxShadow: CARD_SHADOW }}
      >
        <div
          className="h-1"
          style={{ background: "linear-gradient(to right, #8B5E3C, #C9853E)" }}
        />
        <div className="p-7">
          <h2 className="font-display text-xl font-semibold text-ink mb-1">Create account</h2>
          <p className="font-ui text-xs text-ink-muted mb-5">
            Start tracking your reading life.
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-sm bg-red-50 border border-red-200 text-red-700 text-sm font-ui">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-ui text-xs text-ink-muted uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                pattern="[a-zA-Z0-9_]+"
                minLength={3}
                maxLength={50}
                className="w-full px-3 py-2.5 rounded-sm border font-ui text-ink text-sm focus:outline-none focus:ring-1 transition-shadow"
                style={inputStyle}
              />
              <p className="mt-1 text-xs font-ui" style={{ color: "#A89070" }}>
                Letters, numbers, underscores only
              </p>
            </div>

            <div>
              <label className="block font-ui text-xs text-ink-muted uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-sm border font-ui text-ink text-sm focus:outline-none focus:ring-1 transition-shadow"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block font-ui text-xs text-ink-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2.5 rounded-sm border font-ui text-ink text-sm focus:outline-none focus:ring-1 transition-shadow"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-sm font-ui text-sm transition-opacity"
              style={{
                background: "#8B5E3C",
                color: "#FFF8F0",
                opacity: loading ? 0.65 : 1,
              }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </div>

      {/* Switch card */}
      <div
        className="rounded-sm py-4 text-center font-ui text-sm text-ink-muted"
        style={{ background: "#FFFDF8", boxShadow: CARD_SHADOW }}
      >
        Already have an account?{" "}
        <Link
          to="/login"
          className="transition-colors"
          style={{ color: "#8B5E3C", fontWeight: 600 }}
        >
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
