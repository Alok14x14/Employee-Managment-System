import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    const refreshSession = useCallback(async () => {
        const storedToken = localStorage.getItem("token");
        if (!storedToken) {
            setUser(null);
            setToken(null);
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get("/auth/session");
            setUser(data.user);
        } catch {
            // Token is invalid, clear it
            localStorage.removeItem("token");
            setUser(null);
            setToken(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSession();
    }, [refreshSession]);

    const login = useCallback(async (email, password, role_type) => {
        const { data } = await api.post("/auth/login", { email, password, role_type });
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(async () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    }, []);

    const updateToken = useCallback((newToken, updatedUser) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        if (updatedUser) {
            setUser(updatedUser);
        } else {
            setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
        }
    }, []);

    const value = useMemo(
        () => ({ user, token, loading, login, logout, refreshSession, updateToken }),
        [user, token, loading, login, logout, refreshSession, updateToken]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}