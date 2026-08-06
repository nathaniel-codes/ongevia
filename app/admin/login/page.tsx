import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Ongevia Admin",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user?.isSuperAdmin) redirect("/admin");

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("admin-password", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirectTo: "/admin",
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }
      redirect("/admin/login?error=Invalid%20email%20or%20password");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-4xl font-semibold tracking-tight">
            Ongevia Admin
          </Link>
          <p className="mt-3 text-sm text-muted">Platform administration access</p>
        </div>
        <div className="panel rounded-xl p-8 shadow-sm">
          {params.error && <p className="mb-4 text-sm text-error">{params.error}</p>}
          <form action={login} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input id="email" name="email" type="email" required className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <input id="password" name="password" type="password" required className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
