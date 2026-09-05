"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface Car {
  id: string; nickname?: string; year?: number; isDefault: boolean;
  makeNameAr?: string; makeNameEn?: string; modelNameAr?: string; modelNameEn?: string;
  customMake?: string; customModel?: string; createdAt: string;
}

interface Make { id: string; nameAr: string; nameEn: string; }
interface Model { id: string; nameAr: string; nameEn: string; }

export default function MyCarsPage() {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ makeId: "", modelId: "", year: "", nickname: "", isDefault: false });
  const [saving, setSaving] = useState(false);

  const fetchCars = async () => {
    const res = await fetch("/api/my-cars");
    const data = await res.json();
    setCars(data.cars || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchCars();
    fetch("/api/vehicles/makes").then(r => r.json()).then(d => setMakes(d.makes || []));
  }, [user]);

  const handleMakeChange = (makeId: string) => {
    // Resetting modelId and loading that make's models is a direct response
    // to this user action (not a background sync), so it lives in the event
    // handler rather than a useEffect keyed on form.makeId.
    setForm(f => ({ ...f, makeId, modelId: "" }));
    if (!makeId) {
      setModels([]);
      return;
    }
    fetch(`/api/vehicles/models?makeId=${makeId}`).then(r => r.json()).then(d => setModels(d.models || []));
  };

  const addCar = async () => {
    if (!form.makeId) return;
    setSaving(true);
    const res = await fetch("/api/my-cars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ makeId: form.makeId || undefined, modelId: form.modelId || undefined, year: form.year ? parseInt(form.year) : undefined, nickname: form.nickname, isDefault: form.isDefault }),
    });
    if (res.ok) {
      setForm({ makeId: "", modelId: "", year: "", nickname: "", isDefault: false });
      setShowAdd(false);
      fetchCars();
    }
    setSaving(false);
  };

  const deleteCar = async (id: string) => {
    await fetch(`/api/my-cars/${id}`, { method: "DELETE" });
    fetchCars();
  };

  const setDefault = async (id: string) => {
    await fetch(`/api/my-cars/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    fetchCars();
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">يجب تسجيل الدخول</h2>
        <Link href="/auth/login" className="bg-[#1565C0] text-white px-6 py-3 rounded-xl font-bold">تسجيل الدخول</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">سياراتي</h1>
        <button onClick={() => setShowAdd(true)} className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0D47A1] flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          إضافة سيارة
        </button>
      </div>

      {showAdd && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-5">
          <h3 className="font-bold text-gray-900 mb-4">إضافة سيارة جديدة</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الماركة *</label>
              <select value={form.makeId} onChange={e => handleMakeChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]">
                <option value="">اختر الماركة</option>
                {makes.map(m => <option key={m.id} value={m.id}>{m.nameAr} ({m.nameEn})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">الموديل</label>
              <select value={form.modelId} onChange={e => setForm({...form, modelId: e.target.value})} disabled={!form.makeId || models.length === 0} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] disabled:opacity-60">
                <option value="">اختر الموديل</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.nameAr} ({m.nameEn})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">سنة الصنع</label>
              <input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} min="1990" max={new Date().getFullYear()} placeholder="مثال: 2018" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">اسم مختصر (اختياري)</label>
              <input value={form.nickname} onChange={e => setForm({...form, nickname: e.target.value})} placeholder="مثال: سيارتي الحمراء" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0]" />
            </div>
          </div>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} className="text-[#1565C0]" />
            <span className="text-sm text-gray-700">تعيين كسيارة افتراضية</span>
          </label>
          <div className="flex gap-2">
            <button onClick={addCar} disabled={saving || !form.makeId} className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button onClick={() => setShowAdd(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm">إلغاء</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="bg-white h-20 rounded-xl animate-pulse" />)}
        </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
          <h2 className="text-lg font-bold text-gray-600 mb-2">لا توجد سيارات</h2>
          <p className="text-gray-400 text-sm mb-4">أضف سيارتك للبحث عن القطع المناسبة</p>
          <button onClick={() => setShowAdd(true)} className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-medium">إضافة سيارة</button>
        </div>
      ) : (
        <div className="space-y-3">
          {cars.map(car => {
            const makeName = car.makeNameAr || car.customMake || "غير محدد";
            const modelName = car.modelNameAr || car.customModel || "";
            return (
              <div key={car.id} className={`bg-white rounded-xl border p-4 ${car.isDefault ? "border-[#1565C0] ring-1 ring-[#1565C0]/20" : "border-gray-100"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#1565C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm">
                          {makeName} {modelName} {car.year ? `(${car.year})` : ""}
                        </p>
                        {car.isDefault && (
                          <span className="bg-[#1565C0] text-white text-xs px-1.5 py-0.5 rounded">افتراضية</span>
                        )}
                      </div>
                      {car.nickname && <p className="text-xs text-gray-400">{car.nickname}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/search?make=${car.makeNameEn || ""}&model=${car.modelNameEn || ""}`}
                      className="text-xs text-[#1565C0] hover:underline"
                    >
                      بحث قطع
                    </Link>
                    {!car.isDefault && (
                      <button onClick={() => setDefault(car.id)} className="text-xs text-gray-500 hover:text-[#1565C0]">
                        تعيين افتراضي
                      </button>
                    )}
                    <button onClick={() => deleteCar(car.id)} className="text-xs text-red-400 hover:text-red-600">حذف</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
