import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "IllinoisTrivia.com",
  description: "Find trivia night fundraising events across Illinois",
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
        <header className="bg-white border-b-4 border-[#ED1C24] shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <span className="text-2xl font-black leading-tight tracking-tight">
                <span className="text-[#58595B]">illinois</span>
                <span className="text-[#ED1C24]">TRIVIA</span>
                <span className="text-[#58595B]">.com</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-[#58595B] font-medium hover:text-[#ED1C24] transition-colors">
                Events
              </Link>
              <Link href="/submit" className="bg-[#ED1C24] hover:bg-red-700 text-white px-4 py-2 rounded font-medium transition-colors">
                Submit an Event
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
          {children}
        </main>

        <footer className="bg-[#58595B] text-gray-300 text-sm text-center py-4">
          <p>
            &copy; {new Date().getFullYear()}{" "}
            <span className="text-white font-semibold">illinois</span>
            <span className="text-[#ED1C24] font-black">TRIVIA</span>
            <span className="text-white font-semibold">.com</span>
            {" "}&mdash; Trivia night fundraisers across the Prairie State
          </p>
        </footer>

        {siteKey && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
