import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperAdmin, signOut } from "@/lib/auth";

const navigation = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/logs", label: "Logs" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/admin" className="font-display text-2xl font-semibold">
            Ongevia Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <form action={logout}>
              <button type="submit" className="text-muted hover:text-foreground">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
