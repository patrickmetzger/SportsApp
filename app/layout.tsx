import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import LoadingProvider from "@/components/providers/LoadingProvider";
import PageLoadingIndicator from "@/components/ui/PageLoadingIndicator";

export const metadata: Metadata = {
  title: "School Sports Management",
  description: "Sports management system for schools",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <LoadingProvider>
          <Suspense fallback={null}>
            <PageLoadingIndicator />
          </Suspense>
          <ImpersonationBanner />
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
