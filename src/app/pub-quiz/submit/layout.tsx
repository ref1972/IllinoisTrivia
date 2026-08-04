import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Pub Quiz",
  description: "Add a weekly pub quiz to the Illinois pub quiz directory.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
