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
    const start = trimmed.indexOf('[');
    const end   = trimmed.lastIndexOf(']');
    if (start !== -1 && end > start) {
      try {
        const parsed = JSON.parse(trimmed.slice(start, end + 1));
        return Array.isArray(parsed) ? parsed : null;
      } catch { return null; }
    }
    return null;
  }
}

// POST /api/ai/recommend
router.post('/recommend', auth, async (req, res) => {
  const { studentName, className, readingLevel, arithmeticLevel } = req.body;

  const prompt = `You are an expert primary school teacher advisor in India.
A student named ${studentName} in ${className} has:
- Reading Level: ${readingLevel}
- Arithmetic Level: ${arithmeticLevel}

Give exactly 6 short, practical teaching recommendations:
- First 3 must be specifically about improving their READING (level: ${readingLevel})
- Last 3 must be specifically about improving their ARITHMETIC (level: ${arithmeticLevel})

Format as a JSON array of 6 strings. Label each tip clearly, e.g.:
["[Reading] Use alphabet flashcards...", "[Reading] ...", "[Reading] ...", "[Arithmetic] Use number line...", "[Arithmetic] ...", "[Arithmetic] ..."]
Only return the JSON array, nothing else.`;

  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-placeholder') {
      throw new Error('OpenAI key not configured');
    }
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });
    const text = completion.choices?.[0]?.message?.content;
    const recommendations = tryParseJsonArray(text);
    if (!recommendations) throw new Error('Could not parse JSON');
    res.json({ recommendations: recommendations.map(String).slice(0, 8) });
  } catch {
    res.json({ recommendations: getRuleBased(readingLevel, arithmeticLevel) });
  }
});

// POST /api/ai/tips  (alias used by admin)
router.post('/tips', auth, async (req, res) => {
  const { studentName, className, readingLevel, arithmeticLevel } = req.body;
  res.json({ recommendations: getRuleBased(readingLevel, arithmeticLevel) });
});

function getRuleBased(reading, arithmetic) {
  const recs = [];

  // Reading tips — always 3
  if (reading === 'Cannot Read') {
    recs.push(
      '[Reading] Use picture books and point to each letter while saying its sound.',
      '[Reading] Practice recognising the student\'s own name in written form daily.',
      '[Reading] Play alphabet matching games using letter cards.'
    );
  } else if (reading === 'Letter') {
    recs.push(
      '[Reading] Use phonics songs to connect letters with sounds.',
      '[Reading] Practice blending 2-letter sounds (e.g. "a" + "t" = "at").',
      '[Reading] Use alphabet flashcards with pictures for each letter.'
    );
  } else if (reading === 'Word') {
    recs.push(
      '[Reading] Read simple 3-letter word books together daily.',
      '[Reading] Play word-matching games with picture cards.',
      '[Reading] Ask the student to read labels around the classroom.'
    );
  } else if (reading === 'Paragraph') {
    recs.push(
      '[Reading] Encourage reading short paragraphs aloud with expression.',
      '[Reading] Ask comprehension questions after each paragraph.',
      '[Reading] Use paired reading — student reads with a peer.'
    );
  } else {
    recs.push(
      '[Reading] Introduce chapter books appropriate for the grade level.',
      '[Reading] Discuss story meaning, characters, and plot after reading.',
      '[Reading] Encourage the student to write a short summary of what they read.'
    );
  }

  // Arithmetic tips — always 3
  if (arithmetic === 'Cannot Solve') {
    recs.push(
      '[Arithmetic] Use physical objects (stones, sticks) to count from 1 to 10.',
      '[Arithmetic] Practice number recognition using number cards daily.',
      '[Arithmetic] Sing counting songs to build number sense.'
    );
  } else if (arithmetic === 'Number Recognition') {
    recs.push(
      '[Arithmetic] Practice writing numbers 1–20 every day.',
      '[Arithmetic] Use a number line to introduce addition with small numbers.',
      '[Arithmetic] Count real objects in the classroom to reinforce number meaning.'
    );
  } else if (arithmetic === 'Subtraction') {
    recs.push(
      '[Arithmetic] Use a number line for subtraction practice.',
      '[Arithmetic] Practice subtraction with real-life examples like sharing food or objects.',
      '[Arithmetic] Use fingers or counters to solve subtraction problems step by step.'
    );
  } else {
    recs.push(
      '[Arithmetic] Introduce division using equal grouping of physical objects.',
      '[Arithmetic] Use multiplication tables with rhythm or songs.',
      '[Arithmetic] Practice word problems involving division in daily life contexts.'
    );
  }

  return recs;
}

module.exports = router;
