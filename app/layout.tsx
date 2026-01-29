import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "@/styles/globals.css"

import { Providers } from "@/providers"

import { Footer } from "@/components/navigation/footer"
import { Navbar } from "@/components/navigation/navbar"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Accessibility Heuristics Guide",
    template: "%s | Accessibility Heuristics Guide",
  },
  description:
    "A comprehensive collection of 37 accessibility heuristics for designers and developers, organized into 6 key categories. Based on WCAG guidelines and industry best practices.",
  keywords: [
    "accessibility",
    "a11y",
    "WCAG",
    "heuristics",
    "design",
    "development",
    "inclusive design",
    "web accessibility",
    "screen readers",
    "keyboard navigation",
  ],
  authors: [{ name: "Accessibility Heuristics" }],
  creator: "Accessibility Heuristics",
  publisher: "Accessibility Heuristics",
  metadataBase: new URL("https://a11y-heuristics.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://a11y-heuristics.vercel.app",
    title: "Accessibility Heuristics Guide",
    description:
      "A comprehensive collection of 37 accessibility heuristics for designers and developers.",
    siteName: "Accessibility Heuristics Guide",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Accessibility Heuristics Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Accessibility Heuristics Guide",
    description:
      "A comprehensive collection of 37 accessibility heuristics for designers and developers.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-[1400px] flex-1 px-3 pb-8 sm:px-8">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
