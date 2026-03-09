import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Feed } from "./pages/Feed";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { Register } from "./pages/Register";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RedirectToOwnProfile() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/profile/${user.username}`} replace />;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <Login />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <Register />
          </GuestOnly>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <RedirectToOwnProfile />
          </RequireAuth>
        }
      />
      <Route
        path="/feed"
        element={
          <RequireAuth>
            <Feed />
          </RequireAuth>
        }
      />
      <Route
        path="/profile/:username"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
