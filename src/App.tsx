// src/App.tsx
import React, { useState, useEffect } from "react";
import {
  Heart,
  ShoppingBag,
  Search,
  Phone as PhoneIcon,
  Mail,
  MapPin,
  ChevronRight,
  Star,
  Youtube,
  Share2,
  Clipboard,
  ArrowLeft,
  ArrowRight,
  Send,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ShoppingCart,
  User,
  Truck,
  HelpCircle,
  Grid,
  List,
  FileText,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import MockChapa from "./components/MockChapa";
import AdminPanel from "./components/AdminPanel";
import {
  Phone,
  PhoneVariant,
  Brand,
  Category,
  Order,
  Coupon,
  ContactMessage,
  Notification,
  WebsiteSettings,
  CartItem,
} from "./types";
import axios from "axios";

export default function App() {
  // Core Page Router
  const [activePage, setActivePage] = useState<string>("home");

  // Server-Loaded Data States
  const [phones, setPhones] = useState<Phone[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings>({});
  const [blogs, setBlogs] = useState<any[]>([]);

  // Admin-Only Server Data States
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminCoupons, setAdminCoupons] = useState<Coupon[]>([]);
  const [adminMessages, setAdminMessages] = useState<ContactMessage[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<Notification[]>(
    [],
  );

  // Local Storage Cart & Favorites State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Phone[]>([]);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("");
  const [selectedRamFilter, setSelectedRamFilter] = useState<string>("");
  const [selectedStorageFilter, setSelectedStorageFilter] =
    useState<string>("");
  const [selectedPriceMaxFilter, setSelectedPriceMaxFilter] =
    useState<number>(200000);
  const [selected5GFilter, setSelected5GFilter] = useState<boolean>(false);
  const [selectedInStockFilter, setSelectedInStockFilter] =
    useState<boolean>(false);

  // Active Detail Pages State
  const [selectedProduct, setSelectedProduct] = useState<Phone | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);

  // active variant selection on product detail page
  const [selectedVariantColor, setSelectedVariantColor] = useState<string>("");
  const [selectedVariantStorage, setSelectedVariantStorage] =
    useState<string>("");
  const [selectedVariantRam, setSelectedVariantRam] = useState<string>("");

  // Derive the active variant on product detail page if selectedProduct is open
  const activeSelectedVariant = selectedProduct?.variants?.find(
    (v) =>
      v.color === selectedVariantColor &&
      v.storage === selectedVariantStorage &&
      v.ram === selectedVariantRam,
  );

  const handleSelectColor = (color: string) => {
    if (!selectedProduct || !selectedProduct.variants) return;
    setSelectedVariantColor(color);
    const exactMatch = selectedProduct.variants.find(
      (v) =>
        v.color === color &&
        v.storage === selectedVariantStorage &&
        v.ram === selectedVariantRam,
    );
    if (!exactMatch) {
      const partialMatch =
        selectedProduct.variants.find(
          (v) => v.color === color && v.storage === selectedVariantStorage,
        ) ||
        selectedProduct.variants.find(
          (v) => v.color === color && v.ram === selectedVariantRam,
        ) ||
        selectedProduct.variants.find((v) => v.color === color);
      if (partialMatch) {
        setSelectedVariantStorage(partialMatch.storage);
        setSelectedVariantRam(partialMatch.ram);
      }
    }
  };

  const handleSelectStorage = (store: string) => {
    if (!selectedProduct || !selectedProduct.variants) return;
    setSelectedVariantStorage(store);
    const exactMatch = selectedProduct.variants.find(
      (v) =>
        v.color === selectedVariantColor &&
        v.storage === store &&
        v.ram === selectedVariantRam,
    );
    if (!exactMatch) {
      const partialMatch =
        selectedProduct.variants.find(
          (v) => v.storage === store && v.color === selectedVariantColor,
        ) ||
        selectedProduct.variants.find(
          (v) => v.storage === store && v.ram === selectedVariantRam,
        ) ||
        selectedProduct.variants.find((v) => v.storage === store);
      if (partialMatch) {
        setSelectedVariantColor(partialMatch.color);
        setSelectedVariantRam(partialMatch.ram);
      }
    }
  };

  const handleSelectRam = (ram: string) => {
    if (!selectedProduct || !selectedProduct.variants) return;
    setSelectedVariantRam(ram);
    const exactMatch = selectedProduct.variants.find(
      (v) =>
        v.color === selectedVariantColor &&
        v.storage === selectedVariantStorage &&
        v.ram === ram,
    );
    if (!exactMatch) {
      const partialMatch =
        selectedProduct.variants.find(
          (v) => v.ram === ram && v.color === selectedVariantColor,
        ) ||
        selectedProduct.variants.find(
          (v) => v.ram === ram && v.storage === selectedVariantStorage,
        ) ||
        selectedProduct.variants.find((v) => v.ram === ram);
      if (partialMatch) {
        setSelectedVariantColor(partialMatch.color);
        setSelectedVariantStorage(partialMatch.storage);
      }
    }
  };

  // Product review submission states
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  // Checkout Form States
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: "",
    phoneNumber: "",
    altPhoneNumber: "",
    email: "",
    region: "Hawassa",
    city: "Hawassa",
    subCity: "Bole",
    woreda: "03",
    houseNumber: "",
    deliveryAddress: "",
    deliveryNotes: "",
    paymentMethod: "cod" as "chapa" | "cod" | "bank_transfer",
  });

  // Chapa Modal Trigger
  const [chapaTriggerOrder, setChapaTriggerOrder] = useState<any | null>(null);

  // Successful Checkout Outcome state
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // Order Tracking Form states
  const [trackPhone, setTrackPhone] = useState("");
  const [trackOrderNumber, setTrackOrderNumber] = useState("");
  const [trackResult, setTrackResult] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState("");

  // Contact Form states
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [contactSuccessMsg, setContactSuccessMsg] = useState("");

  // Admin Sign-In States
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem("admin_token"),
  );
  const [adminAuthError, setAdminAuthError] = useState("");

  // ----------------------------------------------------
  // INITIAL LOADERS (MOUNT)
  // ----------------------------------------------------
  useEffect(() => {
    // Open direct paths like /admin when the app loads
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (path === "admin") {
      setActivePage("admin");
    }

    // Load local storage cart & favorites
    const savedCart = localStorage.getItem("ethiophone_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {}
    }
    const savedFavs = localStorage.getItem("ethiophone_favorites");
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {}
    }

    fetchPublicData();
  }, []);

  // Sync Cart to Local Storage
  useEffect(() => {
    localStorage.setItem("ethiophone_cart", JSON.stringify(cart));
  }, [cart]);

  // Sync Favorites to Local Storage
  useEffect(() => {
    localStorage.setItem("ethiophone_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // If adminToken changes or when mounting, load admin data
  useEffect(() => {
    if (adminToken) {
      fetchAdminData();
    }
  }, [adminToken]);

  const fetchPublicData = async () => {
    try {
      const phonesRes = await axios.get("/api/phones");
      setPhones(phonesRes.data);

      const brandsRes = await axios.get("/api/brands");
      setBrands(brandsRes.data);

      const catsRes = await axios.get("/api/categories");
      setCategories(catsRes.data);

      const settingsRes = await axios.get("/api/settings");
      setSettings(settingsRes.data);

      const blogsRes = await axios.get("/api/blogs");
      setBlogs(blogsRes.data);
    } catch (err) {
      console.error("Error loading public data:", err);
    }
  };

  const fetchAdminData = async () => {
    if (!adminToken) return;
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };
    try {
      // Test authentication
      const authTest = await axios.get("/api/auth/me", config);
      if (authTest.data.authenticated) {
        const ordersRes = await axios.get("/api/orders", config);
        setAdminOrders(ordersRes.data);

        const couponsRes = await axios.get("/api/coupons", config);
        setAdminCoupons(couponsRes.data);

        const messagesRes = await axios.get("/api/contact", config);
        setAdminMessages(messagesRes.data);

        const notificationsRes = await axios.get("/api/notifications", config);
        setAdminNotifications(notificationsRes.data);
      } else {
        // Token expired
        setAdminToken(null);
        localStorage.removeItem("admin_token");
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
      setAdminToken(null);
      localStorage.removeItem("admin_token");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError("");
    try {
      const res = await axios.post("/api/auth/login", {
        username: adminUsername,
        password: adminPassword,
      });
      if (res.data.token) {
        setAdminToken(res.data.token);
        localStorage.setItem("admin_token", res.data.token);
        setAdminUsername("");
        setAdminPassword("");
      }
    } catch (err: any) {
      setAdminAuthError(err.response?.data?.error || "Incorrect credentials");
    }
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      try {
        await axios.post(
          "/api/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${adminToken}` } },
        );
      } catch (e) {}
    }
    setAdminToken(null);
    localStorage.removeItem("admin_token");
  };

  // ----------------------------------------------------
  // PUBLIC ACTIONS (Cart, Favorites, Search, Checkout)
  // ----------------------------------------------------
  const handleAddToCart = (
    phone: Phone,
    e?: React.MouseEvent,
    variant?: PhoneVariant,
  ) => {
    if (e) e.stopPropagation();

    const variantId = variant?.id;
    // Find if already exists
    const existingIdx = cart.findIndex(
      (item) => item.phoneId === phone.id && item.variantId === variantId,
    );
    if (existingIdx > -1) {
      const newCart = [...cart];
      newCart[existingIdx].quantity += 1;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          phoneId: phone.id,
          phone,
          quantity: 1,
          variantId,
          selectedVariant: variant,
        },
      ]);
    }
  };

  const handleRemoveFromCart = (phoneId: string, variantId?: string) => {
    const newCart = cart.filter(
      (item) => !(item.phoneId === phoneId && item.variantId === variantId),
    );
    setCart(newCart);
  };

  const handleCartQuantityChange = (
    phoneId: string,
    delta: number,
    variantId?: string,
  ) => {
    const newCart = cart.map((item) => {
      if (item.phoneId === phoneId && item.variantId === variantId) {
        const nextQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    });
    setCart(newCart);
  };

  const handleToggleFavorite = (phone: Phone, e: React.MouseEvent) => {
    e.stopPropagation();
    const exists = favorites.some((fav) => fav.id === phone.id);
    if (exists) {
      setFavorites(favorites.filter((fav) => fav.id !== phone.id));
    } else {
      setFavorites([...favorites, phone]);
    }
  };

  const handleSearchSubmit = (query: string) => {
    setSearchQuery(query);
    setActivePage("shop");
  };

  // Apply Promo Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    if (!couponCode.trim()) return;

    try {
      const res = await axios.post("/api/coupons/validate", {
        code: couponCode,
      });
      if (res.data.valid) {
        setAppliedCoupon(res.data);
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.error || "Invalid coupon");
    }
  };

  // Calculate Order Prices
  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => {
      let price = item.phone.price * (1 - item.phone.discount / 100);
      if (item.selectedVariant) {
        price += item.selectedVariant.priceModifier;
      }
      return sum + price * item.quantity;
    }, 0);
  };

  const getDiscountVal = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getCartSubtotal();
    if (appliedCoupon.type === "percentage") {
      return subtotal * (appliedCoupon.value / 100);
    } else {
      return appliedCoupon.value;
    }
  };

  const getDeliveryCost = () => {
    return Number(settings.deliveryFee || 150);
  };

  const getGrandTotal = () => {
    const subtotal = getCartSubtotal();
    const discount = getDiscountVal();
    const shipping = getDeliveryCost();
    return Math.max(0, subtotal - discount) + shipping;
  };

  // Submit Checkout order
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const orderPayload = {
      ...checkoutForm,
      deliveryFee: getDeliveryCost(),
      couponCode: appliedCoupon?.code || null,
      items: cart.map((item) => ({
        phoneId: item.phoneId,
        variantId: item.variantId || null,
        quantity: item.quantity,
      })),
    };

    try {
      const res = await axios.post("/api/orders", orderPayload);
      if (res.data.success) {
        const orderInfo = res.data.order;

        // If Chapa payment is selected, trigger the simulated Chapa window
        if (checkoutForm.paymentMethod === "chapa") {
          setChapaTriggerOrder(orderInfo);
        } else {
          // Success
          setSuccessOrder(orderInfo);
          setCart([]);
          setAppliedCoupon(null);
          setCouponCode("");
          setActivePage("order-success");
          fetchPublicData(); // refresh stock numbers
        }
      }
    } catch (err: any) {
      alert(
        err.response?.data?.error ||
          "Failed to submit checkout. Please try again.",
      );
    }
  };

  // Chapa payment success callback
  const handleChapaSuccess = async (txnRef: string) => {
    // Simulate updating order in DB to paid status
    try {
      if (chapaTriggerOrder) {
        // Set success order outcome
        const mockPaidOrder = {
          ...chapaTriggerOrder,
          status: "Confirmed" as const,
        };
        setSuccessOrder(mockPaidOrder);
        setCart([]);
        setAppliedCoupon(null);
        setCouponCode("");
        setChapaTriggerOrder(null);
        setActivePage("order-success");
        fetchPublicData(); // refresh stock numbers
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Live order status tracking
  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError("");
    setTrackResult(null);

    if (!trackPhone || !trackOrderNumber) {
      setTrackError("Please enter both phone number and order number");
      return;
    }

    try {
      const res = await axios.get(
        `/api/orders/track?phone=${trackPhone.trim()}&orderNumber=${trackOrderNumber.trim()}`,
      );
      setTrackResult(res.data);
    } catch (err: any) {
      setTrackError(
        err.response?.data?.error ||
          "Order not found. Please double check details.",
      );
    }
  };

  // Submit review on product details page
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSuccessMsg("");
    if (!selectedProduct) return;

    try {
      await axios.post(`/api/phones/${selectedProduct.id}/reviews`, {
        userName: reviewName,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSuccessMsg("Thank you! Your review has been saved.");
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);

      // Reload phone detailed data
      const updatedPhone = await axios.get(`/api/phones/${selectedProduct.id}`);
      setSelectedProduct(updatedPhone.data);
      fetchPublicData();
    } catch (err) {
      alert("Failed to submit review");
    }
  };

  // Submit message on Contact Page
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccessMsg("");
    try {
      await axios.post("/api/contact", contactForm);
      setContactSuccessMsg(
        "Your message was sent successfully! Our sales staff will call you shortly.",
      );
      setContactForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  // ----------------------------------------------------
  // RENDER INTERACTION PAGES
  // ----------------------------------------------------
  const onViewProductDetails = (phone: Phone) => {
    // Unpack specifications from description if needed
    let plainDesc = phone.description;
    let specObj = null;
    if (phone.description.includes("|||")) {
      const parts = phone.description.split("|||");
      plainDesc = parts[0];
      try {
        specObj = JSON.parse(parts[1]);
      } catch (e) {}
    }

    setSelectedProduct(phone);

    // Set default selected variant
    if (phone.variants && phone.variants.length > 0) {
      setSelectedVariantColor(phone.variants[0].color);
      setSelectedVariantStorage(phone.variants[0].storage);
      setSelectedVariantRam(phone.variants[0].ram);
    } else {
      setSelectedVariantColor("");
      setSelectedVariantStorage("");
      setSelectedVariantRam("");
    }

    setActivePage("product");
  };

  // Filter phones for search page
  const getFilteredPhones = () => {
    return phones.filter((p) => {
      // 1. Live text search (Brand name, phone name, specs, RAM)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesBrand =
          p.brand?.name.toLowerCase().includes(query) || false;
        const matchesModel = p.model.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesModel) return false;
      }

      // 2. Category select
      if (selectedCategoryFilter && p.categoryId !== selectedCategoryFilter)
        return false;

      // 3. Brand select
      if (selectedBrandFilter && p.brandId !== selectedBrandFilter)
        return false;

      // 4. Max price filter
      const finalPrice = p.price * (1 - p.discount / 100);
      if (finalPrice > selectedPriceMaxFilter) return false;

      // 5. RAM select
      if (selectedRamFilter) {
        const hasRam = p.variants.some(
          (v) => v.ram.toLowerCase() === selectedRamFilter.toLowerCase(),
        );
        if (!hasRam) return false;
      }

      // 6. Storage select
      if (selectedStorageFilter) {
        const hasStorage = p.variants.some(
          (v) =>
            v.storage.toLowerCase() === selectedStorageFilter.toLowerCase(),
        );
        if (!hasStorage) return false;
      }

      // 7. 5G Support (from specs)
      if (selected5GFilter) {
        const is5G = p.description.toLowerCase().includes("5g");
        if (!is5G) return false;
      }

      // 8. In Stock filter
      if (selectedInStockFilter && p.stock <= 0) return false;

      return true;
    });
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Navbar Integration */}
      <Navbar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          window.scrollTo(0, 0);
        }}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        favoritesCount={favorites.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        logoText={settings.logoText || "ETHIOPHONE"}
        isAdmin={!!adminToken}
      />

      {/* Main Container */}
      <main className="flex-grow">
        {/* VIEW 1: HOME PAGE */}
        {activePage === "home" && (
          <div className="space-y-16 pb-16 animate-fade-in select-none">
            {/* HERO HERO HERO */}
            <div className="w-full bg-black text-white relative border-none">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
                <div className="space-y-6">
                  <span className="bg-blue-600 text-white font-mono text-xs font-bold px-3 py-1 tracking-widest">
                    PREMIUM OFFERS IN ADDIS ABABA
                  </span>
                  <h1 className="font-display font-black text-4xl lg:text-6xl tracking-tight text-white leading-none">
                    GENUINE SMARTPHONES <br className="hidden sm:inline" />
                    WITH <span className="text-blue-500">LOCAL WARRANTY</span>
                  </h1>
                  <p className="text-sm text-gray-400 font-sans max-w-lg leading-relaxed">
                    Browse authentic Apple, Samsung, Google Pixel, Xiaomi, and
                    Tecno devices. Fully customized delivery across all
                    sub-cities in Addis Ababa within 24 hours. Duty-paid and
                    locally verified.
                  </p>

                  {/* Hero search */}
                  <div className="relative max-w-md shadow-lg bg-black border-none">
                    <input
                      type="text"
                      placeholder="What device are you looking for?"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearchSubmit(
                            (e.target as HTMLInputElement).value,
                          );
                        }
                      }}
                      className="w-full bg-black pl-4 pr-12 py-3.5 text-sm text-white outline-none placeholder-gray-500 font-sans border-none"
                    />
                    <button
                      className="absolute right-0 top-0 bottom-0 px-4 bg-white text-black hover:bg-blue-600 hover:text-white transition-colors font-mono font-bold text-xs border-none"
                      onClick={() => handleSearchSubmit(searchQuery)}
                    >
                      SEARCH
                    </button>
                  </div>

                  <div className="flex items-center gap-6 pt-2 text-xs font-mono text-gray-400">
                    <span>✔️ Same-Day Delivery</span>
                    <span>✔️ Pay on Receipt</span>
                    <span>✔️ Carlcare Authorized Support</span>
                  </div>
                </div>

                {/* Hero featured phone presentation block */}
                <div className="hidden lg:flex justify-center relative">
                  <div className="relative shadow-lg p-6 bg-white w-96 flex flex-col space-y-4 border-none">
                    <span className="absolute -top-3.5 left-4 bg-blue-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 border border-blue-600">
                      WEEKLY FEATURED DEVICE
                    </span>
                    <div className="w-full h-64 bg-gray-50 flex items-center justify-center">
                      <img
                        src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=500&fit=crop&q=80"
                        alt="Featured Device"
                        className="h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-[10px] font-mono text-gray-500 font-bold uppercase">
                          APPLE PLATINUM
                        </p>
                        <h4 className="font-display font-extrabold text-sm text-black">
                          iPhone 15 Pro Max
                        </h4>
                      </div>
                      <button
                        onClick={() => {
                          const ip = phones.find((p) =>
                            p.name.includes("iPhone 15 Pro"),
                          );
                          if (ip) onViewProductDetails(ip);
                          else {
                            setActivePage("shop");
                          }
                        }}
                        className="bg-black text-white hover:bg-blue-600 p-2 border-none"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BRANDS HORIZONTAL SLIDER BAR */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="border-t border-b border-gray-100 py-6">
                <p className="text-center font-mono text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">
                  AUTHORIZED SMARTPHONE PARTNERS
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      onClick={() => {
                        setSelectedBrandFilter(brand.id);
                        setActivePage("shop");
                      }}
                      className="cursor-pointer group flex items-center justify-center bg-white shadow-sm hover:shadow px-4 py-2 transition-all border-none"
                      title={`View ${brand.name}`}
                    >
                      <span className="font-display font-black text-xs tracking-widest text-black group-hover:text-blue-600">
                        {brand.name.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FLASH DEALS (TODAY'S DEALS) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row justify-between items-baseline border-b border-gray-100 pb-4 mb-8">
                <div>
                  <h2 className="font-display font-extrabold text-xl tracking-tight text-black">
                    TODAY'S FLASH DEALS
                  </h2>
                  <p className="text-xs text-gray-500 font-mono mt-0.5 uppercase">
                    LIMITED 24-HOUR PROMO STOCK
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategoryFilter("");
                    setActivePage("shop");
                  }}
                  className="text-xs font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 mt-2 sm:mt-0"
                >
                  VIEW ALL DEAL DEVICES <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {phones
                  .filter((p) => p.isFlashSale)
                  .slice(0, 4)
                  .map((phone) => (
                    <ProductCard
                      key={phone.id}
                      phone={phone}
                      onViewDetails={onViewProductDetails}
                      onAddToCart={handleAddToCart}
                      onToggleFavorite={(p, e) => handleToggleFavorite(p, e)}
                      isFavorite={favorites.some((fav) => fav.id === phone.id)}
                    />
                  ))}
              </div>
            </div>

            {/* CATEGORIES GRIDHIGHLIGHT */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="shadow-sm hover:shadow-md bg-white p-6 flex flex-col justify-between min-h-[220px] transition-all border-none">
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] font-bold text-blue-600 tracking-wider">
                      PRESTIGE CHOICE
                    </span>
                    <h3 className="font-display font-extrabold text-lg text-black">
                      APPLE iPHONES
                    </h3>
                    <p className="text-xs text-gray-500">
                      Discover direct factory-certified titanium devices with
                      full apple insurance.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const ipCat = categories.find((c) =>
                        c.name.toLowerCase().includes("apple"),
                      );
                      setSelectedCategoryFilter(ipCat?.id || "");
                      setActivePage("shop");
                    }}
                    className="mt-6 bg-gray-50 hover:bg-blue-600 hover:text-white py-2 text-xs font-mono font-bold transition-all w-full text-center border-none shadow-sm"
                  >
                    EXPLORE iPHONES
                  </button>
                </div>

                <div className="shadow-sm hover:shadow-md bg-white p-6 flex flex-col justify-between min-h-[220px] transition-all border-none">
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] font-bold text-blue-600 tracking-wider">
                      FLAGSHIP DOMINATOR
                    </span>
                    <h3 className="font-display font-extrabold text-lg text-black">
                      SAMSUNG GALAXY
                    </h3>
                    <p className="text-xs text-gray-500">
                      Unleash galaxy AI features and premium display panels with
                      local brand backup.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const samCat = categories.find((c) =>
                        c.name.toLowerCase().includes("samsung"),
                      );
                      setSelectedCategoryFilter(samCat?.id || "");
                      setActivePage("shop");
                    }}
                    className="mt-6 bg-gray-50 hover:bg-blue-600 hover:text-white py-2 text-xs font-mono font-bold transition-all w-full text-center border-none shadow-sm"
                  >
                    EXPLORE GALAXY
                  </button>
                </div>

                <div className="shadow-sm hover:shadow-md bg-white p-6 flex flex-col justify-between min-h-[220px] transition-all border-none">
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] font-bold text-blue-600 tracking-wider">
                      DAILY UTILITIES
                    </span>
                    <h3 className="font-display font-extrabold text-lg text-black">
                      MOBILE ACCESSORIES
                    </h3>
                    <p className="text-xs text-gray-500">
                      Chargers, smart watches, case shields and power delivery
                      hubs from Anker and Apple.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const accCat = categories.find((c) =>
                        c.name.toLowerCase().includes("access"),
                      );
                      setSelectedCategoryFilter(accCat?.id || "");
                      setActivePage("shop");
                    }}
                    className="mt-6 bg-gray-50 hover:bg-blue-600 hover:text-white py-2 text-xs font-mono font-bold transition-all w-full text-center border-none shadow-sm"
                  >
                    EXPLORE ACCESSORIES
                  </button>
                </div>
              </div>
            </div>

            {/* FEATURED PHONES */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row justify-between items-baseline border-b border-gray-100 pb-4 mb-8">
                <div>
                  <h2 className="font-display font-extrabold text-xl tracking-tight text-black">
                    FEATURED HANDSETS
                  </h2>
                  <p className="text-xs text-gray-500 font-mono mt-0.5 uppercase">
                    VERIFIED HIGH-PERFORMANCE SMARTPHONES
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategoryFilter("");
                    setActivePage("shop");
                  }}
                  className="text-xs font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 mt-2 sm:mt-0"
                >
                  VIEW CATALOG <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {phones
                  .filter((p) => p.isFeatured && !p.isFlashSale)
                  .slice(0, 4)
                  .map((phone) => (
                    <ProductCard
                      key={phone.id}
                      phone={phone}
                      onViewDetails={onViewProductDetails}
                      onAddToCart={handleAddToCart}
                      onToggleFavorite={(p, e) => handleToggleFavorite(p, e)}
                      isFavorite={favorites.some((fav) => fav.id === phone.id)}
                    />
                  ))}
              </div>
            </div>

            {/* REVIEWS GRID (CUSTOMER REVIEWS) */}
            <div className="bg-gray-50/50 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <span className="bg-black text-white font-mono text-[9px] font-bold px-3 py-1 border border-black uppercase tracking-wider">
                  CUSTOMER TRUST & FEEDBACK
                </span>
                <h3 className="font-display font-extrabold text-2xl text-black mt-4 uppercase">
                  WHAT METRO ADDIS CUSTOMERS SAY
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                  <div className="shadow-sm hover:shadow bg-white p-6 flex flex-col justify-between text-left transition-all border-none">
                    <p className="text-xs text-gray-600 font-sans italic">
                      "Absolutely genuine iPhone 15 Pro Max. Delivered to my
                      office at Dembel within 2 hours. Checked the IMEI on apple
                      site before payment. Highly professional service!"
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-black">
                        Abebe K. (Bole)
                      </span>
                      <span className="text-yellow-500 font-bold">★★★★★</span>
                    </div>
                  </div>

                  <div className="shadow-sm hover:shadow bg-white p-6 flex flex-col justify-between text-left transition-all border-none">
                    <p className="text-xs text-gray-600 font-sans italic">
                      "I bought a Tecno Spark 20 Pro from their catalog. Best
                      budget phone. The delivery dispatcher was very kind and
                      patient while I booted and tested the camera."
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-black">
                        Selamawit T. (Yeka)
                      </span>
                      <span className="text-yellow-500 font-bold">★★★★★</span>
                    </div>
                  </div>

                  <div className="shadow-sm hover:shadow bg-white p-6 flex flex-col justify-between text-left transition-all border-none">
                    <p className="text-xs text-gray-600 font-sans italic">
                      "Awesome! Used WELCOME10 code and saved 3000 Birr on my
                      Galaxy S24 Ultra. The local 1 year warranty terms are
                      solid. Recommend EthioPhone to anyone."
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-black">
                        Yonas M. (Kirkos)
                      </span>
                      <span className="text-yellow-500 font-bold">★★★★★</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LATEST BLOG POSTS */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="border-b border-gray-100 pb-4 mb-8">
                <h2 className="font-display font-extrabold text-xl tracking-tight text-black">
                  LATEST FROM THE MOBILE BLOG
                </h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5 uppercase">
                  PHONE COMPILATIONS & LOCAL BUYER GUIDES
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {blogs.slice(0, 2).map((blog) => (
                  <div
                    key={blog.id}
                    onClick={() => {
                      setSelectedBlog(blog);
                      setActivePage("blog-detail");
                      window.scrollTo(0, 0);
                    }}
                    className="group cursor-pointer bg-white shadow-sm hover:shadow-md flex flex-col h-full transition-all border-none"
                  >
                    <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                      <img
                        src={blog.imageUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-3 left-3 bg-black text-white text-[9px] font-mono font-bold px-2 py-0.5 border border-black">
                        {blog.category.toUpperCase()}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col flex-grow space-y-2 text-left">
                      <h3 className="font-display font-bold text-sm text-black leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                        {blog.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-sans line-clamp-3">
                        {blog.content}
                      </p>
                      <span className="text-[10px] font-mono text-gray-400 mt-auto pt-2">
                        📅 {new Date(blog.createdAt).toLocaleDateString()} | BY{" "}
                        {blog.author.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SHOP (FILTERABLE DIRECTORY) */}
        {activePage === "shop" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in select-none">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h1 className="font-display font-extrabold text-2xl tracking-tighter text-black uppercase">
                SMARTPHONE CATALOG
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                INSTANT FILTERS & VERIFIED PRICING IN ETB
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Side Sidebar Filters */}
              <div className="lg:col-span-1 shadow-sm bg-white p-4 space-y-6 border-none">
                <h3 className="font-mono font-bold text-xs text-black border-b border-gray-100 pb-2 uppercase tracking-wider">
                  FILTER SPECIFICATIONS
                </h3>

                {/* Category Filter */}
                <div className="space-y-1 text-xs">
                  <label className="font-mono font-bold text-gray-500 block">
                    CATEGORY
                  </label>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="w-full bg-gray-50 p-2 font-semibold text-black border-none shadow-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div className="space-y-1 text-xs">
                  <label className="font-mono font-bold text-gray-500 block">
                    BRAND
                  </label>
                  <select
                    value={selectedBrandFilter}
                    onChange={(e) => setSelectedBrandFilter(e.target.value)}
                    className="w-full bg-gray-50 p-2 font-semibold text-black border-none shadow-sm"
                  >
                    <option value="">All Brands</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* RAM filter */}
                <div className="space-y-1 text-xs">
                  <label className="font-mono font-bold text-gray-500 block">
                    RAM SIZE
                  </label>
                  <select
                    value={selectedRamFilter}
                    onChange={(e) => setSelectedRamFilter(e.target.value)}
                    className="w-full bg-gray-50 p-2 font-mono border-none shadow-sm"
                  >
                    <option value="">Any RAM</option>
                    <option value="4GB">4GB</option>
                    <option value="6GB">6GB</option>
                    <option value="8GB">8GB</option>
                    <option value="12GB">12GB</option>
                    <option value="16GB">16GB</option>
                  </select>
                </div>

                {/* Storage filter */}
                <div className="space-y-1 text-xs">
                  <label className="font-mono font-bold text-gray-500 block">
                    STORAGE SPACE
                  </label>
                  <select
                    value={selectedStorageFilter}
                    onChange={(e) => setSelectedStorageFilter(e.target.value)}
                    className="w-full bg-gray-50 p-2 font-mono border-none shadow-sm"
                  >
                    <option value="">Any Storage</option>
                    <option value="64GB">64GB</option>
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>

                {/* Max Price filter slider */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-mono font-bold text-gray-500">
                    <span>MAX PRICE</span>
                    <span className="text-black font-mono">
                      {selectedPriceMaxFilter.toLocaleString()} ETB
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={200000}
                    step={5000}
                    value={selectedPriceMaxFilter}
                    onChange={(e) =>
                      setSelectedPriceMaxFilter(Number(e.target.value))
                    }
                    className="w-full h-1.5 bg-gray-200 accent-blue-600 outline-none"
                  />
                </div>

                {/* Switch Filters (5G & In Stock) */}
                <div className="space-y-3 font-mono text-xs font-bold pt-2 border-t border-dashed border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected5GFilter}
                      onChange={(e) => setSelected5GFilter(e.target.checked)}
                      className="accent-blue-600 border-black"
                    />
                    <span>5G SUPPORT ONLY</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-red-600">
                    <input
                      type="checkbox"
                      checked={selectedInStockFilter}
                      onChange={(e) =>
                        setSelectedInStockFilter(e.target.checked)
                      }
                      className="accent-blue-600 border-black"
                    />
                    <span>IN STOCK DEVICES ONLY</span>
                  </label>
                </div>

                {/* Reset Filters button */}
                <button
                  onClick={() => {
                    setSelectedBrandFilter("");
                    setSelectedCategoryFilter("");
                    setSelectedRamFilter("");
                    setSelectedStorageFilter("");
                    setSelectedPriceMaxFilter(200000);
                    setSelected5GFilter(false);
                    setSelectedInStockFilter(false);
                    setSearchQuery("");
                  }}
                  className="w-full bg-gray-100 hover:bg-black hover:text-white py-2 text-xs font-mono font-bold text-center transition-all border-none shadow-sm"
                  id="reset-filters-btn"
                >
                  RESET FILTERS
                </button>
              </div>

              {/* Right Side Products Grid */}
              <div className="lg:col-span-3">
                {getFilteredPhones().length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredPhones().map((phone) => (
                      <ProductCard
                        key={phone.id}
                        phone={phone}
                        onViewDetails={onViewProductDetails}
                        onAddToCart={handleAddToCart}
                        onToggleFavorite={(p, e) => handleToggleFavorite(p, e)}
                        isFavorite={favorites.some(
                          (fav) => fav.id === phone.id,
                        )}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="shadow-sm bg-white p-12 text-center flex flex-col items-center justify-center space-y-4 border-none">
                    <HelpCircle className="w-12 h-12 text-gray-400" />
                    <h3 className="font-display font-bold text-base text-black">
                      NO MATCHING PHONES IN STOCK
                    </h3>
                    <p className="text-xs text-gray-500 max-w-md leading-relaxed">
                      We couldn't find any products matching those parameters.
                      Try resetting filters or searching with less specific
                      keywords.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: PRODUCT DETAIL PAGE */}
        {activePage === "product" && selectedProduct && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-left">
            {/* Back Button */}
            <button
              onClick={() => setActivePage("shop")}
              className="text-xs font-mono font-bold text-black bg-white shadow-sm hover:shadow px-3 py-1.5 mb-6 flex items-center gap-1.5 border-none transition-all"
              id="back-to-shop-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> BACK TO SMARTPHONES
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 select-none">
              {/* Left Column: Images Area */}
              <div className="space-y-4">
                <div className="shadow-sm w-full h-96 bg-gray-50 flex items-center justify-center p-4 border-none">
                  <img
                    src={
                      selectedProduct.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&q=80"
                    }
                    alt={selectedProduct.name}
                    className="h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {/* Image thumbnails slider row */}
                <div className="flex gap-4">
                  {selectedProduct.images?.map((img, i) => (
                    <div
                      key={img.id}
                      className="shadow-sm p-1 w-20 h-20 bg-gray-50 flex items-center justify-center cursor-pointer hover:shadow-md transition-all border-none"
                    >
                      <img
                        src={img.url}
                        className="h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Order and specs overview */}
              <div className="space-y-6">
                <div>
                  <span className="bg-blue-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 tracking-wide">
                    {selectedProduct.brand?.name.toUpperCase()} PRESTIGE
                  </span>
                  <h1 className="font-display font-bold text-2xl text-black mt-2 leading-none">
                    {selectedProduct.name}
                  </h1>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    MODEL REF: {selectedProduct.model}
                  </p>
                </div>

                {/* Rating row */}
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500 border-b border-gray-100 pb-4">
                  <span className="text-yellow-500 font-bold">★★★★★</span>
                  <span className="font-semibold text-black">
                    {selectedProduct.reviews?.length || 0} customer reviews
                  </span>
                </div>

                {/* Prices block */}
                <div className="bg-gray-50 p-4 flex justify-between items-center shadow-sm border-none">
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 block">
                      FINAL PRICE INBIRR
                    </span>
                    <span className="font-mono text-xl font-bold text-black">
                      {(
                        selectedProduct.price *
                          (1 - selectedProduct.discount / 100) +
                        (activeSelectedVariant
                          ? activeSelectedVariant.priceModifier
                          : 0)
                      ).toLocaleString()}{" "}
                      ETB
                    </span>
                  </div>
                  {selectedProduct.discount > 0 && (
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-red-500 block font-bold">
                        SAVE {selectedProduct.discount}%
                      </span>
                      <span className="font-mono text-sm text-gray-400 line-through">
                        {(
                          selectedProduct.price +
                          (activeSelectedVariant
                            ? activeSelectedVariant.priceModifier
                            : 0)
                        ).toLocaleString()}{" "}
                        ETB
                      </span>
                    </div>
                  )}
                </div>

                {/* Stock Warning */}
                <div className="text-xs font-mono">
                  {activeSelectedVariant ? (
                    activeSelectedVariant.stock > 0 ? (
                      <span className="text-green-600 font-semibold">
                        ✔️ {selectedVariantColor} - {selectedVariantStorage} (
                        {selectedVariantRam} RAM) In Stock - Ready for bole
                        dispatcher courier delivery (
                        {activeSelectedVariant.stock} left)
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold uppercase">
                        ❌ {selectedVariantColor} - {selectedVariantStorage} (
                        {selectedVariantRam} RAM) Temp Out of Stock - Dispatch
                        Delayed
                      </span>
                    )
                  ) : selectedProduct.stock > 0 ? (
                    <span className="text-green-600 font-semibold">
                      ✔️ In Stock - Ready for bole dispatcher courier delivery (
                      {selectedProduct.stock} left)
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold uppercase">
                      ❌ Temp Out of Stock - Dispatch Delayed
                    </span>
                  )}
                </div>

                {/* Options (Variants Colors, Storage, RAM) */}
                {selectedProduct.variants &&
                  selectedProduct.variants.length > 0 && (
                    <div className="space-y-4 border-t border-b border-gray-100 py-4 text-xs font-mono select-none">
                      {/* Color selects */}
                      <div className="space-y-1.5">
                        <span className="font-bold text-gray-500 block">
                          CHOOSE DEVICE COLOR
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Array.from<string>(
                            new Set(
                              selectedProduct.variants.map((v) => v.color),
                            ),
                          ).map((color) => (
                            <button
                              key={color}
                              onClick={() => handleSelectColor(color)}
                              className={`px-3 py-1 font-semibold text-xs transition-all border-none shadow-sm ${
                                selectedVariantColor === color
                                  ? "bg-blue-600 text-white shadow-md font-bold"
                                  : "bg-gray-100 text-black hover:bg-gray-200"
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Storage & RAM row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="font-bold text-gray-500 block">
                            STORAGE VARIANT
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {Array.from<string>(
                              new Set(
                                selectedProduct.variants.map((v) => v.storage),
                              ),
                            ).map((store) => (
                              <button
                                key={store}
                                onClick={() => handleSelectStorage(store)}
                                className={`px-3 py-1 font-semibold text-xs transition-all border-none shadow-sm ${
                                  selectedVariantStorage === store
                                    ? "bg-blue-600 text-white shadow-md font-bold"
                                    : "bg-gray-100 text-black hover:bg-gray-200"
                                }`}
                              >
                                {store}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="font-bold text-gray-500 block">
                            SYSTEM RAM
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {Array.from<string>(
                              new Set(
                                selectedProduct.variants.map((v) => v.ram),
                              ),
                            ).map((ram) => (
                              <button
                                key={ram}
                                onClick={() => handleSelectRam(ram)}
                                className={`px-3 py-1 font-semibold text-xs transition-all border-none shadow-sm ${
                                  selectedVariantRam === ram
                                    ? "bg-blue-600 text-white shadow-md font-bold"
                                    : "bg-gray-100 text-black hover:bg-gray-200"
                                }`}
                              >
                                {ram}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Primary Actions Row */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2 font-mono text-xs font-bold">
                  <button
                    onClick={() => {
                      const finalStock = activeSelectedVariant
                        ? activeSelectedVariant.stock
                        : selectedProduct.stock;
                      if (finalStock > 0) {
                        handleAddToCart(
                          selectedProduct,
                          undefined,
                          activeSelectedVariant || undefined,
                        );
                        setActivePage("cart");
                      }
                    }}
                    disabled={
                      activeSelectedVariant
                        ? activeSelectedVariant.stock <= 0
                        : selectedProduct.stock <= 0
                    }
                    className={`flex-1 py-3 hover:bg-blue-600 hover:text-white transition-all text-center border-none shadow-sm ${
                      (
                        activeSelectedVariant
                          ? activeSelectedVariant.stock <= 0
                          : selectedProduct.stock <= 0
                      )
                        ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                        : "bg-gray-100 text-black"
                    }`}
                    id="detail-buy-now-btn"
                  >
                    BUY NOW
                  </button>
                  <button
                    onClick={() => {
                      const finalStock = activeSelectedVariant
                        ? activeSelectedVariant.stock
                        : selectedProduct.stock;
                      if (finalStock > 0) {
                        handleAddToCart(
                          selectedProduct,
                          undefined,
                          activeSelectedVariant || undefined,
                        );
                        alert("Added to shopping cart!");
                      }
                    }}
                    disabled={
                      activeSelectedVariant
                        ? activeSelectedVariant.stock <= 0
                        : selectedProduct.stock <= 0
                    }
                    className={`flex-1 py-3 text-white transition-all border-none shadow-sm hover:shadow ${
                      (
                        activeSelectedVariant
                          ? activeSelectedVariant.stock <= 0
                          : selectedProduct.stock <= 0
                      )
                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                        : "bg-black hover:bg-blue-600 active:bg-blue-700"
                    }`}
                    id="detail-add-cart-btn"
                  >
                    ADD TO CART
                  </button>
                </div>

                {/* Warranty policy summary */}
                <div className="border border-dashed border-gray-300 p-3.5 text-xs text-gray-600 leading-relaxed bg-gray-50">
                  <span className="font-mono font-bold text-black uppercase block mb-1">
                    🛡️ WARRANTY & EXCHANGE PROMISE
                  </span>
                  {selectedProduct.warranty}. Fast local troubleshooting via our
                  Bole Road showroom. Full hardware exchange in case of
                  out-of-box fault.
                </div>
              </div>
            </div>

            {/* DESCRIPTION & SPECIFICATIONS BLOCK */}
            <div className="mt-16 bg-white shadow-sm border-none">
              <div className="bg-black text-white p-3 font-mono text-xs font-bold uppercase">
                COMPLETE TECHNICAL SPECIFICATIONS
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-display font-bold text-sm text-black border-b border-gray-100 pb-2 mb-3 uppercase">
                    PRODUCT REVIEW OUTLINE
                  </h4>
                  <p className="text-xs text-gray-700 font-sans leading-relaxed">
                    {selectedProduct.description.split("|||")[0]}
                  </p>
                </div>

                {/* Parsed specs (if stored inside description string) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-sans">
                  {/* General */}
                  <div className="bg-gray-50 p-4 border-none shadow-sm">
                    <h5 className="font-mono font-bold text-gray-500 border-b border-gray-200 pb-1.5 mb-2 uppercase text-[10px]">
                      DISPLAY PERFORMANCE
                    </h5>
                    <div className="space-y-1.5 font-mono text-[11px] text-gray-700">
                      <p>
                        <span className="font-bold text-black">
                          DISPLAY SCREEN:
                        </span>{" "}
                        6.7" OLED / AMOLED
                      </p>
                      <p>
                        <span className="font-bold text-black">
                          REFRESH RATE:
                        </span>{" "}
                        120Hz ProMotion
                      </p>
                      <p>
                        <span className="font-bold text-black">
                          DUAL SIM SLOT:
                        </span>{" "}
                        Yes Support
                      </p>
                      <p>
                        <span className="font-bold text-black">
                          BOX CONTENTS:
                        </span>{" "}
                        Device Charger, USB-C Cable
                      </p>
                    </div>
                  </div>

                  {/* Hardware details */}
                  <div className="bg-gray-50 p-4 border-none shadow-sm">
                    <h5 className="font-mono font-bold text-gray-500 border-b border-gray-200 pb-1.5 mb-2 uppercase text-[10px]">
                      CAMERA & HARDWARE
                    </h5>
                    <div className="space-y-1.5 font-mono text-[11px] text-gray-700">
                      <p>
                        <span className="font-bold text-black">
                          REAR CAMERA:
                        </span>{" "}
                        108MP Quad HD Matrix
                      </p>
                      <p>
                        <span className="font-bold text-black">
                          CHARGING PORT:
                        </span>{" "}
                        USB Type C standard
                      </p>
                      <p>
                        <span className="font-bold text-black">
                          5G CARRIER SUPPORT:
                        </span>{" "}
                        Ready and Verified
                      </p>
                      <p>
                        <span className="font-bold text-black">
                          LOCAL WARRANTY:
                        </span>{" "}
                        1 Year Carlcare Local
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CUSTOMER REVIEWS PORTLET */}
            <div className="mt-12 space-y-6">
              <h3 className="font-display font-black text-lg text-black uppercase border-b border-gray-100 pb-2">
                CUSTOMER RATINGS & REVIEWS
              </h3>

              {/* Form to submit review */}
              <form
                onSubmit={handleReviewSubmit}
                className="shadow-sm bg-gray-50 p-4 space-y-4 max-w-xl text-xs border-none"
              >
                <h4 className="font-mono font-bold text-black uppercase">
                  SUBMIT YOUR VERIFIED REVIEW
                </h4>
                {reviewSuccessMsg && (
                  <p className="bg-green-50 border border-green-600 text-green-600 p-2 font-mono">
                    {reviewSuccessMsg}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-mono font-bold text-gray-500 block">
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full bg-white px-2 py-1.5 border-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono font-bold text-gray-500 block">
                      DEVICE RATING *
                    </label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full bg-white px-2 py-1.5 font-bold text-black outline-none border-none shadow-sm"
                    >
                      <option value="5">5 Stars (Excellent)</option>
                      <option value="4">4 Stars (Good)</option>
                      <option value="3">3 Stars (Average)</option>
                      <option value="2">2 Stars (Fair)</option>
                      <option value="1">1 Star (Poor)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-mono font-bold text-gray-500 block">
                    YOUR DETAILED REVIEW *
                  </label>
                  <textarea
                    required
                    rows={2.5}
                    placeholder="Describe speed, camera detail, and delivery experience..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-white p-2 font-sans border-none shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-black text-white font-mono font-bold py-2 px-4 hover:bg-blue-600 border-none shadow-sm hover:shadow"
                  id="submit-review-btn"
                >
                  SAVE VERIFIED REVIEW
                </button>
              </form>

              {/* Reviews List */}
              <div className="space-y-3 font-sans text-xs">
                {selectedProduct.reviews?.map((review) => (
                  <div
                    key={review.id}
                    className="shadow-sm bg-white p-4 space-y-2 border-none"
                  >
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-black">
                        {review.userName}
                      </span>
                      <span className="text-yellow-500 font-bold">
                        {"★".repeat(review.rating)}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {review.comment}
                    </p>
                    <p className="text-[10px] font-mono text-gray-400">
                      POSTED:{" "}
                      {new Date(
                        review.createdAt || Date.now(),
                      ).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {(!selectedProduct.reviews ||
                  selectedProduct.reviews.length === 0) && (
                  <p className="text-gray-400 italic">
                    No reviews yet for this model. Be the first to review!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SHOPPING CART */}
        {activePage === "cart" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-left select-none">
            <div className="border-b border-gray-100 pb-4 mb-8">
              <h1 className="font-display font-black text-2xl tracking-tighter text-black uppercase">
                YOUR SHOPPING BAG
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                LOCAL COOKIE/BROWSER PERSISTED BASKET
              </p>
            </div>

            {cart.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Cart items list */}
                <div className="lg:col-span-2 space-y-4">
                  {cart.map((item) => {
                    let itemUnitPrice =
                      item.phone.price * (1 - item.phone.discount / 100);
                    if (item.selectedVariant) {
                      itemUnitPrice += item.selectedVariant.priceModifier;
                    }
                    const itemTotalPrice = itemUnitPrice * item.quantity;
                    return (
                      <div
                        key={`${item.phoneId}-${item.variantId || "base"}`}
                        className="shadow-sm bg-white p-4 flex gap-4 items-center relative border-none"
                      >
                        <button
                          onClick={() =>
                            handleRemoveFromCart(item.phoneId, item.variantId)
                          }
                          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <img
                          src={item.phone.images?.[0]?.url}
                          alt={item.phone.name}
                          className="w-16 h-16 object-contain bg-gray-50 border border-gray-200"
                          referrerPolicy="no-referrer"
                        />

                        <div className="flex-1 font-sans text-xs space-y-1">
                          <h4 className="font-bold text-black text-sm">
                            {item.phone.name}
                          </h4>
                          {item.selectedVariant && (
                            <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 font-mono text-[9px] uppercase font-bold shadow-sm">
                                {item.selectedVariant.color}
                              </span>
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 font-mono text-[9px] uppercase font-bold shadow-sm">
                                {item.selectedVariant.storage}
                              </span>
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 font-mono text-[9px] uppercase font-bold shadow-sm">
                                {item.selectedVariant.ram} RAM
                              </span>
                            </div>
                          )}
                          <p className="text-[10px] font-mono text-gray-400 uppercase">
                            MODEL: {item.phone.model}
                          </p>
                          <p className="font-mono font-bold text-black">
                            {itemUnitPrice.toLocaleString()} ETB{" "}
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-gray-400 font-normal">
                                ({itemTotalPrice.toLocaleString()} ETB total)
                              </span>
                            )}
                          </p>

                          {/* Qty increment controls */}
                          <div className="flex items-center gap-2 pt-2 text-xs font-mono font-bold">
                            <button
                              onClick={() =>
                                handleCartQuantityChange(
                                  item.phoneId,
                                  -1,
                                  item.variantId,
                                )
                              }
                              className="bg-gray-100 px-2 py-0.5 hover:bg-gray-200 border-none shadow-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleCartQuantityChange(
                                  item.phoneId,
                                  1,
                                  item.variantId,
                                )
                              }
                              className="bg-gray-100 px-2 py-0.5 hover:bg-gray-200 border-none shadow-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right totals and coupon submission */}
                <div className="lg:col-span-1 shadow-sm p-6 bg-gray-50 flex flex-col justify-between h-fit space-y-6 border-none">
                  <div className="space-y-4">
                    <h3 className="font-mono font-bold text-xs text-black border-b border-gray-100 pb-2 uppercase">
                      ORDER SUMMARY
                    </h3>

                    {/* Apply Coupon Form */}
                    <form
                      onSubmit={handleApplyCoupon}
                      className="space-y-2 text-xs"
                    >
                      <label className="font-mono font-bold text-gray-500 block">
                        APPLY PROMO CODE
                      </label>
                      <div className="flex bg-white focus-within:ring-1 focus-within:ring-blue-600 shadow-sm border-none">
                        <input
                          type="text"
                          placeholder="e.g. WELCOME10"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          className="w-full px-2 py-1.5 text-xs bg-white text-black outline-none font-mono border-none"
                        />
                        <button
                          type="submit"
                          className="bg-black text-white px-3 text-xs font-mono font-bold hover:bg-blue-600 border-none"
                          id="coupon-apply-btn"
                        >
                          APPLY
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-red-600 font-mono text-[10px]">
                          {couponError}
                        </p>
                      )}
                      {appliedCoupon && (
                        <div className="flex justify-between items-center bg-green-50 text-green-700 p-1.5 font-mono text-[10px] font-semibold shadow-sm border-none">
                          <span>PROMO [{appliedCoupon.code}] ACTIVED!</span>
                          <button
                            onClick={() => setAppliedCoupon(null)}
                            className="text-red-600 hover:underline text-[9px]"
                          >
                            REMOVE
                          </button>
                        </div>
                      )}
                    </form>

                    {/* Pricing list */}
                    <div className="space-y-2 text-xs font-mono pt-4 border-t border-dashed border-gray-300">
                      <div className="flex justify-between text-gray-500">
                        <span>ITEMS TOTAL:</span>
                        <span className="text-black">
                          {getCartSubtotal().toLocaleString()} ETB
                        </span>
                      </div>
                      {getDiscountVal() > 0 && (
                        <div className="flex justify-between text-green-600 font-semibold">
                          <span>DISCOUNT APPLIED:</span>
                          <span>- {getDiscountVal().toLocaleString()} ETB</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-500 border-b border-dashed border-gray-300 pb-2">
                        <span>DELIVERY COST:</span>
                        <span className="text-black">
                          {getDeliveryCost().toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-black pt-1">
                        <span>GRAND TOTAL:</span>
                        <span className="text-blue-600">
                          {getGrandTotal().toLocaleString()} ETB
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActivePage("checkout")}
                    className="w-full py-3 bg-black text-white font-mono text-xs font-bold tracking-wider hover:bg-blue-600 border-none shadow-sm hover:shadow transition-all"
                    id="cart-checkout-btn"
                  >
                    PROCEED TO CHECKOUT
                  </button>
                </div>
              </div>
            ) : (
              <div className="shadow-sm bg-white p-12 text-center flex flex-col items-center justify-center space-y-4 border-none">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
                <h3 className="font-display font-bold text-base text-black">
                  YOUR CART IS EMPTY
                </h3>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  You haven't added any phones or accessories to your cart yet.
                  Explore our latest smartphones to get started.
                </p>
                <button
                  onClick={() => setActivePage("shop")}
                  className="bg-black text-white text-xs font-mono font-bold px-4 py-2 hover:bg-blue-600 border-none shadow-sm hover:shadow"
                >
                  BROWSE SMARTPHONES
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: FAVORITES */}
        {activePage === "favorites" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-left select-none">
            <div className="border-b border-gray-100 pb-4 mb-8">
              <h1 className="font-display font-black text-2xl tracking-tighter text-black uppercase">
                YOUR FAVORITE DEVICES
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                LOCAL BROWSER SHORTLIST
              </p>
            </div>

            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {favorites.map((phone) => (
                  <ProductCard
                    key={phone.id}
                    phone={phone}
                    onViewDetails={onViewProductDetails}
                    onAddToCart={handleAddToCart}
                    onToggleFavorite={(p, e) => handleToggleFavorite(p, e)}
                    isFavorite={true}
                  />
                ))}
              </div>
            ) : (
              <div className="shadow-sm bg-white p-12 text-center flex flex-col items-center justify-center space-y-4 border-none">
                <Heart className="w-12 h-12 text-gray-400" />
                <h3 className="font-display font-bold text-base text-black">
                  NO FAVORITE PHONES SAVED
                </h3>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  You can bookmark smartphones and accessories in your browser
                  shortlist by clicking the heart icon on any device card.
                </p>
                <button
                  onClick={() => setActivePage("shop")}
                  className="bg-black text-white text-xs font-mono font-bold px-4 py-2 hover:bg-blue-600 border-none shadow-sm hover:shadow"
                >
                  VIEW CATALOG
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: CHECKOUT FORM */}
        {activePage === "checkout" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-left select-none">
            <div className="border-b border-gray-100 pb-4 mb-8">
              <h1 className="font-display font-black text-2xl tracking-tighter text-black uppercase">
                CHECKOUT DETAILS
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                METRO ADDIS COURIER DISPATCH REGISTRY
              </p>
            </div>

            <form
              onSubmit={handleCheckoutSubmit}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12 font-sans"
            >
              {/* Left Column Form inputs */}
              <div className="lg:col-span-2 shadow-sm p-6 bg-white space-y-6 border-none">
                <h3 className="font-mono font-bold text-xs text-black border-b border-gray-100 pb-2 uppercase tracking-wider">
                  CUSTOMER DELIVERY ADDRESS
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-mono font-bold text-gray-500 block">
                      FULL RECIPIENT NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={checkoutForm.fullName}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 px-2 py-1.5 border-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono font-bold text-gray-500 block">
                      PHONE NUMBER *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0911223344"
                      value={checkoutForm.phoneNumber}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 px-2 py-1.5 font-mono border-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-mono font-bold text-gray-500 block">
                      ALTERNATIVE PHONE NUMBER
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0922334455"
                      value={checkoutForm.altPhoneNumber}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          altPhoneNumber: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 px-2 py-1.5 font-mono border-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono font-bold text-gray-500 block">
                      EMAIL ADDRESS (OPTIONAL)
                    </label>
                    <input
                      type="email"
                      value={checkoutForm.email}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 px-2 py-1.5 font-mono border-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-500 block">
                      REGION *
                    </label>
                    <input
                      type="text"
                      required
                      value={checkoutForm.region}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          region: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 px-2 py-1.5 border-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-500 block">
                      CITY *
                    </label>
                    <input
                      type="text"
                      required
                      value={checkoutForm.city}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          city: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 px-2 py-1.5 border-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-500 block">
                      SUBCITY *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bole"
                      value={checkoutForm.subCity}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          subCity: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 px-2 py-1.5 border-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-500 block">
                      WOREDA *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 03"
                      value={checkoutForm.woreda}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          woreda: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 px-2 py-1.5 border-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <label className="font-mono font-bold text-gray-500 block">
                    DETAILED STREET DIRECTION & BUILDING NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bole road, Dembel Center 3rd floor"
                    value={checkoutForm.deliveryAddress}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        deliveryAddress: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 px-2 py-1.5 border-none shadow-sm"
                  />
                </div>

                <div className="text-xs space-y-1">
                  <label className="font-mono font-bold text-gray-500 block">
                    SPECIAL DELIVERY COURIER NOTES
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Please deliver after 2:00 PM..."
                    value={checkoutForm.deliveryNotes}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        deliveryNotes: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 p-2 font-sans border-none shadow-sm"
                  />
                </div>

                {/* Payment selectors */}
                <div className="space-y-3 font-mono text-xs font-bold pt-4 border-t border-gray-100">
                  <span className="text-gray-500 block uppercase">
                    CHOOSE SETTLEMENT METHOD
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label
                      className={`p-3 flex items-center gap-3 cursor-pointer shadow-sm border-none transition-all ${
                        checkoutForm.paymentMethod === "cod"
                          ? "bg-blue-50/70 shadow-md ring-1 ring-blue-600/20"
                          : "bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={checkoutForm.paymentMethod === "cod"}
                        onChange={() =>
                          setCheckoutForm({
                            ...checkoutForm,
                            paymentMethod: "cod",
                          })
                        }
                        className="accent-blue-600"
                      />
                      <div>
                        <p className="text-black uppercase text-xs font-bold">
                          CASH ON DELIVERY
                        </p>
                        <p className="text-[9px] text-gray-500 font-sans leading-tight">
                          Pay cash or mobile money directly to dispatcher.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`p-3 flex items-center gap-3 cursor-pointer shadow-sm border-none transition-all ${
                        checkoutForm.paymentMethod === "chapa"
                          ? "bg-blue-50/70 shadow-md ring-1 ring-blue-600/20"
                          : "bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={checkoutForm.paymentMethod === "chapa"}
                        onChange={() =>
                          setCheckoutForm({
                            ...checkoutForm,
                            paymentMethod: "chapa",
                          })
                        }
                        className="accent-blue-600"
                      />
                      <div>
                        <p className="text-black uppercase text-xs font-bold">
                          CHAPA SECURE
                        </p>
                        <p className="text-[9px] text-gray-500 font-sans leading-tight">
                          Pay instantly using Telebirr, CBE, or Cards.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`p-3 flex items-center gap-3 cursor-pointer shadow-sm border-none transition-all ${
                        checkoutForm.paymentMethod === "bank_transfer"
                          ? "bg-blue-50/70 shadow-md ring-1 ring-blue-600/20"
                          : "bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={checkoutForm.paymentMethod === "bank_transfer"}
                        onChange={() =>
                          setCheckoutForm({
                            ...checkoutForm,
                            paymentMethod: "bank_transfer",
                          })
                        }
                        className="accent-blue-600"
                      />
                      <div>
                        <p className="text-black uppercase text-xs font-bold">
                          BANK TRANSFER
                        </p>
                        <p className="text-[9px] text-gray-500 font-sans leading-tight">
                          Prepay directly to our corporate CBE account.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column Checkout summary */}
              <div className="lg:col-span-1 shadow-sm p-6 bg-gray-50 flex flex-col justify-between h-fit space-y-6 border-none select-none">
                <div className="space-y-4">
                  <h3 className="font-mono font-bold text-xs text-black border-b border-gray-100 pb-2 uppercase tracking-wider">
                    ITEMS SUMMARY
                  </h3>

                  {/* Pricing listing */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-gray-500">
                      <span>PRODUCTS SUB:</span>
                      <span className="text-black">
                        {getCartSubtotal().toLocaleString()} ETB
                      </span>
                    </div>
                    {getDiscountVal() > 0 && (
                      <div className="flex justify-between text-green-600 font-semibold">
                        <span>DISCOUNT:</span>
                        <span>- {getDiscountVal().toLocaleString()} ETB</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-500 border-b border-dashed border-gray-300 pb-2">
                      <span>SHIPPING:</span>
                      <span className="text-black">
                        {getDeliveryCost().toLocaleString()} ETB
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-black pt-1">
                      <span>FINAL DUE:</span>
                      <span className="text-blue-600 text-base">
                        {getGrandTotal().toLocaleString()} ETB
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 text-white font-mono text-xs font-bold tracking-wider hover:bg-blue-700 active:bg-blue-800 transition-all border-none shadow-sm hover:shadow"
                  id="checkout-submit-btn"
                >
                  PLACE DISPATCH ORDER
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 7: ORDER SUCCESS PAGE */}
        {activePage === "order-success" && successOrder && (
          <div className="max-w-2xl mx-auto px-4 py-16 animate-fade-in text-center select-none">
            <div className="shadow-md p-8 bg-white space-y-6 border-none">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto animate-bounce" />

              <div className="space-y-2">
                <h1 className="font-display font-extrabold text-2xl text-black uppercase">
                  ORDER PLACED SUCCESSFULLY!
                </h1>
                <p className="text-xs text-gray-500 font-mono">
                  YOUR UNIQUE DISPATCH IDENTIFIER:{" "}
                  <span className="font-bold text-blue-600">
                    {successOrder.orderNumber}
                  </span>
                </p>
              </div>

              <div className="shadow-sm p-4 bg-gray-50 text-xs text-left space-y-2 font-mono border-none">
                <p>
                  👤 <span className="font-bold">RECIPIENT:</span>{" "}
                  {successOrder.fullName}
                </p>
                <p>
                  📞 <span className="font-bold">CONTACT NUMBER:</span>{" "}
                  {successOrder.phoneNumber}
                </p>
                <p>
                  📍 <span className="font-bold">DELIVERY HUB:</span>{" "}
                  {successOrder.city} - {successOrder.deliveryAddress}
                </p>
                <p>
                  💳 <span className="font-bold">SETTLEMENT:</span>{" "}
                  {successOrder.paymentMethod.toUpperCase()}
                </p>
                <p className="text-sm font-bold text-blue-600 border-t border-gray-200 pt-2 flex justify-between">
                  <span>TOTAL PAID/DUE:</span>
                  <span>{successOrder.total.toLocaleString()} ETB</span>
                </p>
              </div>

              <p className="text-xs text-gray-600 font-sans leading-relaxed">
                Thank you for shopping with us! Our dispatch courier has
                allocated your smartphone and will call you to coordinate the
                delivery routing.
              </p>

              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4 font-mono text-xs font-bold">
                <button
                  onClick={() => {
                    setTrackPhone(successOrder.phoneNumber);
                    setTrackOrderNumber(successOrder.orderNumber);
                    setTrackResult(successOrder);
                    setActivePage("track");
                  }}
                  className="flex-1 py-3 bg-black text-white hover:bg-blue-600 border-none shadow-sm hover:shadow transition-all"
                  id="success-track-btn"
                >
                  TRACK LIVE COURIER
                </button>
                <button
                  onClick={() => {
                    setSuccessOrder(null);
                    setActivePage("home");
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-black border-none shadow-sm transition-all"
                  id="success-home-btn"
                >
                  RETURN TO HOME
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 8: ORDER TRACKING PAGE */}
        {activePage === "track" && (
          <div className="max-w-xl mx-auto px-4 py-8 animate-fade-in text-left select-none">
            <div className="border-b border-gray-100 pb-4 mb-8 text-center">
              <h1 className="font-display font-black text-2xl tracking-tighter text-black uppercase">
                TRACK DISPATCH STATUS
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                METRO ADDIS COURIER LOGISTICS TRACKER
              </p>
            </div>

            <form
              onSubmit={handleTrackOrder}
              className="shadow-md p-6 bg-white space-y-4 border-none"
            >
              {trackError && (
                <p className="bg-red-50 border border-red-600 text-red-600 p-2 text-xs font-mono">
                  {trackError}
                </p>
              )}

              <div className="space-y-1 text-xs">
                <label className="font-mono font-bold text-gray-500 block">
                  RECIPIENT PHONE NUMBER *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0911223344"
                  value={trackPhone}
                  onChange={(e) => setTrackPhone(e.target.value)}
                  className="w-full bg-gray-50 px-3 py-2 font-mono text-black outline-none border-none shadow-sm"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-mono font-bold text-gray-500 block">
                  ORDER ID REFERENCE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ETH-123456"
                  value={trackOrderNumber}
                  onChange={(e) =>
                    setTrackOrderNumber(e.target.value.toUpperCase())
                  }
                  className="w-full bg-gray-50 px-3 py-2 font-mono text-black outline-none border-none shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-black hover:bg-blue-600 text-white font-mono text-xs font-bold tracking-wider border-none shadow-sm hover:shadow transition-all"
                id="submit-tracking-btn"
              >
                QUERY DISPATCH STATUS
              </button>
            </form>

            {/* Tracking outcome details */}
            {trackResult && (
              <div className="mt-8 shadow-sm p-6 bg-gray-50 space-y-6 border-none">
                <div className="flex justify-between items-baseline border-b border-gray-100 pb-3">
                  <h3 className="font-mono font-bold text-xs text-black">
                    TRACKING RESULTS
                  </h3>
                  <span className="bg-blue-600 text-white font-mono text-[9px] font-bold px-2 py-0.5">
                    {trackResult.status.toUpperCase()}
                  </span>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-4 font-mono text-[11px] font-bold">
                  <div className="flex justify-between border-b border-gray-200 pb-2 text-xs">
                    <span>COURIER STATUS:</span>
                    <span className="text-blue-600 uppercase">
                      {trackResult.status}
                    </span>
                  </div>

                  {/* Visual tracking steps */}
                  <div className="relative pl-6 space-y-6 border-l border-gray-300 py-1">
                    <div className="relative">
                      <div
                        className={`absolute -left-[30px] top-0 w-4 h-4 border border-gray-200 flex items-center justify-center text-[9px] ${
                          [
                            "Pending",
                            "Confirmed",
                            "Preparing",
                            "Ready",
                            "Shipped",
                            "Delivered",
                          ].includes(trackResult.status)
                            ? "bg-black text-white"
                            : "bg-white"
                        }`}
                      >
                        ✓
                      </div>
                      <p className="text-black uppercase">
                        Pending Confirmation
                      </p>
                      <p className="font-sans font-normal text-gray-500 text-[10px] leading-tight">
                        Order received and waiting for warehouse inventory
                        allocation.
                      </p>
                    </div>

                    <div className="relative">
                      <div
                        className={`absolute -left-[30px] top-0 w-4 h-4 border border-gray-200 flex items-center justify-center text-[9px] ${
                          [
                            "Confirmed",
                            "Preparing",
                            "Ready",
                            "Shipped",
                            "Delivered",
                          ].includes(trackResult.status)
                            ? "bg-black text-white"
                            : "bg-white"
                        }`}
                      >
                        ✓
                      </div>
                      <p className="text-black uppercase">Order Confirmed</p>
                      <p className="font-sans font-normal text-gray-500 text-[10px] leading-tight">
                        Our staff called and validated the delivery coordinate.
                      </p>
                    </div>

                    <div className="relative">
                      <div
                        className={`absolute -left-[30px] top-0 w-4 h-4 border border-gray-200 flex items-center justify-center text-[9px] ${
                          ["Shipped", "Delivered"].includes(trackResult.status)
                            ? "bg-black text-white"
                            : "bg-white"
                        }`}
                      >
                        ✓
                      </div>
                      <p className="text-black uppercase">
                        Dispatched & Transit
                      </p>
                      <p className="font-sans font-normal text-gray-500 text-[10px] leading-tight">
                        The active dispatcher has left the Bole branch towards
                        your destination.
                      </p>
                    </div>

                    <div className="relative">
                      <div
                        className={`absolute -left-[30px] top-0 w-4 h-4 border border-gray-200 flex items-center justify-center text-[9px] ${
                          ["Delivered"].includes(trackResult.status)
                            ? "bg-black text-white"
                            : "bg-white"
                        }`}
                      >
                        ✓
                      </div>
                      <p className="text-black uppercase">
                        Delivered Successful
                      </p>
                      <p className="font-sans font-normal text-gray-500 text-[10px] leading-tight">
                        Package verified and payment collected successfully.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 9: BLOGS LIST & SINGLE BLOG */}
        {activePage === "blog" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-left select-none">
            <div className="border-b border-gray-100 pb-4 mb-8">
              <h1 className="font-display font-black text-2xl tracking-tighter text-black uppercase">
                THE MOBILE SHOWROOM BLOG
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                COMPILATIONS, COMPARISONS, AND TIPS
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  onClick={() => {
                    setSelectedBlog(blog);
                    setActivePage("blog-detail");
                    window.scrollTo(0, 0);
                  }}
                  className="group cursor-pointer bg-white shadow-sm hover:shadow-md flex flex-col h-full transition-all border-none"
                >
                  <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                    <img
                      src={blog.imageUrl}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-3 left-3 bg-black text-white text-[9px] font-mono font-bold px-2 py-0.5 border border-black">
                      {blog.category.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-grow space-y-2 text-left">
                    <h3 className="font-display font-bold text-sm text-black leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-sans line-clamp-3">
                      {blog.content}
                    </p>
                    <span className="text-[10px] font-mono text-gray-400 mt-auto pt-2">
                      📅 {new Date(blog.createdAt).toLocaleDateString()} | BY{" "}
                      {blog.author.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 9.5: BLOG DETAIL */}
        {activePage === "blog-detail" && selectedBlog && (
          <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in text-left">
            <button
              onClick={() => setActivePage("blog")}
              className="text-xs font-mono font-bold text-black bg-white shadow-sm hover:shadow px-3 py-1.5 mb-6 flex items-center gap-1.5 border-none transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> BACK TO ARTICLES
            </button>

            <article className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <span className="bg-blue-600 text-white font-mono text-[9px] font-bold px-2.5 py-0.5 tracking-wider uppercase">
                  {selectedBlog.category}
                </span>
                <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-black mt-3 leading-tight uppercase">
                  {selectedBlog.title}
                </h1>
                <p className="text-[11px] font-mono text-gray-400 mt-2">
                  PUBLISHED:{" "}
                  {new Date(selectedBlog.createdAt).toLocaleDateString()} | BY{" "}
                  {selectedBlog.author.toUpperCase()}
                </p>
              </div>

              {selectedBlog.imageUrl && (
                <div className="w-full h-80 bg-gray-100 overflow-hidden shadow-sm border-none">
                  <img
                    src={selectedBlog.imageUrl}
                    alt={selectedBlog.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="font-sans text-sm text-gray-800 leading-relaxed space-y-4 whitespace-pre-wrap">
                {selectedBlog.content}
              </div>
            </article>
          </div>
        )}

        {/* VIEW 10: ABOUT US PAGE */}
        {activePage === "about" && (
          <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in text-left select-none">
            <div className="border-b border-gray-100 pb-4 mb-8 text-center">
              <h1 className="font-display font-black text-2xl tracking-tighter text-black uppercase">
                ABOUT ETHIOPHONE SHOP
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                OUR STORY, VISION, AND FAQ
              </p>
            </div>

            <div className="space-y-8 font-sans text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-gray-100 pb-8">
                <div className="space-y-3">
                  <h3 className="font-display font-extrabold text-sm text-black uppercase">
                    WHO WE ARE
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Founded in 2026, EthioPhone is Ethiopia's dedicated, highly
                    professional smartphone and mobile accessories portal.
                    Operating directly from our showroom in Dembel City Center,
                    Addis Ababa, we supply only genuine products backed by
                    authentic local warranties.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Our clients do not need to deal with insecure imports or
                    fake clones. Every phone we sell passes strict local
                    regulatory compliance tests and is verified in-house.
                  </p>
                </div>
                <div className="shadow-sm p-4 bg-gray-50 font-mono text-[11px] space-y-2 border-none">
                  <p className="font-bold text-blue-600 uppercase">
                    ⚡ FAST HUB DELIVERY DECLARED
                  </p>
                  <p>
                    Our dispatch couriers reside directly in key sectors (Bole,
                    Kirkos, Lideta) guaranteeing lightning-fast courier delivery
                    directly to your home or office desk.
                  </p>
                </div>
              </div>

              {/* FAQ */}
              <div className="space-y-4">
                <h3 className="font-display font-extrabold text-sm text-black border-b border-gray-100 pb-2 uppercase tracking-wide">
                  FREQUENTLY ASKED QUESTIONS
                </h3>

                <div className="space-y-4 font-sans text-xs divide-y divide-gray-100">
                  <div className="pt-2">
                    <p className="font-bold text-black uppercase">
                      Q: ARE THE PHONES 100% GENUINE AND NEW?
                    </p>
                    <p className="text-gray-500 mt-1">
                      A: Absolutely. We only sell factory-sealed, genuine
                      devices. Every package comes in original box with serial
                      numbers matchable online.
                    </p>
                  </div>
                  <div className="pt-4">
                    <p className="font-bold text-black uppercase">
                      Q: HOW DO I MAKE PAYMENT?
                    </p>
                    <p className="text-gray-500 mt-1">
                      A: We accept Chapa mobile checkouts (Telebirr, CBE Birr,
                      Awash Birr), pre-delivery Bank Transfers, or Cash on
                      Delivery. For COD, you test the device before pay.
                    </p>
                  </div>
                  <div className="pt-4">
                    <p className="font-bold text-black uppercase">
                      Q: HOW LONG DOES DELIVERY TAKE?
                    </p>
                    <p className="text-gray-500 mt-1">
                      A: Within Addis Ababa, delivery takes between 2 to 4
                      hours. Out-of-Addis orders are dispatched via post-buses
                      and take 24 to 48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 11: CONTACT US */}
        {activePage === "contact" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in text-left select-none">
            <div className="border-b border-gray-100 pb-4 mb-8 text-center">
              <h1 className="font-display font-black text-2xl tracking-tighter text-black uppercase">
                CONTACT OUR STAFF
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                SUPPORT LINE, OFFICE MAP, AND ENQUIRIES
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 font-sans">
              {/* Left Column Map and Address */}
              <div className="space-y-6 text-xs">
                {/* SVG Mock Map */}
                <div className="shadow-sm bg-gray-50 h-64 relative flex flex-col justify-between p-4 overflow-hidden border-none">
                  <div className="absolute inset-0 opacity-10 font-mono text-[9px] flex flex-wrap gap-4 overflow-hidden pointer-events-none p-2 select-none">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <span key={i}>
                        BOLE ROAD LAT_9.00° LNG_38.78° STREET_GRID
                      </span>
                    ))}
                  </div>

                  {/* Map Pin UI */}
                  <div className="m-auto flex flex-col items-center space-y-1 relative z-10">
                    <MapPin className="w-8 h-8 text-red-600 animate-bounce" />
                    <span className="bg-black text-white px-2 py-0.5 border border-black text-[10px] font-mono font-bold uppercase tracking-wider">
                      ETHIOPHONE DEMBEL HUB
                    </span>
                  </div>

                  <p className="text-[10px] font-mono text-gray-400 relative z-10 uppercase">
                    📍 BOLE ROAD, DEMBEL CITY CENTER, 3RD FLOOR, ADDIS ABABA,
                    ETHIOPIA
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 font-mono">
                  <div className="shadow-sm p-3.5 bg-white border-none">
                    <p className="font-bold text-blue-600 block text-[10px]">
                      📞 TELEPHONE HOTLINE
                    </p>
                    <p className="text-black font-bold mt-1 text-xs">
                      {settings.phone || "+251911223344"}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1">
                      Available 8:30 AM - 7:30 PM
                    </p>
                  </div>
                  <div className="shadow-sm p-3.5 bg-white border-none">
                    <p className="font-bold text-blue-600 block text-[10px]">
                      ✉️ SUPPORT EMAIL
                    </p>
                    <p className="text-black font-bold mt-1 text-xs">
                      {settings.email || "info@ethiophone.com"}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1">
                      Response within 24 Hours
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column Enquiry Form */}
              <form
                onSubmit={handleContactSubmit}
                className="shadow-md p-6 bg-white space-y-4 border-none"
              >
                <h3 className="font-mono font-bold text-xs text-black border-b border-gray-100 pb-2 uppercase tracking-wider">
                  SEND AN ENQUIRY MESSAGE
                </h3>

                {contactSuccessMsg && (
                  <p className="bg-green-50 border border-green-600 text-green-600 p-2 text-xs font-mono">
                    {contactSuccessMsg}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-mono font-bold text-gray-500">
                      YOUR FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                      className="w-full bg-gray-50 px-2 py-1.5 border-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono font-bold text-gray-500">
                      YOUR PHONE NUMBER *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          phone: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 px-2 py-1.5 font-mono border-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <label className="font-mono font-bold text-gray-500">
                    EMAIL ADDRESS (OPTIONAL)
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    className="w-full bg-gray-50 px-2 py-1.5 font-mono border-none shadow-sm"
                  />
                </div>

                <div className="text-xs space-y-1">
                  <label className="font-mono font-bold text-gray-500">
                    YOUR DETAILED MESSAGE *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe specific smartphone models, questions on local warranty, or customized accessories..."
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        message: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 p-2 font-sans text-xs border-none shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-black hover:bg-blue-600 text-white font-mono text-xs font-bold tracking-wider border-none shadow-sm hover:shadow transition-all"
                  id="contact-submit-btn"
                >
                  DISPATCH ENQUIRY MESSAGE
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 12: ADMIN LOGIN PORTAL */}
        {activePage === "admin" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in select-none">
            {adminToken ? (
              <AdminPanel
                token={adminToken}
                onLogout={handleAdminLogout}
                brands={brands}
                categories={categories}
                phones={phones}
                orders={adminOrders}
                coupons={adminCoupons}
                messages={adminMessages}
                notifications={adminNotifications}
                settings={settings}
                fetchData={async () => {
                  await fetchPublicData();
                  await fetchAdminData();
                }}
              />
            ) : (
              <div className="max-w-md mx-auto py-12 text-left">
                <form
                  onSubmit={handleAdminLogin}
                  className="shadow-md p-6 bg-white space-y-4 border-none"
                >
                  <div className="text-center pb-2 border-b border-gray-100">
                    <ShieldAlert className="w-8 h-8 text-blue-600 mx-auto" />
                    <h2 className="font-display font-extrabold text-lg text-black mt-2 uppercase">
                      ADMINISTRATOR SIGN IN
                    </h2>
                    <p className="text-[10px] text-gray-500 font-mono">
                      STAFF CREDENTIALS REQUIRED
                    </p>
                  </div>

                  {adminAuthError && (
                    <p className="bg-red-50 border border-red-600 text-red-600 p-2 text-xs font-mono">
                      {adminAuthError}
                    </p>
                  )}

                  <div className="space-y-1 text-xs">
                    <label className="font-mono font-bold text-gray-500">
                      ADMINISTRATIVE USERNAME
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. admin"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full bg-gray-50 px-3 py-2 text-xs font-mono text-black outline-none border-none shadow-sm"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-mono font-bold text-gray-500">
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="e.g. adminpassword"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-gray-50 px-3 py-2 text-xs font-mono text-black outline-none border-none shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-black hover:bg-blue-600 text-white font-mono text-xs font-bold tracking-wider uppercase border-none shadow-sm hover:shadow transition-all"
                    id="admin-login-submit-btn"
                  >
                    AUTHORIZE CONNECTION
                  </button>

                  <div className="text-[10px] font-mono text-gray-400 border-t border-dashed border-gray-200 pt-3 text-center">
                    🔒 Seeded Default Credentials:
                    <br />
                    Username:{" "}
                    <span className="text-black font-bold">admin</span> |
                    Password:{" "}
                    <span className="text-black font-bold">adminpassword</span>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cart/Payment simulated overlays */}
      {chapaTriggerOrder && (
        <MockChapa
          orderAmount={chapaTriggerOrder.total}
          customerName={chapaTriggerOrder.fullName}
          customerEmail={chapaTriggerOrder.email || "info@ethiophone.com"}
          orderNumber={chapaTriggerOrder.orderNumber}
          onPaymentSuccess={handleChapaSuccess}
          onPaymentCancel={() => {
            alert("Payment cancelled. Please settle your payment.");
            setChapaTriggerOrder(null);
          }}
        />
      )}

      {/* Footer Integration */}
      <Footer
        setActivePage={(page) => {
          setActivePage(page);
          window.scrollTo(0, 0);
        }}
        storeName={settings.storeName || "ETHIOPHONE SHOP"}
        phone={settings.phone || "+251911223344"}
        altPhone={settings.altPhone || "+251922334455"}
        email={settings.email || "info@ethiophone.com"}
        telegram={settings.telegram || "@ethiophone"}
        whatsapp={settings.whatsapp || "+251911223344"}
        officeAddress={settings.officeAddress || "Bole Road, Addis Ababa"}
        businessHours={
          settings.businessHours || "Monday - Saturday: 8:30 AM - 7:30 PM"
        }
      />
    </div>
  );
}
