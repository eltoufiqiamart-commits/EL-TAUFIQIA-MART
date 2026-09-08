"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  isActive: boolean;
};

export default function CustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/customers", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر تحميل العملاء");
      setCustomers(data.customers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) load();
  }

  return (
    <main dir="rtl" className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">العملاء</h1>
            <p className="mt-1 text-sm text-gray-500">عرض وإدارة حسابات العملاء</p>
          </div>
          <button onClick={load} className="rounded-lg border px-4 py-2 text-sm">تحديث</button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto rounded-xl border bg-white">
          {loading ? <div className="p-6 text-sm">جاري التحميل...</div> :
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3">العميل</th>
                <th className="p-3">البريد</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">التسجيل</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3">{[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}</td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3">{c.phone || "—"}</td>
                  <td className="p-3">{new Date(c.createdAt).toLocaleDateString("ar-EG")}</td>
                  <td className="p-3">{c.isActive ? "نشط" : "موقوف"}</td>
                  <td className="p-3">
                    <button onClick={() => toggle(c.id, !c.isActive)} className="rounded-lg border px-3 py-1.5">
                      {c.isActive ? "إيقاف" : "تفعيل"}
                    </button>
                  </td>
                </tr>
              ))}
              {!customers.length && <tr><td colSpan={6} className="p-8 text-center text-gray-500">لا يوجد عملاء</td></tr>}
            </tbody>
          </table>}
        </div>
      </div>
    </main>
  );
}
