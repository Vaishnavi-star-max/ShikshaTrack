import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, WifiOff } from 'lucide-react';
import api from '../api/axios';
import { enqueue } from '../utils/offlineQueue';

const READING_LEVELS  = ['Cannot Read', 'Letter', 'Word', 'Paragraph', 'Story'];
const ARITH_LEVELS    = ['Cannot Solve', 'Number Recognition', 'Subtraction', 'Division'];
const CLASSES         = ['Class 1','Class 2','Class 3','Class 4','Class 5'];

export default function AssessmentForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    studentName: '', studentId: '', className: 'Class 3',
    readingLevel: '', arithmeticLevel: '', date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.studentName || !form.readingLevel || !form.arithmeticLevel) {
      alert('Please fill all required fields.');
      return;
    }
    setSaving(true);
    if (!navigator.onLine) {
      enqueue(form);
      setSaved(true);
      setSaving(false);
      setTimeout(() => navigate('/dashboard'), 1200);
      return;
    }
    try {
      await api.post('/assessments', form);
      setSaved(true);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch {
      enqueue(form);
      setSaved(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back"><ChevronLeft/></button>
        <h1 className="text-lg font-bold">New Assessment</h1>
        {!navigator.onLine && <span className="ml-auto flex items-center gap-1 text-xs bg-yellow-500 px-2 py-1 rounded-full"><WifiOff size={12}/> Offline</span>}
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-700">Student Info</h2>
          <input
            placeholder="Student Name *"
            value={form.studentName}
            onChange={e => set('studentName', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            placeholder="Student ID (optional)"
            value={form.studentId}
            onChange={e => set('studentId', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <select
            value={form.className}
            onChange={e => set('className', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-3">Reading Level *</h2>
          <div className="grid grid-cols-1 gap-2">
            {READING_LEVELS.map(lvl => (
              <button
                key={lvl}
                onClick={() => set('readingLevel', lvl)}
                className={`py-3 px-4 rounded-xl text-left text-sm font-medium border-2 transition ${
                  form.readingLevel === lvl
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}
              >{lvl}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-3">Arithmetic Level *</h2>
          <div className="grid grid-cols-1 gap-2">
            {ARITH_LEVELS.map(lvl => (
              <button
                key={lvl}
                onClick={() => set('arithmeticLevel', lvl)}
                className={`py-3 px-4 rounded-xl text-left text-sm font-medium border-2 transition ${
                  form.arithmeticLevel === lvl
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}
              >{lvl}</button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="w-full bg-indigo-600 text-white rounded-xl py-4 text-base font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {saved ? '✅ Saved!' : saving ? 'Saving...' : 'Save Assessment'}
        </button>
      </div>
    </div>
  );
}
