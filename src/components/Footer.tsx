// src/components/Footer.tsx
import React from "react";
import { Smartphone, Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";

interface FooterProps {
  setActivePage: (page: string) => void;
  storeName: string;
  phone: string;
  altPhone: string;
  email: string;
  telegram: string;
  whatsapp: string;
  officeAddress: string;
  businessHours: string;
}

export default function Footer({
  setActivePage,
  storeName,
  phone,
  altPhone,
  email,
  telegram,
  whatsapp,
  officeAddress,
  businessHours,
}: FooterProps) {
  return (
    <footer className="bg-black text-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-none select-none mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Store Brand */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-white text-black p-1 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-display font-bold text-lg tracking-tighter text-white">
                {storeName || "ETHIOPHONE"}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Ethiopia's premier e-commerce platform for genuine smartphones and premium mobile accessories. Bringing the global standard of mobile shopping to Addis Ababa.
            </p>
            <div className="text-xs font-mono text-gray-400">
              <p>📍 {officeAddress || "Bole Road, Addis Ababa"}</p>
              <p className="mt-1">🕒 {businessHours || "Monday - Saturday: 8:30 AM - 7:30 PM"}</p>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-widest text-blue-500">QUICK LINKS</h4>
            <div className="flex flex-col space-y-2 text-xs font-sans text-gray-300">
              <button onClick={() => setActivePage("shop")} className="text-left hover:text-white hover:underline transition-all">Browse Smartphones</button>
              <button onClick={() => setActivePage("shop")} className="text-left hover:text-white hover:underline transition-all">Mobile Accessories</button>
              <button onClick={() => setActivePage("blog")} className="text-left hover:text-white hover:underline transition-all font-semibold text-blue-400">Read Phone Reviews</button>
              <button onClick={() => setActivePage("about")} className="text-left hover:text-white hover:underline transition-all">About Our Company</button>
              <button onClick={() => setActivePage("contact")} className="text-left hover:text-white hover:underline transition-all">Contact Support</button>
              <button onClick={() => setActivePage("track")} className="text-left hover:text-white hover:underline transition-all font-mono">Track My Order</button>
            </div>
          </div>

          {/* Column 3: Local Customer Support */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-widest text-blue-500">LOCAL CONTACT</h4>
            <div className="flex flex-col space-y-2 text-xs font-sans text-gray-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${phone}`} className="hover:text-white">{phone || "+251911223344"}</a>
              </div>
              {altPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${altPhone}`} className="hover:text-white">{altPhone}</a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${email}`} className="hover:text-white">{email || "info@ethiophone.com"}</a>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <Send className="w-4 h-4" />
                <a href={`https://t.me/${telegram?.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:underline">Telegram Channel</a>
              </div>
            </div>
          </div>

          {/* Column 4: Delivery / Policy Info */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-widest text-blue-500">OUR SERVICE PROMISE</h4>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              All listed phones are physically in stock, duty-paid, and ready for same-day delivery. Test your device upon delivery before making payment.
            </p>
            <div className="pt-2 border-t border-gray-800 text-[10px] font-mono text-gray-500">
              <p>⚡ COD | Bank Transfer | Chapa Payments</p>
              <p className="mt-1">🔒 Secure direct checkouts</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-gray-500">
          <p>© {new Date().getFullYear()} {storeName || "EthioPhone Premium"}. All Rights Reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0 text-[11px]">
            <button onClick={() => setActivePage("about")} className="hover:text-white">WARRANTY POLICY</button>
            <span>|</span>
            <button onClick={() => setActivePage("about")} className="hover:text-white">DELIVERY AREAS</button>
            <span>|</span>
            <button onClick={() => setActivePage("admin")} className="hover:text-blue-500 font-bold text-gray-400">STAFF LOGIN</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
