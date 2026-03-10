import { createAdminClient } from './supabase/server.js';
import { generateEmbedding } from './embeddings.js';

/**
 * Searches for the most semantically similar legal documents.
 * @param {number[]} embedding - 384-dim query embedding
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array>} - Array of matching legal documents
 */
export async function searchSimilarDocs(embedding, topK = 5) {
  const supabase = await createAdminClient();

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: topK,
  });

  if (error) {
    console.error('RAG vector search error:', error);
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return data || [];
}

/**
 * Full-text search for browsing the legal library.
 * @param {string} query - Search query
 * @param {string|null} source - Optional filter by legal act
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Items per page
 */
export async function searchLegalLibrary(query, source = null, page = 1, pageSize = 20) {
  const supabase = await createAdminClient();

  const trimmedQuery = (query || '').trim();

  // When there is no search query, fall back to simple paginated browsing
  // so users can scroll through the corpus by section.
  if (!trimmedQuery) {
    let q = supabase
      .from('legal_documents')
      .select('id, source, section, title, content', { count: 'exact' });

    if (source) {
      q = q.eq('source', source);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await q
      .order('section')
      .range(from, to);

    if (error) throw new Error(`Library search failed: ${error.message}`);

    return { data: data || [], total: count || 0, page, pageSize };
  }

  // For keyword queries, use semantic vector search instead of ILIKE.
  let embedding;
  try {
    embedding = await generateEmbedding(trimmedQuery);
  } catch (error) {
    throw new Error(`Failed to embed query: ${error.message}`);
  }

  // Fetch a bounded pool and paginate locally.
  // This avoids "total = pageSize" bugs and makes pagination stable.
  const MAX_SEMANTIC_RESULTS = 200;
  const matchCount = MAX_SEMANTIC_RESULTS;

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: matchCount,
  });

  if (error) throw new Error(`Library search failed: ${error.message}`);

  let results = data || [];

  if (source) {
    results = results.filter((doc) => doc.source === source);
  }

  const total = results.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: results.slice(start, end),
    total,
    page,
    pageSize,
  };
}

/**
 * Get all distinct legal sources.
 */
export async function getLegalSources() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('legal_documents')
    .select('source')
    .order('source');

  if (error) throw error;

  // Deduplicate
  const sources = [...new Set(data.map((d) => d.source))];
  return sources;
}
