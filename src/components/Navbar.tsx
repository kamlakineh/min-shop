// src/components/Navbar.tsx
import React, { useState } from "react";
import {
  Search,
  ShoppingBag,
  Heart,
  Smartphone,
  Menu,
  X,
  ShieldAlert,
  BookOpen,
  Clock,
} from "lucide-react";
import { Phone } from "../types";

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  cartCount: number;
  favoritesCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  logoText: string;
}

export default function Navbar({
  activePage,
  setActivePage,
  cartCount,
  favoritesCount,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  logoText,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchSubmit(searchQuery);
    }
  };

  const navItems = [
    { id: "home", label: "HOME" },
    { id: "shop", label: "SHOP" },
    { id: "blog", label: "BLOG" },
    { id: "about", label: "ABOUT" },
    { id: "contact", label: "CONTACT" },
    { id: "track", label: "TRACK ORDER" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-[0_2px_15px_rgba(0,0,0,0.06)] border-none select-none">
      {/* Top Notice Bar */}
      <div className="w-full bg-black text-white py-2 px-6 text-[10px] uppercase tracking-widest font-mono flex flex-col sm:flex-row justify-between items-center border-none">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>OFFICIAL ETHIOPHONE PLATFORM | OPEN: 8:30 AM - 7:30 PM</span>
        </div>
        <div className="flex items-center gap-6 mt-1 sm:mt-0">
          <span>FAST METRO ADDIS DELIVERY</span>
          <span className="text-blue-500 font-bold">100% GENUINE</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => {
              setActivePage("home");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
            id="nav-logo-btn"
          >
            <div className="bg-black text-white p-1 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-500" />
            </div>
            <span className="font-display font-bold text-xl tracking-tighter text-black select-none">
              {logoText || "ETHIOPHONE"}
            </span>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.12)] border-none transition-shadow">
              <input
                type="text"
                placeholder="Search phone name, brand, RAM, storage..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-3 pr-10 py-1.5 text-sm bg-white text-black outline-none font-sans placeholder-gray-400 border-none"
              />
              <button
                onClick={() => onSearchSubmit(searchQuery)}
                className="absolute right-0 top-0 bottom-0 px-3 bg-black text-white hover:bg-blue-600 active:bg-blue-700 flex items-center justify-center transition-colors border-none"
                id="search-btn-desktop"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 items-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`text-xs font-semibold tracking-wider font-sans transition-colors py-1 border-b-2 ${
                  activePage === item.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-800 hover:text-black hover:border-black"
                }`}
                id={`nav-item-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Icons (Cart & Favorites) */}
          <div className="flex items-center space-x-3">
            {/* Favorites Icon */}
            <button
              onClick={() => setActivePage("favorites")}
              className="relative p-2 text-black hover:text-blue-600 active:scale-95 transition-all"
              title="Favorites"
              id="nav-favorites-btn"
            >
              <Heart
                className={`w-5 h-5 ${favoritesCount > 0 ? "fill-red-500 text-red-500" : ""}`}
              />
              {favoritesCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-black text-white text-[9px] font-mono font-bold w-4 h-4 flex items-center justify-center border border-white">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => setActivePage("cart")}
              className="relative p-2 text-black hover:text-blue-600 active:scale-95 transition-all"
              title="Shopping Cart"
              id="nav-cart-btn"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-blue-600 text-white text-[9px] font-mono font-bold w-4 h-4 flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-black hover:bg-gray-100 transition-colors"
              id="nav-mobile-menu-toggle"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white py-3 px-4 flex flex-col space-y-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-none">
          {/* Mobile Search */}
          <div className="relative w-full shadow-sm bg-white border-none">
            <input
              type="text"
              placeholder="Search phones, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-3 pr-10 py-2 text-sm bg-white text-black outline-none font-sans border-none"
            />
            <button
              onClick={() => {
                onSearchSubmit(searchQuery);
                setMobileMenuOpen(false);
              }}
              className="absolute right-0 top-0 bottom-0 px-3 bg-black text-white hover:bg-blue-600 flex items-center justify-center transition-colors border-none"
              id="search-btn-mobile"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col space-y-1 font-sans">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-sm font-semibold py-2.5 px-3 border-b border-gray-100 transition-colors ${
                  activePage === item.id
                    ? "text-blue-600 bg-blue-50/50 pl-4 border-l-2 border-l-blue-600"
                    : "text-gray-800 hover:bg-gray-50"
                }`}
                id={`nav-item-mobile-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
