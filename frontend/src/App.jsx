import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ChevronDown,
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

function MainLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const nav = [
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
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{user?.fullName}</span>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{user?.role}</span>
            <ChevronDown size={16} />
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
  const [data, setData] = useState(null);
  useEffect(() => {
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
  }, []);
  const chart = [
    { name: "Revenue", value: Number(data?.month?.revenue || 0) },
    { name: "Expenses", value: Number(data?.month?.expenses || 0) },
    { name: "Net", value: Number(data?.month?.netProfit || 0) }
  ];
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Current stock, sales, and profitability snapshot." />
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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", categoryId: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", minimumStock: "", unit: "pcs" });

  const load = () => {
    productService.getAll().then((res) => setProducts(res.data)).catch(() => setProducts([]));
    categoryService.getAll().then((res) => setCategories(res.data)).catch(() => setCategories([]));
  };
  useEffect(load, []);

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
    if (editingProduct) {
      await productService.update(editingProduct.id, payload);
      toast.success("Product updated");
    } else {
      await productService.create(payload);
      toast.success("Product added");
    }
    resetForm();
    load();
  };

  const filtered = products.filter((product) => [product.name, product.sku].join(" ").toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Add products, monitor stock, and track pricing."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => downloadExport(exportService.productsCsv, "inventory.csv")}>Excel</button>
            <button className="btn-primary" onClick={() => downloadExport(exportService.productsPdf, "inventory.pdf")}>PDF</button>
          </div>
        }
      />
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
                      <button className="rounded-md p-2 text-rose-600 hover:bg-rose-50" onClick={() => productService.delete(product.id).then(load)} aria-label={`Delete ${product.name}`}>
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
  const [sales, setSales] = useState([]);
  const load = () => saleService.getAll().then((res) => setSales(res.data)).catch(() => setSales([]));
  useEffect(load, []);

  const savePayment = async (sale, amountPaid) => {
    await saleService.updatePayment(sale.id, { amountPaid: String(Number(amountPaid || 0)), paymentMethod: "CASH" });
    toast.success("Payment updated");
    load();
  };

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Invoices and payment status."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => downloadExport(exportService.salesCsv, "sales.csv")}>Excel</button>
            <button className="btn-secondary" onClick={() => downloadExport(exportService.salesPdf, "sales.pdf")}>PDF</button>
            <Link className="btn-primary" to="/sales/new"><Plus size={16} /> New sale</Link>
          </div>
        }
      />
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
                  <button className="btn-secondary px-3 py-1" onClick={() => downloadExport(() => exportService.invoicePdf(sale.id), `${sale.invoiceNumber}.pdf`)}>Invoice PDF</button>
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
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [items, setItems] = useState([]);
  useEffect(() => { productService.getAll().then((res) => setProducts(res.data)).catch(() => setProducts([])); }, []);

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
    await saleService.create({ customerName, amountPaid: paid, paymentMethod: "CASH", items });
    toast.success("Invoice created");
    navigate("/sales");
  };

  return (
    <>
      <PageHeader title="New Sale" subtitle="Build an invoice and deduct stock automatically." />
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
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ title: "", amount: "", category: "OTHER", expenseDate: today(), description: "" });
  const load = () => expenseService.getAll().then((res) => setExpenses(res.data)).catch(() => setExpenses([]));
  useEffect(load, []);
  const save = async (event) => {
    event.preventDefault();
    await expenseService.create({ ...form, amount: Number(form.amount || 0) });
    toast.success("Expense added");
    setForm({ title: "", amount: "", category: "OTHER", expenseDate: today(), description: "" });
    load();
  };
  return (
    <>
      <PageHeader title="Expenses" subtitle="Track operating costs for profit and loss." />
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
  const [range, setRange] = useState({ start: today().slice(0, 8) + "01", end: today() });
  const [summary, setSummary] = useState(null);
  const load = () => reportService.getProfitLoss(range.start, range.end).then((res) => setSummary(res.data)).catch(() => setSummary(null));
  useEffect(load, []);
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
            <button className="btn-secondary" onClick={() => downloadExport(() => exportService.profitLossCsv(range.start, range.end), "profit-loss.csv")}>Excel</button>
            <button className="btn-primary" onClick={() => downloadExport(() => exportService.profitLossPdf(range.start, range.end), "profit-loss.pdf")}>PDF</button>
          </div>
        }
      />
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
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
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
