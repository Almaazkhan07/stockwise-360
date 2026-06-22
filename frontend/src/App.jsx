import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ChevronDown,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  Users,
  X
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import {
  categoryService,
  expenseService,
  exportService,
  productService,
  reportService,
  saleService,
  userService
} from "./services/api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);
const currentMonthPrefix = () => today().slice(0, 7);
const monthStart = () => `${currentMonthPrefix()}-01`;

const DEFAULT_STOCK = { id: "main", name: "Main Stock", backend: true };
const LOCAL_CATEGORIES = [
  { id: 1, name: "General" },
  { id: 2, name: "Electronics" },
  { id: 3, name: "Accessories" },
  { id: 4, name: "Grocery" }
];

const blankStockData = () => ({
  products: [],
  sales: [],
  expenses: [],
  saleCounter: 1,
  categories: LOCAL_CATEGORIES
});

function storedJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

const stockDataKey = (stockId) => `stockwiseData:${stockId}`;

function initialStockBooks() {
  const customStocks = storedJson("stockwiseStocks", []);
  return [DEFAULT_STOCK, ...customStocks.filter((stock) => stock?.id && stock?.name)];
}

function downloadText(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  saveBlob({ data: blob }, filename);
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function csv(rows) {
  return rows.map((row) => row.map(csvValue).join(",")).join("\n");
}

function localProfitLoss(data, start, end) {
  const inRange = (date) => {
    const value = String(date || "").slice(0, 10);
    return (!start || value >= start) && (!end || value <= end);
  };
  const sales = data.sales.filter((sale) => inRange(sale.createdAt));
  const expenses = data.expenses.filter((expense) => inRange(expense.expenseDate));
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
  const cogs = sales.reduce(
    (sum, sale) => sum + (sale.saleItems || []).reduce((itemSum, item) => itemSum + Number(item.costPrice || 0) * Number(item.quantity || 0), 0),
    0
  );
  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  return {
    revenue,
    cogs,
    expenses: expenseTotal,
    grossProfit: revenue - cogs,
    netProfit: revenue - cogs - expenseTotal,
    salesCount: sales.length
  };
}

function localDashboard(data) {
  const todaySummary = localProfitLoss(data, today(), today());
  const monthSummary = localProfitLoss(data, monthStart(), today());
  const lowStockProducts = data.products.filter((product) => Number(product.stockQuantity || 0) <= Number(product.minimumStock || 0));
  return {
    today: todaySummary,
    month: monthSummary,
    activeProducts: data.products.length,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    recentSales: data.sales.slice(-6).reverse()
  };
}

function saveBlob(response, filename) {
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function downloadExport(request, filename) {
  const response = await request();
  saveBlob(response, filename);
}

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return children;
}

const StockContext = createContext(null);

function StockProvider({ children }) {
  const [stockBooks, setStockBooks] = useState(initialStockBooks);
  const [currentStockId, setCurrentStockId] = useState(() => localStorage.getItem("stockwiseCurrentStock") || "main");
  const [localData, setLocalDataState] = useState(() => storedJson(stockDataKey(localStorage.getItem("stockwiseCurrentStock") || "main"), blankStockData()));

  const currentStock = stockBooks.find((stock) => stock.id === currentStockId) || stockBooks[0] || DEFAULT_STOCK;
  const isBackendStock = Boolean(currentStock.backend);

  const persistStocks = (nextStocks = stockBooks, nextCurrent = currentStockId) => {
    localStorage.setItem("stockwiseStocks", JSON.stringify(nextStocks.filter((stock) => !stock.backend)));
    localStorage.setItem("stockwiseCurrentStock", nextCurrent);
  };

  const readLocalData = (stockId = currentStockId) => storedJson(stockDataKey(stockId), blankStockData());

  const writeLocalData = (nextData, stockId = currentStockId) => {
    localStorage.setItem(stockDataKey(stockId), JSON.stringify(nextData));
    if (stockId === currentStockId) setLocalDataState(nextData);
  };

  const updateLocalData = (updater) => {
    const nextData = typeof updater === "function" ? updater(readLocalData()) : updater;
    writeLocalData(nextData);
    return nextData;
  };

  const selectStock = (stockId) => {
    if (!stockBooks.some((stock) => stock.id === stockId)) return;
    setCurrentStockId(stockId);
    localStorage.setItem("stockwiseCurrentStock", stockId);
    setLocalDataState(storedJson(stockDataKey(stockId), blankStockData()));
  };

  const createStock = (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const id = `stock-${Date.now()}`;
    const nextStocks = [...stockBooks, { id, name: trimmedName, backend: false }];
    setStockBooks(nextStocks);
    setCurrentStockId(id);
    writeLocalData(blankStockData(), id);
    persistStocks(nextStocks, id);
    toast.success("Stock workspace created");
  };

  const deleteStock = (stockId) => {
    if (stockId === "main") return;
    const nextStocks = stockBooks.filter((stock) => stock.id !== stockId);
    setStockBooks(nextStocks);
    localStorage.removeItem(stockDataKey(stockId));
    const nextCurrent = currentStockId === stockId ? "main" : currentStockId;
    setCurrentStockId(nextCurrent);
    setLocalDataState(readLocalData(nextCurrent));
    persistStocks(nextStocks, nextCurrent);
    toast.success("Stock workspace deleted");
  };

  const value = {
    stockBooks,
    currentStock,
    currentStockId,
    isBackendStock,
    localData,
    selectStock,
    createStock,
    deleteStock,
    updateLocalData
  };

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

function useStock() {
  const value = useContext(StockContext);
  if (!value) throw new Error("useStock must be used inside StockProvider");
  return value;
}

function MainLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { stockBooks, currentStockId, currentStock, selectStock } = useStock();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const nav = [
    ["/stocks", "Stocks", Database],
    ["/dashboard", "Dashboard", LayoutDashboard],
    ["/inventory", "Inventory", Package],
    ["/sales", "Sales", ShoppingCart],
    ["/expenses", "Expenses", Receipt],
    ["/reports", "Reports", BarChart3]
  ];

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className={`${open ? "w-64" : "w-16"} flex shrink-0 flex-col bg-ink text-white transition-all`}>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-500">
            <Boxes size={19} />
          </div>
          {open && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">StockWise 360</p>
              <p className="text-xs text-slate-400">Business Manager</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {nav.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex h-10 items-center gap-3 rounded-md px-3 text-sm transition ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {open && <span>{label}</span>}
            </NavLink>
          ))}
          {isAdmin() && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex h-10 items-center gap-3 rounded-md px-3 text-sm transition ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Users size={18} className="shrink-0" />
              {open && <span>Users</span>}
            </NavLink>
          )}
        </nav>
        {open && (
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-mint text-sm font-bold">
                {user?.fullName?.[0] || "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.fullName}</p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white">
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <select
              className="field max-w-[230px]"
              value={currentStockId}
              onChange={(event) => selectStock(event.target.value)}
              aria-label="Select stock workspace"
            >
              {stockBooks.map((stock) => (
                <option key={stock.id} value={stock.id}>{stock.name}</option>
              ))}
            </select>
            <Link to="/stocks" className="btn-secondary whitespace-nowrap"><Plus size={16} /> New stock</Link>
            <div className="hidden items-center gap-2 text-sm text-slate-600 md:flex">
              <span className="max-w-[180px] truncate font-semibold text-slate-900">{currentStock.name}</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{user?.role}</span>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700"
  };
  return (
    <div className="panel p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-3 inline-flex rounded-md px-2 py-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function StocksPage() {
  const { stockBooks, currentStockId, currentStock, selectStock, createStock, deleteStock } = useStock();
  const [name, setName] = useState("");

  const submit = (event) => {
    event.preventDefault();
    createStock(name);
    setName("");
  };

  return (
    <>
      <PageHeader
        title="Stock Workspaces"
        subtitle="Create separate stock books for another item group, shop, counter, or billing setup."
      />
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="panel grid h-fit gap-3 p-4">
          <h2 className="text-base font-bold">Create new stock</h2>
          <input
            className="field"
            placeholder="Example: Mobile Accessories Stock"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <button className="btn-primary"><Plus size={16} /> Create stock workspace</button>
          <p className="text-xs leading-5 text-slate-500">
            Main Stock uses the live Railway MySQL database. Extra workspaces are saved in this browser for separate inventory, sales, expenses, and invoices.
          </p>
        </form>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stockBooks.map((stock) => (
            <div key={stock.id} className="panel flex min-h-[150px] flex-col justify-between p-4">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="truncate text-base font-bold text-slate-950">{stock.name}</h3>
                  {stock.id === currentStockId && <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Selected</span>}
                </div>
                <p className="text-sm text-slate-500">
                  {stock.backend ? "Connected to Railway MySQL backend." : "Separate browser-saved stock workspace."}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={stock.id === currentStockId ? "btn-primary" : "btn-secondary"} onClick={() => selectStock(stock.id)}>
                  {stock.id === currentStockId ? "Current stock" : "Open stock"}
                </button>
                {!stock.backend && (
                  <button className="rounded-md p-2 text-rose-600 hover:bg-rose-50" onClick={() => deleteStock(stock.id)} aria-label={`Delete ${stock.name}`}>
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel mt-5 p-4">
        <h2 className="text-base font-bold">Current workspace</h2>
        <p className="mt-1 text-sm text-slate-500">
          You are working in <strong className="text-slate-800">{currentStock.name}</strong>. Dashboard, Inventory, Sales, Expenses, Billing, and Reports will use this selected stock.
        </p>
      </div>
    </>
  );
}

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "admin", password: "Admin@123" });
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const ok = await login(form);
    setBusy(false);
    if (ok) navigate("/dashboard");
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-[1fr_440px]">
      <section className="hidden bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center lg:block">
        <div className="flex h-full items-end bg-slate-950/45 p-12 text-white">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold">StockWise 360</h1>
            <p className="mt-4 text-lg text-white/85">Inventory, invoices, expenses, and profit reporting in one operational workspace.</p>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center px-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-blue-600 text-white">
              <Package />
            </div>
            <h2 className="text-2xl font-bold text-slate-950">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Default admin: admin / Admin@123</p>
          </div>
          <label className="mb-4 block text-sm font-medium text-slate-700">
            Username
            <input className="field mt-1" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </label>
          <label className="mb-6 block text-sm font-medium text-slate-700">
            Password
            <input className="field mt-1" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
      </section>
    </div>
  );
}

function DashboardPage() {
  const { currentStock, isBackendStock, localData } = useStock();
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!isBackendStock) {
      setData(localDashboard(localData));
      return;
    }
    reportService.getDashboardSummary()
      .then((res) => setData(res.data))
      .catch(() => setData({
        today: { revenue: 0, netProfit: 0, salesCount: 0 },
        month: { revenue: 0, netProfit: 0, expenses: 0 },
        activeProducts: 0,
        lowStockCount: 0,
        lowStockProducts: [],
        recentSales: []
      }));
  }, [isBackendStock, localData]);
  const chart = [
    { name: "Revenue", value: Number(data?.month?.revenue || 0) },
    { name: "Expenses", value: Number(data?.month?.expenses || 0) },
    { name: "Net", value: Number(data?.month?.netProfit || 0) }
  ];
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Current stock, sales, and profitability snapshot." />
      <div className="mb-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Workspace: <strong>{currentStock.name}</strong>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today Revenue" value={money(data?.today?.revenue)} />
        <StatCard label="Month Net Profit" value={money(data?.month?.netProfit)} tone="green" />
        <StatCard label="Active Products" value={data?.activeProducts ?? 0} tone="orange" />
        <StatCard label="Low Stock" value={data?.lowStockCount ?? 0} tone="red" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <div className="panel p-4">
          <h2 className="mb-4 text-base font-bold">Month performance</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold"><AlertTriangle size={18} /> Low stock alerts</h2>
          <div className="space-y-3">
            {(data?.lowStockProducts || []).slice(0, 6).map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-md bg-rose-50 px-3 py-2 text-sm">
                <span className="font-medium text-rose-900">{product.name}</span>
                <span className="text-rose-700">{product.stockQuantity} left</span>
              </div>
            ))}
            {(!data?.lowStockProducts || data.lowStockProducts.length === 0) && <p className="text-sm text-slate-500">No low stock items yet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}

