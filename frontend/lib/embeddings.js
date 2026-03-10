/**
 * Generates a 384-dimensional embedding for the given text
 * using HuggingFace Inference API with all-MiniLM-L6-v2.
 */
export async function generateEmbedding(text) {
  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} — ${err}`);
  }

  const data = await response.json();

  // The API returns a 2D array for batches; handle single input case
  if (Array.isArray(data[0])) {
    return data[0];
  }
  return data;
}
