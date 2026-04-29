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
  // Customer Google login
  googleCallback: (session_id: string) =>
    api.post("/auth/google-callback", { session_id }).then((r) => r.data),
  // Staff/Admin login (ID + password)
  staffLogin: (staff_id: string, password: string) =>
    api.post("/auth/staff-login", { staff_id, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
};

export const shopApi = {
  categories: (includeHidden = false) =>
    api.get("/categories", { params: { include_hidden: includeHidden } }).then((r) => r.data),
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
  exportOrdersCsv: (days = 30) => `${BASE}/api/admin/orders/export?days=${days}`,
  // Razorpay
  rpCreate: (order_id: string) => api.post("/payments/razorpay/create", { order_id }).then((r) => r.data),
  rpVerify: (payload: any) => api.post("/payments/razorpay/verify", payload).then((r) => r.data),
  // Categories
  createCategory: (c: any) => api.post("/categories", c).then((r) => r.data),
  updateCategory: (id: string, c: any) => api.put(`/categories/${id}`, c).then((r) => r.data),
  deleteCategory: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
  // Staff
  createStaff: (data: { name: string; phone?: string }) =>
    api.post("/admin/staff", data).then((r) => r.data),
  listStaff: () => api.get("/admin/staff").then((r) => r.data),
  deleteStaff: (id: string) => api.delete(`/admin/staff/${id}`).then((r) => r.data),
};
