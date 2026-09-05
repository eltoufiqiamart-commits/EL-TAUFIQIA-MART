"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function AccountPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">يجب تسجيل الدخول</h2>
        <Link href="/auth/login" className="bg-[#1565C0] text-white px-6 py-3 rounded-xl font-bold">تسجيل الدخول</Link>
      </div>
    );
  }

  const menuItems = [
    { href: "/orders", label: "طلباتي", icon: "orders", desc: "عرض وتتبع طلباتك" },
    { href: "/my-cars", label: "سياراتي", icon: "car", desc: "إدارة سياراتك المحفوظة" },
    { href: "/favorites", label: "المفضلة", icon: "heart", desc: "المنتجات التي أحببتها" },
    { href: "/cart", label: "السلة", icon: "cart", desc: "عرض سلة التسوق" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-900 mb-6">حسابي</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 flex items-center gap-4">
        <div className="w-16 h-16 bg-[#1565C0] rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
          {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">{user.fullName || "مستخدم"}</h2>
          <p className="text-gray-500 text-sm">{user.email}</p>
          {user.phone && <p className="text-gray-400 text-sm" dir="ltr">{user.phone}</p>}
          <div className="mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === "admin" ? "bg-red-100 text-red-700" : user.role === "seller" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
              {user.role === "admin" ? "مدير النظام" : user.role === "seller" ? "بائع" : "عميل"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {menuItems.map(item => (
          <Link key={item.href} href={item.href} className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:border-[#1565C0] hover:bg-blue-50 transition-all group">
            <div className="w-10 h-10 bg-blue-50 group-hover:bg-[#1565C0] rounded-xl flex items-center justify-center mx-auto mb-2 transition-colors">
              {item.icon === "orders" && <svg className="w-5 h-5 text-[#1565C0] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              {item.icon === "car" && <svg className="w-5 h-5 text-[#1565C0] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              {item.icon === "heart" && <svg className="w-5 h-5 text-[#1565C0] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
              {item.icon === "cart" && <svg className="w-5 h-5 text-[#1565C0] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            </div>
            <p className="text-xs font-semibold text-gray-700 group-hover:text-[#1565C0]">{item.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Special links for role */}
      {user.role === "seller" && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-5">
          <p className="text-sm font-medium text-orange-800 mb-3">حساب البائع</p>
          <Link href="/seller/dashboard" className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600">
            لوحة تحكم البائع
          </Link>
        </div>
      )}

      {user.role === "admin" && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
          <p className="text-sm font-medium text-red-800 mb-3">صلاحيات المدير</p>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
            لوحة الإدارة
          </Link>
        </div>
      )}

      <button
        onClick={logout}
        className="w-full bg-gray-100 hover:bg-red-50 text-red-600 py-3 rounded-xl font-medium transition-colors text-sm"
      >
        تسجيل الخروج
      </button>
    </div>
  );
}
