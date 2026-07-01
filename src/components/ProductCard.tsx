// src/components/ProductCard.tsx
import React from "react";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { Phone } from "../types";

interface ProductCardProps {
  phone: Phone;
  onViewDetails: (phone: Phone) => void;
  onAddToCart: (phone: Phone, e?: React.MouseEvent) => void;
  onToggleFavorite: (phone: Phone, e: React.MouseEvent) => void;
  isFavorite: boolean;
  key?: any;
}

export default function ProductCard({
  phone,
  onViewDetails,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
}: ProductCardProps) {
  const finalPrice = phone.price * (1 - phone.discount / 100);
  const mainImage = phone.images?.[0]?.url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&q=80";

  return (
    <div 
      onClick={() => onViewDetails(phone)}
      className="group relative bg-white flex flex-col h-full cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border-none select-none"
      id={`product-card-${phone.id}`}
    >
      {/* Favorite Button Overlay */}
      <button
        onClick={(e) => onToggleFavorite(phone, e)}
        className="absolute top-3 right-3 z-10 p-2 bg-white shadow-sm hover:shadow-md text-black hover:text-red-500 transition-all border-none"
        id={`product-favorite-btn-${phone.id}`}
        title="Add to Favorites"
      >
        <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
      </button>

      {/* Sale/Discount Badge */}
      {phone.discount > 0 && (
        <span className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 tracking-wider">
          SAVE {phone.discount}%
        </span>
      )}

      {/* Flash Sale Badge */}
      {phone.isFlashSale && (
        <span className="absolute top-9 left-3 z-10 bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 tracking-wider">
          FLASH DEAL
        </span>
      )}

      {/* Product Image Area */}
      <div className="w-full h-56 bg-gray-50 overflow-hidden relative flex items-center justify-center">
        <img
          src={mainImage}
          alt={phone.name}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        {phone.stock <= 0 && (
          <div className="absolute inset-0 bg-white/85 flex items-center justify-center font-mono text-xs font-bold text-red-600 uppercase tracking-widest border border-red-600 m-4">
            Out of Stock
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-4 flex flex-col flex-1 space-y-2">
        {/* Brand & Category row */}
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 tracking-wider uppercase">
          <span>{phone.brand?.name || "Generic"}</span>
          <span>{phone.model}</span>
        </div>

        {/* Product Name */}
        <h3 className="font-display font-bold text-sm text-black leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
          {phone.name}
        </h3>

        {/* Warranty label if available */}
        <div className="text-[10px] font-sans font-medium text-gray-500">
          🛡️ {phone.warranty || "1 Year Warranty"}
        </div>

        {/* Price row */}
        <div className="pt-2 flex items-baseline gap-2">
          <span className="font-mono text-sm font-bold text-black">
            {finalPrice.toLocaleString()} ETB
          </span>
          {phone.discount > 0 && (
            <span className="font-mono text-xs text-gray-400 line-through">
              {phone.price.toLocaleString()} ETB
            </span>
          )}
        </div>
      </div>

      {/* Quick Add Bottom Button */}
      <div className="p-4 pt-0">
        <button
          onClick={(e) => {
            if (phone.stock > 0) {
              onAddToCart(phone, e);
            } else {
              e.stopPropagation();
            }
          }}
          disabled={phone.stock <= 0}
          className={`w-full py-2 font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all duration-150 border-none shadow-sm ${
            phone.stock <= 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-black text-white hover:bg-blue-600 hover:shadow active:bg-blue-700"
          }`}
          id={`product-cart-btn-${phone.id}`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {phone.stock <= 0 ? "OUT OF STOCK" : "ADD TO CART"}
        </button>
      </div>
    </div>
  );
}
