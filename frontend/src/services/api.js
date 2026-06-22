import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

export const categoryService = {
  getAll: () => api.get("/categories"),
  create: (data) => api.post("/categories", data)
};

export const productService = {
  getAll: () => api.get("/products"),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get("/products/low-stock"),
  search: (keyword) => api.get(`/products/search?keyword=${encodeURIComponent(keyword)}`)
};

export const saleService = {
  getAll: () => api.get("/sales"),
  create: (data) => api.post("/sales", data),
  updatePayment: (id, data) => api.patch(`/sales/${id}/payment`, data),
  getPending: () => api.get("/sales/pending"),
  getRecent: () => api.get("/sales/recent")
};

export const expenseService = {
  getAll: () => api.get("/expenses"),
  create: (data) => api.post("/expenses", data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`)
};

export const reportService = {
  getDashboardSummary: () => api.get("/reports/dashboard"),
  getProfitLoss: (start, end) => api.get(`/reports/profit-loss?start=${start}&end=${end}`),
  getTopProducts: (start, end) => api.get(`/reports/top-products?start=${start}&end=${end}`)
};

export const userService = {
  getAll: () => api.get("/users")
};

export const exportService = {
  productsCsv: () => api.get("/exports/products.csv", { responseType: "blob" }),
  productsPdf: () => api.get("/exports/products.pdf", { responseType: "blob" }),
  salesCsv: () => api.get("/exports/sales.csv", { responseType: "blob" }),
  salesPdf: () => api.get("/exports/sales.pdf", { responseType: "blob" }),
  profitLossCsv: (start, end) => api.get(`/exports/reports/profit-loss.csv?start=${start}&end=${end}`, { responseType: "blob" }),
  profitLossPdf: (start, end) => api.get(`/exports/reports/profit-loss.pdf?start=${start}&end=${end}`, { responseType: "blob" }),
  invoicePdf: (id) => api.get(`/exports/invoice/${id}.pdf`, { responseType: "blob" }),
  invoiceHtml: (id) => api.get(`/exports/invoice/${id}.html`, { responseType: "blob" })
};
