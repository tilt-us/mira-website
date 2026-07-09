const fs = require('node:fs');

const coveragePaths = [
  './coverage/mira-website/coverage-summary.json',
  './coverage/coverage-summary.json',
];

const threshold = Number(process.env.COVERAGE_THRESHOLD ?? 90);
const metrics = ['lines', 'functions', 'branches', 'statements'];

const reportPath = coveragePaths.find(fs.existsSync);
if (!reportPath) {
  console.error('[coverage] coverage-summary.json not found.');
  console.error('[coverage] tried:');
  for (const candidate of coveragePaths) {
    console.error(`  - ${candidate}`);
  }
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const totals = report.total || report.totals || report.all;

if (!totals) {
  console.error('[coverage] Unexpected coverage-summary.json format.');
  process.exit(1);
}

const failures = metrics.filter((metric) => {
  const pct = Number(totals?.[metric]?.pct);
  return Number.isNaN(pct) || pct < threshold;
});

if (failures.length > 0) {
  console.error(`\n[coverage] Coverage threshold check failed (minimum ${threshold}%).`);
  for (const metric of failures) {
    const pct = totals?.[metric]?.pct;
    console.error(`  - ${metric}: ${pct === undefined ? 'unknown' : `${pct}%`} (required >= ${threshold}%)`);
  }
  process.exit(1);
}

console.log(`[coverage] Coverage threshold passed (>= ${threshold}% for ${metrics.join(', ')}).`);
