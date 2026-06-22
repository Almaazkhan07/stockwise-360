import { createServer } from "node:http";

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>StockWise 360</title>
  <style>
    *{box-sizing:border-box}body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f6fa;color:#172033}button,input,select{font:inherit}
    .login{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) 430px;background:white}.hero{background:linear-gradient(rgba(15,23,42,.35),rgba(15,23,42,.72)),url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80') center/cover;color:white;display:flex;align-items:end;padding:56px}.hero h1{font-size:56px;margin:0}.hero p{font-size:18px;max-width:620px;color:#e5e7eb}.login form{display:flex;flex-direction:column;justify-content:center;padding:48px;gap:14px}
    .app{display:grid;grid-template-columns:248px minmax(0,1fr);min-height:100vh}.side{position:sticky;top:0;height:100vh;background:#172033;color:white;padding:18px 12px;display:flex;flex-direction:column}.brand{font-size:20px;font-weight:800;padding:10px 12px 22px}.nav{display:grid;gap:6px}.nav button{background:transparent;color:#cbd5e1;text-align:left;border:0;border-radius:6px;padding:11px 12px;cursor:pointer}.nav button.active,.nav button:hover{background:#2563eb;color:white}.main{min-width:0}.top{height:64px;background:white;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 22px}.content{width:min(100%,1440px);margin:0 auto;padding:22px}.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:18px}.page-head h1{margin:0;font-size:26px}.page-head p{margin:5px 0 0;color:#64748b}.actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
    .field{width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:10px 12px;background:#fff;min-height:40px}.btn{border:0;border-radius:6px;background:#2563eb;color:white;padding:10px 14px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap}.btn:hover{background:#1d4ed8}.btn.secondary{background:white;color:#334155;border:1px solid #cbd5e1}.btn.secondary:hover{background:#f8fafc}.btn.small{padding:7px 10px;font-size:12px}.btn.green{background:#0f766e}.btn.green:hover{background:#115e59}.btn.dark{background:#172033}.btn.dark:hover{background:#0f172a}
    .cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.card,.panel{background:white;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 1px 2px rgba(15,23,42,.04)}.card{padding:16px}.card span{display:block;color:#64748b;font-size:13px}.card strong{display:inline-block;margin-top:10px;font-size:24px}.panel{padding:16px}.panel h3{margin:0 0 14px}.workspace{display:grid;grid-template-columns:380px minmax(0,1fr);gap:18px;align-items:start}.workspace.wide{grid-template-columns:minmax(0,1fr)}.form{display:grid;gap:10px}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #e2e8f0;padding:12px 14px;background:#fff}.toolbar .field{max-width:340px}.table-wrap{overflow:auto;max-height:calc(100vh - 250px)}table{width:100%;border-collapse:collapse;background:white;min-width:900px}th,td{padding:11px 12px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px;vertical-align:middle}th{position:sticky;top:0;z-index:1;font-size:12px;color:#64748b;text-transform:uppercase;background:#f8fafc}.num{text-align:right}.muted{color:#64748b}.pill{background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:700}.pill.paid{background:#dcfce7;color:#166534}.pill.partial{background:#fef3c7;color:#92400e}.pill.pending{background:#fee2e2;color:#991b1b}.error{color:#be123c;font-size:14px}.mobile-list{display:none}.mobile-card{background:white;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:10px}.mobile-card strong{display:block;margin-bottom:4px}.mobile-row{display:flex;justify-content:space-between;gap:12px;padding:4px 0;color:#475569}.sold-items{display:grid;gap:4px;min-width:220px}.sold-item{font-size:12px;color:#334155;line-height:1.35}.sold-item b{color:#0f172a}.invoice-item{display:grid;grid-template-columns:minmax(0,1fr) 74px 88px 34px;gap:8px;align-items:center;border:1px solid #e2e8f0;border-radius:6px;padding:8px}.invoice-total{border-top:1px solid #e2e8f0;margin-top:6px;padding-top:10px;display:grid;gap:7px}.invoice-total div{display:flex;justify-content:space-between;gap:12px}.invoice-total .grand{font-size:18px;font-weight:800;color:#0f172a}.payment-box{display:flex;gap:8px;align-items:center;min-width:260px}.payment-box .field{min-width:100px;padding:7px 9px;min-height:34px}.chart{height:220px;display:grid;align-items:end;grid-template-columns:repeat(4,1fr);gap:18px;border-left:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:20px 20px 0}.bar{display:flex;flex-direction:column;align-items:center;gap:8px;justify-content:flex-end;height:100%}.bar i{display:block;width:56px;border-radius:6px 6px 0 0;background:#2563eb;min-height:6px}.bar span{font-size:12px;color:#64748b;text-align:center}
    @media(max-width:1100px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.workspace{grid-template-columns:1fr}.table-wrap{max-height:none}}
    @media(max-width:760px){.login{grid-template-columns:1fr}.hero{display:none}.login form{padding:28px}.app{grid-template-columns:1fr}.side{position:static;height:auto}.nav{grid-template-columns:repeat(3,1fr)}.nav button{text-align:center;padding:10px 6px}.content{padding:14px}.top{height:auto;min-height:58px;padding:12px 14px}.page-head{display:block}.actions{justify-content:flex-start;margin-top:12px}.cards{grid-template-columns:1fr}.row{grid-template-columns:1fr}.desktop-table{display:none}.mobile-list{display:block}.toolbar{display:block}.toolbar .field{max-width:none;margin-bottom:10px}.chart{gap:8px;padding:12px 8px 0}.bar i{width:34px}}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const API = "http://localhost:8080/api";
    const APP_NAME = "StockWise 360";
    const DEFAULT_STOCK = { id: "main", name: "Main Stock", backend: true };
    const LOCAL_CATEGORIES = [
      { id: 1, name: "General" },
      { id: 2, name: "Grocery" },
      { id: 3, name: "Beverages" },
      { id: 4, name: "Personal Care" },
      { id: 5, name: "Household" },
      { id: 6, name: "Stationery" }
    ];
    function storedJson(key, fallback){
      try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
      catch { return fallback; }
    }
    function initialStockBooks(){
      const custom = storedJson("stockwiseStocks", []);
      return [DEFAULT_STOCK, ...custom.filter(stock => stock && stock.id && stock.name)];
    }
    function blankStockData(){ return { products: [], sales: [], expenses: [], saleCounter: 1, categories: LOCAL_CATEGORIES }; }
    function stockDataKey(id){ return "stockwiseData:" + id; }
    const state = {
      token: localStorage.token || "",
      user: JSON.parse(localStorage.user || "null"),
      route: "dashboard",
      data: {},
      filters: { inventory: "", sales: "" },
      stockBooks: initialStockBooks(),
      currentStockId: localStorage.currentStockId || "main",
      stockFormName: "",
      editingProductId: null,
      productForm: { name: "", sku: "", categoryId: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", minimumStock: "", unit: "pcs" },
      draft: { customerName: "Walk-in Customer", customerPhone: "", productId: "", quantity: 1, discountPercent: 0, taxPercent: 0, amountPaid: 0, paymentStatus: "PENDING", items: [] }
    };
    const root = document.getElementById("root");
    const money = v => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(v||0));
    const today = () => new Date().toISOString().slice(0,10);
    const monthStart = () => today().slice(0,8) + "01";
    function esc(v){ return String(v ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }
    function currentStock(){ return state.stockBooks.find(stock => stock.id === state.currentStockId) || state.stockBooks[0]; }
    function isBackendStock(){ return currentStock()?.backend; }
    function persistStocks(){
      localStorage.stockwiseStocks = JSON.stringify(state.stockBooks.filter(stock => !stock.backend));
      localStorage.currentStockId = state.currentStockId;
    }
    function readLocalStock(){
      return storedJson(stockDataKey(state.currentStockId), blankStockData());
    }
    function writeLocalStock(data){
      localStorage.setItem(stockDataKey(state.currentStockId), JSON.stringify(data));
    }
    function resetWorkingForms(){
      state.data = {};
      state.editingProductId = null;
      state.productForm = { name: "", sku: "", categoryId: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", minimumStock: "", unit: "pcs" };
      state.draft = { customerName: "Walk-in Customer", customerPhone: "", productId: "", quantity: 1, discountPercent: 0, taxPercent: 0, amountPaid: 0, paymentStatus: "PENDING", items: [] };
    }
    function selectStock(id){
      if (!state.stockBooks.some(stock => stock.id === id)) return;
      state.currentStockId = id;
      persistStocks();
      resetWorkingForms();
      render();
      loadRoute();
    }
    function createStock(e){
      e.preventDefault();
      const name = state.stockFormName.trim();
      if (!name) return;
      const id = "stock-" + Date.now();
      state.stockBooks.push({ id, name, backend: false });
      state.currentStockId = id;
      state.stockFormName = "";
      writeLocalStock(blankStockData());
      persistStocks();
      resetWorkingForms();
      state.route = "dashboard";
      render();
      loadRoute();
    }
    function deleteStock(id){
      if (id === "main") return alert("Main Stock is connected to MySQL and cannot be deleted here.");
      if (!confirm("Delete this stock workspace?")) return;
      state.stockBooks = state.stockBooks.filter(stock => stock.id !== id);
      localStorage.removeItem(stockDataKey(id));
      if (state.currentStockId === id) state.currentStockId = "main";
      persistStocks();
      resetWorkingForms();
      render();
      loadRoute();
    }
    function localPaymentStatus(total, paid){
      if (Number(paid || 0) >= Number(total || 0) && Number(total || 0) > 0) return "PAID";
      if (Number(paid || 0) > 0) return "PARTIAL";
      return "PENDING";
    }
    function localDashboard(data){
      const day = today();
      const month = day.slice(0,7);
      const todaySales = data.sales.filter(s => (s.createdAt || "").slice(0,10) === day);
      const monthSales = data.sales.filter(s => (s.createdAt || "").slice(0,7) === month);
      const monthExpenses = data.expenses.filter(e => (e.expenseDate || "").slice(0,7) === month);
      const monthRevenue = monthSales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
      const monthCogs = monthSales.reduce((sum, sale) => sum + (sale.saleItems || []).reduce((lineSum, item) => lineSum + Number(item.totalCost || 0), 0), 0);
      const expenses = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      return {
        today: { revenue: todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0), salesCount: todaySales.length },
        month: { revenue: monthRevenue, netProfit: monthRevenue - monthCogs - expenses, expenses },
        activeProducts: data.products.length,
        lowStockCount: data.products.filter(p => Number(p.stockQuantity || 0) <= Number(p.minimumStock || 0)).length,
        lowStockProducts: data.products.filter(p => Number(p.stockQuantity || 0) <= Number(p.minimumStock || 0)).slice(0, 8)
      };
    }
    function localProfitLoss(data, start = monthStart(), end = today()){
      const sales = data.sales.filter(s => {
        const d = (s.createdAt || "").slice(0,10);
        return d >= start && d <= end;
      });
      const expenses = data.expenses.filter(e => (e.expenseDate || "") >= start && (e.expenseDate || "") <= end);
      const revenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
      const cogs = sales.reduce((sum, sale) => sum + (sale.saleItems || []).reduce((lineSum, item) => lineSum + Number(item.totalCost || 0), 0), 0);
      const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      return { revenue, cogs, expenses: expenseTotal, grossProfit: revenue - cogs, netProfit: revenue - cogs - expenseTotal, salesCount: sales.length };
    }
    function loadLocalRoute(){
      const data = readLocalStock();
      if (state.route === "dashboard") state.data.dashboard = localDashboard(data);
      if (state.route === "inventory") { state.data.products = data.products; state.data.categories = data.categories || LOCAL_CATEGORIES; }
      if (state.route === "sales") { state.data.sales = data.sales; state.data.products = data.products; }
      if (state.route === "expenses") state.data.expenses = data.expenses;
      if (state.route === "reports") state.data.report = localProfitLoss(data);
    }
    async function api(path, opts = {}) {
      const res = await fetch(API + path, { ...opts, headers: { "Content-Type": "application/json", ...(state.token ? { Authorization: "Bearer " + state.token } : {}), ...(opts.headers || {}) } });
      if (!res.ok) throw new Error((await res.json().catch(()=>({message:res.statusText}))).message || res.statusText);
      return res.status === 204 ? null : res.json();
    }
    async function download(path, filename) {
      const res = await fetch(API + path, { headers: { Authorization: "Bearer " + state.token } });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }
    function downloadText(filename, text, type = "text/plain"){
      const blob = new Blob([text], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }
    function csvCell(value){ return '"' + String(value ?? "").replace(/"/g, '""') + '"'; }
    function csv(rows){ return rows.map(row => row.map(csvCell).join(",")).join("\n"); }
    function downloadInventoryCsv(){
      if (isBackendStock()) return download('/exports/products.csv','inventory.csv');
      const rows = [["SKU","Product","Category","Stock","Minimum Stock","Cost Price","Selling Price"], ...readLocalStock().products.map(p => [p.sku, p.name, p.category?.name || "-", p.stockQuantity + " " + (p.unit || ""), p.minimumStock, p.buyingPrice, p.sellingPrice])];
      downloadText((currentStock()?.name || "stock") + "-inventory.csv", csv(rows), "text/csv");
    }
    function downloadSalesCsv(){
      if (isBackendStock()) return download('/exports/sales.csv','sales.csv');
      const rows = [["Invoice","Customer","Items","Total","Paid","Balance","Status","Date"], ...readLocalStock().sales.map(s => [s.invoiceNumber, s.customerName, (s.saleItems || []).map(i => (i.product?.name || "Item") + " x " + i.quantity).join("; "), s.totalAmount, s.amountPaid, s.balanceDue, s.paymentStatus, (s.createdAt || "").slice(0,10)])];
      downloadText((currentStock()?.name || "stock") + "-sales.csv", csv(rows), "text/csv");
    }
    function downloadReportCsv(start = monthStart(), end = today()){
      if (isBackendStock()) return download('/exports/reports/profit-loss.csv?start='+start+'&end='+end,'profit-loss.csv');
      const r = localProfitLoss(readLocalStock(), start, end);
      downloadText((currentStock()?.name || "stock") + "-profit-loss.csv", csv([["Metric","Value"],["Revenue",r.revenue],["COGS",r.cogs],["Expenses",r.expenses],["Gross Profit",r.grossProfit],["Net Profit",r.netProfit],["Sales Count",r.salesCount]]), "text/csv");
    }
    function localInvoiceHtml(sale){
      const rows = (sale.saleItems || []).map(item => '<tr><td>'+esc(item.product?.name || "Item")+'</td><td>'+item.quantity+'</td><td>'+money(item.unitPrice)+'</td><td>'+money(item.totalPrice)+'</td></tr>').join("");
      return '<!doctype html><html><head><title>'+esc(sale.invoiceNumber)+'</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#172033}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}.total{margin-top:20px;max-width:320px;margin-left:auto}.total div{display:flex;justify-content:space-between;padding:5px 0}.brand{display:flex;justify-content:space-between;gap:20px}</style></head><body><div class="brand"><div><h1>'+APP_NAME+'</h1><p>'+esc(currentStock()?.name || "Stock")+' Invoice</p></div><div><strong>'+esc(sale.invoiceNumber)+'</strong><br>'+esc((sale.createdAt || "").slice(0,10))+'</div></div><p><strong>Customer:</strong> '+esc(sale.customerName || "-")+'</p><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>'+rows+'</tbody></table><div class="total"><div><span>Total</span><strong>'+money(sale.totalAmount)+'</strong></div><div><span>Paid</span><strong>'+money(sale.amountPaid)+'</strong></div><div><span>Balance</span><strong>'+money(sale.balanceDue)+'</strong></div><div><span>Status</span><strong>'+esc(sale.paymentStatus)+'</strong></div></div></body></html>';
    }
    function downloadInvoiceHtml(id){
      if (isBackendStock()) return download('/exports/invoice/'+id+'.html','invoice-'+id+'.html');
      const sale = readLocalStock().sales.find(s => s.id === Number(id));
      if (!sale) return alert("Invoice not found.");
      downloadText(sale.invoiceNumber + ".html", localInvoiceHtml(sale), "text/html");
    }
    function downloadInvoicePdf(id){
      if (isBackendStock()) {
        const sale = (state.data.sales || []).find(s => s.id === Number(id));
        return download('/exports/invoice/'+id+'.pdf',(sale?.invoiceNumber || "invoice")+'.pdf');
      }
      const sale = readLocalStock().sales.find(s => s.id === Number(id));
      if (!sale) return alert("Invoice not found.");
      downloadText(sale.invoiceNumber + ".html", localInvoiceHtml(sale), "text/html");
    }
    function openExport(path){ window.open(API + path + (path.includes("?") ? "&" : "?") + "tokenNote=use-browser-auth", "_blank"); }
    function setRoute(route){ state.route = route; render(); loadRoute(); }
    async function login(e){
      e.preventDefault();
      try {
        const data = await api("/auth/login", { method:"POST", body: JSON.stringify({ username: username.value, password: password.value }) });
        state.token = data.token; state.user = data.user; localStorage.token = data.token; localStorage.user = JSON.stringify(data.user);
        render(); await loadRoute();
      } catch(err) { loginError.textContent = err.message; }
    }
    function logout(){ localStorage.clear(); state.token=""; state.user=null; render(); }
    async function loadRoute(){
      if(!state.user) return;
      if(!isBackendStock()) {
        loadLocalRoute();
        render();
        return;
      }
      try {
        if(state.route==="dashboard") state.data.dashboard = await api("/reports/dashboard");
        if(state.route==="inventory") { state.data.products = await api("/products"); state.data.categories = await api("/categories"); }
        if(state.route==="sales") { state.data.sales = await api("/sales"); state.data.products = await api("/products"); }
        if(state.route==="expenses") state.data.expenses = await api("/expenses");
        if(state.route==="reports") state.data.report = await api("/reports/profit-loss?start="+monthStart()+"&end="+today());
        if(state.route==="users") state.data.users = await api("/users");
      } catch(err) { state.data.error = err.message; }
      render();
    }
    function resetProductForm(){
      state.editingProductId = null;
      state.productForm = { name: "", sku: "", categoryId: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", minimumStock: "", unit: "pcs" };
      render();
    }
    function setProductField(field, value){
      state.productForm[field] = value;
    }
    function editProduct(id){
      const product = (state.data.products || []).find(p => p.id === Number(id));
      if (!product) return;
      state.editingProductId = product.id;
      state.productForm = {
        name: product.name || "",
        sku: product.sku || "",
        categoryId: product.category?.id || "",
        buyingPrice: product.buyingPrice ?? "",
        sellingPrice: product.sellingPrice ?? "",
        stockQuantity: product.stockQuantity ?? "",
        minimumStock: product.minimumStock ?? "",
        unit: product.unit || "pcs"
      };
      render();
    }
    async function saveProduct(e){
      e.preventDefault();
      const category = (state.data.categories || LOCAL_CATEGORIES).find(c => c.id === Number(state.productForm.categoryId)) || null;
      const payload = {
        name: state.productForm.name,
        sku: state.productForm.sku,
        categoryId: state.productForm.categoryId ? Number(state.productForm.categoryId) : null,
        buyingPrice: Number(state.productForm.buyingPrice || 0),
        sellingPrice: Number(state.productForm.sellingPrice || 0),
        stockQuantity: Number(state.productForm.stockQuantity || 0),
        minimumStock: Number(state.productForm.minimumStock || 0),
        unit: state.productForm.unit || "pcs"
      };
      if (!isBackendStock()) {
        const data = readLocalStock();
        if (state.editingProductId) {
          data.products = data.products.map(product => product.id === state.editingProductId ? { ...product, ...payload, category } : product);
        } else {
          data.products.push({ ...payload, id: Date.now(), category, active: true });
        }
        writeLocalStock(data);
        state.editingProductId = null;
        state.productForm = { name: "", sku: "", categoryId: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", minimumStock: "", unit: "pcs" };
        loadRoute();
        return;
      }
      if (state.editingProductId) await api("/products/"+state.editingProductId, { method:"PUT", body: JSON.stringify(payload) });
      else await api("/products", { method:"POST", body: JSON.stringify(payload) });
      state.editingProductId = null;
      state.productForm = { name: "", sku: "", categoryId: "", buyingPrice: "", sellingPrice: "", stockQuantity: "", minimumStock: "", unit: "pcs" };
      loadRoute();
    }
    async function addExpense(e){
      e.preventDefault(); const f=e.target;
      if (!isBackendStock()) {
        const data = readLocalStock();
        data.expenses.unshift({ id: Date.now(), title:f.title.value, amount:Number(f.amount.value||0), category:f.category.value, expenseDate:f.expenseDate.value, description:f.description.value });
        writeLocalStock(data);
        f.reset();
        loadRoute();
        return;
      }
      await api("/expenses", { method:"POST", body: JSON.stringify({ title:f.title.value, amount:Number(f.amount.value||0), category:f.category.value, expenseDate:f.expenseDate.value, description:f.description.value })});
      f.reset(); loadRoute();
    }
    function draftSubtotal(){ return state.draft.items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0); }
    function draftDiscount(){ return draftSubtotal() * Number(state.draft.discountPercent || 0) / 100; }
    function draftTax(){ return (draftSubtotal() - draftDiscount()) * Number(state.draft.taxPercent || 0) / 100; }
    function draftTotal(){ return draftSubtotal() - draftDiscount() + draftTax(); }
    function draftPaidAmount(){
      if (state.draft.paymentStatus === "PAID") return draftTotal();
      if (state.draft.paymentStatus === "PENDING") return 0;
      return Number(state.draft.amountPaid || 0);
    }
    function draftBalance(){ return Math.max(0, draftTotal() - draftPaidAmount()); }
    function setDraftPaymentStatus(status){
      state.draft.paymentStatus = status;
      if (status === "PAID") state.draft.amountPaid = draftTotal().toFixed(2);
      if (status === "PENDING") state.draft.amountPaid = 0;
      render();
    }
    function addInvoiceItem(){
      const product = (state.data.products || []).find(p => p.id === Number(state.draft.productId));
      if (!product) return;
      const qty = Math.max(1, Number(state.draft.quantity || 1));
      const existing = state.draft.items.find(item => item.productId === product.id);
      if (existing) existing.quantity += qty;
      else state.draft.items.push({ productId: product.id, name: product.name, quantity: qty, unitPrice: Number(product.sellingPrice || 0) });
      state.draft.productId = "";
      state.draft.quantity = 1;
      render();
    }
    function updateInvoiceItem(index, field, value){
      const item = state.draft.items[index];
      if (!item) return;
      item[field] = field === "quantity" ? Math.max(1, Number(value || 1)) : Number(value || 0);
      render();
    }
    function removeInvoiceItem(index){
      state.draft.items.splice(index, 1);
      render();
    }
    async function addSale(e){
      e.preventDefault();
      if (!state.draft.items.length) return alert("Add at least one item to the invoice.");
      if (state.draft.paymentStatus === "PARTIAL" && draftPaidAmount() <= 0) return alert("Enter amount paid for a partial invoice.");
      if (!isBackendStock()) {
        const data = readLocalStock();
        for (const item of state.draft.items) {
          const product = data.products.find(p => p.id === item.productId);
          if (!product) return alert("Product not found in this stock.");
          if (Number(product.stockQuantity || 0) < Number(item.quantity || 0)) return alert("Insufficient stock for " + product.name);
        }
        const subtotal = draftSubtotal();
        const discount = draftDiscount();
        const tax = draftTax();
        const total = draftTotal();
        const paid = draftPaidAmount();
        const saleItems = state.draft.items.map((item, index) => {
          const product = data.products.find(p => p.id === item.productId);
          product.stockQuantity = Number(product.stockQuantity || 0) - Number(item.quantity || 0);
          return {
            id: Date.now() + index,
            product,
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
            totalPrice: Number(item.unitPrice || 0) * Number(item.quantity || 0),
            totalCost: Number(product.buyingPrice || 0) * Number(item.quantity || 0)
          };
        });
        data.sales.unshift({
          id: Date.now(),
          invoiceNumber: "SW-" + String(data.saleCounter || 1).padStart(5, "0"),
          customerName: state.draft.customerName || "Walk-in Customer",
          customerPhone: state.draft.customerPhone,
          subtotal,
          discountAmount: discount,
          taxAmount: tax,
          totalAmount: total,
          amountPaid: paid,
          balanceDue: Math.max(0, total - paid),
          paymentStatus: localPaymentStatus(total, paid),
          createdAt: new Date().toISOString(),
          saleItems
        });
        data.saleCounter = Number(data.saleCounter || 1) + 1;
        writeLocalStock(data);
        state.draft = { customerName: "Walk-in Customer", customerPhone: "", productId: "", quantity: 1, discountPercent: 0, taxPercent: 0, amountPaid: 0, paymentStatus: "PENDING", items: [] };
        loadRoute();
        return;
      }
      await api("/sales", {
        method:"POST",
        body: JSON.stringify({
          customerName: state.draft.customerName || "Walk-in Customer",
          customerPhone: state.draft.customerPhone,
          discountPercent: Number(state.draft.discountPercent || 0),
          taxPercent: Number(state.draft.taxPercent || 0),
          amountPaid: draftPaidAmount(),
          paymentMethod:"CASH",
          items: state.draft.items.map(item => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice }))
        })
      });
      state.draft = { customerName: "Walk-in Customer", customerPhone: "", productId: "", quantity: 1, discountPercent: 0, taxPercent: 0, amountPaid: 0, paymentStatus: "PENDING", items: [] };
      loadRoute();
    }
    async function updateSalePayment(id, amount){
      if (!isBackendStock()) {
        const data = readLocalStock();
        data.sales = data.sales.map(sale => {
          if (sale.id !== Number(id)) return sale;
          const paid = Math.min(Number(amount || 0), Number(sale.totalAmount || 0));
          return { ...sale, amountPaid: paid, balanceDue: Math.max(0, Number(sale.totalAmount || 0) - paid), paymentStatus: localPaymentStatus(sale.totalAmount, paid) };
        });
        writeLocalStock(data);
        loadRoute();
        return;
      }
      await api("/sales/"+id+"/payment", { method:"PATCH", body: JSON.stringify({ amountPaid: String(Number(amount || 0)), paymentMethod: "CASH" }) });
      loadRoute();
    }
    async function markSalePaid(id, total){
      await updateSalePayment(id, total);
    }
    async function runReport(e){
      e.preventDefault(); const f=e.target;
      if (!isBackendStock()) {
        state.data.report = localProfitLoss(readLocalStock(), f.start.value, f.end.value);
        render();
        return;
      }
      state.data.report = await api("/reports/profit-loss?start="+f.start.value+"&end="+f.end.value);
      render();
    }
    function pageHead(title, subtitle, actions){ return '<div class="page-head"><div><h1>'+title+'</h1><p>'+subtitle+'</p></div><div class="actions">'+(actions||"")+'</div></div>'; }
    function loginView(){ return '<main class="login"><section class="hero"><div><h1>'+APP_NAME+'</h1><p>Inventory, sales, expenses, and billing across multiple stock workspaces.</p></div></section><form onsubmit="login(event)"><h2>Sign in</h2><p class="muted">Default admin: admin / Admin@123</p><input id="username" class="field" value="admin" placeholder="Username"><input id="password" class="field" value="Admin@123" type="password" placeholder="Password"><button class="btn">Sign in</button><div id="loginError" class="error"></div></form></main>'; }
    function shell(content){
      const nav=[["stocks","Stocks"],["dashboard","Dashboard"],["inventory","Inventory"],["sales","Sales & Billing"],["expenses","Expenses"],["reports","Reports"],["users","Users"]];
      const stockOptions = state.stockBooks.map(stock => '<option value="'+esc(stock.id)+'" '+(stock.id===state.currentStockId?'selected':'')+'>'+esc(stock.name)+'</option>').join("");
      return '<div class="app"><aside class="side"><div class="brand">'+APP_NAME+'</div><div class="nav">'+nav.map(n=>'<button class="'+(state.route===n[0]?'active':'')+'" data-route="'+n[0]+'" onclick="setRoute(this.dataset.route)">'+n[1]+'</button>').join("")+'</div></aside><section class="main"><header class="top"><div class="actions" style="justify-content:flex-start"><select class="field" style="width:210px" onchange="selectStock(this.value)">'+stockOptions+'</select><button class="btn secondary" onclick="setRoute(\'stocks\')">New stock</button></div><div class="actions"><strong>'+esc(state.user.fullName)+'</strong><button class="btn secondary" onclick="logout()">Logout</button></div></header><div class="content">'+content+'</div></section></div>';
    }
    function stocks(){
      const cards = state.stockBooks.map(stock => '<div class="mobile-card"><strong>'+esc(stock.name)+'</strong><div class="muted">'+(stock.backend?'Connected to MySQL backend':'Separate browser-saved stock workspace')+'</div><div class="actions" style="justify-content:flex-start;margin-top:10px"><button class="btn small '+(stock.id===state.currentStockId?'green':'secondary')+'" onclick="selectStock(\''+esc(stock.id)+'\')">'+(stock.id===state.currentStockId?'Selected':'Open')+'</button>'+(stock.backend?'':'<button class="btn small secondary" onclick="deleteStock(\''+esc(stock.id)+'\')">Delete</button>')+'</div></div>').join("");
      return pageHead("Stocks","Create a separate stock book for another billing/inventory setup.")+'<div class="workspace"><form class="panel form" onsubmit="createStock(event)"><h3>Create new stock</h3><input class="field" value="'+esc(state.stockFormName)+'" oninput="state.stockFormName=this.value" placeholder="Example: Mobile Accessories Stock" required><button class="btn">Create stock workspace</button></form><div class="panel"><h3>Your stock workspaces</h3><div class="mobile-list" style="display:block">'+cards+'</div></div></div>';
    }
    function dashboard(){ const d=state.data.dashboard||{}; return pageHead("Dashboard","Snapshot for "+esc(currentStock()?.name || "Current Stock")+".")+'<div class="cards"><div class="card"><span>Today revenue</span><strong>'+money(d.today?.revenue)+'</strong></div><div class="card"><span>Month net profit</span><strong>'+money(d.month?.netProfit)+'</strong></div><div class="card"><span>Active products</span><strong>'+(d.activeProducts||0)+'</strong></div><div class="card"><span>Low stock</span><strong>'+(d.lowStockCount||0)+'</strong></div></div><div class="panel" style="margin-top:18px"><h3>Low stock alerts</h3>'+((d.lowStockProducts||[]).map(p=>'<p>'+esc(p.name)+' - '+p.stockQuantity+' left</p>').join("")||'<p class="muted">No low stock items yet.</p>')+'</div>'; }
    function inventory(){
      const ps=(state.data.products||[]).filter(p => (p.name+" "+(p.sku||"")).toLowerCase().includes(state.filters.inventory.toLowerCase()));
      const cs=state.data.categories||[];
      const pf=state.productForm;
      const actions=isBackendStock()?'<button class="btn secondary" onclick="downloadInventoryCsv()">Excel</button><button class="btn dark" onclick="download(\'/exports/products.pdf\',\'inventory.pdf\')">PDF</button>':'<button class="btn secondary" onclick="downloadInventoryCsv()">Excel</button>';
      const table='<div class="panel" style="padding:0"><div class="toolbar"><input class="field" placeholder="Search product or SKU" value="'+esc(state.filters.inventory)+'" oninput="state.filters.inventory=this.value;render()"><div class="muted">'+ps.length+' products</div></div><div class="desktop-table table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th class="num">Stock</th><th class="num">Cost</th><th class="num">Price</th><th>Update</th></tr></thead><tbody>'+ps.map(p=>'<tr><td><strong>'+esc(p.name)+'</strong><br><span class="muted">'+esc(p.sku||"")+'</span></td><td>'+esc(p.category?.name||"-")+'</td><td class="num">'+p.stockQuantity+' '+esc(p.unit||"")+'</td><td class="num">'+money(p.buyingPrice)+'</td><td class="num">'+money(p.sellingPrice)+'</td><td><button class="btn small secondary" onclick="editProduct('+p.id+')">Edit</button></td></tr>').join("")+'</tbody></table></div><div class="mobile-list">'+ps.map(p=>'<div class="mobile-card"><strong>'+esc(p.name)+'</strong><div class="muted">'+esc(p.sku||"")+'</div><div class="mobile-row"><span>Stock</span><b>'+p.stockQuantity+' '+esc(p.unit||"")+'</b></div><div class="mobile-row"><span>Price</span><b>'+money(p.sellingPrice)+'</b></div><button class="btn small secondary" onclick="editProduct('+p.id+')">Edit item</button></div>').join("")+'</div></div>';
      const formActions = state.editingProductId ? '<div class="actions" style="justify-content:flex-start"><button class="btn">Save update</button><button type="button" class="btn secondary" onclick="resetProductForm()">Cancel</button></div>' : '<button class="btn">Add product</button>';
      return pageHead("Inventory","Compact stock table with editable item and stock updates.",actions)+'<div class="workspace"><form class="panel form" onsubmit="saveProduct(event)"><h3>'+(state.editingProductId?'Update product':'Add product')+'</h3><input class="field" value="'+esc(pf.name)+'" oninput="setProductField(\'name\',this.value)" placeholder="Product name" required><input class="field" value="'+esc(pf.sku)+'" oninput="setProductField(\'sku\',this.value)" placeholder="SKU"><select class="field" onchange="setProductField(\'categoryId\',this.value)"><option value="">No category</option>'+cs.map(c=>'<option value="'+c.id+'" '+(Number(pf.categoryId)===c.id?'selected':'')+'>'+esc(c.name)+'</option>').join("")+'</select><div class="row"><input class="field" value="'+esc(pf.buyingPrice)+'" oninput="setProductField(\'buyingPrice\',this.value)" type="number" placeholder="Cost"><input class="field" value="'+esc(pf.sellingPrice)+'" oninput="setProductField(\'sellingPrice\',this.value)" type="number" placeholder="Price"><input class="field" value="'+esc(pf.stockQuantity)+'" oninput="setProductField(\'stockQuantity\',this.value)" type="number" placeholder="Stock"><input class="field" value="'+esc(pf.minimumStock)+'" oninput="setProductField(\'minimumStock\',this.value)" type="number" placeholder="Min stock"></div><input class="field" value="'+esc(pf.unit)+'" oninput="setProductField(\'unit\',this.value)" placeholder="Unit">'+formActions+'</form>'+table+'</div>';
    }
    function sales(){
      const products=state.data.products||[];
      const sales=(state.data.sales||[]).filter(s => (s.invoiceNumber+" "+s.customerName+" "+s.paymentStatus).toLowerCase().includes(state.filters.sales.toLowerCase()));
      const actions=isBackendStock()?'<button class="btn secondary" onclick="downloadSalesCsv()">Excel</button><button class="btn dark" onclick="download(\'/exports/sales.pdf\',\'sales.pdf\')">PDF</button>':'<button class="btn secondary" onclick="downloadSalesCsv()">Excel</button>';
      const statusClass = s => s.paymentStatus === "PAID" ? "paid" : (s.paymentStatus === "PARTIAL" ? "partial" : "pending");
      const paymentCell = s => '<div class="payment-box"><input class="field" id="pay-'+s.id+'" type="number" min="0" value="'+Number(s.amountPaid||0)+'"><button class="btn small secondary" onclick="updateSalePayment('+s.id+', document.getElementById(\'pay-'+s.id+'\').value)">Save</button><button class="btn small green" onclick="markSalePaid('+s.id+','+Number(s.totalAmount||0)+')">Paid</button></div>';
      const soldItems = s => '<div class="sold-items">'+((s.saleItems||[]).map(item => '<div class="sold-item"><b>'+esc(item.product?.name || 'Item')+'</b> x '+item.quantity+' <span class="muted">('+money(item.totalPrice)+')</span></div>').join("") || '<span class="muted">No items listed</span>')+'</div>';
      const invoiceButtons = s => isBackendStock()?'<button class="btn small green" onclick="downloadInvoicePdf('+s.id+')">PDF</button> <button class="btn small secondary" onclick="downloadInvoiceHtml('+s.id+')">HTML</button>':'<button class="btn small green" onclick="downloadInvoiceHtml('+s.id+')">HTML</button>';
      const invoiceItems = state.draft.items.map((item, index) => '<div class="invoice-item"><div><strong>'+esc(item.name)+'</strong><div class="muted">'+money(item.unitPrice)+' each | line '+money(Number(item.unitPrice||0)*Number(item.quantity||0))+'</div></div><input class="field" type="number" min="1" value="'+item.quantity+'" onchange="updateInvoiceItem('+index+',\'quantity\',this.value)"><input class="field" type="number" min="0" value="'+item.unitPrice+'" onchange="updateInvoiceItem('+index+',\'unitPrice\',this.value)"><button type="button" class="btn small secondary" onclick="removeInvoiceItem('+index+')">X</button></div>').join("");
      const builder='<form class="panel form" onsubmit="addSale(event)"><h3>Create editable invoice</h3><input class="field" value="'+esc(state.draft.customerName)+'" placeholder="Customer name" oninput="state.draft.customerName=this.value"><input class="field" value="'+esc(state.draft.customerPhone)+'" placeholder="Customer phone" oninput="state.draft.customerPhone=this.value"><div class="row"><select class="field" value="'+state.draft.productId+'" onchange="state.draft.productId=this.value"><option value="">Select item</option>'+products.map(p=>'<option value="'+p.id+'" '+(Number(state.draft.productId)===p.id?'selected':'')+'>'+esc(p.name)+' - '+money(p.sellingPrice)+'</option>').join("")+'</select><input class="field" type="number" min="1" value="'+state.draft.quantity+'" oninput="state.draft.quantity=this.value" placeholder="Qty"></div><button type="button" class="btn secondary" onclick="addInvoiceItem()">Add item to bill</button><div class="form">'+(invoiceItems || '<p class="muted">No items added yet.</p>')+'</div><div class="row"><input class="field" type="number" min="0" value="'+state.draft.discountPercent+'" oninput="state.draft.discountPercent=this.value;render()" placeholder="Discount %"><input class="field" type="number" min="0" value="'+state.draft.taxPercent+'" oninput="state.draft.taxPercent=this.value;render()" placeholder="Tax %"></div><select class="field" onchange="setDraftPaymentStatus(this.value)"><option value="PENDING" '+(state.draft.paymentStatus==="PENDING"?'selected':'')+'>Pending</option><option value="PARTIAL" '+(state.draft.paymentStatus==="PARTIAL"?'selected':'')+'>Partial</option><option value="PAID" '+(state.draft.paymentStatus==="PAID"?'selected':'')+'>Paid</option></select><input class="field" type="number" min="0" value="'+draftPaidAmount()+'" '+(state.draft.paymentStatus==="PARTIAL"?'':'readonly')+' oninput="state.draft.amountPaid=this.value;state.draft.paymentStatus=Number(this.value||0) >= draftTotal() && draftTotal() > 0 ? \'PAID\' : Number(this.value||0) > 0 ? \'PARTIAL\' : \'PENDING\';render()" placeholder="Amount paid"><div class="invoice-total"><div><span>Subtotal</span><b>'+money(draftSubtotal())+'</b></div><div><span>Discount</span><b>'+money(draftDiscount())+'</b></div><div><span>Tax</span><b>'+money(draftTax())+'</b></div><div class="grand"><span>Total bill</span><span>'+money(draftTotal())+'</span></div><div><span>Amount paid</span><b>'+money(draftPaidAmount())+'</b></div><div><span>Balance due</span><b>'+money(draftBalance())+'</b></div><div><span>Status</span><b>'+state.draft.paymentStatus+'</b></div></div><button class="btn" '+(!state.draft.items.length?'disabled':'')+'>Generate invoice</button></form>';
      const table='<div class="panel" style="padding:0"><div class="toolbar"><input class="field" placeholder="Search invoice, customer, status" value="'+esc(state.filters.sales)+'" oninput="state.filters.sales=this.value;render()"><div class="muted">'+sales.length+' invoices</div></div><div class="desktop-table table-wrap"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Items bought</th><th class="num">Total</th><th>Payment edit</th><th class="num">Balance</th><th>Status</th><th>Date</th><th>Invoice</th></tr></thead><tbody>'+sales.map(s=>'<tr><td><strong>'+esc(s.invoiceNumber)+'</strong></td><td>'+esc(s.customerName)+'</td><td>'+soldItems(s)+'</td><td class="num">'+money(s.totalAmount)+'</td><td>'+paymentCell(s)+'</td><td class="num">'+money(s.balanceDue)+'</td><td><span class="pill '+statusClass(s)+'">'+s.paymentStatus+'</span></td><td>'+esc((s.createdAt||"").slice(0,10))+'</td><td>'+invoiceButtons(s)+'</td></tr>').join("")+'</tbody></table></div><div class="mobile-list">'+sales.map(s=>'<div class="mobile-card"><strong>'+esc(s.invoiceNumber)+'</strong><div class="muted">'+esc(s.customerName)+'</div><div style="margin:8px 0"><div class="muted">Items bought</div>'+soldItems(s)+'</div><div class="mobile-row"><span>Total</span><b>'+money(s.totalAmount)+'</b></div><div class="mobile-row"><span>Paid</span><b>'+money(s.amountPaid)+'</b></div><div class="mobile-row"><span>Balance</span><b>'+money(s.balanceDue)+'</b></div><div class="mobile-row"><span>Status</span><b>'+s.paymentStatus+'</b></div><div style="margin-top:8px">'+paymentCell(s)+'</div><div class="actions" style="justify-content:flex-start;margin-top:8px">'+invoiceButtons(s)+'</div></div>').join("")+'</div></div>';
      return pageHead("Sales","Build invoices with live totals, then edit payment when the customer pays.",actions)+'<div class="workspace">'+builder+table+'</div>';
    }
    function expenses(){ const es=state.data.expenses||[]; return pageHead("Expenses","Track operating costs for profit and loss.")+'<div class="workspace"><form class="panel form" onsubmit="addExpense(event)"><h3>Add expense</h3><input class="field" name="title" placeholder="Title" required><input class="field" name="amount" type="number" placeholder="Amount" required><select class="field" name="category">'+["RENT","ELECTRICITY","SALARY","PURCHASE","TRANSPORT","MAINTENANCE","OTHER"].map(x=>'<option>'+x+'</option>').join("")+'</select><input class="field" name="expenseDate" type="date" value="'+today()+'"><input class="field" name="description" placeholder="Description"><button class="btn">Add expense</button></form><div class="panel table-wrap"><table><thead><tr><th>Title</th><th>Category</th><th class="num">Amount</th><th>Date</th></tr></thead><tbody>'+es.map(e=>'<tr><td>'+esc(e.title)+'</td><td>'+e.category+'</td><td class="num">'+money(e.amount)+'</td><td>'+e.expenseDate+'</td></tr>').join("")+'</tbody></table></div></div>'; }
    function reports(){
      const r=state.data.report||{}; const max=Math.max(Math.abs(Number(r.revenue||0)),Math.abs(Number(r.cogs||0)),Math.abs(Number(r.expenses||0)),Math.abs(Number(r.netProfit||0)),1);
      const actions=isBackendStock()?'<button class="btn secondary" onclick="downloadReportCsv()">Excel</button><button class="btn dark" onclick="download(\'/exports/reports/profit-loss.pdf?start='+monthStart()+'&end='+today()+'\',\'profit-loss.pdf\')">PDF</button>':'<button class="btn secondary" onclick="downloadReportCsv()">Excel</button>';
      const bars=[["Revenue",r.revenue,"#2563eb"],["COGS",r.cogs,"#f59e0b"],["Expenses",r.expenses,"#e11d48"],["Net",r.netProfit,"#0f766e"]].map(x=>'<div class="bar"><i style="height:'+(Math.abs(Number(x[1]||0))/max*170+8)+'px;background:'+x[2]+'"></i><span>'+x[0]+'<br><b>'+money(x[1])+'</b></span></div>').join("");
      return pageHead("Reports","Profit and loss by date range with PDF and Excel export.",actions)+'<form class="panel actions" style="justify-content:flex-start;margin-bottom:16px" onsubmit="runReport(event)"><input class="field" style="max-width:170px" type="date" name="start" value="'+monthStart()+'"><input class="field" style="max-width:170px" type="date" name="end" value="'+today()+'"><button class="btn">Run report</button></form><div class="cards"><div class="card"><span>Revenue</span><strong>'+money(r.revenue)+'</strong></div><div class="card"><span>COGS</span><strong>'+money(r.cogs)+'</strong></div><div class="card"><span>Expenses</span><strong>'+money(r.expenses)+'</strong></div><div class="card"><span>Net profit</span><strong>'+money(r.netProfit)+'</strong></div></div><div class="panel" style="margin-top:18px"><h3>Performance chart</h3><div class="chart">'+bars+'</div></div>';
    }
    function users(){ const us=state.data.users||[]; return pageHead("Users","Admin view of staff accounts.")+'<div class="panel table-wrap"><table><thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th></tr></thead><tbody>'+us.map(u=>'<tr><td>'+esc(u.fullName)+'</td><td>'+esc(u.username)+'</td><td>'+esc(u.email)+'</td><td>'+u.role+'</td></tr>').join("")+'</tbody></table></div>'; }
    function render(){ if(!state.user){ root.innerHTML=loginView(); return; } const views={stocks,dashboard,inventory,sales,expenses,reports,users}; root.innerHTML=shell((views[state.route]||dashboard)()); }
    render(); loadRoute();
  </script>
</body>
</html>`;

const server = createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
});

server.listen(3000, "127.0.0.1", () => {
  console.log("StockWise 360 local preview running at http://localhost:3000");
});
