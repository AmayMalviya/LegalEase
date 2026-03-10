export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import { searchLegalLibrary } from '@/lib/rag';
import { generateEmbedding } from '@/lib/embeddings';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return { ok: false };
  }

  return { ok: true, user };
}

export async function GET(request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const source = searchParams.get('source') || null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await searchLegalLibrary(query, source, page, Math.min(pageSize, 50));
    return NextResponse.json(result);
  } catch (error) {
    console.error('/api/admin/documents GET error:', error);
    return NextResponse.json({ error: 'Failed to load documents.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const source = String(body.source || '').trim();
    const section = String(body.section || '').trim();
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();

    if (!source || !section || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const embedding = await generateEmbedding(`${title}\n\n${content}`.slice(0, 3000));

    const supabaseAdmin = await createAdminClient();
    const id = body.id ? String(body.id) : randomUUID();

    const { error } = await supabaseAdmin.from('legal_documents').insert({
      id,
      source,
      section,
      title,
      content,
      embedding,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('/api/admin/documents POST error:', error);
    return NextResponse.json({ error: 'Failed to create document.' }, { status: 500 });
  }
}

