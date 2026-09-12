"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, bootstrapSession, setAccessToken } from "@/lib/api-client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first mount, exchange the HTTP-only refresh cookie for an access token.
  useEffect(() => {
    let active = true;
    bootstrapSession()
      .then((data) => active && setUser(data.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await api("/auth/login", { method: "POST", body: credentials, retry: false });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api("/auth/register", { method: "POST", body: payload, retry: false });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST", retry: false });
    } finally {
      setAccessToken(null);
      setUser(null);
      router.replace("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
