import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ScrollToTop } from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "ProAudit — Prosuma",
  description: "Application d'audit superviseur pour le groupe Prosuma",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "ProAudit", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ED7D31",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <Script src="/register-sw.js" strategy="afterInteractive" />
      </head>
      <body className="antialiased">
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
