import type { Metadata } from "next";
import { getApprovedPubQuizzes } from "@/lib/db";
import PubQuizClient from "./PubQuizClient";

export const metadata: Metadata = {
  title: "Pub Quizzes in Illinois",
  description: "Weekly pub quiz nights across Illinois, by city and day of the week.",
};

export const dynamic = "force-dynamic";

export default function PubQuizPage() {
  const quizzes = getApprovedPubQuizzes();
  return <PubQuizClient quizzes={quizzes} />;
}
