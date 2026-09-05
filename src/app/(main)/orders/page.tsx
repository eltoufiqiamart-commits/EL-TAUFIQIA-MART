"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/utils";

interface Order {
  id: string; orderNumber: string; status: string; total: string;
  paymentMethod: string; createdAt: string; customerName: string;
  deliveryGovernorate?: string; itemCount?: number;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then(r => r.json())
      .then(d => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, [user]);

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
      <h1 className="text-2xl font-black text-gray-900 mb-6">طلباتي</h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white h-24 rounded-xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-lg font-bold text-gray-600 mb-2">لا توجد طلبات</h2>
          <p className="text-gray-400 text-sm mb-4">لم تقم بأي طلبات بعد</p>
          <Link href="/search" className="bg-[#1565C0] text-white px-6 py-2.5 rounded-xl font-medium">تسوق الآن</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const statusInfo = ORDER_STATUS_LABELS[order.status];
            const paymentInfo = PAYMENT_METHOD_LABELS[order.paymentMethod];
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#1565C0] transition-all">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">{order.orderNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium status-${order.status}`}>
                          {statusInfo?.ar || order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                        {order.deliveryGovernorate && ` • ${order.deliveryGovernorate}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{paymentInfo?.ar}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-[#1565C0] text-lg">{formatPrice(order.total)}</p>
                      <p className="text-xs text-gray-400 text-left">الإجمالي</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
