import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, WifiOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ClassCard from '../components/ClassCard';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', grade: '', school: '' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => { fetchClasses(); }, []);

  async function fetchClasses() {
    try {
      const { data } = await api.get('/teacher/classes');
      setClasses(data);
      // fetch student counts per class
      const counts = {};
      await Promise.all(data.map(async cls => {
        try {
          const r = await api.get(`/teacher/class/${cls._id}/students`);
          counts[cls._id] = r.data.length;
        } catch { counts[cls._id] = 0; }
      }));
      setStudentCounts(counts);
    } catch { /* offline */ }
  }

  async function createClass(e) {
    e.preventDefault();
    try {
      await api.post('/teacher/class', form);
      setForm({ name: '', grade: '', school: '' });
      setShowForm(false);
      fetchClasses();
    } catch (err) { alert(err.response?.data?.message || 'Failed to create class'); }
  }

  const GRADES = ['Class 1','Class 2','Class 3','Class 4','Class 5'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">📚 ShikshaTrack</h1>
          <p className="text-xs text-indigo-200">Welcome, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && <span className="flex items-center gap-1 text-xs bg-yellow-500 px-2 py-1 rounded-full"><WifiOff size={12}/> Offline</span>}
          <button onClick={logout} className="text-xs bg-indigo-500 px-3 py-1 rounded-full hover:bg-indigo-400 flex items-center gap-1">
            <LogOut size={12}/> Logout
          </button>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-700 text-lg">My Classes</h2>
          <button onClick={() => setShowForm(v => !v)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-indigo-700 transition">
            <Plus size={16}/> New Class
          </button>
        </div>

        {showForm && (
          <form onSubmit={createClass} className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-700">Create Class</h3>
            <input placeholder="Class Name (e.g. 3A)" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            <select required value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">Select Grade</option>
              {GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
            <input placeholder="School (optional)" value={form.school}
              onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-indigo-700 transition">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2 text-sm font-semibold hover:bg-gray-200 transition">Cancel</button>
            </div>
          </form>
        )}

        {classes.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">🏫</div>
            <p>No classes yet. Create your first class!</p>
          </div>
        )}

        {classes.map(cls => (
          <ClassCard key={cls._id} cls={cls} studentCount={studentCounts[cls._id] || 0}/>
        ))}
      </div>

      <button onClick={() => navigate('/assess')}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-indigo-700 transition"
        aria-label="Quick Assessment">+</button>
    </div>
  );
}
