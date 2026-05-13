import "dotenv/config";
import { faker } from "@faker-js/faker";
import { env } from "../src/env";
import { db } from "../src/db/client";
import { members, tenants } from "../src/db/schema";
import { eq } from "drizzle-orm";

const TOTAL_MEMBERS = 100;
const GABRIEL_INDEX = 70;

main().catch((err) => {
  console.error("seed failed", err);
  process.exit(1);
});

async function main() {
  faker.seed(42);

  const tenantId = await findOrCreateTenant(env().DEMO_TENANT_NAME);
  await wipeMembers(tenantId);

  const rows = buildMemberRows(tenantId, env().DEMO_PHONE_NUMBER);
  await db().insert(members).values(rows);

  console.log(`Seeded ${rows.length} members into tenant ${tenantId}.`);
  console.log(`Gabriel Avila is at seed index ${GABRIEL_INDEX} with priority_score 0.000.`);
  process.exit(0);
}

async function findOrCreateTenant(name: string): Promise<string> {
  const existing = await db().select().from(tenants).where(eq(tenants.name, name)).limit(1);
  const first = existing[0];
  if (first) return first.id;
  const inserted = await db().insert(tenants).values({ name }).returning({ id: tenants.id });
  const row = inserted[0];
  if (!row) throw new Error("Failed to create tenant");
  return row.id;
}

async function wipeMembers(tenantId: string) {
  await db().delete(members).where(eq(members.tenantId, tenantId));
}

type MemberRow = typeof members.$inferInsert;

function buildMemberRows(tenantId: string, demoPhone: string): MemberRow[] {
  const rows: MemberRow[] = [];
  for (let i = 0; i < TOTAL_MEMBERS; i++) {
    if (i === GABRIEL_INDEX) {
      rows.push(buildGabriel(tenantId, demoPhone));
      continue;
    }
    rows.push(buildRandomMember(tenantId, i));
  }
  return rows;
}

function buildGabriel(tenantId: string, demoPhone: string): MemberRow {
  return {
    tenantId,
    externalId: "MBR-000071",
    firstName: "Gabriel",
    lastName: "Avila",
    phone: demoPhone,
    priorityScore: "0.000",
    priorityRationale: null,
    flags: [],
  };
}

function buildRandomMember(tenantId: string, index: number): MemberRow {
  return {
    tenantId,
    externalId: `MBR-${String(index + 1).padStart(6, "0")}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone: faker.phone.number({ style: "international" }),
    priorityScore: randomLowScore(),
    priorityRationale: null,
    flags: [],
  };
}

function randomLowScore(): string {
  const value = Math.random() * 0.6;
  return value.toFixed(3);
}
