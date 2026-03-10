/**
 * LegalEase — Embedding Generation Script
 * Reads legal_corpus.json, generates embeddings, uploads to Supabase.
 *
 * Prerequisites:
 *   1. legal_corpus.json generated (run ingest-laws.js first)
 *   2. Supabase project configured with 001_init.sql migration
 *   3. .env.local populated with HF_API_KEY and Supabase keys
 *
 * Usage: node scripts/generate-embeddings.js
 */

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const CORPUS_FILE = path.join(__dirname, '..', 'legal-documents', 'legal_corpus.json');
const BATCH_SIZE = 10; // Parallel HF API calls per batch
const UPLOAD_BATCH_SIZE = 50; // Supabase upsert batch

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Generate embedding for a single text using HuggingFace API.
 */
async function generateEmbedding(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: text.slice(0, 512), // Token limit for the model
            options: { wait_for_model: true },
          }),
        }
      );

      if (response.status === 503) {
        // Model loading — wait and retry
        console.log(`  ⏳ Model loading, waiting 20s (attempt ${attempt})...`);
        await new Promise((r) => setTimeout(r, 20000));
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`HF API ${response.status}: ${err}`);
      }

      const data = await response.json();
      return Array.isArray(data[0]) ? data[0] : data;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`  ⚠️  Retry ${attempt}/${retries}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

/**
 * Check how many documents are already embedded in Supabase.
 */
async function getExistingIds() {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('id')
    .not('embedding', 'is', null);

  if (error) throw new Error(`Failed to fetch existing IDs: ${error.message}`);
  return new Set((data || []).map((d) => d.id));
}

async function main() {
  console.log('🚀 LegalEase Embedding Pipeline\n');

  // Load corpus
  if (!fs.existsSync(CORPUS_FILE)) {
    console.error('❌ legal_corpus.json not found. Run ingest-laws.js first.');
    process.exit(1);
  }
  const corpus = JSON.parse(fs.readFileSync(CORPUS_FILE, 'utf-8'));
  console.log(`📚 Loaded ${corpus.length} documents from corpus.\n`);

  // Find already-processed docs
  console.log('🔍 Checking existing embeddings in Supabase...');
  const existingIds = await getExistingIds();
  console.log(`   ${existingIds.size} documents already embedded.\n`);

  const remaining = corpus.filter((doc) => !existingIds.has(doc.id));
  console.log(`⚙️  Processing ${remaining.length} remaining documents...\n`);

  if (remaining.length === 0) {
    console.log('✅ All documents already embedded!');
    return;
  }

  let processed = 0;
  let failed = 0;
  const uploadBuffer = [];

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map(async (doc) => {
        const textToEmbed = `${doc.source} Section ${doc.section}: ${doc.title}. ${doc.content}`;
        const embedding = await generateEmbedding(textToEmbed);
        return { ...doc, embedding };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        uploadBuffer.push(result.value);
        processed++;
      } else {
        failed++;
        console.error(`  ❌ Failed: ${result.reason?.message}`);
      }
    }

    // Upload when buffer is full
    if (uploadBuffer.length >= UPLOAD_BATCH_SIZE) {
      await uploadBatch(uploadBuffer.splice(0, uploadBuffer.length));
    }

    const pct = Math.round(((i + batch.length) / remaining.length) * 100);
    console.log(
      `  Progress: ${pct}% (${i + batch.length}/${remaining.length}) — ✓ ${processed} ✗ ${failed}`
    );

    // Rate limiting: 100ms between batches
    if (i + BATCH_SIZE < remaining.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // Upload remaining
  if (uploadBuffer.length > 0) {
    await uploadBatch(uploadBuffer);
  }

  console.log(`\n✅ Done!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Failed:    ${failed}`);
  console.log(`   Total in Supabase: ${existingIds.size + processed}`);
}

async function uploadBatch(docs) {
  const rows = docs.map((doc) => ({
    id: doc.id,
    source: doc.source,
    section: doc.section,
    title: doc.title,
    content: doc.content,
    embedding: doc.embedding,
  }));

  const { error } = await supabase
    .from('legal_documents')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error(`  ❌ Upload batch failed: ${error.message}`);
  } else {
    console.log(`  ⬆️  Uploaded batch of ${rows.length} documents`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
