import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CartItem = {
  product_id: string;
  name: string;
  image: string;
  unit: string;
  price: number;
  discount_pct: number;
  quantity: number;
};

type Ctx = {
  items: CartItem[];
  add: (p: any) => void;
  remove: (pid: string) => void;
  setQty: (pid: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<Ctx>({} as Ctx);
const KEY = "cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = (p: any) => {
    setItems((cur) => {
      const ex = cur.find((c) => c.product_id === p.id);
      if (ex) return cur.map((c) => (c.product_id === p.id ? { ...c, quantity: c.quantity + 1 } : c));
      return [
        ...cur,
        {
          product_id: p.id,
          name: p.name,
          image: p.image,
          unit: p.unit,
          price: p.price,
          discount_pct: p.discount_pct || 0,
          quantity: 1,
        },
      ];
    });
  };
  const remove = (pid: string) => setItems((cur) => cur.filter((c) => c.product_id !== pid));
  const setQty = (pid: string, qty: number) =>
    setItems((cur) =>
      qty <= 0 ? cur.filter((c) => c.product_id !== pid) : cur.map((c) => (c.product_id === pid ? { ...c, quantity: qty } : c))
    );
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * (1 - i.discount_pct / 100) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
