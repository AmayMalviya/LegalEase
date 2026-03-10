-- ============================================================
-- LegalEase - Initial Database Migration
-- Run this once in Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension
create extension if not exists vector;

-- ============================================================
-- Legal Documents with Embeddings
-- ============================================================
create table if not exists legal_documents (
  id          text primary key,
  source      text not null,
  section     text not null,
  title       text not null,
  content     text not null,
  embedding   vector(384)
);

-- HNSW index for fast cosine similarity search
create index if not exists legal_documents_embedding_idx
  on legal_documents using hnsw (embedding vector_cosine_ops);

-- Full-text search index
create index if not exists legal_documents_content_idx
  on legal_documents using gin(to_tsvector('english', content || ' ' || title));

-- ============================================================
-- RPC: Vector similarity search
-- ============================================================
create or replace function match_documents (
  query_embedding vector(384),
  match_count     int default 5
)
returns table (
  id      text,
  source  text,
  section text,
  title   text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    source,
    section,
    title,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from legal_documents
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- User Query History
-- ============================================================
create table if not exists query_history (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  question    text not null,
  answer      text not null,
  sources     jsonb default '[]',
  created_at  timestamptz default now()
);

-- ============================================================
-- Saved / Bookmarked Laws
-- ============================================================
create table if not exists saved_laws (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  legal_doc_id    text references legal_documents(id) on delete cascade,
  source          text,
  section         text,
  title           text,
  content         text,
  created_at      timestamptz default now(),
  unique(user_id, legal_doc_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table query_history enable row level security;
alter table saved_laws enable row level security;
alter table legal_documents enable row level security;

-- Legal documents: anyone can read
create policy "Public legal documents read"
  on legal_documents for select using (true);

-- Query history: users manage their own
create policy "Users manage own query history"
  on query_history for all using (auth.uid() = user_id);

-- Saved laws: users manage their own
create policy "Users manage own saved laws"
  on saved_laws for all using (auth.uid() = user_id);
