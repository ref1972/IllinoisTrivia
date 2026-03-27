import { notFound } from "next/navigation";
import { getEventByManageToken } from "@/lib/db";
import ManageForm from "./ManageForm";

export default async function ManagePage({ params }: { params: { token: string } }) {
  const event = getEventByManageToken(params.token);

  if (!event) return notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#58595B] mb-2">Manage Your Event</h1>
      <p className="text-gray-600 mb-6">
        You can request changes or deletion for <strong>{event.name}</strong>. All requests require admin approval before taking effect.
      </p>
      <ManageForm event={event} token={params.token} />
    </div>
  );
}
