/**
 * LegalEase — Data Ingestion Script
 * Reads all dataset files and creates a unified legal_corpus.json
 *
 * Usage: node scripts/ingest-laws.js
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const LEGAL_DOCS_DIR = path.join(__dirname, '..', 'legal-documents');
const OUTPUT_FILE = path.join(__dirname, '..', 'legal-documents', 'legal_corpus.json');

const corpus = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addDoc(id, source, section, title, content) {
  if (!content || content.trim().length < 10) return;
  corpus.push({
    id: id.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''),
    source,
    section: String(section),
    title: title || `Section ${section}`,
    content: content.trim(),
  });
}

function slugify(source) {
  return source.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// ─── 1. IPC (ipc.json) ───────────────────────────────────────────────────────
console.log('📖 Processing IPC...');
const ipc = JSON.parse(fs.readFileSync(path.join(LEGAL_DOCS_DIR, 'ipc.json'), 'utf-8'));
ipc.forEach((item) => {
  if (item.Section && item.section_title && item.section_desc) {
    addDoc(
      `ipc_${item.Section}`,
      'Indian Penal Code',
      item.Section,
      item.section_title,
      item.section_desc
    );
  }
});
console.log(`  ✓ IPC: ${ipc.length} sections`);

// ─── 2. CrPC (crpc.json) ─────────────────────────────────────────────────────
console.log('📖 Processing CrPC...');
const crpc = JSON.parse(fs.readFileSync(path.join(LEGAL_DOCS_DIR, 'crpc.json'), 'utf-8'));
crpc.forEach((item) => {
  if (item.section && item.section_title && item.section_desc) {
    addDoc(
      `crpc_${item.section}`,
      'Code of Criminal Procedure',
      item.section,
      item.section_title,
      item.section_desc
    );
  }
});
console.log(`  ✓ CrPC: ${crpc.length} sections`);

// ─── 3. CPC (cpc.json) ───────────────────────────────────────────────────────
console.log('📖 Processing CPC...');
const cpc = JSON.parse(fs.readFileSync(path.join(LEGAL_DOCS_DIR, 'cpc.json'), 'utf-8'));
cpc.forEach((item) => {
  if (item.section && item.title && item.description) {
    addDoc(
      `cpc_${item.section}`,
      'Code of Civil Procedure',
      item.section,
      item.title,
      item.description
    );
  }
});
console.log(`  ✓ CPC: ${cpc.length} sections`);

// ─── 4. IEA (iea.json) ───────────────────────────────────────────────────────
console.log('📖 Processing IEA...');
const iea = JSON.parse(fs.readFileSync(path.join(LEGAL_DOCS_DIR, 'iea.json'), 'utf-8'));
iea.forEach((item) => {
  if (item.section && item.section_title && item.section_desc) {
    addDoc(
      `iea_${item.section}`,
      'Indian Evidence Act',
      item.section,
      item.section_title,
      item.section_desc
    );
  }
});
console.log(`  ✓ IEA: ${iea.length} sections`);

// ─── 5. NIA (nia.json) ───────────────────────────────────────────────────────
console.log('📖 Processing NIA...');
const nia = JSON.parse(fs.readFileSync(path.join(LEGAL_DOCS_DIR, 'nia.json'), 'utf-8'));
nia.forEach((item) => {
  if (item.section && item.section_title && item.section_desc) {
    addDoc(
      `nia_${item.section}`,
      'Negotiable Instruments Act',
      item.section,
      item.section_title,
      item.section_desc
    );
  }
});
console.log(`  ✓ NIA: ${nia.length} sections`);

// ─── 6. Use IndiaLaw.db for HMA, IDA, MVA (malformed JSON fallbacks) ─────────
console.log('📖 Processing HMA, IDA, MVA from IndiaLaw.db...');
const db = new Database(path.join(LEGAL_DOCS_DIR, 'IndiaLaw.db'), { readonly: true });

// Hindu Marriage Act
const hmaRows = db.prepare('SELECT * FROM HMA').all();
hmaRows.forEach((item) => {
  if (item.section && item.section_title && item.section_desc) {
    addDoc(
      `hma_${item.section}`,
      'Hindu Marriage Act',
      item.section,
      item.section_title,
      item.section_desc
    );
  }
});
console.log(`  ✓ HMA: ${hmaRows.length} sections`);

// Drugs and Cosmetics Act
const idaRows = db.prepare('SELECT * FROM IDA').all();
idaRows.forEach((item) => {
  if (item.section && item.title && item.description) {
    addDoc(
      `ida_${item.section}`,
      'Drugs and Cosmetics Act',
      item.section,
      item.title,
      item.description
    );
  }
});
console.log(`  ✓ IDA: ${idaRows.length} sections`);

// Motor Vehicles Act
const mvaRows = db.prepare('SELECT * FROM MVA').all();
mvaRows.forEach((item) => {
  if (item.section && item.title && item.description) {
    addDoc(
      `mva_${item.section}`,
      'Motor Vehicles Act',
      item.section,
      item.title,
      item.description
    );
  }
});
console.log(`  ✓ MVA: ${mvaRows.length} sections`);
db.close();

// ─── 7. Constitution of India (CSV) ──────────────────────────────────────────
console.log('📖 Processing Constitution of India...');
const constitutionPath = path.join(LEGAL_DOCS_DIR, 'Constitution Of India.csv');
const constitutionRaw = fs.readFileSync(constitutionPath, 'utf-8');
const constitutionLines = constitutionRaw.split('\n').filter((l) => l.trim());

// CSV has no header — first column is article text, lines are structured as article blocks
// Format: "ArticleNum. Title\nContent..."
let articleNum = 0;
constitutionLines.forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  // Match lines starting with a number (article number)
  const match = trimmed.match(/^(\d+[A-Z]?)\.\s+(.+)/);
  if (match) {
    articleNum++;
    const section = match[1];
    const rest = match[2];
    const dotIndex = rest.indexOf(':');
    const title = dotIndex > -1 ? rest.slice(0, dotIndex).trim() : rest.slice(0, 80).trim();
    const content = rest;
    addDoc(`const_${section}`, 'Constitution of India', section, title, content);
  }
});
console.log(`  ✓ Constitution: ${articleNum} articles`);

// ─── 8. FIR Dataset (CSV) ───────────────────────────────────────────────────
console.log('📖 Processing FIR Dataset...');
const firPath = path.join(LEGAL_DOCS_DIR, 'FIR_DATASET.csv');
const firRaw = fs.readFileSync(firPath, 'utf-8');
const firLines = firRaw.split('\n');
const firHeader = firLines[0].split(',');

let firCount = 0;
for (let i = 1; i < firLines.length; i++) {
  const line = firLines[i];
  if (!line.trim()) continue;

  // Parse quoted CSV fields
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  fields.push(current.trim());

  const url = fields[0] || '';
  const description = fields[1] || '';
  const offense = fields[2] || '';
  const punishment = fields[3] || '';
  const cognizable = fields[4] || '';
  const bailable = fields[5] || '';
  const court = fields[6] || '';

  // Extract section from URL
  const secMatch = url.match(/section-(\d+[A-Za-z]*)/);
  const section = secMatch ? secMatch[1] : `fir_${i}`;

  if (offense && description) {
    const content = `${description}\n\nOffense: ${offense}\nPunishment: ${punishment}\nCognizable: ${cognizable}\nBailable: ${bailable}\nTriable by: ${court}`;
    addDoc(`fir_ipc_${section}`, 'IPC (FIR Reference)', section, offense, content);
    firCount++;
  }
}
console.log(`  ✓ FIR Dataset: ${firCount} entries`);

// ─── Deduplicate by ID ────────────────────────────────────────────────────────
const seen = new Set();
const deduped = corpus.filter((doc) => {
  if (seen.has(doc.id)) return false;
  seen.add(doc.id);
  return true;
});

// ─── Write output ─────────────────────────────────────────────────────────────
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(deduped, null, 2));
console.log(`\n✅ Done! legal_corpus.json created with ${deduped.length} total documents.`);
console.log(`   Output: ${OUTPUT_FILE}`);
