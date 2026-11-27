import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import FindEvents from "./FindEvents";

export default async function FindEventsPage() {
  if (!await isAdmin()) redirect("/admin/login");
  return <FindEvents />;
}
