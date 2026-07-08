import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { execSync } from 'child_process';
import * as schema from '../lib/db/schema';

// ============ Types ============

interface LinkCheckResult {
  hackathonName: string;
  urlType: 'website' | 'registrationUrl';
  url: string;
  httpStatus: number | null;
  finalUrl: string;
  assessment: 'OK' | 'DEAD' | 'REDIRECT_SUSPICIOUS' | 'GENERIC_PAGE' | 'TIMEOUT' | 'ERROR';
  note: string;
}

// ============ Helpers ============

/**
 * Extract registration URL from the `registration` JSONB field.
 * The field structure varies — try common keys.
 */
function extractRegistrationUrl(reg: unknown): string | null {
  if (!reg || typeof reg !== 'object') return null;
  const r = reg as Record<string, unknown>;
  for (const key of ['url', 'registrationUrl', 'link', 'registrationLink']) {
    if (r[key] && typeof r[key] === 'string' && (r[key] as string).startsWith('http')) {
      return r[key] as string;
    }
  }
  return null;
}

/**
 * Use curl to perform a HEAD request (following redirects) and capture
 * the final HTTP status code and effective URL.
 */
function checkUrl(url: string): { httpStatus: number | null; finalUrl: string; error?: string } {
  try {
    // Use curl with:
    //   -s  silent
    //   -o /dev/null  discard body
    //   -I  HEAD request (but some servers reject HEAD, so we use -L with write-out)
    //   -L  follow redirects
    //   --max-time 10  timeout
    //   -w  write out status code and effective URL
    const cmd = `curl -sI -L --max-time 10 -o /dev/null -w '%{http_code}\\n%{url_effective}' '${url.replace(/'/g, "'\\''")}'`;
    const output = execSync(cmd, { timeout: 15000, encoding: 'utf-8' }).trim();
    const lines = output.split('\n');
    const statusCode = parseInt(lines[0], 10);
    const effectiveUrl = lines[1] || url;
    return { httpStatus: isNaN(statusCode) ? null : statusCode, finalUrl: effectiveUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ETIMEDOUT') || msg.includes('timed out') || msg.includes('timeout')) {
      return { httpStatus: null, finalUrl: url, error: 'TIMEOUT' };
    }
    return { httpStatus: null, finalUrl: url, error: msg.substring(0, 120) };
  }
}

/**
 * Known generic/unrelated domains that indicate the link is dead or wrong
 */
const GENERIC_DOMAINS = [
  'google.com/search',
  'bing.com/search',
  'baidu.com/s',
  'github.com/404',
  'example.com',
  'localhost',
  'about:blank',
];

const GENERIC_PAGE_INDICATORS = [
  '/404',
  '/not-found',
  'page not found',
  'error 404',
  'does not exist',
  'domain for sale',
  'parked domain',
  'coming soon',
  'buy this domain',
];

/**
 * Assess the link quality based on status code, final URL, and hackathon name.
 */
