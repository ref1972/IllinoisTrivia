import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit an Event",
  description: "List your Illinois trivia night fundraiser for free. Submissions are reviewed before going live.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
