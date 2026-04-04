import type { Metadata } from "next";
import AdminShell from "@/components/AdminShell";
import AdminMobileNav from "@/components/AdminMobileNav";

export const metadata: Metadata = {
  title: "IT Admin — IllinoisTrivia",
  other: {
    "theme-color": "#0B1C3A",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminShell />
      <AdminMobileNav />
      <div className="admin-content">{children}</div>
    </>
  );
}
