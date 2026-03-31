import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, AlertTriangle, CheckCircle, WifiOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { flushQueue } from '../utils/offlineQueue';

const READING_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#6366f1'];
const ARITH_COLORS   = ['#ef4444','#f97316','#eab308','#22c55e'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on  = () => { setIsOnline(true);  flushQueue(api); };
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const { data } = await api.get('/assessments/stats');
      setStats(data);
    } catch { /* offline — stats unavailable */ }
  }

  const readingData = stats?.readingDist || [];
  const arithData   = stats?.arithDist   || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">📚 ShikshaTrack</h1>
          <p className="text-xs text-indigo-200">Welcome, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && <span className="flex items-center gap-1 text-xs bg-yellow-500 text-white px-2 py-1 rounded-full"><WifiOff size={12}/> Offline</span>}
          <button onClick={logout} className="text-xs bg-indigo-500 px-3 py-1 rounded-full hover:bg-indigo-400">Logout</button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <Users className="text-indigo-500" size={28}/>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalStudents ?? '—'}</p>
            <p className="text-xs text-gray-500">Total Students</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <AlertTriangle className="text-red-400" size={28}/>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats?.belowGrade ?? '—'}</p>
            <p className="text-xs text-gray-500">Below Grade</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <CheckCircle className="text-green-500" size={28}/>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats?.atGrade ?? '—'}</p>
            <p className="text-xs text-gray-500">At Grade Level</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="text-2xl">📝</div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{stats?.totalAssessments ?? '—'}</p>
            <p className="text-xs text-gray-500">Assessments</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="px-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-3">Reading Level Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={readingData}>
              <XAxis dataKey="level" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }}/>
              <Tooltip/>
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {readingData.map((_, i) => <Cell key={i} fill={READING_COLORS[i % READING_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-3">Arithmetic Level Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={arithData} dataKey="count" nameKey="level" cx="50%" cy="50%" outerRadius={65} label>
                {arithData.map((_, i) => <Cell key={i} fill={ARITH_COLORS[i % ARITH_COLORS.length]}/>)}
              </Pie>
              <Legend/>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/assess')}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-indigo-700 transition"
        aria-label="Add Assessment"
      >+</button>
    </div>
  );
}
