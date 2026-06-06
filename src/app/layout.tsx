import type { Metadata, Viewport } from "next";
import "./globals.css";

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
        <script src="/register-sw.js" defer />
        <script dangerouslySetInnerHTML={{
          __html: `document.addEventListener('click',function(e){var t=e.target.closest('a');if(!t||!t.href)return;var u=new URL(t.href);if(u.pathname===location.pathname&&u.hostname===location.hostname){e.preventDefault();window.scrollTo({top:0,behavior:'smooth'})}})`
        }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
