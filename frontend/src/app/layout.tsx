import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  Inter,
  Roboto,
  Montserrat,
  Open_Sans,
  Lato,
  Playfair_Display,
  DM_Serif_Display,
  Great_Vibes,
  Dancing_Script
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Certificate fonts - loaded for editor preview
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const roboto = Roboto({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-roboto", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" });
const lato = Lato({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-lato", display: "swap" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display", display: "swap" });
const dmSerifDisplay = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-dm-serif-display", display: "swap" });
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-great-vibes", display: "swap" });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script", display: "swap" });

export const metadata: Metadata = {
  title: "CertiFlow - Design, Issue & Verify Certificates at Lightning Speed",
  description: "The modern standard for digital credentials. Design beautiful certificates with our drag-and-drop editor, issue thousands in seconds, and verify authenticity instantly. Trusted by educators, event organizers, and enterprises worldwide.",
  keywords: ["certificate generator", "digital certificates", "credential verification", "bulk certificate generation", "certificate design", "online certificates", "certificate automation"],
  authors: [{ name: "CertiFlow" }],
  creator: "CertiFlow",
  publisher: "CertiFlow",
  metadataBase: new URL('https://certiflow.shivang.dev'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "CertiFlow - Design, Issue & Verify Certificates at Lightning Speed",
    description: "The modern standard for digital credentials. Design beautiful certificates with our drag-and-drop editor, issue thousands in seconds, and verify authenticity instantly.",
    url: 'https://certiflow.shivang.dev',
    siteName: 'CertiFlow',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CertiFlow - Design, Issue & Verify Certificates at Lightning Speed",
    description: "The modern standard for digital credentials. Design beautiful certificates with our drag-and-drop editor, issue thousands in seconds.",
    creator: '@certiflow',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${roboto.variable} ${montserrat.variable} ${openSans.variable} ${lato.variable} ${playfairDisplay.variable} ${dmSerifDisplay.variable} ${greatVibes.variable} ${dancingScript.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
