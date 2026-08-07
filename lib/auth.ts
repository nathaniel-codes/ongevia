import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/client";
import { ensureWorkspaceForUser, getPrimaryWorkspace } from "@/lib/workspace";
import { ensureWallet } from "@/lib/wallet";
import { normalizePhone, verifyPhoneOtp } from "@/lib/phone";
import { logAction } from "@/lib/action-log";

type AdapterPrismaClient = Parameters<typeof PrismaAdapter>[0];

export const authConfig = {
  adapter: PrismaAdapter(prisma as unknown as AdapterPrismaClient),
  providers: [
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        code: { label: "OTP", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const phone = normalizePhone(String(credentials?.phone ?? ""));
        const code = String(credentials?.code ?? "");
        const displayName = String(credentials?.name ?? "")
          .trim()
          .slice(0, 80);
        if (!phone || !code) return null;

        const verified = await verifyPhoneOtp(phone, code);
        if (!verified.ok) return null;

        let user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone,
              phoneVerified: new Date(),
              name: displayName || null,
            },
          });
          await ensureWorkspaceForUser(user.id, phone);
          await ensureWallet(user.id);
          await logAction({
            actorUserId: user.id,
            action: "auth.signup",
            entityType: "User",
            entityId: user.id,
            meta: { phone, name: displayName || null },
          });
        } else {
          if (user.isSuspended) return null;
          const nameLooksLikePhone =
            !user.name ||
            user.name === user.phone ||
            /^\+?\d[\d\s-]{6,}$/.test(user.name);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              phoneVerified: new Date(),
              ...(displayName && nameLooksLikePhone
                ? { name: displayName }
                : {}),
            },
          });
          if (displayName && nameLooksLikePhone) {
            user = { ...user, name: displayName };
          }
          await ensureWorkspaceForUser(user.id, phone);
          await ensureWallet(user.id);
          await logAction({
            actorUserId: user.id,
            action: "auth.login",
            entityType: "User",
            entityId: user.id,
            meta: { phone },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    Credentials({
      id: "admin-password",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        let user = await prisma.user.findUnique({ where: { email } });

        // Bootstrap from env if no admin yet
        const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD ?? "";
        if (
          !user &&
          adminEmail &&
          adminPassword &&
          email === adminEmail &&
          password === adminPassword
        ) {
          const passwordHash = await bcrypt.hash(adminPassword, 12);
          user = await prisma.user.create({
            data: {
              email: adminEmail,
              passwordHash,
              isSuperAdmin: true,
              name: "Super Admin",
              emailVerified: new Date(),
            },
          });
        }

        if (!user?.passwordHash || !user.isSuperAdmin) return null;
        if (user.isSuspended) return null;

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return null;

        await logAction({
          actorUserId: user.id,
          actorType: "ADMIN",
          action: "admin.login",
          entityType: "User",
          entityId: user.id,
          meta: { email },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    Credentials({
      id: "impersonate",
      name: "Impersonate",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = String(credentials?.token ?? "");
        if (!token) return null;

        const key = `impersonate:${token}`;
        const row = await prisma.platformSetting.findUnique({ where: { key } });
        if (!row) return null;

        await prisma.platformSetting.delete({ where: { key } });

        try {
          const data = JSON.parse(row.value) as {
            adminId: string;
            targetUserId: string;
            exp: number;
          };
          if (Date.now() > data.exp) return null;

          const user = await prisma.user.findUnique({
            where: { id: data.targetUserId },
          });
          if (!user || user.isSuspended) return null;

          await logAction({
            actorUserId: data.adminId,
            impersonatedUserId: user.id,
            actorType: "ADMIN",
            action: "admin.impersonate",
            entityType: "User",
            entityId: user.id,
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isSuperAdmin: true, phone: true, email: true },
        });
        token.isSuperAdmin = dbUser?.isSuperAdmin ?? false;
        token.phone = dbUser?.phone ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
        session.user.phone = (token.phone as string | null) ?? null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isSuperAdmin) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      isSuperAdmin: true,
      isSuspended: true,
    },
  });
  if (!user?.isSuperAdmin || user.isSuspended) return null;
  return user;
}

export async function getCurrentWorkspaceId(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const workspace = await getPrimaryWorkspace(userId);
  if (workspace) return workspace.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, email: true },
  });

  const createdWorkspace = await ensureWorkspaceForUser(
    userId,
    user?.phone ?? user?.email
  );
  return createdWorkspace.id;
}
