"use client";

import { signOut } from "next-auth/react";

export default function AdminSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-gray-500 hover:text-[#C83803] transition-colors"
    >
      Sign Out
    </button>
  );
}
