import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import api from '../api/axios';
import StudentCard from '../components/StudentCard';
import AiTips from '../components/AiTips';

const READING_LEVELS = ['Cannot Read','Letter','Word','Paragraph','Story'];
const ARITH_LEVELS   = ['Cannot Solve','Number Recognition','Subtraction','Division'];

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name:'', studentId:'', readingLevel:'Cannot Read', arithmeticLevel:'Cannot Solve' });

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    try {
      const [clsRes, stuRes] = await Promise.all([
        api.get('/teacher/classes'),
        api.get(`/teacher/class/${id}/students`),
      ]);
      setCls(clsRes.data.find(c => c._id === id));
      setStudents(stuRes.data);
    } catch { /* offline */ }
  }

  async function addStudent(e) {
    e.preventDefault();
    try {
      await api.post('/teacher/student', { ...form, classId: id });
      setForm({ name:'', studentId:'', readingLevel:'Cannot Read', arithmeticLevel:'Cannot Solve' });
      setShowForm(false);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add student'); }
  }

  async function updateStudent(studentId, field, value) {
    try {
      const updated = await api.put(`/teacher/student/${studentId}`, { [field]: value });
      setStudents(s => s.map(st => st._id === studentId ? updated.data : st));
      if (selected?._id === studentId) setSelected(updated.data);
    } catch { /* handle */ }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/teacher')} aria-label="Back"><ChevronLeft/></button>
        <div>
          <h1 className="text-lg font-bold">{cls?.name || 'Class'}</h1>
          <p className="text-xs text-indigo-200">{cls?.grade} · {students.length} students</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="ml-auto bg-white text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 hover:bg-indigo-50 transition">
          <Plus size={14}/> Add Student
        </button>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-3">
        {showForm && (
          <form onSubmit={addStudent} className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-700">Add Student</h3>
            <input placeholder="Student Name *" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            <input placeholder="Student ID (optional)" value={form.studentId}
              onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            <select value={form.readingLevel} onChange={e => setForm(f => ({ ...f, readingLevel: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {READING_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <select value={form.arithmeticLevel} onChange={e => setForm(f => ({ ...f, arithmeticLevel: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {ARITH_LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-indigo-700 transition">Add</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2 text-sm font-semibold">Cancel</button>
            </div>
          </form>
        )}

        {students.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">👨‍🎓</div>
            <p>No students yet. Add your first student!</p>
          </div>
        )}

        {students.map(s => (
          <StudentCard key={s._id} student={s} onClick={setSelected}/>
        ))}
      </div>

      {/* Student detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-lg">{selected.name}</h2>
              <button onClick={() => setSelected(null)}><X size={20} className="text-gray-400"/></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Reading Level</p>
                <select value={selected.readingLevel}
                  onChange={e => updateStudent(selected._id, 'readingLevel', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {READING_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Arithmetic Level</p>
                <select value={selected.arithmeticLevel}
                  onChange={e => updateStudent(selected._id, 'arithmeticLevel', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {ARITH_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <AiTips student={{ ...selected, class: cls }}/>
          </div>
        </div>
      )}
    </div>
  );
}
