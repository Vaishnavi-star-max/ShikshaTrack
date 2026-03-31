import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

const READING_SCORE  = { 'Cannot Read': 0, 'Letter': 1, 'Word': 2, 'Paragraph': 3, 'Story': 4 };
const ARITH_SCORE    = { 'Cannot Solve': 0, 'Number Recognition': 1, 'Subtraction': 2, 'Division': 3 };

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    api.get(`/students/${id}`).then(r => setStudent(r.data)).catch(() => {});
    api.get(`/assessments?studentId=${id}`).then(r => setAssessments(r.data)).catch(() => {});
  }, [id]);

  async function getRecommendations() {
    if (!student) return;
    setLoadingRecs(true);
    try {
      const { data } = await api.post('/ai/recommend', {
        studentName: student.name,
        className: student.className,
        readingLevel: assessments[0]?.readingLevel,
        arithmeticLevel: assessments[0]?.arithmeticLevel,
      });
      setRecs(data.recommendations || []);
    } catch { setRecs(['Could not load recommendations. Check your connection.']); }
    finally { setLoadingRecs(false); }
  }

  const chartData = [...assessments].reverse().map(a => ({
    date: new Date(a.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }),
    reading: READING_SCORE[a.readingLevel] ?? 0,
    arithmetic: ARITH_SCORE[a.arithmeticLevel] ?? 0,
  }));

  const latest = assessments[0];
  const gradeStatus = latest
    ? (READING_SCORE[latest.readingLevel] < 3 ? 'Below Grade Level' : 'At Grade Level')
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back"><ChevronLeft/></button>
        <div>
          <h1 className="text-lg font-bold">{student?.name || 'Student'}</h1>
          <p className="text-xs text-indigo-200">{student?.className}</p>
        </div>
        {gradeStatus && (
          <span className={`ml-auto text-xs font-medium px-2 py-1 rounded-full ${gradeStatus === 'At Grade Level' ? 'bg-green-400 text-white' : 'bg-red-400 text-white'}`}>
            {gradeStatus}
          </span>
        )}
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {latest && (
          <div className="bg-white rounded-xl p-4 shadow-sm grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Reading</p>
              <p className="font-semibold text-indigo-700">{latest.readingLevel}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Arithmetic</p>
              <p className="font-semibold text-indigo-700">{latest.arithmeticLevel}</p>
            </div>
          </div>
        )}

        {chartData.length > 1 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-3">Progress Over Time</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }}/>
                <YAxis domain={[0,4]} tick={{ fontSize: 10 }}/>
                <Tooltip/>
                <Line type="monotone" dataKey="reading" stroke="#6366f1" strokeWidth={2} dot={false} name="Reading"/>
                <Line type="monotone" dataKey="arithmetic" stroke="#22c55e" strokeWidth={2} dot={false} name="Arithmetic"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <button
          onClick={getRecommendations}
          disabled={loadingRecs}
          className="w-full bg-amber-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-amber-600 transition disabled:opacity-60"
        >
          <Lightbulb size={18}/> {loadingRecs ? 'Getting suggestions...' : 'Get AI Recommendations'}
        </button>

        {recs.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2"><Lightbulb size={16} className="text-amber-500"/> Teaching Suggestions</h2>
            {recs.map((r, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-amber-500 font-bold">{i + 1}.</span>
                <p>{r}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-3">Assessment History</h2>
          {assessments.length === 0 && <p className="text-gray-400 text-sm">No assessments yet.</p>}
          <div className="space-y-2">
            {assessments.map(a => (
              <div key={a._id} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-500">{new Date(a.date).toLocaleDateString()}</span>
                <span className="text-indigo-600">{a.readingLevel}</span>
                <span className="text-green-600">{a.arithmeticLevel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
