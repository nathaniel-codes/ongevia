import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db/client";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@ongevia.local")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "change-me-strong-password";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      isSuperAdmin: true,
      name: "Super Admin",
      emailVerified: new Date(),
    },
    update: {
      passwordHash,
      isSuperAdmin: true,
      isSuspended: false,
    },
  });

  console.log(`Admin ready: ${user.email} (${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
