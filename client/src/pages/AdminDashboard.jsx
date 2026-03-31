import { useEffect, useState } from 'react';
import { Users, BookOpen, School, AlertTriangle, CheckCircle, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#6366f1'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/admin/teachers').then(r => setTeachers(r.data)).catch(() => {});
    api.get('/admin/students').then(r => setStudents(r.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-700 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">📚 ShikshaTrack — Admin</h1>
          <p className="text-xs text-purple-200">Welcome, {user?.name}</p>
        </div>
        <button onClick={logout} className="text-xs bg-purple-500 px-3 py-1 rounded-full hover:bg-purple-400 flex items-center gap-1">
          <LogOut size={12}/> Logout
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        {['overview','teachers','students'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition ${tab === t ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">

        {tab === 'overview' && stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Users size={24} className="text-indigo-500"/>, val: stats.totalStudents,  label: 'Total Students' },
                { icon: <School size={24} className="text-purple-500"/>, val: stats.totalTeachers, label: 'Teachers' },
                { icon: <AlertTriangle size={24} className="text-red-400"/>, val: stats.belowGrade, label: 'Below Grade' },
                { icon: <CheckCircle size={24} className="text-green-500"/>, val: stats.atGrade,    label: 'At Grade Level' },
              ].map(({ icon, val, label }) => (
                <div key={label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                  {icon}
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{val ?? '—'}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Reading Level Distribution</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.readingDist}>
                  <XAxis dataKey="level" tick={{ fontSize: 10 }}/>
                  <YAxis tick={{ fontSize: 10 }}/>
                  <Tooltip/>
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {stats.readingDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Arithmetic Level Distribution</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats.arithDist}>
                  <XAxis dataKey="level" tick={{ fontSize: 10 }}/>
                  <YAxis tick={{ fontSize: 10 }}/>
                  <Tooltip/>
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {stats.arithDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab === 'teachers' && (
          <div className="space-y-2">
            {teachers.length === 0 && <p className="text-center text-gray-400 py-8">No teachers found.</p>}
            {teachers.map(t => (
              <div key={t._id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.email}</p>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Teacher</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'students' && (
          <div className="space-y-2">
            {students.length === 0 && <p className="text-center text-gray-400 py-8">No students found.</p>}
            {students.map(s => (
              <div key={s._id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-800">{s.name}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.gradeStatus === 'At Grade Level' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {s.gradeStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Teacher: {s.teacher?.name} · Class: {s.class?.name} · Reading: {s.readingLevel}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
