import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/db/schema';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const allHackathons = await db.select().from(schema.hackathons);

  console.log(`\n========================================`);
  console.log(`  HACKATHON DATA QUALITY AUDIT REPORT`);
  console.log(`  Total hackathons: ${allHackathons.length}`);
  console.log(`  Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`========================================\n`);

  // Define fields to check
  const fieldsToCheck = [
    'description',
    'summary',
    'theme',
    'prizePool',
    'tracks',
    'website',
    'registration',
    'teams',
    'location',
    'organizer',
    'hostOrganizer',
    'coverImage',
    'logo',
    'tags',
    'techStack',
    'prizes',
    'sponsors',
    'agenda',
    'infoCards',
    'brief',
  ] as const;

  type FieldName = typeof fieldsToCheck[number];

  function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) return true;
    return false;
  }

  function getRegistrationUrl(reg: unknown): string {
    if (!reg) return '(null)';
    if (typeof reg === 'object' && reg !== null) {
      const r = reg as Record<string, unknown>;
      if (r.url) return String(r.url);
      if (r.registrationUrl) return String(r.registrationUrl);
      if (r.link) return String(r.link);
      return JSON.stringify(reg).substring(0, 120);
    }
    return String(reg);
  }

  // Collect stats
  const fieldMissingCount: Record<string, number> = {};
  fieldsToCheck.forEach(f => fieldMissingCount[f] = 0);

  interface HackathonReport {
    id: string;
    name: string;
    slug: string;
    status: string;
    missingFields: string[];
    missingCount: number;
    website: string;
    registrationUrl: string;
    startDate: string;
    endDate: string;
    isVerified: boolean;
    isFeatured: boolean;
  }

  const reports: HackathonReport[] = [];

  for (const h of allHackathons) {
    const missingFields: string[] = [];

    for (const field of fieldsToCheck) {
      const value = (h as Record<string, unknown>)[field];
      if (isEmpty(value)) {
        missingFields.push(field);
        fieldMissingCount[field]++;
      }
    }

    reports.push({
      id: h.id,
      name: h.name,
      slug: h.slug,
      status: h.status || 'unknown',
      missingFields,
      missingCount: missingFields.length,
      website: h.website || '(null)',
      registrationUrl: getRegistrationUrl(h.registration),
      startDate: h.startDate ? (h.startDate instanceof Date ? h.startDate.toISOString().split('T')[0] : String(h.startDate)) : '(null)',
      endDate: h.endDate ? (h.endDate instanceof Date ? h.endDate.toISOString().split('T')[0] : String(h.endDate)) : '(null)',
      isVerified: h.isVerified || false,
      isFeatured: h.isFeatured || false,
    });
  }

  // Sort by missing count (worst first)
  reports.sort((a, b) => b.missingCount - a.missingCount);

  // ---- SUMMARY TABLE ----
  console.log(`\n--- FIELD COMPLETENESS SUMMARY ---\n`);
  console.log(`${'Field'.padEnd(20)} | ${'Missing'.padEnd(8)} | ${'Present'.padEnd(8)} | Completeness`);
  console.log(`${'-'.repeat(20)}-+-${'-'.repeat(8)}-+-${'-'.repeat(8)}-+-${'-'.repeat(12)}`);
  for (const field of fieldsToCheck) {
    const missing = fieldMissingCount[field];
    const present = allHackathons.length - missing;
    const pct = allHackathons.length > 0 ? ((present / allHackathons.length) * 100).toFixed(0) : '0';
    console.log(`${field.padEnd(20)} | ${String(missing).padEnd(8)} | ${String(present).padEnd(8)} | ${pct}%`);
  }

  // ---- QUALITY TIERS ----
  const critical = reports.filter(r => r.missingCount >= 12);
  const poor = reports.filter(r => r.missingCount >= 8 && r.missingCount < 12);
  const fair = reports.filter(r => r.missingCount >= 4 && r.missingCount < 8);
  const good = reports.filter(r => r.missingCount < 4);

  console.log(`\n--- QUALITY DISTRIBUTION ---\n`);
  console.log(`  CRITICAL (12+ missing):  ${critical.length} hackathons`);
  console.log(`  POOR (8-11 missing):     ${poor.length} hackathons`);
  console.log(`  FAIR (4-7 missing):      ${fair.length} hackathons`);
  console.log(`  GOOD (0-3 missing):      ${good.length} hackathons`);

  // ---- DETAILED PER-HACKATHON REPORT ----
  console.log(`\n\n${'='.repeat(100)}`);
  console.log(`  DETAILED PER-HACKATHON REPORT (sorted by missing fields, worst first)`);
  console.log(`${'='.repeat(100)}\n`);

  for (const r of reports) {
    const tier = r.missingCount >= 12 ? '🔴 CRITICAL' : r.missingCount >= 8 ? '🟠 POOR' : r.missingCount >= 4 ? '🟡 FAIR' : '🟢 GOOD';
    console.log(`--- [${tier}] ${r.name} ---`);
    console.log(`  ID:       ${r.id}`);
    console.log(`  Slug:     ${r.slug}`);
    console.log(`  Status:   ${r.status} | Verified: ${r.isVerified} | Featured: ${r.isFeatured}`);
    console.log(`  Dates:    ${r.startDate} ~ ${r.endDate}`);
    console.log(`  Website:  ${r.website}`);
    console.log(`  RegURL:   ${r.registrationUrl}`);
    console.log(`  Missing (${r.missingCount}/${fieldsToCheck.length}): ${r.missingFields.join(', ') || '(none)'}`);
    console.log('');
  }

  // ---- ACTIONABLE: hackathons that need the most attention ----
  if (critical.length > 0 || poor.length > 0) {
    console.log(`\n${'='.repeat(100)}`);
    console.log(`  HACKATHONS NEEDING IMMEDIATE ATTENTION`);
    console.log(`${'='.repeat(100)}\n`);
    for (const r of [...critical, ...poor]) {
      console.log(`  - ${r.name} (${r.slug}) — missing ${r.missingCount} fields: ${r.missingFields.join(', ')}`);
    }
  }
}

main().catch(console.error);
