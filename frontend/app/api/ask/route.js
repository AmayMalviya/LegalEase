import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';
import { searchSimilarDocs } from '@/lib/rag';
import { generateLegalAnswer } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || question.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a valid legal question.' },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim().slice(0, 500);

    // Step 1: Generate embedding for the user question
    let embedding;
    try {
      embedding = await generateEmbedding(trimmedQuestion);
    } catch (embError) {
      console.error('Embedding error:', embError);
      return NextResponse.json(
        { error: 'Failed to process your question. Please try again.' },
        { status: 503 }
      );
    }

    // Step 2: Vector similarity search
    const contextDocs = await searchSimilarDocs(embedding, 5);

    if (!contextDocs || contextDocs.length === 0) {
      return NextResponse.json({
        answer:
          'I could not find relevant legal information for your question in my database. Please rephrase your question or try a more specific legal topic.',
        sources: [],
      });
    }

    // Step 3: Generate AI answer using context
    const { answer, model } = await generateLegalAnswer(trimmedQuestion, contextDocs);

    // Step 4: Save to query history if user is authenticated
    const sources = contextDocs.map((doc) => ({
      id: doc.id,
      source: doc.source,
      section: doc.section,
      title: doc.title,
      similarity: doc.similarity,
    }));

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('query_history').insert({
          user_id: user.id,
          question: trimmedQuestion,
          answer,
          sources,
        });
      }
    } catch (authError) {
      // Non-fatal: user might not be logged in
      console.log('Not saving history (user not authenticated)');
    }

    return NextResponse.json({ answer, sources, model });
  } catch (error) {
    console.error('/api/ask error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
