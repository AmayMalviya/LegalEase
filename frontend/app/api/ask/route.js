import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { generateEmbedding } from '@/lib/embeddings';
import { searchSimilarDocs } from '@/lib/rag';
import { buildLegalMessages, generateLegalAnswer, generateRelatedQuestions } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const body = await request.json();
    const { question, stream } = body;

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
      if (stream) {
        const encoder = new TextEncoder();
        const streamBody = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'token',
                  token:
                    'I could not find relevant legal information for your question in my database. Please rephrase your question or try a more specific legal topic.',
                }) + '\n'
              )
            );
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'done' }) + '\n')
            );
            controller.close();
          },
        });

        return new Response(streamBody, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }

      return NextResponse.json({
        answer:
          'I could not find relevant legal information for your question in my database. Please rephrase your question or try a more specific legal topic.',
        sources: [],
      });
    }

    // Prepare shared metadata
    const sources = contextDocs.map((doc) => ({
      id: doc.id,
      source: doc.source,
      section: doc.section,
      title: doc.title,
      similarity: doc.similarity,
    }));

    // Non‑streaming behaviour for backwards compatibility / other consumers
    if (!stream) {
      const { answer, model } = await generateLegalAnswer(trimmedQuestion, contextDocs);

      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from('query_history').insert({
            user_id: user.id,
            question: trimmedQuestion,
            answer,
            sources,
          });
        }
      } catch (authError) {
        console.log('Not saving history (user not authenticated)');
      }

      const relatedQuestions = await generateRelatedQuestions(trimmedQuestion, answer);

      return NextResponse.json({ answer, sources, model, relatedQuestions });
    }

    // Streaming response for chat‑like UX
    const encoder = new TextEncoder();

    const streamBody = new ReadableStream({
      async start(controller) {
        let fullAnswer = '';

        try {
          // Send meta (sources) first so the client can render badges immediately
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'meta',
                sources,
              }) + '\n'
            )
          );

          const messages = buildLegalMessages(trimmedQuestion, contextDocs);

          const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.3,
            max_tokens: 1024,
            stream: true,
          });

          for await (const chunk of completion) {
            const token = chunk.choices[0]?.delta?.content || '';
            if (!token) continue;
            fullAnswer += token;

            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'token',
                  token,
                }) + '\n'
              )
            );
          }

          // Persist history (non‑blocking for client)
          try {
            const supabase = await createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user) {
              await supabase.from('query_history').insert({
                user_id: user.id,
                question: trimmedQuestion,
                answer: fullAnswer,
                sources,
              });
            }
          } catch (authError) {
            console.log('Not saving history (user not authenticated)');
          }

          // Generate related questions after full answer is known
          try {
            const relatedQuestions = await generateRelatedQuestions(
              trimmedQuestion,
              fullAnswer
            );

            if (relatedQuestions.length) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'related',
                    relatedQuestions,
                  }) + '\n'
                )
              );
            }
          } catch (rqError) {
            console.error('Related questions error:', rqError);
          }

          controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
          controller.close();
        } catch (err) {
          console.error('Streaming /api/ask error:', err);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'error',
                error:
                  'An unexpected error occurred while generating the answer. Please try again.',
              }) + '\n'
            )
          );
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
          controller.close();
        }
      },
    });

    return new Response(streamBody, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('/api/ask error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
