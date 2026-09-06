"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function SellerApplyPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    storeName: "", storeNameAr: "", description: "", phone: "", address: "", taxId: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError("يجب تسجيل الدخول أولاً"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/seller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) setSubmitted(true);
      else setError(data.error || "خطأ في إرسال الطلب");
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">تم إرسال طلبك بنجاح!</h2>
          <p className="text-gray-500 text-sm mb-6">سيتم مراجعة طلبك والرد عليك في أقرب وقت ممكن.</p>
          <Link href="/" className="bg-[#1565C0] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#0D47A1]">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#FF9900] rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900">انضم كبائع</h1>
          <p className="text-gray-500 text-sm mt-1">أكمل بياناتك للتقديم كبائع على توفيقية مارت</p>
        </div>

        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
            يجب <Link href="/auth/login" className="font-bold underline">تسجيل الدخول</Link> أولاً للتقديم كبائع
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">اسم المتجر بالعربية *</label>
              <input value={form.storeNameAr} onChange={(e) => setForm({ ...form, storeNameAr: e.target.value })} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Store Name (English) *</label>
              <input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} required dir="ltr" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">وصف المتجر</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0] resize-none" placeholder="اكتب وصفاً مختصراً عن متجرك وما تبيعه..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">رقم الهاتف *</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required dir="ltr" placeholder="01xxxxxxxxx" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الرقم الضريبي (اختياري)</label>
              <input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">العنوان</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#1565C0] resize-none" placeholder="عنوان المتجر أو المخزن..." />
          </div>

          <button type="submit" disabled={loading || !user} className="w-full bg-[#FF9900] hover:bg-[#E68900] text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-60">
            {loading ? "جاري الإرسال..." : "تقديم الطلب"}
          </button>
        </form>
      </div>
    </div>
  );
}
