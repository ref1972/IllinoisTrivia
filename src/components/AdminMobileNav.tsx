"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pub-quizzes", label: "Pub Quizzes" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/venues", label: "Venues" },
  { href: "/admin/create", label: "Create Event" },
];

export default function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0B1C3A] text-white flex items-center justify-between px-4 h-14 shadow-md">
        <Link href="/admin" className="font-black text-lg tracking-tight" onClick={() => setOpen(false)}>
          <span className="text-white">IT</span>{" "}
          <span className="text-[#C83803]">Admin</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 flex items-center justify-center rounded-lg active:bg-white/10"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Spacer so content isn't hidden behind the fixed bar */}
      <div className="h-14" />

      {/* Overlay menu */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <nav className="fixed top-14 right-0 bottom-0 z-50 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex-1 py-4">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center px-6 py-3.5 text-base font-medium transition-colors ${
                      active
                        ? "bg-orange-50 text-[#C83803] border-r-4 border-[#C83803]"
                        : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="border-t px-6 py-4">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left text-sm text-gray-500 hover:text-[#C83803] transition-colors"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
