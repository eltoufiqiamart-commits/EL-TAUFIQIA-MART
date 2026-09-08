"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // On the login route itself we render <>{children}</> unconditionally
    // below, before ever reading `checking` — so there is nothing to
    // resolve here, and no need to touch `checking` at all for this path.
    if (pathname === "/admin/login") return;
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.user?.role === "admin") {
          setIsAdmin(true);
        } else {
          router.push("/admin/login");
        }
      })
      .catch(() => router.push("/admin/login"))
      .finally(() => setChecking(false));
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565C0]" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const navLinks = [
    { href: "/admin/orders", label: "الطلبات", icon: "orders" },
    { href: "/admin/products", label: "المنتجات", icon: "products" },
    { href: "/admin/categories", label: "التصنيفات", icon: "categories" },
    { href: "/admin/shipping-methods", label: "الشحن", icon: "shipping" },
    { href: "/admin/reviews", label: "المراجعات", icon: "reviews" },
    { href: "/admin/customers", label: "العملاء", icon: "customers" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1565C0] text-white flex flex-col min-h-screen flex-shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Tawfiqia Mart"
              width={120}
              height={80}
              className="h-8 w-auto object-contain"
            />
            <p className="text-blue-200 text-xs">لوحة الإدارة</p>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navLinks.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href) ? "bg-white/20 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.icon === "orders" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                  {link.icon === "products" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4-8-4m8 4v10" />
                    </svg>
                  )}
                  {link.icon === "categories" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  )}
                  {link.icon === "customers" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8m9 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                  )}
                  {link.icon === "reviews" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 3z" /></svg>
                  )}
                  {link.icon === "shipping" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a2 2 0 104 0m6 0a2 2 0 104 0" />
                    </svg>
                  )}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-white/10">
          <Link href="/" className="block text-xs text-blue-200 hover:text-white mb-2 px-3 py-1.5">
            الموقع الرئيسي
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-right px-3 py-2 text-sm text-red-300 hover:text-red-100 hover:bg-red-900/30 rounded-lg transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
