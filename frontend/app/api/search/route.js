import { NextResponse } from 'next/server';
import { searchLegalLibrary, getLegalSources } from '@/lib/rag';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const source = searchParams.get('source') || null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const action = searchParams.get('action');

    // Return available sources list
    if (action === 'sources') {
      const sources = await getLegalSources();
      return NextResponse.json({ sources });
    }

    const result = await searchLegalLibrary(query, source, page, Math.min(pageSize, 50));
    return NextResponse.json(result);
  } catch (error) {
    console.error('/api/search error:', error);
    return NextResponse.json(
      { error: 'Search failed. Please try again.' },
      { status: 500 }
    );
  }
}