function InventoryPage() {
  const { currentStock, isBackendStock, localData, updateLocalData } = useStock();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", categoryId: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", minimumStock: "", unit: "pcs" });

  const load = () => {
    if (!isBackendStock) {
      setProducts(localData.products || []);
      setCategories(localData.categories || LOCAL_CATEGORIES);
      return;
    }
    productService.getAll().then((res) => setProducts(res.data)).catch(() => setProducts([]));
    categoryService.getAll().then((res) => setCategories(res.data)).catch(() => setCategories([]));
  };
  useEffect(load, [isBackendStock, localData]);

  const resetForm = () => {
    setEditingProduct(null);
    setForm({ name: "", sku: "", categoryId: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", minimumStock: "", unit: "pcs" });
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      categoryId: product.category?.id || "",
      buyingPrice: product.buyingPrice ?? "",
      sellingPrice: product.sellingPrice ?? "",
      stockQuantity: product.stockQuantity ?? "",
      minimumStock: product.minimumStock ?? "",
      unit: product.unit || "pcs"
    });
  };

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      buyingPrice: Number(form.buyingPrice || 0),
      sellingPrice: Number(form.sellingPrice || 0),
      stockQuantity: Number(form.stockQuantity || 0),
      minimumStock: Number(form.minimumStock || 0)
    };
    if (!isBackendStock) {
      const category = categories.find((item) => item.id === payload.categoryId) || null;
      const savedProduct = {
        ...payload,
        id: editingProduct?.id || Date.now(),
        category,
        active: true
      };
      updateLocalData((data) => ({
        ...data,
        products: editingProduct
          ? data.products.map((product) => (product.id === editingProduct.id ? savedProduct : product))
          : [...data.products, savedProduct]
      }));
      toast.success(editingProduct ? "Product updated" : "Product added");
    } else if (editingProduct) {
      await productService.update(editingProduct.id, payload);
      toast.success("Product updated");
    } else {
      await productService.create(payload);
      toast.success("Product added");
    }
    resetForm();
    load();
  };

  const deleteProduct = async (productId) => {
    if (!isBackendStock) {
      updateLocalData((data) => ({ ...data, products: data.products.filter((product) => product.id !== productId) }));
      toast.success("Product deleted");
      return;
    }
    await productService.delete(productId);
    load();
  };

  const exportInventoryCsv = () => {
    if (isBackendStock) return downloadExport(exportService.productsCsv, "inventory.csv");
    const rows = [
      ["SKU", "Product", "Category", "Stock", "Minimum Stock", "Cost Price", "Selling Price"],
      ...products.map((product) => [
        product.sku,
        product.name,
        product.category?.name || "-",
        `${product.stockQuantity} ${product.unit || ""}`,
        product.minimumStock,
        product.buyingPrice,
        product.sellingPrice
      ])
    ];
    downloadText(`${currentStock.name}-inventory.csv`, csv(rows), "text/csv");
  };

  const filtered = products.filter((product) => [product.name, product.sku].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Add products, monitor stock, and track pricing."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={exportInventoryCsv}>Excel</button>
            {isBackendStock && <button className="btn-primary" onClick={() => downloadExport(exportService.productsPdf, "inventory.pdf")}>PDF</button>}
          </div>
        }
      />
      <div className="mb-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Workspace: <strong>{currentStock.name}</strong>
      </div>
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={save} className="panel p-4">
          <h2 className="mb-4 text-base font-bold">{editingProduct ? "Update product" : "Add product"}</h2>
          <div className="grid gap-3">
            <input className="field" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="field" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <select className="field" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">No category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input className="field" type="number" placeholder="Cost" value={form.buyingPrice} onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })} />
              <input className="field" type="number" placeholder="Sale price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
              <input className="field" type="number" placeholder="Stock" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
              <input className="field" type="number" placeholder="Min stock" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} />
            </div>
            <input className="field" placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary"><Plus size={16} /> {editingProduct ? "Save update" : "Add product"}</button>
              {editingProduct && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
            </div>
          </div>
        </form>
        <div className="panel overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-200 p-4">
            <Search size={18} className="text-slate-400" />
            <input className="w-full outline-none" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3"><p className="font-semibold">{product.name}</p><p className="text-xs text-slate-500">{product.sku}</p></td>
                    <td className="px-4 py-3">{product.category?.name || "-"}</td>
                    <td className="px-4 py-3">{product.stockQuantity} {product.unit}</td>
                    <td className="px-4 py-3">{money(product.buyingPrice)}</td>
                    <td className="px-4 py-3">{money(product.sellingPrice)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                      <button className="rounded-md p-2 text-blue-700 hover:bg-blue-50" onClick={() => startEdit(product)} aria-label={`Edit ${product.name}`}>
                        <Pencil size={16} />
                      </button>
                      <button className="rounded-md p-2 text-rose-600 hover:bg-rose-50" onClick={() => deleteProduct(product.id)} aria-label={`Delete ${product.name}`}>
                        <Trash2 size={16} />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function SalesPage() {
  const { currentStock, isBackendStock, localData, updateLocalData } = useStock();
  const [sales, setSales] = useState([]);
  const load = () => {
    if (!isBackendStock) {
      setSales(localData.sales || []);
      return;
    }
    saleService.getAll().then((res) => setSales(res.data)).catch(() => setSales([]));
  };
  useEffect(load, [isBackendStock, localData]);

  const savePayment = async (sale, amountPaid) => {
    if (!isBackendStock) {
      const paid = Number(amountPaid || 0);
      updateLocalData((data) => ({
        ...data,
        sales: data.sales.map((item) => item.id === sale.id ? {
          ...item,
          amountPaid: paid,
          balanceDue: Math.max(0, Number(item.totalAmount || 0) - paid),
          paymentStatus: paid >= Number(item.totalAmount || 0) ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING"
        } : item)
      }));
      toast.success("Payment updated");
      return;
    }
    await saleService.updatePayment(sale.id, { amountPaid: String(Number(amountPaid || 0)), paymentMethod: "CASH" });
    toast.success("Payment updated");
    load();
  };

  const exportSalesCsv = () => {
    if (isBackendStock) return downloadExport(exportService.salesCsv, "sales.csv");
    const rows = [
      ["Invoice", "Customer", "Items", "Total", "Paid", "Balance", "Status", "Date"],
      ...sales.map((sale) => [
        sale.invoiceNumber,
        sale.customerName,
        (sale.saleItems || []).map((item) => `${item.product?.name || "Item"} x ${item.quantity}`).join("; "),
        sale.totalAmount,
        sale.amountPaid,
        sale.balanceDue,
        sale.paymentStatus,
        String(sale.createdAt || "").slice(0, 10)
      ])
    ];
    downloadText(`${currentStock.name}-sales.csv`, csv(rows), "text/csv");
  };

  const downloadLocalInvoice = (sale) => {
    const rows = (sale.saleItems || []).map((item) => `
      <tr><td>${item.product?.name || "Item"}</td><td>${item.quantity}</td><td>${money(item.unitPrice)}</td><td>${money(item.totalPrice)}</td></tr>
    `).join("");
    downloadText(`${sale.invoiceNumber}.html`, `<!doctype html>
      <html><head><title>${sale.invoiceNumber}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#172033}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}.total{margin-top:20px;max-width:320px;margin-left:auto}.total div{display:flex;justify-content:space-between;padding:5px 0}</style></head>
      <body><h1>StockWise 360</h1><p><strong>${currentStock.name}</strong> Invoice ${sale.invoiceNumber}</p><p><strong>Customer:</strong> ${sale.customerName}</p>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="total"><div><span>Total</span><strong>${money(sale.totalAmount)}</strong></div><div><span>Paid</span><strong>${money(sale.amountPaid)}</strong></div><div><span>Balance</span><strong>${money(sale.balanceDue)}</strong></div><div><span>Status</span><strong>${sale.paymentStatus}</strong></div></div></body></html>`, "text/html");
  };

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Invoices and payment status."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={exportSalesCsv}>Excel</button>
            {isBackendStock && <button className="btn-secondary" onClick={() => downloadExport(exportService.salesPdf, "sales.pdf")}>PDF</button>}
            <Link className="btn-primary" to="/sales/new"><Plus size={16} /> New sale</Link>
          </div>
        }
      />
      <div className="mb-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Workspace: <strong>{currentStock.name}</strong>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Items bought</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment edit</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Download</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-4 py-3 font-semibold">{sale.invoiceNumber}</td>
                <td className="px-4 py-3">{sale.customerName}</td>
                <td className="px-4 py-3">
                  <div className="grid min-w-[220px] gap-1 text-xs text-slate-600">
                    {(sale.saleItems || []).map((item) => (
                      <div key={item.id}>
                        <strong className="text-slate-800">{item.product?.name || "Item"}</strong> x {item.quantity} <span>({money(item.totalPrice)})</span>
                      </div>
                    ))}
                    {(!sale.saleItems || sale.saleItems.length === 0) && <span>No items listed</span>}
                  </div>
                </td>
                <td className="px-4 py-3">{money(sale.totalAmount)}</td>
                <td className="px-4 py-3">
                  <div className="flex min-w-[220px] gap-2">
                    <input id={`pay-${sale.id}`} className="field max-w-[110px] py-1" type="number" defaultValue={Number(sale.amountPaid || 0)} />
                    <button className="btn-secondary px-3 py-1" onClick={() => savePayment(sale, document.getElementById(`pay-${sale.id}`).value)}>Save</button>
                    <button className="btn-primary px-3 py-1" onClick={() => savePayment(sale, sale.totalAmount)}>Paid</button>
                  </div>
                </td>
                <td className="px-4 py-3">{money(sale.balanceDue)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{sale.paymentStatus}</span></td>
                <td className="px-4 py-3">{sale.createdAt?.slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <button className="btn-secondary px-3 py-1" onClick={() => isBackendStock ? downloadExport(() => exportService.invoicePdf(sale.id), `${sale.invoiceNumber}.pdf`) : downloadLocalInvoice(sale)}>
                    {isBackendStock ? "Invoice PDF" : "Invoice HTML"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function NewSalePage() {
  const navigate = useNavigate();
  const { currentStock, isBackendStock, localData, updateLocalData } = useStock();
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!isBackendStock) {
      setProducts(localData.products || []);
      return;
    }
    productService.getAll().then((res) => setProducts(res.data)).catch(() => setProducts([]));
  }, [isBackendStock, localData]);

  const addItem = (productId) => {
    const product = products.find((item) => item.id === Number(productId));
    if (!product) return;
    setItems([...items, { productId: product.id, name: product.name, quantity: 1, unitPrice: product.sellingPrice }]);
  };
  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0);
  const paid = paymentStatus === "PAID" ? subtotal : paymentStatus === "PENDING" ? 0 : Number(amountPaid || 0);
  const balance = Math.max(0, subtotal - paid);
  const save = async () => {
    if (paymentStatus === "PARTIAL" && paid <= 0) {
      toast.error("Enter amount paid for a partial invoice");
      return;
    }
    if (!isBackendStock) {
      const insufficientItem = items.find((item) => {
        const product = localData.products.find((row) => row.id === item.productId);
        return !product || Number(product.stockQuantity || 0) < Number(item.quantity || 0);
      });
      if (insufficientItem) {
        toast.error(`Insufficient stock for ${insufficientItem.name}`);
        return;
      }
      const saleItems = items.map((item, index) => {
        const product = localData.products.find((row) => row.id === item.productId);
        return {
          id: Date.now() + index,
          product: { id: product.id, name: product.name, sku: product.sku },
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          costPrice: Number(product.buyingPrice || 0),
          totalPrice: Number(item.unitPrice || 0) * Number(item.quantity || 0)
        };
      });
      updateLocalData((data) => {
        const invoiceNumber = `INV-${String(data.saleCounter || 1).padStart(4, "0")}`;
        const sale = {
          id: Date.now(),
          invoiceNumber,
          customerName,
          saleItems,
          totalAmount: subtotal,
          amountPaid: paid,
          balanceDue: balance,
          paymentStatus: paid >= subtotal ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING",
          paymentMethod: "CASH",
          createdAt: new Date().toISOString()
        };
        return {
          ...data,
          saleCounter: Number(data.saleCounter || 1) + 1,
          products: data.products.map((product) => {
            const item = items.find((row) => row.productId === product.id);
            return item ? { ...product, stockQuantity: Number(product.stockQuantity || 0) - Number(item.quantity || 0) } : product;
          }),
          sales: [sale, ...data.sales]
        };
      });
    } else {
      await saleService.create({ customerName, amountPaid: paid, paymentMethod: "CASH", items });
    }
    toast.success("Invoice created");
    navigate("/sales");
  };

  return (
    <>
      <PageHeader title="New Sale" subtitle="Build an invoice and deduct stock automatically." />
      <div className="mb-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Workspace: <strong>{currentStock.name}</strong>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="panel p-4">
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <input className="field" placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <select className="field" onChange={(e) => addItem(e.target.value)} value="">
              <option value="">Add product</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} - {money(product.sellingPrice)}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[1fr_90px_120px_44px]" key={`${item.productId}-${index}`}>
                <div className="font-semibold">{item.name}</div>
                <input className="field" type="number" value={item.quantity} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, quantity: Number(e.target.value) } : row))} />
                <input className="field" type="number" value={item.unitPrice} onChange={(e) => setItems(items.map((row, i) => i === index ? { ...row, unitPrice: Number(e.target.value) } : row))} />
                <button className="rounded-md p-2 text-rose-600 hover:bg-rose-50" onClick={() => setItems(items.filter((_, i) => i !== index))}><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="panel h-fit p-4">
          <h2 className="mb-4 text-base font-bold">Invoice total</h2>
          <div className="mb-4 flex items-center justify-between text-lg font-bold"><span>Subtotal</span><span>{money(subtotal)}</span></div>
          <select
            className="field mb-4"
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              if (e.target.value === "PENDING") setAmountPaid("");
              if (e.target.value === "PAID") setAmountPaid(String(subtotal));
            }}
          >
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
          <input
            className="field mb-4"
            type="number"
            placeholder="Amount paid"
            value={paymentStatus === "PAID" ? subtotal : paymentStatus === "PENDING" ? 0 : amountPaid}
            readOnly={paymentStatus !== "PARTIAL"}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
          <div className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Balance due</span><strong>{money(balance)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><strong>{paymentStatus}</strong></div>
          </div>
          <button className="btn-primary w-full" onClick={save} disabled={!items.length}>Create invoice</button>
        </div>
      </div>
    </>
  );
}

