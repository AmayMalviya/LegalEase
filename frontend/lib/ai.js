import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an AI legal assistant specialized in Indian law.

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

/**
 * Generates an AI legal answer using Groq (Llama 3).
 * @param {string} question - The user's legal question
 * @param {Array} contextDocs - Retrieved legal documents from RAG
 * @returns {Promise<{answer: string, model: string}>}
 */
export async function generateLegalAnswer(question, contextDocs) {
  const context = contextDocs
    .map(
      (doc, i) =>
        `[${i + 1}] ${doc.source} — Section ${doc.section}: ${doc.title}\n${doc.content}`
    )
    .join('\n\n---\n\n');

  const userPrompt = `Legal Context:\n\n${context}\n\n---\n\nUser Question: ${question}`;

  const response = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  const answer = response.choices[0]?.message?.content || 'Unable to generate a response.';
  return { answer, model: response.model };
}
