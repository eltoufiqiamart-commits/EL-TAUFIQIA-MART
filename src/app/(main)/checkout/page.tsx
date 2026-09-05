"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice, calculateDiscountedPrice, PAYMENT_METHOD_LABELS, PREPAID_DISCOUNT_PERCENT } from "@/lib/utils";

interface ShippingMethod { id: string; nameAr: string; nameEn: string; fee: string; estimatedDays?: number; provider?: string; }

const PAYMENT_METHODS = [
  { value: "cash_on_delivery", ar: "الدفع عند الاستلام", desc: "لا يوجد خصم" },
  { value: "instapay", ar: "InstaPay", desc: "خصم 2% - رقم: 01119496168" },
  { value: "vodafone_cash", ar: "فودافون كاش", desc: "خصم 2% - رقم: 01099017820" },
  { value: "fawry", ar: "فوري", desc: "خصم 2% - رقم: 01206680398" },
  { value: "card", ar: "بطاقة بنكية", desc: "خصم 2%" },
  { value: "bank_transfer", ar: "تحويل بنكي", desc: "خصم 2%" },
];

export default function CheckoutPage() {
  const { items, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [form, setForm] = useState({
    customerName: user?.fullName || "",
    customerPhone: user?.phone || "",
    customerEmail: user?.email || "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryGovernorate: "",
    paymentMethod: "cash_on_delivery",
    shippingMethodId: "",
    customerNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Generated once when the checkout page loads and reused for every submit
  // attempt (including retries), so a double-click or network retry can never
  // create two orders — the server treats repeats of the same key as the
  // same order.
  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  // Once the (async-loaded) auth user becomes available, prefill any of
  // these three fields the person hasn't already typed into. Adjusting
  // state during render (guarded by syncedUserId) instead of in an effect
  // follows React's recommended "adjusting state when a prop changes"
  // pattern and avoids an extra commit/render pass.
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);
  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id);
    setForm(f => ({
      ...f,
      customerName: f.customerName || user.fullName || "",
      customerPhone: f.customerPhone || user.phone || "",
      customerEmail: f.customerEmail || user.email || "",
    }));
  }

  useEffect(() => {
    fetch("/api/shipping-methods").then(r => r.json()).then(d => {
      setShippingMethods(d.methods || []);
      if (d.methods?.length > 0) {
        setForm(f => ({ ...f, shippingMethodId: d.methods[0].id }));
      }
    });
  }, []);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">يجب تسجيل الدخول أولاً</h2>
        <Link href="/auth/login" className="bg-[#1565C0] text-white px-6 py-3 rounded-xl font-bold">تسجيل الدخول</Link>
      </div>
    );
  }

  if (!cartLoading && items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">السلة فارغة</h2>
        <Link href="/search" className="bg-[#1565C0] text-white px-6 py-3 rounded-xl font-bold">تسوق الآن</Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => {
    const p = parseFloat(item.productPrice);
    return sum + calculateDiscountedPrice(p, item.productDiscountPercent) * item.quantity;
  }, 0);

  const selectedShipping = shippingMethods.find(m => m.id === form.shippingMethodId);
  const shippingFee = selectedShipping ? parseFloat(selectedShipping.fee) : 0;
  const isPrepaid = form.paymentMethod !== "cash_on_delivery";
  const discount = isPrepaid ? subtotal * PREPAID_DISCOUNT_PERCENT / 100 : 0;
  const total = subtotal + shippingFee - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, idempotencyKey }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/orders/${data.order.id}?success=1`);
      } else {
        setError(data.error || "حدث خطأ أثناء إنشاء الطلب");
      }
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  const EGYPT_GOVERNORATES = [
    "القاهرة", "الجيزة", "الإسكندرية", "الشرقية", "الدقهلية", "البحيرة", "المنوفية", "الغربية", "كفر الشيخ",
    "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "الفيوم", "بني سويف",
    "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح",
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-900 mb-6">إتمام الطلب</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer Info */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">بيانات العميل</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">رقم الهاتف *</label>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    required
                    dir="ltr"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0]"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    dir="ltr"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0]"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">عنوان التوصيل</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">العنوان التفصيلي *</label>
                  <textarea
                    value={form.deliveryAddress}
                    onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                    required
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0] resize-none"
                    placeholder="الشارع، المبنى، الدور، الشقة..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">المحافظة</label>
                    <select
                      value={form.deliveryGovernorate}
                      onChange={(e) => setForm({ ...form, deliveryGovernorate: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0]"
                    >
                      <option value="">اختر المحافظة</option>
                      {EGYPT_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">المدينة/الحي</label>
                    <input
                      type="text"
                      value={form.deliveryCity}
                      onChange={(e) => setForm({ ...form, deliveryCity: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0]"
                      placeholder="مثال: مدينة نصر"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping */}
            {shippingMethods.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4">طريقة الشحن</h3>
                <div className="space-y-2">
                  {shippingMethods.map(method => (
                    <label key={method.id} className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${form.shippingMethodId === method.id ? "border-[#1565C0] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value={method.id}
                          checked={form.shippingMethodId === method.id}
                          onChange={(e) => setForm({ ...form, shippingMethodId: e.target.value })}
                          className="text-[#1565C0]"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{method.nameAr}</p>
                          {method.estimatedDays !== undefined && (
                            <p className="text-xs text-gray-500">
                              {method.estimatedDays === 0 ? "استلام فوري" : `${method.estimatedDays} أيام عمل`}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#1565C0]">
                        {parseFloat(method.fee) === 0 ? "مجاناً" : formatPrice(method.fee)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">طريقة الدفع</h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(method => (
                  <label key={method.value} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${form.paymentMethod === method.value ? "border-[#1565C0] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={form.paymentMethod === method.value}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      className="text-[#1565C0] mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{method.ar}</p>
                      <p className={`text-xs ${method.value !== "cash_on_delivery" ? "text-green-600 font-medium" : "text-gray-500"}`}>
                        {method.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {isPrepaid && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs text-green-700 font-medium">
                    سيتم تطبيق خصم {PREPAID_DISCOUNT_PERCENT}% على إجمالي طلبك عند اختيار الدفع المسبق
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3">ملاحظات إضافية</h3>
              <textarea
                value={form.customerNotes}
                onChange={(e) => setForm({ ...form, customerNotes: e.target.value })}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0] resize-none"
                placeholder="أي تعليمات خاصة للتوصيل أو الطلب..."
              />
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-4">
              <h3 className="font-bold text-gray-900 mb-4">ملخص الطلب</h3>

              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {items.map(item => {
                  const p = parseFloat(item.productPrice);
                  const discounted = calculateDiscountedPrice(p, item.productDiscountPercent);
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 bg-gray-50 rounded border border-gray-100 flex-shrink-0 overflow-hidden">
                        {item.productImageUrl ? (
                          <img src={item.productImageUrl} alt={item.productNameAr} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <span className="flex-1 line-clamp-1 text-gray-700">{item.productNameAr}</span>
                      <span className="text-gray-900 font-medium flex-shrink-0">x{item.quantity}</span>
                      <span className="text-[#1565C0] font-semibold flex-shrink-0">{formatPrice(discounted * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع الجزئي</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الشحن</span>
                  <span className="font-medium">{shippingFee === 0 ? "مجاناً" : formatPrice(shippingFee)}</span>
                </div>
                {isPrepaid && (
                  <div className="flex justify-between text-green-600">
                    <span>خصم الدفع المسبق ({PREPAID_DISCOUNT_PERCENT}%)</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>الإجمالي</span>
                  <span className="text-[#1565C0]">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="w-full mt-4 bg-[#FF9900] hover:bg-[#E68900] text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-60"
              >
                {submitting ? "جاري إنشاء الطلب..." : "تأكيد الطلب"}
              </button>

              <p className="text-xs text-gray-400 text-center mt-2">
                بالضغط على تأكيد الطلب فأنت توافق على شروط الاستخدام
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
