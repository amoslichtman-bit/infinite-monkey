import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Infinite Monkey",
  description: "The K. The K. It won't come out. I want to be a bug but I have to type the K.",
  openGraph: {
    title: "Infinite Monkey",
    description: "The K. The K. It won't come out. I want to be a bug but I have to type the K.",
    type: "website",
    // Deleting the old images array entirely prevents the "create new app" graphic from showing
    images: [], 
  },
  twitter: {
    card: "summary",
    title: "Infinite Monkey",
    description: "The K. The K. It won't come out. I want to be a bug but I have to type the K.",
    images: [],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
