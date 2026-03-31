import { useState } from 'react';
import { Lightbulb, Loader, BookOpen, Calculator } from 'lucide-react';
import api from '../api/axios';

export default function AiTips({ student }) {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function getTips() {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/recommend', {
        studentName:     student.name,
        className:       student.class?.name || student.className || '',
        readingLevel:    student.readingLevel,
        arithmeticLevel: student.arithmeticLevel,
      });
      setTips(data.recommendations || []);
      setFetched(true);
    } catch {
      setTips(['[Reading] Could not load tips. Check your connection.']);
      setFetched(true);
    } finally { setLoading(false); }
  }

  const readingTips  = tips.filter(t => t.startsWith('[Reading]'));
  const arithTips    = tips.filter(t => t.startsWith('[Arithmetic]'));
  const otherTips    = tips.filter(t => !t.startsWith('[Reading]') && !t.startsWith('[Arithmetic]'));

  function stripLabel(tip) {
    return tip.replace(/^\[(Reading|Arithmetic)\]\s*/, '');
  }

  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
          <Lightbulb size={16}/> AI Teaching Tips
        </h3>
        {!fetched && (
          <button onClick={getTips} disabled={loading}
            className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full hover:bg-amber-600 transition disabled:opacity-60 flex items-center gap-1">
            {loading ? <><Loader size={12} className="animate-spin"/> Loading...</> : 'Get Tips'}
          </button>
        )}
      </div>

      {fetched && (
        <>
          {/* Reading Tips */}
          {readingTips.length > 0 && (
            <div>
              <p className="text-xs font-bold text-indigo-700 flex items-center gap-1 mb-1">
                <BookOpen size={12}/> Reading Tips
              </p>
              <ul className="space-y-1">
                {readingTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-900">
                    <span className="font-bold text-indigo-400 shrink-0">{i + 1}.</span>
                    <span>{stripLabel(tip)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Arithmetic Tips */}
          {arithTips.length > 0 && (
            <div>
              <p className="text-xs font-bold text-green-700 flex items-center gap-1 mb-1">
                <Calculator size={12}/> Arithmetic Tips
              </p>
              <ul className="space-y-1">
                {arithTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-900">
                    <span className="font-bold text-green-500 shrink-0">{i + 1}.</span>
                    <span>{stripLabel(tip)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fallback unlabelled tips */}
          {otherTips.length > 0 && (
            <ul className="space-y-1">
              {otherTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-900">
                  <span className="font-bold text-amber-500 shrink-0">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}

          <button onClick={() => { setFetched(false); setTips([]); }}
            className="text-xs text-amber-600 underline">Refresh Tips</button>
        </>
      )}
    </div>
  );
}
