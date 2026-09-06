"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/utils";

interface SellerProduct {
  id: string; nameAr: string; price: string; stock: number; isActive: boolean;
  categoryNameAr?: string; brandNameAr?: string; partNumber?: string; mainImageUrl?: string; createdAt: string;
}

interface SellerOrder {
  sellerOrderId: string; sellerOrderStatus: string; sellerSubtotal: string;
  orderNumber: string; customerName: string; customerPhone: string;
  orderPaymentMethod: string; orderCreatedAt: string;
}

export default function SellerDashboardPage() {
  const { user, sellerProfile } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    if (user.role !== "seller" && user.role !== "admin") { router.push("/"); return; }
    
    Promise.all([
      fetch("/api/seller/products").then(r => r.json()),
      fetch("/api/seller/orders").then(r => r.json()),
    ]).then(([pData, oData]) => {
      setProducts(pData.products || []);
      setOrders(oData.orders || []);
    }).finally(() => setLoading(false));
  }, [user, router]);

  if (!user || (user.role !== "seller" && user.role !== "admin")) return null;

  if (sellerProfile && sellerProfile.status !== "approved") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-yellow-800 mb-2">حساب البائع قيد المراجعة</h2>
          <p className="text-yellow-700 text-sm">حسابك كبائع لم يتم اعتماده بعد. سيتواصل معك فريقنا قريباً.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">لوحة البائع</h1>
        {tab === "products" && (
          <Link href="/seller/products/new" className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0D47A1] flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة منتج
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-black text-[#1565C0]">{products.length}</p>
          <p className="text-sm text-gray-500 mt-1">إجمالي المنتجات</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-black text-green-600">{products.filter(p => p.isActive).length}</p>
          <p className="text-sm text-gray-500 mt-1">منتجات نشطة</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-black text-[#FF9900]">{orders.length}</p>
          <p className="text-sm text-gray-500 mt-1">إجمالي الطلبات</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-3xl font-black text-purple-600">{orders.filter(o => o.sellerOrderStatus === "new").length}</p>
          <p className="text-sm text-gray-500 mt-1">طلبات جديدة</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        <button
          onClick={() => setTab("products")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === "products" ? "border-[#1565C0] text-[#1565C0]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          منتجاتي ({products.length})
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === "orders" ? "border-[#1565C0] text-[#1565C0]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          الطلبات ({orders.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white h-16 rounded-xl animate-pulse" />)}
        </div>
      ) : tab === "products" ? (
        products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <p className="text-gray-500 mb-4">لا توجد منتجات بعد</p>
            <Link href="/seller/products/new" className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-medium">أضف أول منتج</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">المنتج</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">التصنيف</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">السعر</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">المخزون</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {p.mainImageUrl && <img src={p.mainImageUrl} alt={p.nameAr} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{p.nameAr}</p>
                            {p.partNumber && <p className="text-xs text-gray-400 font-mono">{p.partNumber}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{p.categoryNameAr || "-"}</td>
                      <td className="px-4 py-3 font-bold text-[#1565C0]">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-yellow-600" : "text-green-600"}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.isActive ? "نشط" : "معطل"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/seller/products/${p.id}/edit`} className="text-[#1565C0] hover:underline text-xs">تعديل</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500">لا توجد طلبات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const statusInfo = ORDER_STATUS_LABELS[order.sellerOrderStatus];
              return (
                <Link key={order.sellerOrderId} href={`/seller/orders/${order.sellerOrderId}`}>
                  <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#1565C0] transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-gray-900">{order.orderNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium status-${order.sellerOrderStatus}`}>
                            {statusInfo?.ar || order.sellerOrderStatus}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{order.customerName}</p>
                        <p className="text-xs text-gray-400">{new Date(order.orderCreatedAt).toLocaleDateString("ar-EG")}</p>
                      </div>
                      <p className="font-black text-[#1565C0]">{formatPrice(order.sellerSubtotal)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
