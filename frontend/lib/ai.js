import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const SYSTEM_PROMPT = `You are an AI legal assistant specialized in Indian law.

Your task is to answer legal questions using ONLY the provided legal context.

Guidelines:
- Explain the law in simple, clear language that anyone can understand
- Reference specific sections and acts by name
- If the answer is not found in the provided context, say: "I don't have enough information in my legal database to answer this question. Please consult a qualified legal professional."
- Do NOT make up laws or sections not present in the context
- Structure your response clearly

Response format:
1. **Answer**: A clear, simple explanation
2. **Relevant Sections**: List the specific laws/sections that apply
3. **Plain English Summary**: A 2-3 sentence simplified interpretation`;

const MODEL_NAME = 'llama-3.3-70b-versatile';

export function buildLegalMessages(question, contextDocs) {
  const context = contextDocs
    .map(
      (doc, i) =>
        `[${i + 1}] ${doc.source} — Section ${doc.section}: ${doc.title}\n${doc.content}`
    )
    .join('\n\n---\n\n');

  const userPrompt = `Legal Context:\n\n${context}\n\n---\n\nUser Question: ${question}`;

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * Generates an AI legal answer using Groq (Llama 3).
 * @param {string} question - The user's legal question
 * @param {Array} contextDocs - Retrieved legal documents from RAG
 * @returns {Promise<{answer: string, model: string}>}
 */
export async function generateLegalAnswer(question, contextDocs) {
  const messages = buildLegalMessages(question, contextDocs);

  const response = await groq.chat.completions.create({
    model: MODEL_NAME,
    messages,
    temperature: 0.3,
    max_tokens: 1024,
  });

  const answer = response.choices[0]?.message?.content || 'Unable to generate a response.';
  return { answer, model: response.model };
}

/**
 * Generate 2–4 concise related follow‑up questions for a given
 * question + answer pair. Returns a plain array of strings.
 */
export async function generateRelatedQuestions(question, answer) {
  const response = await groq.chat.completions.create({
    model: MODEL_NAME,
    messages: [
      {
        role: 'system',
        content:
          'You generate 3 concise, practical follow-up questions about Indian law based on the original user question and the AI answer. ' +
          'Return ONLY a JSON array of strings. Do not include any explanation, prose, or markdown—just valid JSON.',
      },
      {
        role: 'user',
        content: `Original question:\n${question}\n\nAnswer:\n${answer}\n\nNow return 3 related questions as a JSON array of strings.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 256,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? '[]';

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((q) => typeof q === 'string' && q.trim()).slice(0, 4);
    }
  } catch {
    // fall through to empty array
  }

  return [];
}
