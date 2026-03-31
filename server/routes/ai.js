const router = require('express').Router();
const auth   = require('../middleware/auth');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function tryParseJsonArray(text) {
  if (!text) return null;
  const trimmed = String(text).trim();
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    // Try to extract the first JSON array from the response.
    const start = trimmed.indexOf('[');
    const end = trimmed.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const parsed = JSON.parse(trimmed.slice(start, end + 1));
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

router.post('/recommend', auth, async (req, res) => {
  const { studentName, className, readingLevel, arithmeticLevel } = req.body;

  const prompt = `You are an expert primary school teacher advisor in India.
A student named ${studentName} in ${className} has:
- Reading Level: ${readingLevel}
- Arithmetic Level: ${arithmeticLevel}

Give 4 short, practical teaching recommendations for this teacher to help this student improve.
Format as a JSON array of strings. Example: ["Use flashcards for letters", "Practice counting with objects"]
Only return the JSON array, nothing else.`;

  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const text = completion.choices?.[0]?.message?.content;
    const recommendations = tryParseJsonArray(text);
    if (!recommendations) throw new Error('Could not parse recommendations JSON');
    res.json({ recommendations: recommendations.map(String).slice(0, 8) });
  } catch (err) {
    // Fallback rule-based recommendations if OpenAI fails
    const fallback = getRuleBased(readingLevel, arithmeticLevel);
    res.json({ recommendations: fallback });
  }
});

function getRuleBased(reading, arithmetic) {
  const recs = [];
  if (reading === 'Cannot Read' || reading === 'Letter')
    recs.push('Use alphabet flashcards daily for 10 minutes', 'Practice letter sounds with phonics songs');
  else if (reading === 'Word')
    recs.push('Read simple 3-letter word books together', 'Play word-matching games');
  else
    recs.push('Encourage reading short paragraphs aloud', 'Discuss story meaning after reading');

  if (arithmetic === 'Cannot Solve' || arithmetic === 'Number Recognition')
    recs.push('Use physical objects (stones, sticks) to count', 'Practice number writing 1-20 daily');
  else if (arithmetic === 'Subtraction')
    recs.push('Use a number line for subtraction practice', 'Practice subtraction with real-life examples like sharing food');
  else
    recs.push('Introduce division using equal grouping of objects', 'Use multiplication tables with rhythm/songs');

  return recs;
}

module.exports = router;
