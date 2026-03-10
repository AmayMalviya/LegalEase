export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
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

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const body = await request.json();
    const patch = {};

    if (body.source !== undefined) patch.source = String(body.source || '').trim();
    if (body.section !== undefined) patch.section = String(body.section || '').trim();
    if (body.title !== undefined) patch.title = String(body.title || '').trim();
    if (body.content !== undefined) patch.content = String(body.content || '').trim();

    if (patch.title || patch.content) {
      const embedText = `${patch.title || ''}\n\n${patch.content || ''}`.trim();
      if (embedText) {
        patch.embedding = await generateEmbedding(embedText.slice(0, 3000));
      }
    }

    const supabaseAdmin = await createAdminClient();
    const { error } = await supabaseAdmin.from('legal_documents').update(patch).eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('/api/admin/documents/[id] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update document.' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const id = params?.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabaseAdmin = await createAdminClient();
    const { error } = await supabaseAdmin.from('legal_documents').delete().eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('/api/admin/documents/[id] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete document.' }, { status: 500 });
  }
}

