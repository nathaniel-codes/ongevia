import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";

export default async function DiagnosticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/dashboard");
  return children;
}
