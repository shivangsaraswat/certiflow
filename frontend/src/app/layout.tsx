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
import { SessionProvider } from "@/components/providers/session-provider";


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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${roboto.variable} ${montserrat.variable} ${openSans.variable} ${lato.variable} ${playfairDisplay.variable} ${dmSerifDisplay.variable} ${greatVibes.variable} ${dancingScript.variable} antialiased`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

