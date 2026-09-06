"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatPrice, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/utils";

interface Order {
  id: string; orderNumber: string; status: string; customerName: string;
  customerPhone: string; deliveryGovernorate?: string; total: string;
  paymentMethod: string; paymentStatus: string; createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "جميع الحالات" },
  { value: "new", label: "جديد" },
  { value: "confirmed", label: "مؤكد" },
  { value: "preparing", label: "قيد التجهيز" },
  { value: "ready_for_shipping", label: "جاهز للشحن" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغي" },
  { value: "returned", label: "مرتجع" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("page", page.toString());
    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [q, status, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">إدارة الطلبات</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="بحث برقم الطلب أو اسم العميل..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] flex-1 min-w-48"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]"
        >
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={fetchOrders} className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0D47A1]">
          بحث
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">رقم الطلب</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">العميل</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الدفع</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الإجمالي</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">التاريخ</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    لا توجد طلبات
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const statusInfo = ORDER_STATUS_LABELS[order.status];
                  const paymentInfo = PAYMENT_METHOD_LABELS[order.paymentMethod];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium text-[#1565C0]">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-gray-400 text-xs" dir="ltr">{order.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium status-${order.status}`}>
                          {statusInfo?.ar}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-600">{paymentInfo?.ar}</p>
                        <span className={`text-xs font-medium ${order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                          {order.paymentStatus === "paid" ? "مدفوع" : "في الانتظار"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#1565C0]">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                        <br />
                        {new Date(order.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${order.id}`} className="text-[#1565C0] hover:underline text-xs font-medium">
                          عرض التفاصيل
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-50 flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-40">السابق</button>
          <span className="text-sm text-gray-500">صفحة {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 20} className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-40">التالي</button>
        </div>
      </div>
    </div>
  );
}
