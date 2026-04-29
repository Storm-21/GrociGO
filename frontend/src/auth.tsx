import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "./api";

type User = {
  id: string;
  phone: string;
  name: string;
  role: "customer" | "staff" | "admin";
  staff_id?: string;
  addresses?: any[];
  preferences?: any;
};

type Ctx = {
  user: User | null | undefined;
  staffLogin: (staff_id: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<Ctx>({} as Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) { setUser(null); return; }
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        await AsyncStorage.removeItem("token");
        setUser(null);
      }
    })();
  }, []);

  const staffLogin = async (staff_id: string, password: string) => {
    const res = await authApi.staffLogin(staff_id, password);
    await AsyncStorage.setItem("token", res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, staffLogin, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
