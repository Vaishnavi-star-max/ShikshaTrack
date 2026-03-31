import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, CheckCircle, ClipboardList, Plus, LogOut, WifiOff, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { flushQueue, getQueue } from '../utils/offlineQueue';
import ClassCard from '../components/ClassCard';

const READING_LEVELS = ['Cannot Read','Letter','Word','Paragraph','Story'];
const ARITH_LEVELS   = ['Cannot Solve','Number Recognition','Subtraction','Division'];
const READING_SCORE  = { 'Cannot Read':0,'Letter':1,'Word':2,'Paragraph':3,'Story':4 };
const BAR_COLORS     = ['#ef4444','#f97316','#eab308','#22c55e','#6366f1'];

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses]           = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [stats, setStats]               = useState(null);
  const [allStudents, setAllStudents]   = useState([]);
  const [tab, setTab]                   = useState('overview');
  const [showClassForm, setShowClassForm] = useState(false);
  const [classForm, setClassForm]       = useState({ name:'', grade:'', school:'' });
  const [isOnline, setIsOnline]         = useState(navigator.onLine);
  const [pendingSync, setPendingSync]   = useState(getQueue().length);

  useEffect(() => {
    const on  = () => { setIsOnline(true); flushQueue(api); setPendingSync(0); };
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [clsRes, statsRes] = await Promise.all([
        api.get('/teacher/classes'),
        api.get('/assessments/stats'),
      ]);
      setClasses(clsRes.data);
      setStats(statsRes.data);

      const counts = {};
      const allStu = [];
      await Promise.all(clsRes.data.map(async cls => {
        try {
          const r = await api.get(`/teacher/class/${cls._id}/students`);
          counts[cls._id] = r.data.length;
          allStu.push(...r.data.map(s => ({ ...s, className: cls.name })));
        } catch { counts[cls._id] = 0; }
      }));
      setStudentCounts(counts);
      setAllStudents(allStu);
    } catch { /* offline */ }
  }

  async function createClass(e) {
    e.preventDefault();
    try {
      await api.post('/teacher/class', classForm);
      setClassForm({ name:'', grade:'', school:'' });
      setShowClassForm(false);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  }

  const totalStudents  = allStudents.length;
  const belowReading   = allStudents.filter(s => READING_SCORE[s.readingLevel] < 3).length;
  const belowArith     = allStudents.filter(s => ['Cannot Solve','Number Recognition'].includes(s.arithmeticLevel)).length;
  const belowPct       = totalStudents ? Math.round((belowReading / totalStudents) * 100) : 0;
  const criticalStudents = allStudents.filter(s => READING_SCORE[s.readingLevel] < 2);

  const readingDist = READING_LEVELS.map(l => ({ level: l, count: allStudents.filter(s => s.readingLevel === l).length }));
  const arithDist   = ARITH_LEVELS.map(l => ({ level: l, count: allStudents.filter(s => s.arithmeticLevel === l).length }));

  const GRADES = ['Class 1','Class 2','Class 3','Class 4','Class 5'];

  function cardColor(pct) {
    if (pct >= 60) return 'border-l-4 border-red-400';
    if (pct >= 30) return 'border-l-4 border-yellow-400';
    return 'border-l-4 border-green-400';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold">📚 ShikshaTrack</h1>
          <p className="text-xs text-indigo-200">Welcome, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="flex items-center gap-1 text-xs bg-yellow-500 px-2 py-1 rounded-full">
              <WifiOff size={11}/> Offline
            </span>
          )}
          {pendingSync > 0 && (
            <span className="text-xs bg-orange-500 px-2 py-1 rounded-full">{pendingSync} pending</span>
          )}
          <button onClick={logout} className="text-xs bg-indigo-500 px-3 py-1 rounded-full hover:bg-indigo-400 flex items-center gap-1">
            <LogOut size={11}/> Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200 px-4 sticky top-[64px] z-10">
        {['overview','classes','students','alerts'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition ${tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}{t === 'alerts' && criticalStudents.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">{criticalStudents.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4 pb-24">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 ${cardColor(0)}`}>
                <Users className="text-indigo-500" size={26}/>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
                  <p className="text-xs text-gray-500">Total Students</p>
                </div>
              </div>
              <div className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 ${cardColor(belowPct)}`}>
                <AlertTriangle className="text-red-400" size={26}/>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{belowPct}%</p>
                  <p className="text-xs text-gray-500">Below Grade (Reading)</p>
                </div>
              </div>
              <div className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 ${cardColor(totalStudents ? Math.round(belowArith/totalStudents*100) : 0)}`}>
                <AlertTriangle className="text-orange-400" size={26}/>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {totalStudents ? Math.round((belowArith/totalStudents)*100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500">Below Grade (Arithmetic)</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 border-l-4 border-green-400">
                <ClipboardList className="text-green-500" size={26}/>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats?.totalAssessments ?? '—'}</p>
                  <p className="text-xs text-gray-500">Assessments</p>
                </div>
              </div>
            </div>

            {/* Reading Chart */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Reading Level Distribution</h2>
              {totalStudents === 0
                ? <p className="text-gray-400 text-sm text-center py-6">No student data yet.</p>
                : <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={readingDist}>
                      <XAxis dataKey="level" tick={{ fontSize: 10 }}/>
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false}/>
                      <Tooltip/>
                      <Bar dataKey="count" radius={[4,4,0,0]}>
                        {readingDist.map((_, i) => <Cell key={i} fill={BAR_COLORS[i]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>

            {/* Arithmetic Chart */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-3">Arithmetic Level Distribution</h2>
              {totalStudents === 0
                ? <p className="text-gray-400 text-sm text-center py-6">No student data yet.</p>
                : <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={arithDist}>
                      <XAxis dataKey="level" tick={{ fontSize: 10 }}/>
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false}/>
                      <Tooltip/>
                      <Bar dataKey="count" radius={[4,4,0,0]}>
                        {arithDist.map((_, i) => <Cell key={i} fill={BAR_COLORS[i]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>

            {/* AI Insights summary */}
            {totalStudents > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <h2 className="font-semibold text-amber-800 flex items-center gap-2">🤖 AI Class Insights</h2>
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">{belowReading}</span> of {totalStudents} students are below grade level in reading.
                </p>
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">{belowArith}</span> of {totalStudents} students need arithmetic support.
                </p>
                {criticalStudents.length > 0 && (
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ {criticalStudents.length} student(s) need urgent attention — reading at Letter level or below.
                  </p>
                )}
                <p className="text-xs text-amber-700 mt-1">
                  Tip: Open a student card to get personalised AI teaching recommendations.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── CLASSES TAB ── */}
        {tab === 'classes' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-700">My Classes</h2>
              <button onClick={() => setShowClassForm(v => !v)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-indigo-700 transition">
                <Plus size={15}/> New Class
              </button>
            </div>

            {showClassForm && (
              <form onSubmit={createClass} className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                <h3 className="font-semibold text-gray-700">Create Class</h3>
                <input placeholder="Class Name (e.g. 3A)" required value={classForm.name}
                  onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                <select required value={classForm.grade} onChange={e => setClassForm(f => ({ ...f, grade: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">Select Grade</option>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
                <input placeholder="School (optional)" value={classForm.school}
                  onChange={e => setClassForm(f => ({ ...f, school: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-indigo-700">Create</button>
                  <button type="button" onClick={() => setShowClassForm(false)} className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2 text-sm font-semibold">Cancel</button>
                </div>
              </form>
            )}

            {classes.length === 0 && !showClassForm && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">🏫</div>
                <p>No classes yet. Create your first class!</p>
              </div>
            )}
            {classes.map(cls => (
              <ClassCard key={cls._id} cls={cls} studentCount={studentCounts[cls._id] || 0}/>
            ))}
          </>
        )}

        {/* ── STUDENTS TAB ── */}
        {tab === 'students' && (
          <>
            <h2 className="font-bold text-gray-700">All Students ({allStudents.length})</h2>
            {allStudents.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">👨‍🎓</div>
                <p>No students yet. Add students inside a class.</p>
              </div>
            )}
            <div className="space-y-2">
              {allStudents.map(s => (
                <div key={s._id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.className} · {s.readingLevel} · {s.arithmeticLevel}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.gradeStatus === 'At Grade Level' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {s.gradeStatus}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ALERTS TAB ── */}
        {tab === 'alerts' && (
          <>
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
              <Bell size={18} className="text-red-500"/> Alerts & Notifications
            </h2>

            {!isOnline && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                <WifiOff className="text-yellow-500" size={20}/>
                <div>
                  <p className="font-semibold text-yellow-800 text-sm">You are offline</p>
                  <p className="text-xs text-yellow-700">Assessments will sync when connection is restored. {pendingSync} pending.</p>
                </div>
              </div>
            )}

            {criticalStudents.length === 0
              ? <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20}/>
                  <p className="text-sm text-green-800 font-medium">No critical alerts. All students are progressing well.</p>
                </div>
              : <>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-sm font-semibold text-red-700 mb-2">⚠️ {criticalStudents.length} students need urgent attention</p>
                    <p className="text-xs text-red-600">These students are at Letter level or below in reading.</p>
                  </div>
                  <div className="space-y-2">
                    {criticalStudents.map(s => (
                      <div key={s._id} className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-400">
                        <p className="font-semibold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.className} · Reading: {s.readingLevel} · Arithmetic: {s.arithmeticLevel}</p>
                        <p className="text-xs text-red-600 mt-1">Action: Open class → student card → Get AI Tips</p>
                      </div>
                    ))}
                  </div>
                </>
            }
          </>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/assess')}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg text-3xl flex items-center justify-center hover:bg-indigo-700 transition"
        aria-label="Quick Assessment">+</button>
    </div>
  );
}
