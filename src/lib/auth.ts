import { getServerSession } from "next-auth";

export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession();
  if (!session?.user?.email) return false;

  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return !!session.user.email;
  return allowed.includes(session.user.email.toLowerCase());
}

export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("Unauthorized");
  }
}
