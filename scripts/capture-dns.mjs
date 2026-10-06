import fs from 'node:fs/promises';

// Public read-only snapshot, not an exhaustive export of the DNS zone.
const domain = 'youthglobalclub.com';
const queries = [
  [domain, 'NS'], [domain, 'MX'], [domain, 'TXT'], [domain, 'A'],
  [domain, 'AAAA'], [domain, 'CAA'], [`_dmarc.${domain}`, 'TXT'],
  [`www.${domain}`, 'CNAME'], [`www.${domain}`, 'A'],
];
const records = await Promise.all(queries.map(async ([name, type]) => {
  const url = new URL('https://dns.google/resolve');
  url.searchParams.set('name', name);
  url.searchParams.set('type', type);
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`DNS lookup failed: HTTP ${response.status}`);
  const result = await response.json();
  return { name, type, status: result.Status, answers: result.Answer || [], authority: result.Authority || [] };
}));
const snapshot = {
  capturedAt: new Date().toISOString(), domain, resolver: 'https://dns.google/resolve',
  completeZoneExport: false,
  note: 'DKIM selectors, verification records and custom hostnames require the complete current DNS zone from Hostinger. No nameserver change is authorized by this partial snapshot.',
  records,
};
await fs.mkdir('deployment', { recursive: true });
await fs.writeFile('deployment/dns-public-before.json', JSON.stringify(snapshot, null, 2) + '\n');
for (const record of records) console.log(JSON.stringify({ name: record.name, type: record.type, status: record.status, answers: record.answers }));
