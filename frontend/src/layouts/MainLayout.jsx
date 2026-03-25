import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

export default function MainLayout() {
  const [hasToken, setHasToken] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem("accessToken")));
  }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    setHasToken(false);
    navigate("/login", { replace: true });
  }

  const isOnLogin = location.pathname.startsWith("/login");
  const searchParams = new URLSearchParams(location.search);
  const isRegisterMode = searchParams.get("mode") === "register";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-semibold text-white">
              WL
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-900">
                Wualt Leads
              </div>
              <p className="text-xs text-slate-500">Lightweight lead manager</p>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {hasToken ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (isOnLogin && isRegisterMode) {
                    // Currently on create-account view: go back to plain login
                    navigate("/login");
                  } else {
                    // From anywhere else, go to create-account view
                    navigate("/login?mode=register");
                  }
                }}
                className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
              >
                {isOnLogin && isRegisterMode ? "Log in" : "Sign in"}
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
