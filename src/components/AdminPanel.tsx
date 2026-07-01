// src/components/AdminPanel.tsx
import React, { useState, useEffect } from "react";
import { uploadFiles } from "../utils/uploadthing.js";
import { 
  BarChart, ListPlus, Settings, Tag, MessageSquare, Plus, Edit, Trash2, 
  Eye, Check, CheckSquare, RefreshCw, LogOut, Package, Users, ShoppingCart, 
  TrendingUp, Download, EyeOff, Printer, Bell, FileText, LayoutList 
} from "lucide-react";
import { 
  Phone, Brand, Category, Order, Coupon, ContactMessage, Notification, WebsiteSettings 
} from "../types";
import axios from "axios";

interface AdminPanelProps {
  token: string;
  onLogout: () => void;
  brands: Brand[];
  categories: Category[];
  phones: Phone[];
  orders: Order[];
  coupons: Coupon[];
  messages: ContactMessage[];
  notifications: Notification[];
  settings: WebsiteSettings;
  fetchData: () => Promise<void>;
}

type TabType = "dashboard" | "phones" | "brands" | "categories" | "orders" | "coupons" | "messages" | "notifications" | "settings";

export default function AdminPanel({
  token,
  onLogout,
  brands,
  categories,
  phones,
  orders,
  coupons,
  messages,
  notifications,
  settings,
  fetchData,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [errorText, setErrorText] = useState("");

  // Print Invoice State
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Pagination for Phones
  const [phoneSearch, setPhoneSearch] = useState("");
  const [phoneCategoryFilter, setPhoneCategoryFilter] = useState("");
  
  // CRUD Phone Form States
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);
  const [isPhoneFormOpen, setIsPhoneFormOpen] = useState(false);
  const [phoneForm, setPhoneForm] = useState({
    name: "",
    brandId: "",
    categoryId: "",
    model: "",
    price: "",
    discount: "0",
    stock: "10",
    description: "",
    warranty: "1 Year Store Warranty",
    isFeatured: false,
    isFlashSale: false,
    videoUrl: "",
    images: ["", ""],
    variants: [
      { color: "Black", storage: "256GB", ram: "8GB", priceModifier: 0, stock: 5 },
      { color: "Silver", storage: "256GB", ram: "8GB", priceModifier: 0, stock: 5 }
    ]
  });

  // CRUD Brand Form States
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandForm, setBrandForm] = useState({ name: "", logoUrl: "" });

  // Image upload progress states
  const [uploadingImg1, setUploadingImg1] = useState(false);
  const [uploadingImg2, setUploadingImg2] = useState(false);
  const [uploadingBrand, setUploadingBrand] = useState(false);

  // CRUD Category Form States
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", isHidden: false, orderIndex: "0" });

  // CRUD Coupon Form States
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "percentage",
    value: "10",
    expirationDate: "2028-12-31",
    usageLimit: "100"
  });

  // Settings State
  const [settingsForm, setSettingsForm] = useState<WebsiteSettings>({});

  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  const apiHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Status Colors for orders
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Confirmed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Preparing": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Ready": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Shipped": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Delivered": return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // ----------------------------------------------------
  // ADMIN DASHBOARD COMPUTED STATS
  // ----------------------------------------------------
  const totalPhonesCount = phones.length;
  const totalOrdersCount = orders.length;
  const totalRevenue = orders
    .filter(o => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const totalReviewsCount = phones.reduce((sum, p) => sum + (p.reviews?.length || 0), 0);
  const totalMessagesCount = messages.length;
  const totalBrandsCount = brands.length;
  const totalCategoriesCount = categories.length;

  // Unread counts
  const unreadMessagesCount = messages.filter(m => !m.isRead).length;
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  // Revenue chart data (Calculated dynamically for 6 mock months)
  const monthlyRevenue = [
    { month: "Jan", revenue: totalRevenue * 0.12, orders: Math.ceil(totalOrdersCount * 0.1) },
    { month: "Feb", revenue: totalRevenue * 0.15, orders: Math.ceil(totalOrdersCount * 0.15) },
    { month: "Mar", revenue: totalRevenue * 0.18, orders: Math.ceil(totalOrdersCount * 0.16) },
    { month: "Apr", revenue: totalRevenue * 0.14, orders: Math.ceil(totalOrdersCount * 0.13) },
    { month: "May", revenue: totalRevenue * 0.20, orders: Math.ceil(totalOrdersCount * 0.22) },
    { month: "Jun", revenue: totalRevenue * 0.21, orders: Math.ceil(totalOrdersCount * 0.24) },
  ];

  // Maximum revenue for SVG scaling
  const maxRevenueVal = Math.max(...monthlyRevenue.map(m => m.revenue), 1000);

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------
  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus }, apiHeaders);
      setMessageText(`Order status updated to ${newStatus}`);
      await fetchData();
    } catch (err: any) {
      setErrorText(err.response?.data?.error || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderDelete = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order? This cannot be undone.")) return;
    try {
      setLoading(true);
      await axios.delete(`/api/orders/${orderId}`, apiHeaders);
      setMessageText("Order deleted successfully");
      await fetchData();
    } catch (err: any) {
      setErrorText(err.response?.data?.error || "Failed to delete order");
    } finally {
      setLoading(false);
    }
  };

  // Mark Message as Read
  const handleMarkMessageRead = async (msgId: string) => {
    try {
      await axios.put(`/api/contact/${msgId}/read`, {}, apiHeaders);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Mark Notification as Read
  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await axios.put(`/api/notifications/${notifId}/read`, {}, apiHeaders);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("/api/settings", settingsForm, apiHeaders);
      setMessageText("Website settings updated successfully!");
      await fetchData();
    } catch (err: any) {
      setErrorText("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  // CRUD Phone Submit
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneForm.brandId || !phoneForm.categoryId) {
      setErrorText("Please select a brand and category.");
      return;
    }

    const payload = {
      ...phoneForm,
      price: Number(phoneForm.price),
      discount: Number(phoneForm.discount),
      stock: Number(phoneForm.stock),
      images: phoneForm.images.filter(url => url !== ""),
      variants: phoneForm.variants,
    };

    try {
      setLoading(true);
      if (editingPhone) {
        await axios.put(`/api/phones/${editingPhone.id}`, payload, apiHeaders);
        setMessageText("Phone updated successfully!");
      } else {
        await axios.post("/api/phones", payload, apiHeaders);
        setMessageText("Phone added successfully!");
      }
      setIsPhoneFormOpen(false);
      setEditingPhone(null);
      await fetchData();
    } catch (err: any) {
      setErrorText(err.response?.data?.error || "Failed to save phone");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhoneClick = (p: Phone) => {
    setEditingPhone(p);
    
    // Parse description-spec boundary if stored together
    let plainDesc = p.description;
    let specObj = null;
    if (p.description.includes("|||")) {
      const parts = p.description.split("|||");
      plainDesc = parts[0];
      try {
        specObj = JSON.parse(parts[1]);
      } catch (e) {}
    }

    setPhoneForm({
      name: p.name,
      brandId: p.brandId,
      categoryId: p.categoryId,
      model: p.model,
      price: String(p.price),
      discount: String(p.discount),
      stock: String(p.stock),
      description: plainDesc,
      warranty: p.warranty,
      isFeatured: p.isFeatured,
      isFlashSale: p.isFlashSale,
      videoUrl: p.videoUrl || "",
      images: p.images.map(img => img.url).concat(["", ""]).slice(0, 3), // support up to 3 fields
      variants: p.variants.map(v => ({
        color: v.color,
        storage: v.storage,
        ram: v.ram,
        priceModifier: v.priceModifier,
        stock: v.stock
      }))
    });
    setIsPhoneFormOpen(true);
  };

  const handleDeletePhone = async (phoneId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      setLoading(true);
      await axios.delete(`/api/phones/${phoneId}`, apiHeaders);
      setMessageText("Product deleted successfully");
      await fetchData();
    } catch (err: any) {
      setErrorText(err.response?.data?.error || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  // CRUD Brand Submit
  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingBrand) {
        await axios.put(`/api/brands/${editingBrand.id}`, brandForm, apiHeaders);
        setMessageText("Brand updated successfully!");
      } else {
        await axios.post("/api/brands", brandForm, apiHeaders);
        setMessageText("Brand added successfully!");
      }
      setIsBrandFormOpen(false);
      setEditingBrand(null);
      setBrandForm({ name: "", logoUrl: "" });
      await fetchData();
    } catch (err: any) {
      setErrorText("Failed to save brand");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!window.confirm("Delete brand? All associated products will have cascade actions.")) return;
    try {
      setLoading(true);
      await axios.delete(`/api/brands/${brandId}`, apiHeaders);
      setMessageText("Brand deleted successfully");
      await fetchData();
    } catch (err: any) {
      setErrorText("Failed to delete brand");
    } finally {
      setLoading(false);
    }
  };

  // CRUD Category Submit
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name: categoryForm.name,
        isHidden: categoryForm.isHidden,
        orderIndex: Number(categoryForm.orderIndex)
      };
      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory.id}`, payload, apiHeaders);
        setMessageText("Category updated!");
      } else {
        await axios.post("/api/categories", payload, apiHeaders);
        setMessageText("Category created!");
      }
      setIsCategoryFormOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", isHidden: false, orderIndex: "0" });
      await fetchData();
    } catch (err: any) {
      setErrorText("Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      setLoading(true);
      await axios.delete(`/api/categories/${catId}`, apiHeaders);
      setMessageText("Category deleted");
      await fetchData();
    } catch (err: any) {
      setErrorText("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  // CRUD Coupon Submit
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("/api/coupons", couponForm, apiHeaders);
      setMessageText("Promo Coupon created successfully!");
      setIsCouponFormOpen(false);
      setCouponForm({ code: "", type: "percentage", value: "10", expirationDate: "2028-12-31", usageLimit: "100" });
      await fetchData();
    } catch (err: any) {
      setErrorText("Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm("Delete this coupon code?")) return;
    try {
      setLoading(true);
      await axios.delete(`/api/coupons/${couponId}`, apiHeaders);
      setMessageText("Coupon deleted");
      await fetchData();
    } catch (err: any) {
      setErrorText("Failed to delete coupon");
    } finally {
      setLoading(false);
    }
  };

  // Simulated CSV Export
  const handleExportOrders = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Order Number,Customer Name,Phone,Total Amount,Payment,Status,Date\n"
      + orders.map(o => `"${o.orderNumber}","${o.fullName}","${o.phoneNumber}",${o.total},"${o.paymentMethod}","${o.status}","${new Date(o.createdAt).toLocaleDateString()}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear Alerts after 4 seconds
  useEffect(() => {
    if (messageText || errorText) {
      const timer = setTimeout(() => {
        setMessageText("");
        setErrorText("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [messageText, errorText]);

  // Invoice Component
  if (invoiceOrder) {
    const deliveryFee = invoiceOrder.deliveryFee;
    const finalTotal = invoiceOrder.total;
    const subtotal = finalTotal - deliveryFee + invoiceOrder.discountApplied;

    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-6 flex flex-col items-center select-none" id="invoice-overlay">
        <div className="max-w-3xl w-full border-2 border-black p-8 flex flex-col space-y-6">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b border-black pb-6">
            <div>
              <h2 className="font-display font-extrabold text-2xl tracking-tight text-black uppercase">
                {settings.storeName || "ETHIOPHONE SHOP"}
              </h2>
              <p className="text-xs font-mono text-gray-500 mt-1">INVOICE & DELIVERY NOTE</p>
              <p className="text-xs font-sans text-gray-600 mt-2">
                📍 {settings.officeAddress || "Dembel City Center, Addis Ababa"}<br />
                📞 {settings.phone || "+251911223344"} | {settings.email || "info@ethiophone.com"}
              </p>
            </div>
            <div className="text-right font-mono text-xs space-y-1">
              <p className="text-sm font-bold text-blue-600 uppercase">ORDER # {invoiceOrder.orderNumber}</p>
              <p>DATE: {new Date(invoiceOrder.createdAt).toLocaleString()}</p>
              <p>PAYMENT: <span className="font-bold uppercase">{invoiceOrder.paymentMethod}</span></p>
              <p>STATUS: <span className="font-bold uppercase">{invoiceOrder.status}</span></p>
            </div>
          </div>

          {/* Customer Address Details */}
          <div className="grid grid-cols-2 gap-6 border-b border-black pb-6 text-xs">
            <div>
              <h4 className="font-mono font-bold text-gray-400 mb-1.5 uppercase">DELIVERY ADDRESS</h4>
              <p className="font-bold text-black text-sm">{invoiceOrder.fullName}</p>
              <p className="font-semibold text-blue-600 mt-0.5">{invoiceOrder.phoneNumber}</p>
              {invoiceOrder.altPhoneNumber && <p className="text-gray-500 mt-0.5">Alt: {invoiceOrder.altPhoneNumber}</p>}
              <p className="text-gray-700 mt-1.5">
                {invoiceOrder.region} Region, {invoiceOrder.city} City<br />
                Subcity: {invoiceOrder.subCity}, Woreda: {invoiceOrder.woreda}<br />
                House: {invoiceOrder.houseNumber || "N/A"}<br />
                Address: <span className="font-semibold">{invoiceOrder.deliveryAddress}</span>
              </p>
            </div>
            <div>
              <h4 className="font-mono font-bold text-gray-400 mb-1.5 uppercase">NOTES & INSTRUCTIONS</h4>
              <p className="text-gray-600 italic leading-relaxed">
                {invoiceOrder.deliveryNotes || "No specific instructions given."}
              </p>
              <div className="mt-4 border border-black p-2 font-mono text-[11px] bg-gray-50">
                ⚠️ <span className="font-bold">Notice:</span> Please verify package seal and power on device during physical delivery. Sign receipt of delivery only when satisfied.
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1">
            <table className="w-full text-xs text-left border border-black font-sans">
              <thead className="bg-black text-white font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3 border-r border-black">PRODUCT</th>
                  <th className="p-3 border-r border-black">SPECIFICATIONS</th>
                  <th className="p-3 border-r border-black text-right">UNIT PRICE</th>
                  <th className="p-3 border-r border-black text-center">QTY</th>
                  <th className="p-3 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {invoiceOrder.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 border-r border-black font-semibold text-black">{item.name}</td>
                    <td className="p-3 border-r border-black font-mono text-[10px] text-gray-500">
                      {item.color && <span>Color: {item.color} | </span>}
                      {item.storage && <span>Storage: {item.storage} | </span>}
                      {item.ram && <span>RAM: {item.ram}</span>}
                    </td>
                    <td className="p-3 border-r border-black text-right font-mono">{item.price.toLocaleString()} ETB</td>
                    <td className="p-3 border-r border-black text-center font-mono">{item.quantity}</td>
                    <td className="p-3 text-right font-mono font-bold">{(item.price * item.quantity).toLocaleString()} ETB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing totals */}
          <div className="border-t border-black pt-4 flex justify-end text-xs font-mono">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-gray-500">
                <span>ITEMS SUBTOTAL:</span>
                <span>{subtotal.toLocaleString()} ETB</span>
              </div>
              {invoiceOrder.discountApplied > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>DISCOUNT ({invoiceOrder.couponCode}):</span>
                  <span>- {invoiceOrder.discountApplied.toLocaleString()} ETB</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500 border-b border-dashed border-gray-400 pb-2">
                <span>DELIVERY FEE:</span>
                <span>{deliveryFee.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-base font-bold text-black pt-1">
                <span>GRAND TOTAL:</span>
                <span>{finalTotal.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs font-mono">
            <div className="border-t border-black pt-4">
              <p>CUSTOMER SIGNATURE</p>
              <p className="text-[10px] text-gray-400 mt-2">I verify that goods were received in full condition</p>
            </div>
            <div className="border-t border-black pt-4">
              <p>DISPATCHER / ETHIOPHONE SIGNATURE</p>
              <p className="text-[10px] text-gray-400 mt-2">Dembel Addis Ababa Hub Authorized Stamp</p>
            </div>
          </div>

          {/* Invoice buttons */}
          <div className="pt-8 border-t border-gray-100 flex justify-between items-center no-print">
            <button
              onClick={() => window.print()}
              className="bg-black text-white px-5 py-2 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-blue-600"
              id="print-invoice-action-btn"
            >
              <Printer className="w-4 h-4" /> PRINT INVOICE
            </button>
            <button
              onClick={() => setInvoiceOrder(null)}
              className="border border-black px-5 py-2 text-xs font-mono font-bold hover:bg-gray-100"
              id="close-invoice-btn"
            >
              CLOSE WINDOW
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-black pb-4 mb-6 gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl tracking-tighter text-black uppercase flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            ADMIN PORTAL
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">STORE CONTROLLER & DISPATCHER SYSTEMS</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setLoading(true);
              await fetchData();
              setLoading(false);
            }}
            className="border border-black p-2 hover:bg-gray-50 text-black flex items-center justify-center"
            title="Refresh All Server Data"
            id="admin-refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onLogout}
            className="bg-black text-white text-xs font-mono font-bold px-3 py-2 flex items-center gap-1.5 hover:bg-red-600"
            id="admin-logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" /> SIGN OUT
          </button>
        </div>
      </div>

      {/* Global Toast Alerts */}
      {messageText && (
        <div className="bg-blue-50 text-blue-600 px-4 py-3 mb-6 text-xs font-mono flex items-center justify-between border-none shadow-sm">
          <span>✔️ {messageText}</span>
        </div>
      )}
      {errorText && (
        <div className="bg-red-50 text-red-600 px-4 py-3 mb-6 text-xs font-mono flex items-center justify-between border-none shadow-sm">
          <span>❌ {errorText}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Drawer Navigation */}
        <div className="lg:col-span-1 shadow-sm bg-white flex flex-col font-mono text-xs font-semibold border-none">
          <div className="bg-black text-white p-3 font-bold text-[10px] tracking-wider uppercase">
            OPERATING SYSTEMS
          </div>
          
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left p-3 border-b border-gray-100 flex items-center justify-between transition-all ${
              activeTab === "dashboard" ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> DASHBOARD
            </span>
          </button>

          <button
            onClick={() => setActiveTab("phones")}
            className={`w-full text-left p-3 border-b border-gray-100 flex items-center justify-between transition-all ${
              activeTab === "phones" ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4" /> PHONES ({totalPhonesCount})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("brands")}
            className={`w-full text-left p-3 border-b border-gray-100 flex items-center justify-between transition-all ${
              activeTab === "brands" ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <LayoutList className="w-4 h-4" /> BRANDS ({totalBrandsCount})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`w-full text-left p-3 border-b border-gray-100 flex items-center justify-between transition-all ${
              activeTab === "categories" ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <ListPlus className="w-4 h-4" /> CATEGORIES ({totalCategoriesCount})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full text-left p-3 border-b border-gray-100 flex items-center justify-between transition-all ${
              activeTab === "orders" ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> ORDERS ({totalOrdersCount})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("coupons")}
            className={`w-full text-left p-3 border-b border-gray-100 flex items-center justify-between transition-all ${
              activeTab === "coupons" ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4" /> COUPONS ({coupons.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`w-full text-left p-3 border-b border-gray-100 flex items-center justify-between transition-all ${
              activeTab === "messages" ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> MESSAGES
            </span>
            {unreadMessagesCount > 0 && (
              <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 border border-white">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full text-left p-3 border-b border-gray-100 flex items-center justify-between transition-all ${
              activeTab === "notifications" ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4" /> ALERTS
            </span>
            {unreadNotificationsCount > 0 && (
              <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 border border-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full text-left p-3 flex items-center justify-between transition-all ${
              activeTab === "settings" ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-black"
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" /> SETTINGS
            </span>
          </button>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-4 min-h-[500px]">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in">
              {/* Statistical cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="shadow-sm p-4 bg-white flex flex-col justify-between border-none">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase">REVENUE (ETB)</span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="font-mono font-bold text-lg text-black mt-2">
                    {totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-gray-400 font-mono mt-1">Excl. Cancelled Orders</p>
                </div>

                <div className="shadow-sm p-4 bg-white flex flex-col justify-between border-none">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase">TOTAL ORDERS</span>
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="font-mono font-bold text-lg text-black mt-2">
                    {totalOrdersCount}
                  </p>
                  <p className="text-[9px] text-gray-400 font-mono mt-1">
                    {orders.filter(o => o.status === "Pending").length} Pending dispatch
                  </p>
                </div>

                <div className="shadow-sm p-4 bg-white flex flex-col justify-between border-none">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase">PHONES IN STOCK</span>
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="font-mono font-bold text-lg text-black mt-2">
                    {totalPhonesCount}
                  </p>
                  <p className="text-[9px] text-gray-400 font-mono mt-1">
                    {phones.filter(p => p.stock === 0).length} Out of stock
                  </p>
                </div>

                <div className="shadow-sm p-4 bg-white flex flex-col justify-between border-none">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase">REVIEWS</span>
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="font-mono font-bold text-lg text-black mt-2">
                    {totalReviewsCount}
                  </p>
                  <p className="text-[9px] text-gray-400 font-mono mt-1">Average rating: 4.8★</p>
                </div>
              </div>

              {/* Dynamic SVG Sales Graph */}
              <div className="shadow-md p-6 bg-white flex flex-col border-none">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-display font-bold text-sm text-black uppercase">REVENUE GROWTH GRAPH (MOCK DATA)</h3>
                    <p className="text-[10px] font-mono text-gray-500 uppercase mt-0.5">Monthly sales performance in ETB</p>
                  </div>
                  <span className="bg-blue-600 text-white font-mono text-[9px] font-semibold px-2 py-0.5 border border-blue-600">6-MONTH ANALYTICS</span>
                </div>

                {/* SVG Visual Bar Chart */}
                <div className="w-full h-64 flex items-end justify-between border-b border-l border-gray-200 pb-2 pl-2 relative">
                  {monthlyRevenue.map((m, idx) => {
                    const barHeight = (m.revenue / maxRevenueVal) * 180 || 10;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center group relative px-2">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 bg-black text-white text-[10px] font-mono py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                          {m.revenue.toLocaleString()} ETB | {m.orders} orders
                        </div>
                        {/* The visual block */}
                        <div 
                          style={{ height: `${barHeight}px` }} 
                          className="w-full bg-blue-600 transition-all duration-500 hover:bg-black"
                        />
                        <span className="text-[10px] font-mono font-bold text-black mt-2">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notifications Brief & Recent Orders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Pending Tasks Panel */}
                <div className="shadow-sm p-4 bg-white flex flex-col border-none">
                  <h4 className="font-display font-bold text-xs text-black border-b border-gray-100 pb-2 mb-3 uppercase">
                    PENDING ACTIONS
                  </h4>
                  <div className="flex-1 divide-y divide-gray-100 font-sans text-xs">
                    {orders.filter(o => o.status === "Pending").length > 0 ? (
                      orders.filter(o => o.status === "Pending").slice(0, 4).map(o => (
                        <div key={o.id} className="py-2 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-black">Order {o.orderNumber}</p>
                            <p className="text-[10px] font-mono text-gray-500">{o.fullName} - {o.total.toLocaleString()} ETB</p>
                          </div>
                          <button
                            onClick={() => { setActiveTab("orders"); }}
                            className="bg-black hover:bg-blue-600 text-white text-[10px] font-mono font-bold px-2.5 py-1 shadow-sm border-none transition-all"
                          >
                            DISPATCH
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 py-4 italic">No pending orders. Good job!</p>
                    )}
                  </div>
                </div>

                {/* System Alerts */}
                <div className="shadow-sm p-4 bg-white flex flex-col border-none">
                  <h4 className="font-display font-bold text-xs text-black border-b border-gray-100 pb-2 mb-3 uppercase">
                    RECENT ALERTS
                  </h4>
                  <div className="flex-1 divide-y divide-gray-100 font-mono text-[11px] text-gray-700">
                    {notifications.slice(0, 4).map(notif => (
                      <div key={notif.id} className="py-2 flex justify-between items-start gap-3">
                        <div>
                          <p className={`font-bold ${notif.isRead ? "text-gray-400" : "text-black"}`}>
                            [{notif.type.toUpperCase()}] {notif.title}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{notif.message}</p>
                        </div>
                        {!notif.isRead && (
                          <button 
                            onClick={() => handleMarkNotificationRead(notif.id)}
                            className="text-[9px] font-bold text-blue-600 hover:underline flex-shrink-0"
                          >
                            ACK
                          </button>
                        )}
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-gray-400 py-4 italic">No active system alerts.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: PHONE / ACCESSORY CRUD MANAGEMENT */}
          {activeTab === "phones" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="relative max-w-xs border border-black flex-1">
                  <input
                    type="text"
                    placeholder="Search phones..."
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white text-black outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingPhone(null);
                    setPhoneForm({
                      name: "",
                      brandId: brands[0]?.id || "",
                      categoryId: categories[0]?.id || "",
                      model: "",
                      price: "50000",
                      discount: "0",
                      stock: "10",
                      description: "",
                      warranty: "1 Year Local Warranty",
                      isFeatured: false,
                      isFlashSale: false,
                      videoUrl: "",
                      images: ["", ""],
                      variants: [
                        { color: "Black", storage: "256GB", ram: "8GB", priceModifier: 0, stock: 5 },
                        { color: "Silver", storage: "256GB", ram: "8GB", priceModifier: 0, stock: 5 }
                      ]
                    });
                    setIsPhoneFormOpen(true);
                  }}
                  className="bg-black text-white text-xs font-mono font-bold px-3 py-2 flex items-center gap-1.5 hover:bg-blue-600"
                  id="admin-add-phone-btn"
                >
                  <Plus className="w-4 h-4" /> ADD PRODUCT
                </button>
              </div>

              {isPhoneFormOpen && (
                <form onSubmit={handlePhoneSubmit} className="shadow-md p-6 bg-gray-50 space-y-4 border-none">
                  <h3 className="font-display font-bold text-sm text-black border-b border-gray-100 pb-2 uppercase">
                    {editingPhone ? "EDIT PRODUCT DETAILS" : "ADD NEW SMARTPHONE / ACCESSORY"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-mono font-bold text-black">PRODUCT NAME *</label>
                      <input
                        type="text"
                        required
                        value={phoneForm.name}
                        onChange={(e) => setPhoneForm({ ...phoneForm, name: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono font-bold text-black">BRAND *</label>
                      <select
                        required
                        value={phoneForm.brandId}
                        onChange={(e) => setPhoneForm({ ...phoneForm, brandId: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      >
                        <option value="">Select Brand</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono font-bold text-black">CATEGORY *</label>
                      <select
                        required
                        value={phoneForm.categoryId}
                        onChange={(e) => setPhoneForm({ ...phoneForm, categoryId: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-mono font-bold text-black">MODEL / NUMBER *</label>
                      <input
                        type="text"
                        required
                        value={phoneForm.model}
                        onChange={(e) => setPhoneForm({ ...phoneForm, model: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono font-bold text-black">BASE PRICE (ETB) *</label>
                      <input
                        type="number"
                        required
                        value={phoneForm.price}
                        onChange={(e) => setPhoneForm({ ...phoneForm, price: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono font-bold text-black">DISCOUNT (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={phoneForm.discount}
                        onChange={(e) => setPhoneForm({ ...phoneForm, discount: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono font-bold text-black">BASE STOCK *</label>
                      <input
                        type="number"
                        required
                        value={phoneForm.stock}
                        onChange={(e) => setPhoneForm({ ...phoneForm, stock: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-mono font-bold text-black">IMAGE URL 1 (MAIN) *</label>
                        <label className="cursor-pointer font-mono font-bold text-purple-600 hover:text-purple-800 transition-all text-[10px]">
                          {uploadingImg1 ? "[ UPLOADING... ]" : "[ UPLOAD LOCAL FILE ]"}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingImg1}
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingImg1(true);
                              try {
                                const res = await uploadFiles("imageUploader", { files: [file] });
                                if (res && res[0]?.url) {
                                  const imgs = [...phoneForm.images];
                                  imgs[0] = res[0].url;
                                  setPhoneForm({ ...phoneForm, images: imgs });
                                }
                              } catch (err: any) {
                                alert("Upload failed: " + err.message);
                              } finally {
                                setUploadingImg1(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="https://images.unsplash.com/photo-..."
                        value={phoneForm.images[0]}
                        onChange={(e) => {
                          const imgs = [...phoneForm.images];
                          imgs[0] = e.target.value;
                          setPhoneForm({ ...phoneForm, images: imgs });
                        }}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 font-mono text-[11px] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-mono font-bold text-black">IMAGE URL 2 (OPTIONAL)</label>
                        <label className="cursor-pointer font-mono font-bold text-purple-600 hover:text-purple-800 transition-all text-[10px]">
                          {uploadingImg2 ? "[ UPLOADING... ]" : "[ UPLOAD LOCAL FILE ]"}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingImg2}
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingImg2(true);
                              try {
                                const res = await uploadFiles("imageUploader", { files: [file] });
                                if (res && res[0]?.url) {
                                  const imgs = [...phoneForm.images];
                                  imgs[1] = res[0].url;
                                  setPhoneForm({ ...phoneForm, images: imgs });
                                }
                              } catch (err: any) {
                                alert("Upload failed: " + err.message);
                              } finally {
                                setUploadingImg2(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={phoneForm.images[1]}
                        onChange={(e) => {
                          const imgs = [...phoneForm.images];
                          imgs[1] = e.target.value;
                          setPhoneForm({ ...phoneForm, images: imgs });
                        }}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 font-mono text-[11px] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-mono font-bold text-black">YOUTUBE VIDEO LINK (OPTIONAL)</label>
                      <input
                        type="text"
                        placeholder="https://youtube.com/watch?v=..."
                        value={phoneForm.videoUrl}
                        onChange={(e) => setPhoneForm({ ...phoneForm, videoUrl: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 font-mono text-[11px] transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono font-bold text-black">WARRANTY CLAUSE</label>
                      <input
                        type="text"
                        value={phoneForm.warranty}
                        onChange={(e) => setPhoneForm({ ...phoneForm, warranty: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-mono font-bold text-black">PRODUCT DESCRIPTION *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write premium sales and performance reviews..."
                      value={phoneForm.description}
                      onChange={(e) => setPhoneForm({ ...phoneForm, description: e.target.value })}
                      className="w-full bg-white shadow-sm p-2.5 font-sans border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                    />
                  </div>

                  {/* Highlights */}
                  <div className="flex items-center gap-6 text-xs font-mono font-bold pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={phoneForm.isFeatured}
                        onChange={(e) => setPhoneForm({ ...phoneForm, isFeatured: e.target.checked })}
                      />
                      SET FEATURED BANNER
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-red-600">
                      <input
                        type="checkbox"
                        checked={phoneForm.isFlashSale}
                        onChange={(e) => setPhoneForm({ ...phoneForm, isFlashSale: e.target.checked })}
                      />
                      FLASH SALE DEALS
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPhoneFormOpen(false)}
                      className="bg-gray-100 px-4 py-2 text-xs font-mono font-bold hover:bg-gray-200 transition-all text-black shadow-sm"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-xs font-mono font-bold shadow-md transition-all"
                    >
                      SAVE PRODUCT
                    </button>
                  </div>
                </form>
              )}

              {/* Product table list */}
              <div className="shadow-md overflow-x-auto bg-white border-none">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-black text-white font-mono uppercase text-[10px] border-none">
                    <tr>
                      <th className="p-3 border-none">PRODUCT</th>
                      <th className="p-3 border-none">MODEL & BRAND</th>
                      <th className="p-3 border-none text-right">BASE PRICE</th>
                      <th className="p-3 border-none text-center">STOCK</th>
                      <th className="p-3 border-none text-center">PROMOTIONS</th>
                      <th className="p-3 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {phones
                      .filter(p => p.name.toLowerCase().includes(phoneSearch.toLowerCase()))
                      .map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 font-sans">
                          <td className="p-3 border-none flex items-center gap-3 font-semibold text-black">
                            <img src={p.images?.[0]?.url} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                            <span>{p.name}</span>
                          </td>
                          <td className="p-3 border-none font-mono">
                            <span className="font-bold text-gray-500">{p.brand?.name}</span> / {p.model}
                          </td>
                          <td className="p-3 border-none text-right font-mono font-bold">
                            {p.price.toLocaleString()} ETB
                          </td>
                          <td className={`p-3 border-none text-center font-mono font-bold ${p.stock <= 2 ? "text-red-600" : "text-black"}`}>
                            {p.stock} units
                          </td>
                          <td className="p-3 border-none text-center font-mono text-[10px] space-y-1">
                            {p.isFeatured && <span className="bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 block">FEATURED</span>}
                            {p.isFlashSale && <span className="bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 block">FLASH</span>}
                            {p.discount > 0 && <span className="bg-green-100 text-green-800 border border-green-200 px-1.5 py-0.5 block">-{p.discount}% OFF</span>}
                          </td>
                          <td className="p-3 text-center space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleEditPhoneClick(p)}
                              className="bg-gray-50 hover:bg-black hover:text-white p-1.5 text-black transition-all shadow-sm"
                              title="Edit Phone details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePhone(p.id)}
                              className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 p-1.5 transition-all shadow-sm"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BRAND CRUD */}
          {activeTab === "brands" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-sm text-black uppercase">MANAGE PHONE BRANDS</h3>
                <button
                  onClick={() => {
                    setEditingBrand(null);
                    setBrandForm({ name: "", logoUrl: "" });
                    setIsBrandFormOpen(true);
                  }}
                  className="bg-black text-white text-xs font-mono font-bold px-3 py-2 flex items-center gap-1.5 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" /> ADD BRAND
                </button>
              </div>

              {isBrandFormOpen && (
                <form onSubmit={handleBrandSubmit} className="shadow-md p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-none">
                  <div className="text-xs space-y-1">
                    <label className="font-mono font-bold">BRAND NAME</label>
                    <input
                      type="text"
                      required
                      value={brandForm.name}
                      onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                      className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                    />
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="font-mono font-bold">LOGO URL (OPTIONAL)</label>
                      <label className="cursor-pointer font-mono font-bold text-purple-600 hover:text-purple-800 transition-all text-[10px]">
                        {uploadingBrand ? "[ UPLOADING... ]" : "[ UPLOAD LOCAL LOGO ]"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingBrand}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingBrand(true);
                            try {
                              const res = await uploadFiles("imageUploader", { files: [file] });
                              if (res && res[0]?.url) {
                                setBrandForm({ ...brandForm, logoUrl: res[0].url });
                              }
                            } catch (err: any) {
                              alert("Upload failed: " + err.message);
                            } finally {
                              setUploadingBrand(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={brandForm.logoUrl}
                      onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                      className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 font-mono text-[11px] transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-mono font-bold py-2 transition-all shadow-md"
                    >
                      {editingBrand ? "UPDATE" : "CREATE"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBrandFormOpen(false)}
                      className="bg-gray-100 text-black text-xs font-mono font-bold px-3 py-2 hover:bg-gray-200 transition-all shadow-sm"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}

              <div className="shadow-md bg-white border-none">
                <table className="w-full text-xs text-left">
                  <thead className="bg-black text-white font-mono uppercase text-[10px] border-none">
                    <tr>
                      <th className="p-3 border-none">LOGO</th>
                      <th className="p-3 border-none">BRAND NAME</th>
                      <th className="p-3 border-none text-center">TOTAL DEVICES</th>
                      <th className="p-3 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {brands.map(b => (
                      <tr key={b.id}>
                        <td className="p-3 border-none">
                          {b.logoUrl ? (
                            <img src={b.logoUrl} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="font-mono font-bold bg-gray-100 text-gray-500 px-2 py-1">TXT-LOGO</span>
                          )}
                        </td>
                        <td className="p-3 border-none font-semibold text-black">{b.name}</td>
                        <td className="p-3 border-none text-center font-mono">{b._count?.phones || 0} phones</td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingBrand(b);
                              setBrandForm({ name: b.name, logoUrl: b.logoUrl || "" });
                              setIsBrandFormOpen(true);
                            }}
                            className="bg-gray-50 hover:bg-black hover:text-white p-1 text-black transition-all shadow-sm"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(b.id)}
                            className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 p-1 transition-all shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORY CRUD */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-sm text-black uppercase">MANAGE CATEGORIES</h3>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: "", isHidden: false, orderIndex: String(categories.length) });
                    setIsCategoryFormOpen(true);
                  }}
                  className="bg-black text-white text-xs font-mono font-bold px-3 py-2 flex items-center gap-1.5 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" /> ADD CATEGORY
                </button>
              </div>

              {isCategoryFormOpen && (
                <form onSubmit={handleCategorySubmit} className="shadow-md p-4 bg-gray-50 space-y-4 border-none">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-xs space-y-1">
                      <label className="font-mono font-bold">CATEGORY NAME</label>
                      <input
                        type="text"
                        required
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                    <div className="text-xs space-y-1">
                      <label className="font-mono font-bold">ORDER INDEX</label>
                      <input
                        type="number"
                        required
                        value={categoryForm.orderIndex}
                        onChange={(e) => setCategoryForm({ ...categoryForm, orderIndex: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <label className="font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={categoryForm.isHidden}
                          onChange={(e) => setCategoryForm({ ...categoryForm, isHidden: e.target.checked })}
                        />
                        HIDE CATEGORY IN USER MENU
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-mono font-bold px-4 py-2 transition-all shadow-md"
                    >
                      {editingCategory ? "UPDATE" : "CREATE"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCategoryFormOpen(false)}
                      className="bg-gray-100 text-black text-xs font-mono font-bold px-4 py-2 hover:bg-gray-200 transition-all shadow-sm"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}

              <div className="shadow-md bg-white border-none">
                <table className="w-full text-xs text-left">
                  <thead className="bg-black text-white font-mono uppercase text-[10px] border-none">
                    <tr>
                      <th className="p-3 border-none">SORT INDEX</th>
                      <th className="p-3 border-none">CATEGORY NAME</th>
                      <th className="p-3 border-none text-center">DEVICES / ACC.</th>
                      <th className="p-3 border-none text-center">MENU VISIBILITY</th>
                      <th className="p-3 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map(c => (
                      <tr key={c.id}>
                        <td className="p-3 border-none font-mono font-bold text-center w-24">{c.orderIndex}</td>
                        <td className="p-3 border-none font-semibold text-black">{c.name}</td>
                        <td className="p-3 border-none text-center font-mono">{c._count?.phones || 0} items</td>
                        <td className="p-3 border-none text-center font-mono">
                          {c.isHidden ? (
                            <span className="text-red-600 bg-red-50 px-2 py-0.5 font-bold text-[9px] uppercase shadow-sm">HIDDEN</span>
                          ) : (
                            <span className="text-green-600 bg-green-50 px-2 py-0.5 font-bold text-[9px] uppercase shadow-sm">ACTIVE</span>
                          )}
                        </td>
                        <td className="p-3 text-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingCategory(c);
                              setCategoryForm({ name: c.name, isHidden: c.isHidden, orderIndex: String(c.orderIndex) });
                              setIsCategoryFormOpen(true);
                            }}
                            className="bg-gray-50 hover:bg-black hover:text-white p-1 text-black transition-all shadow-sm"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 p-1 transition-all shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ORDERS DISPATCH SYSTEM */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-sm text-black uppercase">ORDER MANAGEMENT & INVOICING</h3>
                <button
                  onClick={handleExportOrders}
                  className="bg-black text-white text-xs font-mono font-bold px-3 py-2 flex items-center gap-1.5 hover:bg-blue-600"
                >
                  <Download className="w-4 h-4" /> EXPORT EXCEL/CSV
                </button>
              </div>

              <div className="shadow-md bg-white overflow-x-auto border-none">
                <table className="w-full text-xs text-left">
                  <thead className="bg-black text-white font-mono uppercase text-[10px] border-none">
                    <tr>
                      <th className="p-3 border-none">ORDER ID</th>
                      <th className="p-3 border-none">CUSTOMER</th>
                      <th className="p-3 border-none">CONTACT</th>
                      <th className="p-3 border-none text-right">TOTAL AMOUNT</th>
                      <th className="p-3 border-none text-center">STATUS</th>
                      <th className="p-3 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50 font-sans">
                        <td className="p-3 border-none font-mono font-bold text-blue-600">
                          {o.orderNumber}
                        </td>
                        <td className="p-3 border-none">
                          <p className="font-semibold text-black">{o.fullName}</p>
                          <p className="text-[10px] text-gray-500">{o.city} | {o.subCity}</p>
                        </td>
                        <td className="p-3 border-none font-mono">
                          {o.phoneNumber}
                        </td>
                        <td className="p-3 border-none text-right font-mono font-bold">
                          {o.total.toLocaleString()} ETB
                        </td>
                        <td className="p-3 border-none text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase shadow-sm ${getStatusColor(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-3 text-center space-x-1 space-y-1 whitespace-nowrap">
                          {/* Invoice Trigger */}
                          <button
                            onClick={() => setInvoiceOrder(o)}
                            className="bg-gray-50 hover:bg-black hover:text-white text-black p-1.5 inline-flex items-center gap-1 shadow-sm border-none transition-all"
                            title="Print Invoice / Delivery slip"
                          >
                            <Printer className="w-3 h-3" />
                            <span className="text-[9px] font-mono font-bold">SLIP</span>
                          </button>

                          {/* Quick Status selectors */}
                          <select
                            value={o.status}
                            onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                            className="bg-gray-50 shadow-sm px-1.5 py-1 font-mono text-[9px] font-bold border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                          >
                            <option value="Pending">PENDING</option>
                            <option value="Confirmed">CONFIRM</option>
                            <option value="Preparing">PREPARE</option>
                            <option value="Ready">READY</option>
                            <option value="Shipped">SHIPPED</option>
                            <option value="Delivered">DELIVERED</option>
                            <option value="Cancelled">CANCEL</option>
                          </select>

                          {/* Delete */}
                          <button
                            onClick={() => handleOrderDelete(o.id)}
                            className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 p-1.5 inline-flex shadow-sm transition-all border-none"
                            title="Delete order"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400 italic border-none">No customer orders found in system.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: COUPON MANAGER */}
          {activeTab === "coupons" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-sm text-black uppercase">MANAGE COUPONS & PROMOS</h3>
                <button
                  onClick={() => setIsCouponFormOpen(true)}
                  className="bg-black text-white text-xs font-mono font-bold px-3 py-2 flex items-center gap-1.5 hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" /> NEW COUPON
                </button>
              </div>

              {isCouponFormOpen && (
                <form onSubmit={handleCouponSubmit} className="shadow-md p-4 bg-gray-50 space-y-4 border-none">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-mono font-bold">COUPON CODE *</label>
                      <input
                        type="text"
                        required
                        placeholder="SUMMER20"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono font-bold">DISCOUNT TYPE</label>
                      <select
                        value={couponForm.type}
                        onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all font-bold"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed (Birr)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono font-bold">DISCOUNT VALUE *</label>
                      <input
                        type="number"
                        required
                        value={couponForm.value}
                        onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono font-bold">LIMIT USES</label>
                      <input
                        type="number"
                        required
                        value={couponForm.usageLimit}
                        onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-mono font-bold">EXPIRATION DATE *</label>
                      <input
                        type="date"
                        required
                        value={couponForm.expirationDate}
                        onChange={(e) => setCouponForm({ ...couponForm, expirationDate: e.target.value })}
                        className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 font-mono transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-mono font-bold px-4 py-2 transition-all shadow-md"
                    >
                      CREATE COUPON
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCouponFormOpen(false)}
                      className="bg-gray-100 text-black text-xs font-mono font-bold px-4 py-2 hover:bg-gray-200 transition-all shadow-sm"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}

              <div className="shadow-md bg-white border-none">
                <table className="w-full text-xs text-left">
                  <thead className="bg-black text-white font-mono uppercase text-[10px] border-none">
                    <tr>
                      <th className="p-3 border-none">CODE</th>
                      <th className="p-3 border-none text-center">TYPE</th>
                      <th className="p-3 border-none text-right">VALUE</th>
                      <th className="p-3 border-none text-center">USES</th>
                      <th className="p-3 border-none text-center">EXPIRATION</th>
                      <th className="p-3 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coupons.map(c => (
                      <tr key={c.id}>
                        <td className="p-3 border-none font-mono font-bold text-black">{c.code}</td>
                        <td className="p-3 border-none text-center font-mono uppercase">{c.type}</td>
                        <td className="p-3 border-none text-right font-mono font-bold">{c.value} {c.type === "fixed" ? "ETB" : "%"}</td>
                        <td className="p-3 border-none text-center font-mono">
                          {c.usageCount} / {c.usageLimit || "unlimited"}
                        </td>
                        <td className="p-3 border-none text-center font-mono">
                          {new Date(c.expirationDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="bg-red-50 hover:bg-red-600 hover:text-white text-red-600 p-1.5 transition-all shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: CONTACT MESSAGES */}
          {activeTab === "messages" && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-sm text-black uppercase">CUSTOMER CONTACT ENQUIRIES</h3>
              <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`p-4 relative font-sans shadow-sm border-none transition-all ${msg.isRead ? "bg-gray-50/50 text-gray-500" : "bg-white text-black"}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-black text-sm">{msg.name}</h4>
                        <p className="text-xs font-mono text-gray-500">
                          📞 {msg.phone} {msg.email && `| ✉️ ${msg.email}`}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 mt-3 leading-relaxed bg-gray-50/50 p-3 shadow-inner border-none">
                      {msg.message}
                    </p>
                    <div className="mt-3 flex justify-end gap-2 text-xs font-mono">
                      {!msg.isRead && (
                        <button
                          onClick={() => handleMarkMessageRead(msg.id)}
                          className="bg-purple-600 text-white px-3 py-1 text-[10px] font-bold hover:bg-purple-700 transition-all shadow-sm"
                        >
                          MARK AS READ
                        </button>
                      )}
                      <a
                        href={`tel:${msg.phone}`}
                        className="bg-gray-100 text-black px-3 py-1 text-[10px] font-bold hover:bg-gray-200 transition-all shadow-sm"
                      >
                        CALL CUSTOMER
                      </a>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-center py-12 text-gray-400 italic">No contact enquiries received.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: ALERTS & LOGS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-sm text-black uppercase">SYSTEM ALERTS & NOTIFICATIONS</h3>
              <div className="space-y-2">
                {notifications.map(notif => (
                  <div key={notif.id} className={`p-3.5 flex justify-between items-start gap-4 shadow-sm border-none transition-all ${notif.isRead ? "bg-gray-50" : "bg-white font-semibold"}`}>
                    <div className="font-mono text-xs">
                      <p className="font-bold text-black">
                        [{notif.type.toUpperCase()}] {notif.title}
                      </p>
                      <p className="text-gray-500 mt-1">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2">ALARM_TIME: {new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkNotificationRead(notif.id)}
                        className="bg-black text-white px-3 py-1 text-[10px] font-mono font-bold hover:bg-purple-600 transition-all flex-shrink-0 shadow-sm"
                      >
                        ACKNOWLEDGE
                      </button>
                    )}
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-center py-12 text-gray-400 italic">No system alerts generated.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: WEBSITE SETTINGS EDITOR */}
          {activeTab === "settings" && (
            <form onSubmit={handleSaveSettings} className="shadow-md p-6 bg-white space-y-6 border-none">
              <h3 className="font-display font-bold text-sm text-black border-b border-gray-100 pb-2 uppercase">
                WEBSITE INTERFACE SETTINGS
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-mono font-bold">STORE NAME</label>
                  <input
                    type="text"
                    value={settingsForm.storeName || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-bold">LOGO HEADER TEXT</label>
                  <input
                    type="text"
                    value={settingsForm.logoText || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, logoText: e.target.value })}
                    className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-mono font-bold">SUPPORT PHONE NUMBER</label>
                  <input
                    type="text"
                    value={settingsForm.phone || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-bold">DISPATCHER PHONE NUMBER (ALT)</label>
                  <input
                    type="text"
                    value={settingsForm.altPhone || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, altPhone: e.target.value })}
                    className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-bold">SUPPORT EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={settingsForm.email || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-mono font-bold">TELEGRAM USERNAME</label>
                  <input
                    type="text"
                    value={settingsForm.telegram || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telegram: e.target.value })}
                    className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-bold">WHATSAPP LINK</label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                    className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-bold">TIKTOK HANDLE</label>
                  <input
                    type="text"
                    value={settingsForm.tiktok || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tiktok: e.target.value })}
                    className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-mono font-bold">METRO DELIVERY FEE (BIRR)</label>
                  <input
                    type="text"
                    value={settingsForm.deliveryFee || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: e.target.value })}
                    className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 font-mono transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-bold">OFFICE BUSINESS HOURS</label>
                  <input
                    type="text"
                    value={settingsForm.businessHours || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, businessHours: e.target.value })}
                    className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                  />
                </div>
              </div>

              <div className="text-xs space-y-1">
                <label className="font-mono font-bold">OFFICE PHYSICAL LOCATION ADDRESS</label>
                <input
                  type="text"
                  value={settingsForm.officeAddress || ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeAddress: e.target.value })}
                  className="w-full bg-white shadow-sm px-2.5 py-2 border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                />
              </div>

              <div className="text-xs space-y-1">
                <label className="font-mono font-bold">ACTIVE SERVICE REGIONS & METRO DELIVERY AREAS</label>
                <textarea
                  rows={2}
                  value={settingsForm.deliveryAreas || ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deliveryAreas: e.target.value })}
                  className="w-full bg-white shadow-sm p-2.5 font-sans border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                />
              </div>

              <div className="text-xs space-y-1">
                <label className="font-mono font-bold">WARRANTY POLICY SUMMARY CLAUSE</label>
                <textarea
                  rows={3}
                  value={settingsForm.warrantyInfo || ""}
                  onChange={(e) => setSettingsForm({ ...settingsForm, warrantyInfo: e.target.value })}
                  className="w-full bg-white shadow-sm p-2.5 font-sans border-none outline-none focus:ring-1 focus:ring-purple-600 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-2.5 text-xs font-mono font-bold hover:bg-purple-700 transition-all flex items-center gap-1.5 shadow-md"
                  id="admin-settings-submit"
                >
                  <CheckSquare className="w-4 h-4" /> SAVE CONFIGURATION
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
