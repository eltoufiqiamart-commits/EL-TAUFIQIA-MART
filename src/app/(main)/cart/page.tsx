"use client";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice, calculateDiscountedPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, loading } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-700 mb-2">يجب تسجيل الدخول أولاً</h2>
        <p className="text-gray-400 mb-6 text-sm">سجل دخولك لعرض سلتك والدفع</p>
        <Link href="/auth/login" className="bg-[#1565C0] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0D47A1] transition-colors">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.productPrice);
    const discounted = calculateDiscountedPrice(price, item.productDiscountPercent);
    return sum + discounted * item.quantity;
  }, 0);

  // Group by seller
  const sellerGroups = items.reduce((acc, item) => {
    const key = item.sellerId || "unknown";
    if (!acc[key]) acc[key] = { sellerName: item.sellerStoreName || "بائع", items: [] };
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { sellerName: string; items: typeof items }>);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-900 mb-6">سلة التسوق</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565C0]" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-600 mb-2">السلة فارغة</h2>
          <p className="text-gray-400 mb-6 text-sm">لم تضف أي منتجات بعد</p>
          <Link href="/search" className="bg-[#1565C0] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0D47A1] transition-colors">
            تسوق الآن
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {Object.entries(sellerGroups).map(([sellerId, group]) => (
              <div key={sellerId} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-600">
                    البائع: <span className="text-gray-900">{group.sellerName}</span>
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {group.items.map((item) => {
                    const price = parseFloat(item.productPrice);
                    const discounted = calculateDiscountedPrice(price, item.productDiscountPercent);
                    const hasDiscount = item.productDiscountPercent && parseFloat(item.productDiscountPercent) > 0;
                    const isInactive = !item.isActive || item.sellerStatus !== "approved";

                    return (
                      <div key={item.id} className={`p-4 flex gap-3 ${isInactive ? "opacity-60" : ""}`}>
                        {/* Image */}
                        <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                            {item.productImageUrl ? (
                              <img src={item.productImageUrl} alt={item.productNameAr} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full img-placeholder" />
                            )}
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.productId}`}>
                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-[#1565C0]">
                              {item.productNameAr}
                            </h3>
                          </Link>
                          {item.partNumber && (
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">{item.partNumber}</p>
                          )}
                          {isInactive && (
                            <p className="text-xs text-red-500 mt-1">هذا المنتج غير متاح حالياً</p>
                          )}
                          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-[#1565C0]">{formatPrice(discounted * item.quantity)}</span>
                              {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through">{formatPrice(price * item.quantity)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  className="px-2.5 py-1 hover:bg-gray-50 text-gray-600 text-sm font-bold"
                                >-</button>
                                <span className="px-3 py-1 text-sm border-x border-gray-200">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, Math.min(item.productStock, item.quantity + 1))}
                                  className="px-2.5 py-1 hover:bg-gray-50 text-gray-600 text-sm font-bold"
                                >+</button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-4">
              <h3 className="font-bold text-gray-900 mb-4">ملخص الطلب</h3>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">المجموع ({items.reduce((s, i) => s + i.quantity, 0)} قطعة)</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>خصم الدفع المسبق (2%)</span>
                  <span>-{formatPrice(subtotal * 0.02)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>الشحن</span>
                  <span>يُحسب عند الدفع</span>
                </div>
              </div>
              <div className="border-t pt-3 mb-4">
                <div className="flex items-center justify-between font-bold text-base">
                  <span>الإجمالي</span>
                  <span className="text-[#1565C0]">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">قبل الشحن والخصومات</p>
              </div>
              <button
                onClick={() => router.push("/checkout")}
                className="w-full bg-[#FF9900] hover:bg-[#E68900] text-white py-3 rounded-xl font-bold transition-colors"
              >
                متابعة الدفع
              </button>
              <Link href="/search" className="block text-center text-sm text-[#1565C0] mt-3 hover:underline">
                مواصلة التسوق
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
