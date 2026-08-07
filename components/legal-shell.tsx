import Link from "next/link";

interface LegalShellProps {
  title: string;
  description: string;
  updatedAt: string;
  children: React.ReactNode;
}

export default function LegalShell({
  title,
  description,
  updatedAt,
  children,
}: LegalShellProps) {
  return (
    <main className="min-h-screen">
      <header className="border-b border-border/70 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link
            href="/"
            className="font-display text-2xl font-semibold tracking-tight text-foreground"
          >
            Ongevia
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/privacy" className="text-muted hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-muted hover:text-foreground">
              Terms
            </Link>
            <Link
              href="/data-deletion"
              className="text-muted hover:text-foreground"
            >
              Data deletion
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-accent px-3 py-1.5 font-semibold text-white hover:bg-accent-hover"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-14 animate-fade-in">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Last updated {updatedAt}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-base leading-8 text-muted">{description}</p>
        <div className="mt-10 space-y-10 text-sm leading-7 text-foreground/90 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-accent [&_a]:underline">
          {children}
        </div>
      </article>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        <p>
          © {new Date().getFullYear()} Ongevia ·{" "}
          <a href="mailto:nathanielmwaipopo@gmail.com">
            nathanielmwaipopo@gmail.com
          </a>
        </p>
      </footer>
    </main>
  );
}
