import { getApprovedPubQuizzes } from "@/lib/db";
import PubQuizClient from "./PubQuizClient";

export const dynamic = "force-dynamic";

export default function PubQuizPage() {
  const quizzes = getApprovedPubQuizzes();
  return <PubQuizClient quizzes={quizzes} />;
}
