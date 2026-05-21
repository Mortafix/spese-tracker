import type { Metadata } from "next";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";

config.autoAddCss = false;

export const metadata: Metadata = {
  applicationName: "Spese Tracker",
  title: "Spese Tracker",
  description: "Tracking privato delle spese ricorrenti di coppia",
  manifest: "/brand/favicons/site.webmanifest",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-image-preview": "none",
      "max-snippet": 0,
    },
  },
  icons: {
    icon: [
      { url: "/brand/favicons/favicon.ico", sizes: "any" },
      { url: "/brand/favicons/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/brand/favicons/favicon.ico",
    apple: [{ url: "/brand/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