function assessLink(
  hackathonName: string,
  originalUrl: string,
  httpStatus: number | null,
  finalUrl: string,
  error?: string
): { assessment: LinkCheckResult['assessment']; note: string } {
  // Error / timeout
  if (error === 'TIMEOUT') {
    return { assessment: 'TIMEOUT', note: 'Request timed out (>10s)' };
  }
  if (error) {
    return { assessment: 'ERROR', note: error };
  }

  // Dead links
  if (httpStatus === null || httpStatus === 0) {
    return { assessment: 'DEAD', note: 'No response / DNS failure' };
  }
  if (httpStatus >= 400) {
    return { assessment: 'DEAD', note: `HTTP ${httpStatus}` };
  }

  // Check for generic domains
  const finalLower = finalUrl.toLowerCase();
  for (const gd of GENERIC_DOMAINS) {
    if (finalLower.includes(gd)) {
      return { assessment: 'GENERIC_PAGE', note: `Redirected to generic page: ${gd}` };
    }
  }

  // Check for redirect suspicion — did the domain change completely?
  const originalDomain = extractDomain(originalUrl);
  const finalDomain = extractDomain(finalUrl);

  if (originalDomain && finalDomain && originalDomain !== finalDomain) {
    // Some redirects are fine (www -> non-www, http -> https, short URLs)
    const origBase = originalDomain.replace(/^www\./, '');
    const finalBase = finalDomain.replace(/^www\./, '');
    if (origBase !== finalBase) {
      // Check if final URL still seems hackathon-related
      const nameTokens = hackathonName
        .toLowerCase()
        .replace(/[^a-z0-9一-鿿 ]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2);

      const urlContainsToken = nameTokens.some(
        token => finalLower.includes(token)
      );

      if (!urlContainsToken) {
        return {
          assessment: 'REDIRECT_SUSPICIOUS',
          note: `Domain changed: ${originalDomain} -> ${finalDomain}`,
        };
      }
    }
  }

  // Check for generic page indicators in final URL
  for (const indicator of GENERIC_PAGE_INDICATORS) {
    if (finalLower.includes(indicator)) {
      return { assessment: 'GENERIC_PAGE', note: `Final URL contains: ${indicator}` };
    }
  }

  // Status 200-399 with same-ish domain = OK
  if (httpStatus >= 200 && httpStatus < 400) {
    return { assessment: 'OK', note: `HTTP ${httpStatus}` };
  }

  return { assessment: 'OK', note: `HTTP ${httpStatus}` };
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.substring(0, len - 3) + '...';
}

