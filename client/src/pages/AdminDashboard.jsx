import { useEffect, useState } from 'react';
import {
  Users, School, AlertTriangle, CheckCircle,
  ClipboardList, LogOut, Bell, Lightbulb, TrendingDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend, CartesianGrid
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#6366f1'];

function cardBorder(pct) {
  if (pct >= 60) return 'border-l-4 border-red-400';
  if (pct >= 30) return 'border-l-4 border-yellow-400';
  return 'border-l-4 border-green-400';
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats]       = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingAi, setLoadingAi]   = useState(false);
  const [tab, setTab]           = useState('overview');

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/admin/teachers').then(r => setTeachers(r.data)).catch(() => {});
    api.get('/admin/students').then(r => setStudents(r.data)).catch(() => {});
  }, []);

  async function getAiInsights() {
    setLoadingAi(true);
    try {
      const { data } = await api.post('/ai/recommend', {
        studentName: 'Class Overview',
        className: 'All Classes',
        readingLevel: stats?.readingDist?.[0]?.level || 'Cannot Read',
        arithmeticLevel: stats?.arithDist?.[0]?.level || 'Cannot Solve',
        isAdmin: true,
      });
      setAiInsights(data.recommendations || []);
    } catch {
      setAiInsights(['Could not load AI insights. Check your connection.']);
    } finally { setLoadingAi(false); }
  }

  // Derived stats
  const totalStudents  = stats?.totalStudents ?? 0;
  const totalTeachers  = stats?.totalTeachers ?? 0;
  const belowGrade     = stats?.belowGrade ?? 0;
  const atGrade        = stats?.atGrade ?? 0;
  const belowPct       = totalStudents ? Math.round((belowGrade / totalStudents) * 100) : 0;
  const atPct          = totalStudents ? Math.round((atGrade / totalStudents) * 100) : 0;

  // Teacher performance table (assessments per teacher derived from students)
  const teacherPerf = teachers.map(t => {
    const tStudents = students.filter(s => s.teacher?._id === t._id || s.teacher === t._id);
    const below = tStudents.filter(s => s.gradeStatus === 'Below Grade Level').length;
    return {
      ...t,
      studentCount: tStudents.length,
      belowCount: below,
      belowPct: tStudents.length ? Math.round((below / tStudents.length) * 100) : 0,
    };
  }).sort((a, b) => b.belowPct - a.belowPct);

  // Critical alerts
  const criticalTeachers = teacherPerf.filter(t => t.belowPct >= 60);

  const readingDist = stats?.readingDist || [];
  const arithDist   = stats?.arithDist   || [];

  // Trend data (simulated from distribution for visual)
  const trendData = readingDist.map((r, i) => ({
    level: r.level,
    reading: r.count,
    arithmetic: arithDist[i]?.count ?? 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-700 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold">📚 ShikshaTrack — Admin</h1>
          <p className="text-xs text-purple-200">Welcome, {user?.name}</p>
        </div>
        <button onClick={logout}
          className="text-xs bg-purple-500 px-3 py-1 rounded-full hover:bg-purple-400 flex items-center gap-1">
          <LogOut size={11}/> Logout
        </button>
      </header>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200 px-4 sticky top-[64px] z-10 overflow-x-auto">
        {['overview','teachers','students','ai insights','alerts'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition
              ${tab === t ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
            {t === 'alerts' && criticalTeachers.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{criticalTeachers.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4 pb-10">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 border-l-4 border-indigo-400">
                <Users className="text-indigo-500" size={26}/>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
                  <p className="text-xs text-gray-500">Total Students</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 border-l-4 border-purple-400">
                <School className="text-purple-500" size={26}/>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{totalTeachers}</p>
                  <p className="text-xs text-gray-500">Teachers</p>
                </div>
              </div>
              <div className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 ${cardBorder(belowPct)}`}>
                <AlertTriangle className="text-red-400" size={26}/>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{belowPct}%</p>
                  <p className="text-xs text-gray-500">Avg Below Grade</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 border-l-4 border-green-400">
                <CheckCircle className="text-green-500" size={26}/>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{atPct}%</p>
                  <p className="text-xs text-gray-500">At Grade Level</p>
                </div>
              </div>
            </div>

            {/* Reading Distribution */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Reading Level — All Schools</h2>
              {readingDist.length === 0
                ? <p className="text-gray-400 text-sm text-center py-6">No data yet.</p>
                : <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={readingDist}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="level" tick={{ fontSize: 10 }}/>
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false}/>
                      <Tooltip/>
                      <Bar dataKey="count" radius={[4,4,0,0]}>
                        {readingDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>

            {/* Arithmetic Distribution */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Arithmetic Level — All Schools</h2>
              {arithDist.length === 0
                ? <p className="text-gray-400 text-sm text-center py-6">No data yet.</p>
                : <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={arithDist}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="level" tick={{ fontSize: 10 }}/>
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false}/>
                      <Tooltip/>
                      <Bar dataKey="count" radius={[4,4,0,0]}>
                        {arithDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>

            {/* Trend Comparison */}
            {trendData.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h2 className="font-semibold text-gray-700 mb-3">Reading vs Arithmetic Comparison</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="level" tick={{ fontSize: 10 }}/>
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false}/>
                    <Tooltip/>
                    <Legend/>
                    <Line type="monotone" dataKey="reading" stroke="#6366f1" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="arithmetic" stroke="#22c55e" strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {/* ── TEACHERS TAB ── */}
        {tab === 'teachers' && (
          <>
            <h2 className="font-bold text-gray-700">Teacher Performance ({teachers.length})</h2>
            {teacherPerf.length === 0 && (
              <p className="text-center text-gray-400 py-8">No teachers registered yet.</p>
            )}
            <div className="space-y-2">
              {teacherPerf.map(t => (
                <div key={t._id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${t.belowPct >= 60 ? 'border-red-400' : t.belowPct >= 30 ? 'border-yellow-400' : 'border-green-400'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-800">{t.name}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.belowPct >= 60 ? 'bg-red-100 text-red-700' : t.belowPct >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {t.belowPct}% below grade
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{t.email}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Students: {t.studentCount}</span>
                    <span>Below grade: {t.belowCount}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${t.belowPct >= 60 ? 'bg-red-400' : t.belowPct >= 30 ? 'bg-yellow-400' : 'bg-green-400'}`}
                      style={{ width: `${t.belowPct}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── STUDENTS TAB ── */}
        {tab === 'students' && (
          <>
            <h2 className="font-bold text-gray-700">All Students ({students.length})</h2>
            {students.length === 0 && (
              <p className="text-center text-gray-400 py-8">No students found.</p>
            )}
            <div className="space-y-2">
              {students.map(s => (
                <div key={s._id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-800">{s.name}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.gradeStatus === 'At Grade Level' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {s.gradeStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Teacher: {s.teacher?.name ?? '—'} · Class: {s.class?.name ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Reading: {s.readingLevel} · Arithmetic: {s.arithmeticLevel}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── AI INSIGHTS TAB ── */}
        {tab === 'ai insights' && (
          <>
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-500"/> AI Policy Recommendations
            </h2>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <p className="text-sm text-amber-900 font-medium">System-level learning gap summary:</p>
              <p className="text-sm text-amber-800">
                <span className="font-semibold">{belowGrade}</span> of {totalStudents} students ({belowPct}%) are below grade level.
              </p>
              {criticalTeachers.length > 0 && (
                <p className="text-sm text-red-700">
                  ⚠️ {criticalTeachers.length} teacher(s) have 60%+ students below grade — priority intervention needed.
                </p>
              )}
            </div>

            {aiInsights.length === 0
              ? <button onClick={getAiInsights} disabled={loadingAi}
                  className="w-full bg-amber-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-amber-600 transition disabled:opacity-60">
                  <Lightbulb size={18}/> {loadingAi ? 'Generating insights...' : 'Generate AI Insights'}
                </button>
              : <>
                  <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                    {aiInsights.map((tip, i) => (
                      <div key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                        <p>{tip}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setAiInsights([])}
                    className="text-sm text-amber-600 underline">Regenerate</button>
                </>
            }
          </>
        )}

        {/* ── ALERTS TAB ── */}
        {tab === 'alerts' && (
          <>
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
              <Bell size={18} className="text-red-500"/> Alerts & Notifications
            </h2>

            {criticalTeachers.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="text-green-500" size={20}/>
                <p className="text-sm text-green-800 font-medium">No critical alerts. All classes are performing well.</p>
              </div>
            )}

            {criticalTeachers.length > 0 && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-red-700">
                    ⚠️ {criticalTeachers.length} teacher(s) have critical learning gaps (60%+ students below grade)
                  </p>
                </div>
                <div className="space-y-2">
                  {criticalTeachers.map(t => (
                    <div key={t._id} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-400">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-800">{t.name}</p>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{t.belowPct}% below</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{t.email} · {t.studentCount} students</p>
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <TrendingDown size={11}/> Recommend: Targeted teacher training + resource allocation
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Low assessment coverage alert */}
            {teachers.filter(t => {
              const count = students.filter(s => s.teacher?._id === t._id || s.teacher === t._id).length;
              return count === 0;
            }).length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                  <ClipboardList size={15}/> Low Assessment Coverage
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {teachers.filter(t => students.filter(s => s.teacher?._id === t._id || s.teacher === t._id).length === 0).length} teacher(s) have no students recorded yet.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
