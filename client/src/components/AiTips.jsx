import { useState } from 'react';
import { Lightbulb, Loader } from 'lucide-react';
import api from '../api/axios';

export default function AiTips({ student }) {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function getTips() {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/recommend', {
        studentName:      student.name,
        className:        student.class?.name || '',
        readingLevel:     student.readingLevel,
        arithmeticLevel:  student.arithmeticLevel,
      });
      setTips(data.recommendations || []);
      setFetched(true);
    } catch {
      setTips(['Could not load tips. Check your connection.']);
      setFetched(true);
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
      <div className="flex items-center justify-between mb-3">
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
      {fetched && tips.length > 0 && (
        <ul className="space-y-2">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-sm text-amber-900">
              <span className="font-bold text-amber-500 shrink-0">{i + 1}.</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
      {fetched && (
        <button onClick={() => { setFetched(false); setTips([]); }}
          className="text-xs text-amber-600 mt-2 underline">Refresh</button>
      )}
    </div>
  );
}
