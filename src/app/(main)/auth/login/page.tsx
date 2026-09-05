"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "خطأ في تسجيل الدخول");
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="Tawfiqia Mart"
                width={160}
                height={107}
                className="h-11 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-gray-900">تسجيل الدخول</h1>
            <p className="text-gray-500 text-sm mt-1">أهلاً بك في توفيقية مارت</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1565C0] hover:bg-[#0D47A1] text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-60"
            >
              {loading ? "جاري التحقق..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-500">
            ليس لديك حساب؟{" "}
            <Link href="/auth/register" className="text-[#1565C0] font-medium hover:underline">
              سجل الآن
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