// ============ Main ============

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log('Fetching all hackathons from database...');
  const allHackathons = await db.select().from(schema.hackathons);
  console.log(`Found ${allHackathons.length} hackathons.\n`);

  // Collect all URLs to check
  interface UrlToCheck {
    hackathonName: string;
    urlType: 'website' | 'registrationUrl';
    url: string;
  }

  const urlsToCheck: UrlToCheck[] = [];

  for (const h of allHackathons) {
    if (h.website && h.website.startsWith('http')) {
      urlsToCheck.push({
        hackathonName: h.name,
        urlType: 'website',
        url: h.website,
      });
    }

    const regUrl = extractRegistrationUrl(h.registration);
    if (regUrl) {
      urlsToCheck.push({
        hackathonName: h.name,
        urlType: 'registrationUrl',
        url: regUrl,
      });
    }
  }

  console.log(`Total URLs to verify: ${urlsToCheck.length}`);
  console.log(`  - Website URLs: ${urlsToCheck.filter(u => u.urlType === 'website').length}`);
  console.log(`  - Registration URLs: ${urlsToCheck.filter(u => u.urlType === 'registrationUrl').length}`);
  console.log(`\nStarting link verification (this may take a few minutes)...\n`);

  const results: LinkCheckResult[] = [];
  let completed = 0;

  for (const item of urlsToCheck) {
    completed++;
    process.stdout.write(`  [${completed}/${urlsToCheck.length}] Checking ${truncate(item.url, 60)}...`);

    const { httpStatus, finalUrl, error } = checkUrl(item.url);
    const { assessment, note } = assessLink(item.hackathonName, item.url, httpStatus, finalUrl, error);

    results.push({
      hackathonName: item.hackathonName,
      urlType: item.urlType,
      url: item.url,
      httpStatus,
      finalUrl,
      assessment,
      note,
    });

    // Color-coded inline status
    const statusIcon =
      assessment === 'OK' ? ' OK' :
      assessment === 'DEAD' ? ' DEAD' :
      assessment === 'REDIRECT_SUSPICIOUS' ? ' SUSPICIOUS' :
      assessment === 'GENERIC_PAGE' ? ' GENERIC' :
      assessment === 'TIMEOUT' ? ' TIMEOUT' :
      ' ERROR';
    process.stdout.write(` ${statusIcon}\n`);
  }

  // ============ Output Report ============

  console.log(`\n${'='.repeat(140)}`);
  console.log(`  HACKATHON LINK VERIFICATION REPORT`);
  console.log(`  Total URLs checked: ${results.length}`);
  console.log(`  Date: ${new Date().toISOString().split('T')[0]}`);
  console.log(`${'='.repeat(140)}\n`);

  // Summary counts
  const okCount = results.filter(r => r.assessment === 'OK').length;
  const deadCount = results.filter(r => r.assessment === 'DEAD').length;
  const suspiciousCount = results.filter(r => r.assessment === 'REDIRECT_SUSPICIOUS').length;
  const genericCount = results.filter(r => r.assessment === 'GENERIC_PAGE').length;
  const timeoutCount = results.filter(r => r.assessment === 'TIMEOUT').length;
  const errorCount = results.filter(r => r.assessment === 'ERROR').length;

  console.log(`--- SUMMARY ---\n`);
  console.log(`  OK:                  ${okCount}`);
  console.log(`  DEAD:                ${deadCount}`);
  console.log(`  REDIRECT_SUSPICIOUS: ${suspiciousCount}`);
  console.log(`  GENERIC_PAGE:        ${genericCount}`);
  console.log(`  TIMEOUT:             ${timeoutCount}`);
  console.log(`  ERROR:               ${errorCount}`);

  // Hackathons with NO URLs
  const hackathonsWithUrls = new Set(urlsToCheck.map(u => u.hackathonName));
  const hackathonsWithoutUrls = allHackathons.filter(h => !hackathonsWithUrls.has(h.name));
  if (hackathonsWithoutUrls.length > 0) {
    console.log(`\n  NO URL AT ALL:       ${hackathonsWithoutUrls.length} hackathons`);
    for (const h of hackathonsWithoutUrls) {
      console.log(`    - ${h.name}`);
    }
  }

  // ============ Full Table ============

  const colName = 30;
  const colType = 16;
  const colUrl = 45;
  const colStatus = 8;
  const colFinal = 45;
  const colAssess = 22;

  console.log(`\n--- FULL RESULTS TABLE ---\n`);
  console.log(
    `${'Hackathon Name'.padEnd(colName)} | ${'Type'.padEnd(colType)} | ${'URL'.padEnd(colUrl)} | ${'Status'.padEnd(colStatus)} | ${'Final URL'.padEnd(colFinal)} | ${'Assessment'.padEnd(colAssess)}`
  );
  console.log(
    `${'-'.repeat(colName)}-+-${'-'.repeat(colType)}-+-${'-'.repeat(colUrl)}-+-${'-'.repeat(colStatus)}-+-${'-'.repeat(colFinal)}-+-${'-'.repeat(colAssess)}`
  );

  for (const r of results) {
    console.log(
      `${truncate(r.hackathonName, colName).padEnd(colName)} | ${r.urlType.padEnd(colType)} | ${truncate(r.url, colUrl).padEnd(colUrl)} | ${String(r.httpStatus ?? 'N/A').padEnd(colStatus)} | ${truncate(r.finalUrl, colFinal).padEnd(colFinal)} | ${r.assessment.padEnd(colAssess)}`
    );
  }

  // ============ Problem Links Detail ============

  const problems = results.filter(r => r.assessment !== 'OK');
  if (problems.length > 0) {
    console.log(`\n${'='.repeat(140)}`);
    console.log(`  PROBLEM LINKS (${problems.length} issues found)`);
    console.log(`${'='.repeat(140)}\n`);

    for (const r of problems) {
      console.log(`  [${r.assessment}] ${r.hackathonName}`);
      console.log(`    Type:      ${r.urlType}`);
      console.log(`    URL:       ${r.url}`);
      console.log(`    Status:    ${r.httpStatus ?? 'N/A'}`);
      console.log(`    Final URL: ${r.finalUrl}`);
      console.log(`    Note:      ${r.note}`);
      console.log('');
    }
  } else {
    console.log(`\nAll links are OK!`);
  }
}

main().catch(console.error);
