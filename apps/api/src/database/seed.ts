import { hash } from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

import {
  PrismaClient,
  MembershipStatus,
  UserStatus,
} from "../generated/prisma/client.js";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for seeding.");

const isProduction = process.env.NODE_ENV === "production";
const ownerPassword = (() => {
  const configured =
    process.env.SEED_OWNER_PASSWORD ??
    (isProduction ? undefined : "ChangeMe123!");
  if (!configured)
    throw new Error("SEED_OWNER_PASSWORD is required in production.");
  return configured;
})();

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const permissions = [
  ["users.manage", "users", "Manage users and memberships", 3],
  ["roles.manage", "users", "Manage roles and permissions", 3],
  ["settings.manage", "settings", "Manage business settings", 3],
  ["audit.read", "audit", "Read sensitive audit history", 3],
  ["customers.read", "customers", "Read customer records", 1],
  ["customers.manage", "customers", "Create and edit customer records", 2],
  ["events.read", "events", "Read event records", 1],
  ["events.manage", "events", "Create and edit event records", 2],
  ["quotations.issue", "quotations", "Issue commercial quotations", 3],
  ["invoices.issue", "invoices", "Issue invoices", 3],
  ["payments.record", "payments", "Record and allocate payments", 3],
  ["reports.financial", "reports", "View financial reports", 3],
] as const;

async function seed() {
  const business = await prisma.business.upsert({
    where: { slug: "siddique-sons" },
    update: {},
    create: {
      slug: "siddique-sons",
      legalName: "Siddique Sons Caterers",
      displayName: "Siddique Sons Caterers",
      settings: { create: {} },
    },
  });

  const permissionRecords = [];
  for (const [key, module, description, riskLevel] of permissions) {
    permissionRecords.push(
      await prisma.permission.upsert({
        where: { key },
        update: { module, description, riskLevel },
        create: { key, module, description, riskLevel },
      }),
    );
  }

  const ownerRole = await prisma.role.upsert({
    where: { key: "system.owner" },
    update: {
      name: "Business Owner",
      description: "Full business administration",
      isSystem: true,
    },
    create: {
      key: "system.owner",
      name: "Business Owner",
      description: "Full business administration",
      isSystem: true,
    },
  });

  await prisma.rolePermission.createMany({
    data: permissionRecords.map((permission) => ({
      roleId: ownerRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  const email = (
    process.env.SEED_OWNER_EMAIL ?? "owner@sscsynapse.local"
  ).toLowerCase();
  const owner = await prisma.user.upsert({
    where: { emailNormalized: email },
    update: { status: UserStatus.ACTIVE },
    create: {
      email,
      emailNormalized: email,
      fullName: process.env.SEED_OWNER_NAME ?? "SSC Owner",
      passwordHash: await hash(ownerPassword),
      status: UserStatus.ACTIVE,
    },
  });

  const membership = await prisma.businessMembership.upsert({
    where: { businessId_userId: { businessId: business.id, userId: owner.id } },
    update: { status: MembershipStatus.ACTIVE, financialVisibility: true },
    create: {
      businessId: business.id,
      userId: owner.id,
      status: MembershipStatus.ACTIVE,
      financialVisibility: true,
      joinedAt: new Date(),
    },
  });

  await prisma.membershipRole.upsert({
    where: {
      membershipId_roleId: {
        membershipId: membership.id,
        roleId: ownerRole.id,
      },
    },
    update: {},
    create: { membershipId: membership.id, roleId: ownerRole.id },
  });

  console.info(`Seeded ${business.displayName} with owner ${email}.`);
}

seed()
  .finally(async () => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
