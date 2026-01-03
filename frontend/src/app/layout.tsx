import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageTitleProvider } from "@/components/providers/page-title-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CertifGen - Certificate Generator",
  description: "Generate professional certificates with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PageTitleProvider>
          <div className="flex min-h-screen">
            {/* Sidebar - hidden on mobile */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 lg:ml-64">
              <Header />
              <main className="p-6">
                {children}
              </main>
            </div>
          </div>
        </PageTitleProvider>
      </body>
    </html>
  );
}
