"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

interface CartItem {
  id: string;
  quantity: number;
  productId: string;
  productNameAr: string;
  productNameEn: string;
  productSlug: string;
  productPrice: string;
  productDiscountPercent: string | null;
  productStock: number;
  productImageUrl: string | null;
  productCondition: string;
  partNumber: string | null;
  sellerId: string | null;
  sellerStoreName: string | null;
  brandNameAr: string | null;
  brandNameEn: string | null;
  isActive: boolean | null;
  sellerStatus: string | null;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  addToCart: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Clear the cart the moment the signed-in user changes (e.g. on logout)
  // by adjusting state during render — React's recommended alternative to
  // a useEffect that just mirrors one piece of state to another. Only the
  // "no user" side needs an explicit reset; the "logged in" side is
  // populated by refreshCart's fetch below.
  const [lastUserId, setLastUserId] = useState<string | null>(user?.id ?? null);
  const currentUserId = user?.id ?? null;
  if (currentUserId !== lastUserId) {
    setLastUserId(currentUserId);
    if (!currentUserId) setItems([]);
  }

  const refreshCart = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) return { success: false, error: "يجب تسجيل الدخول أولاً" };
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshCart();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "خطأ في الاتصال" };
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      await refreshCart();
    } catch {
      // silent
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      await refreshCart();
    } catch {
      // silent
    }
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addToCart,
      removeFromCart,
      updateQuantity,
      refreshCart,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
