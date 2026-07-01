// src/components/MockChapa.tsx
import React, { useState } from "react";
import { Smartphone, CreditCard, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

interface MockChapaProps {
  orderAmount: number;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  onPaymentSuccess: (txnRef: string) => void;
  onPaymentCancel: () => void;
}

export default function MockChapa({
  orderAmount,
  customerName,
  customerEmail,
  orderNumber,
  onPaymentSuccess,
  onPaymentCancel,
}: MockChapaProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "telebirr" | "cbe" | "awash">("telebirr");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Simple validation
    if (paymentMethod === "telebirr" || paymentMethod === "cbe" || paymentMethod === "awash") {
      if (!phoneNumber || phoneNumber.length < 9) {
        setErrorMsg("Please enter a valid mobile wallet phone number.");
        return;
      }
    } else {
      if (!cardNumber || cardNumber.length < 16) {
        setErrorMsg("Please enter a valid 16-digit card number.");
        return;
      }
    }

    setIsProcessing(true);

    // Simulate Chapa gateway processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      // Final redirect/success callback after showing success check for 1.5 seconds
      setTimeout(() => {
        const txnRef = `CHA-TX-${Math.floor(100000 + Math.random() * 900000)}`;
        onPaymentSuccess(txnRef);
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="bg-white border-2 border-black w-full max-w-md flex flex-col p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 text-white font-display font-extrabold text-sm px-2.5 py-1 tracking-wider uppercase">
              CHAPA
            </div>
            <span className="font-mono text-xs font-bold text-gray-500">PAYMENT GATEWAY</span>
          </div>
          <button 
            onClick={onPaymentCancel}
            disabled={isProcessing || isSuccess}
            className="text-xs font-mono font-bold text-gray-500 hover:text-black hover:underline"
            id="chapa-cancel-btn"
          >
            CANCEL
          </button>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-600 animate-pulse" />
            <h3 className="font-display font-bold text-lg text-black">PAYMENT SUCCESSFUL</h3>
            <p className="text-xs text-gray-500 font-mono font-semibold">
              Generating receipt and redirecting...
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            
            {/* Order Brief */}
            <div className="bg-gray-50 border border-black p-3 flex justify-between items-center text-xs font-mono">
              <div>
                <p className="text-gray-500">ORDER NUMBER</p>
                <p className="font-bold text-black">{orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">AMOUNT DUE</p>
                <p className="font-bold text-blue-600 text-sm">{orderAmount.toLocaleString()} ETB</p>
              </div>
            </div>

            {/* Merchant info */}
            <div className="text-[11px] font-sans text-gray-500">
              Paying to <span className="font-bold text-black">EthioPhone Premium Mobile Shop</span>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-600 text-red-600 p-2.5 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2 border-b border-black pb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("telebirr")}
                className={`border p-2 text-center flex flex-col items-center justify-center space-y-1 ${
                  paymentMethod === "telebirr" ? "border-blue-600 bg-blue-50/50" : "border-black bg-white"
                }`}
                id="chapa-method-telebirr"
              >
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span className="text-[9px] font-mono font-bold leading-tight">TELEBIRR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("cbe")}
                className={`border p-2 text-center flex flex-col items-center justify-center space-y-1 ${
                  paymentMethod === "cbe" ? "border-blue-600 bg-blue-50/50" : "border-black bg-white"
                }`}
                id="chapa-method-cbe"
              >
                <Smartphone className="w-4 h-4 text-green-700" />
                <span className="text-[9px] font-mono font-bold leading-tight">CBE BIRR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("awash")}
                className={`border p-2 text-center flex flex-col items-center justify-center space-y-1 ${
                  paymentMethod === "awash" ? "border-blue-600 bg-blue-50/50" : "border-black bg-white"
                }`}
                id="chapa-method-awash"
              >
                <Smartphone className="w-4 h-4 text-yellow-600" />
                <span className="text-[9px] font-mono font-bold leading-tight">AWASH</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`border p-2 text-center flex flex-col items-center justify-center space-y-1 ${
                  paymentMethod === "card" ? "border-blue-600 bg-blue-50/50" : "border-black bg-white"
                }`}
                id="chapa-method-card"
              >
                <CreditCard className="w-4 h-4 text-black" />
                <span className="text-[9px] font-mono font-bold leading-tight">CARD</span>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handlePay} className="space-y-4">
              {paymentMethod !== "card" ? (
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-bold text-black">
                    ENTER {paymentMethod.toUpperCase()} MOBILE NUMBER
                  </label>
                  <div className="relative border border-black">
                    <span className="absolute left-3 top-2 text-xs font-mono text-gray-500 font-bold">
                      +251
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="911223344"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      disabled={isProcessing}
                      maxLength={9}
                      className="w-full bg-white pl-14 pr-3 py-2 text-xs font-mono text-black outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-sans leading-tight">
                    Enter the phone number linked to your {paymentMethod} mobile money wallet. You will receive an OTP or prompt.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold text-black">
                      CARD NUMBER
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                      disabled={isProcessing}
                      className="w-full bg-white border border-black px-3 py-2 text-xs font-mono text-black outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-black">
                        EXPIRY DATE
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        disabled={isProcessing}
                        className="w-full bg-white border border-black px-3 py-2 text-xs font-mono text-black outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold text-black">
                        CVV
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        disabled={isProcessing}
                        className="w-full bg-white border border-black px-3 py-2 text-xs font-mono text-black outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Shield */}
              <div className="flex items-center gap-2 text-[10px] font-sans text-gray-500 bg-gray-50 border border-gray-200 p-2">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>
                  PCI-DSS Compliant. Your credentials are fully encrypted and transmitted securely via secure connection.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-3 font-mono text-xs font-bold tracking-wider text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-2 transition-colors ${
                  isProcessing ? "opacity-75 cursor-not-allowed" : ""
                }`}
                id="chapa-submit-btn"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-1.5 animate-pulse">
                    PROCESSING PAYMENT...
                  </span>
                ) : (
                  <span>PAY {orderAmount.toLocaleString()} ETB NOW</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
