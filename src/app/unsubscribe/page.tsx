import { Metadata } from "next";
import UnsubscribeForm from "./UnsubscribeForm";

export const metadata: Metadata = { title: "Unsubscribe | IllinoisTrivia.com" };

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold text-[#0B1C3A] mb-6 text-center">Unsubscribe</h1>
      <UnsubscribeForm token={searchParams.token || ""} />
    </div>
  );
}
