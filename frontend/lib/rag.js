import { createAdminClient } from './supabase/server.js';

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

  let q = supabase
    .from('legal_documents')
    .select('id, source, section, title, content', { count: 'exact' });

  if (query && query.trim()) {
    q = q.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
  }

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
