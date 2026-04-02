import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import SessionProvider from "@/components/SessionProvider";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "IllinoisTrivia.com",
  description: "Find trivia night fundraising events across Illinois",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    siteName: "IllinoisTrivia.com",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <GoogleAnalytics />
        <SessionProvider>
          <header className="bg-white border-b-4 border-[#C83803] shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <span className="text-2xl font-black leading-tight tracking-tight">
                  <span className="text-[#0B1C3A]">Illinois</span>
                  <span className="text-[#C83803]">Trivia</span>
                  <span className="text-[#0B1C3A]">.com</span>
                </span>
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="text-[#0B1C3A] font-medium hover:text-[#C83803] transition-colors">
                  Events
                </Link>
                <Link href="/map" className="text-[#0B1C3A] font-medium hover:text-[#C83803] transition-colors">
                  Map
                </Link>
                <Link href="/pub-quiz" className="text-[#0B1C3A] font-medium hover:text-[#C83803] transition-colors">
                  Pub Quiz
                </Link>
                <Link href="/past-events" className="text-[#0B1C3A] font-medium hover:text-[#C83803] transition-colors">
                  Past Events
                </Link>
                <Link href="/contact" className="text-[#0B1C3A] font-medium hover:text-[#C83803] transition-colors">
                  Contact
                </Link>
                <Link href="/submit" className="bg-[#C83803] hover:bg-orange-800 text-white px-4 py-2 rounded font-medium transition-colors">
                  Submit an Event
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
            {children}
          </main>

          <footer className="bg-[#0B1C3A] text-gray-300 text-sm py-6">
            <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>
                &copy; {new Date().getFullYear()}{" "}
                <span className="text-white font-semibold">Illinois</span>
                <span className="text-[#C83803] font-black">Trivia</span>
                <span className="text-white font-semibold">.com</span>
                {" "}&mdash; Trivia night fundraisers across the Prairie State
              </p>
              <div className="flex gap-4 items-center">
                <Link href="/past-events" className="hover:text-white transition-colors">Past Events</Link>
                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                <Link href="/submit" className="hover:text-white transition-colors">Submit Event</Link>
                <a
                  href="https://www.facebook.com/TriviaNights"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Join our Facebook Group
                </a>
              </div>
            </div>
          </footer>

          {siteKey && (
            <Script
              src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
              strategy="afterInteractive"
            />
          )}
        </SessionProvider>
      </body>
    </html>
  );
}
