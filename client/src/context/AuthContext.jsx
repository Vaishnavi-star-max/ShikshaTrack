import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('st_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('st_token') || null);

  function login(userData, jwt) {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('st_user', JSON.stringify(userData));
    localStorage.setItem('st_token', jwt);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('st_user');
    localStorage.removeItem('st_token');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
