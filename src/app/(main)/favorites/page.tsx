"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function FavoritesPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">يجب تسجيل الدخول</h2>
        <Link href="/auth/login" className="bg-[#1565C0] text-white px-6 py-3 rounded-xl font-bold">تسجيل الدخول</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-900 mb-6">المفضلة</h1>
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h2 className="text-lg font-bold text-gray-600 mb-2">لا توجد منتجات مفضلة</h2>
        <p className="text-gray-400 text-sm mb-4">أضف المنتجات للمفضلة أثناء التسوق</p>
        <Link href="/search" className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-medium">تسوق الآن</Link>
      </div>
    </div>
  );
}
