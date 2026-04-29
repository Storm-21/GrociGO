import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (phone: string, password: string) =>
    api.post("/auth/login", { phone, password }).then((r) => r.data),
  register: (phone: string, password: string, name: string, role = "customer") =>
    api.post("/auth/register", { phone, password, name, role }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const shopApi = {
  categories: () => api.get("/categories").then((r) => r.data),
  products: (params?: { category_id?: string; q?: string; include_inactive?: boolean }) =>
    api.get("/products", { params }).then((r) => r.data),
  product: (id: string) => api.get(`/products/${id}`).then((r) => r.data),
  shopSettings: () => api.get("/shop-settings").then((r) => r.data),
};

export const orderApi = {
  place: (payload: any) => api.post("/orders", payload).then((r) => r.data),
  mine: () => api.get("/orders").then((r) => r.data),
  all: (status?: string) =>
    api.get("/orders/all", { params: status ? { status } : {} }).then((r) => r.data),
  get: (id: string) => api.get(`/orders/${id}`).then((r) => r.data),
  status: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
  tracking: (id: string) => api.get(`/orders/${id}/tracking`).then((r) => r.data),
  bill: (id: string) => api.get(`/orders/${id}/bill`).then((r) => r.data),
};

export const adminApi = {
  dashboard: () => api.get("/admin/dashboard").then((r) => r.data),
  balanceSheet: (days = 7) =>
    api.get("/admin/balance-sheet", { params: { days } }).then((r) => r.data),
  createProduct: (p: any) => api.post("/products", p).then((r) => r.data),
  updateProduct: (id: string, p: any) => api.put(`/products/${id}`, p).then((r) => r.data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
  toggleActive: (id: string, active: boolean) =>
    api.patch(`/products/${id}/active?active=${active}`).then((r) => r.data),
  updateShop: (s: any) => api.put("/shop-settings", s).then((r) => r.data),
};

export const meApi = {
  update: (data: any) => api.put("/me", data).then((r) => r.data),
};
