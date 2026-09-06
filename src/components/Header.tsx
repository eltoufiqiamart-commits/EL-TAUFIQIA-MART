"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="w-full">
      {/* Top bar */}
      <div className="bg-gray-900 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-gray-300 text-xs">
            <span>
              <a href="tel:01206680398" className="hover:text-white transition-colors">01206680398</a>
            </span>
            <span>|</span>
            <span>
              <a href="mailto:eltoufiqiamart@gmail.com" className="hover:text-white transition-colors">
                eltoufiqiamart@gmail.com
              </a>
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-300">
            <a
              href="https://wa.me/201206680398"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 transition-colors flex items-center gap-1"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              واتساب
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-[#1565C0] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Tawfiqia Mart"
                width={160}
                height={107}
                priority
                className="h-11 w-auto object-contain"
              />
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن قطعة الغيار، رقم القطعة، الماركة..."
                  className="w-full bg-white text-gray-900 rounded-r-lg px-4 py-2.5 text-sm outline-none placeholder-gray-400"
                  dir="rtl"
                />
                <button
                  type="submit"
                  className="bg-[#FF9900] hover:bg-[#E68900] text-white px-5 py-2.5 rounded-l-lg transition-colors font-medium text-sm flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h7m-7 0a1 1 0 100 2 1 1 0 000-2zm7 0a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
                <span className="text-sm font-medium hidden sm:inline">السلة</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 bg-[#FF9900] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className="w-6 h-6 bg-[#FF9900] rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {user.fullName?.charAt(0) || user.email.charAt(0)}
                    </div>
                    <span className="text-sm hidden sm:inline max-w-24 truncate">{user.fullName || user.email}</span>
                    <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 text-gray-700">
                      {user.role === "admin" && (
                        <>
                          <Link href="/admin/orders" className="block px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700" onClick={() => setUserMenuOpen(false)}>
                            لوحة الإدارة
                          </Link>
                          <hr className="my-1" />
                        </>
                      )}
                      {user.role === "seller" && (
                        <>
                          <Link href="/seller/dashboard" className="block px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700" onClick={() => setUserMenuOpen(false)}>
                            لوحة البائع
                          </Link>
                          <hr className="my-1" />
                        </>
                      )}
                      <Link href="/account" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                        حسابي
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                        طلباتي
                      </Link>
                      <Link href="/my-cars" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                        سياراتي
                      </Link>
                      <Link href="/favorites" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                        المفضلة
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Link
                    href="/auth/login"
                    className="text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
                  >
                    دخول
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-sm bg-[#FF9900] hover:bg-[#E68900] rounded-lg px-3 py-2 transition-colors font-medium"
                  >
                    تسجيل
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden bg-white/10 rounded-lg p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Nav bar */}
        <div className="bg-[#0D47A1] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-1">
              <Link href="/" className="text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors">
                الرئيسية
              </Link>
              <Link href="/search" className="text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors">
                جميع المنتجات
              </Link>
              <Link href="/categories" className="text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors">
                التصنيفات
              </Link>
              <Link href="/my-cars" className="text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors">
                سياراتي
              </Link>
              <Link href="/seller/apply" className="text-white/90 hover:text-white hover:bg-white/10 rounded px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors">
                بع معنا
              </Link>
            </nav>

            {/* Mobile menu */}
            {menuOpen && (
              <nav className="md:hidden py-2 border-t border-white/10">
                <div className="flex flex-col gap-1">
                  <Link href="/" className="text-white/90 hover:text-white px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>الرئيسية</Link>
                  <Link href="/search" className="text-white/90 hover:text-white px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>جميع المنتجات</Link>
                  <Link href="/categories" className="text-white/90 hover:text-white px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>التصنيفات</Link>
                  <Link href="/my-cars" className="text-white/90 hover:text-white px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>سياراتي</Link>
                  <Link href="/seller/apply" className="text-white/90 hover:text-white px-3 py-2 text-sm" onClick={() => setMenuOpen(false)}>بع معنا</Link>
                </div>
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
