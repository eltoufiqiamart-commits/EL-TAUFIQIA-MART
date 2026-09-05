import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

export const metadata: Metadata = {
  title: "توفيقية مارت - Tawfiqia Mart | سوق قطع غيار السيارات",
  description: "السوق المتخصص في قطع غيار السيارات في مصر. تسوق من أفضل البائعين بضمان الجودة والتوافق مع سيارتك.",
  keywords: "قطع غيار سيارات, spare parts, مصر, Egypt, توفيقية مارت",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased font-cairo">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