function ExpensesPage() {
  const { currentStock, isBackendStock, localData, updateLocalData } = useStock();
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ title: "", amount: "", category: "OTHER", expenseDate: today(), description: "" });
  const load = () => {
    if (!isBackendStock) {
      setExpenses(localData.expenses || []);
      return;
    }
    expenseService.getAll().then((res) => setExpenses(res.data)).catch(() => setExpenses([]));
  };
  useEffect(load, [isBackendStock, localData]);
  const save = async (event) => {
    event.preventDefault();
    if (!isBackendStock) {
      updateLocalData((data) => ({
        ...data,
        expenses: [{ ...form, id: Date.now(), amount: Number(form.amount || 0) }, ...data.expenses]
      }));
    } else {
      await expenseService.create({ ...form, amount: Number(form.amount || 0) });
    }
    toast.success("Expense added");
    setForm({ title: "", amount: "", category: "OTHER", expenseDate: today(), description: "" });
    load();
  };
  return (
    <>
      <PageHeader title="Expenses" subtitle="Track operating costs for profit and loss." />
      <div className="mb-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Workspace: <strong>{currentStock.name}</strong>
      </div>
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={save} className="panel grid gap-3 p-4">
          <input className="field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="field" type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {["RENT", "ELECTRICITY", "SALARY", "PURCHASE", "TRANSPORT", "MAINTENANCE", "OTHER"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className="field" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
          <textarea className="field" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn-primary"><Plus size={16} /> Add expense</button>
        </form>
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((expense) => <tr key={expense.id}><td className="px-4 py-3 font-semibold">{expense.title}</td><td className="px-4 py-3">{expense.category}</td><td className="px-4 py-3">{money(expense.amount)}</td><td className="px-4 py-3">{expense.expenseDate}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ReportsPage() {
  const { currentStock, isBackendStock, localData } = useStock();
  const [range, setRange] = useState({ start: today().slice(0, 8) + "01", end: today() });
  const [summary, setSummary] = useState(null);
  const load = () => {
    if (!isBackendStock) {
      setSummary(localProfitLoss(localData, range.start, range.end));
      return;
    }
    reportService.getProfitLoss(range.start, range.end).then((res) => setSummary(res.data)).catch(() => setSummary(null));
  };
  useEffect(load, [isBackendStock, localData]);
  const exportReportCsv = () => {
    if (isBackendStock) return downloadExport(() => exportService.profitLossCsv(range.start, range.end), "profit-loss.csv");
    const report = localProfitLoss(localData, range.start, range.end);
    downloadText(`${currentStock.name}-profit-loss.csv`, csv([
      ["Metric", "Value"],
      ["Revenue", report.revenue],
      ["COGS", report.cogs],
      ["Expenses", report.expenses],
      ["Gross Profit", report.grossProfit],
      ["Net Profit", report.netProfit],
      ["Sales Count", report.salesCount]
    ]), "text/csv");
  };
  const chart = [
    { name: "Revenue", value: Number(summary?.revenue || 0) },
    { name: "COGS", value: Number(summary?.cogs || 0) },
    { name: "Expenses", value: Number(summary?.expenses || 0) },
    { name: "Net", value: Number(summary?.netProfit || 0) }
  ];
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Profit and loss by date range."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={exportReportCsv}>Excel</button>
            {isBackendStock && <button className="btn-primary" onClick={() => downloadExport(() => exportService.profitLossPdf(range.start, range.end), "profit-loss.pdf")}>PDF</button>}
          </div>
        }
      />
      <div className="mb-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Workspace: <strong>{currentStock.name}</strong>
      </div>
      <div className="panel mb-5 flex flex-wrap gap-3 p-4">
        <input className="field max-w-[180px]" type="date" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} />
        <input className="field max-w-[180px]" type="date" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} />
        <button className="btn-primary" onClick={load}>Run report</button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Revenue" value={money(summary?.revenue)} />
        <StatCard label="COGS" value={money(summary?.cogs)} tone="orange" />
        <StatCard label="Expenses" value={money(summary?.expenses)} tone="red" />
        <StatCard label="Net Profit" value={money(summary?.netProfit)} tone="green" />
      </div>
      <div className="panel mt-5 h-80 p-4">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value) => money(value)} /><Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
      </div>
    </>
  );
}

function UsersPage() {
  const [users, setUsers] = useState([]);
  useEffect(() => { userService.getAll().then((res) => setUsers(res.data)).catch(() => setUsers([])); }, []);
  return (
    <>
      <PageHeader title="Users" subtitle="Admin view of staff accounts." />
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Active</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user.id}><td className="px-4 py-3 font-semibold">{user.fullName}</td><td className="px-4 py-3">{user.username}</td><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3">{user.role}</td><td className="px-4 py-3">{user.active ? "Yes" : "No"}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><StockProvider><MainLayout /></StockProvider></PrivateRoute>}>
        <Route index element={<Navigate to="/stocks" replace />} />
        <Route path="stocks" element={<StocksPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="sales/new" element={<NewSalePage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<PrivateRoute adminOnly><UsersPage /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
