import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import api from '../api/axios';

const GRADE_BADGE = {
  'At Grade Level':    'bg-green-100 text-green-700',
  'Below Grade Level': 'bg-red-100 text-red-600',
};

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/students').then(r => setStudents(r.data)).catch(() => {});
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.className?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back"><ChevronLeft/></button>
        <h1 className="text-lg font-bold">Students</h1>
      </header>

      <div className="p-4 space-y-3 max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18}/>
          <input
            placeholder="Search by name or class..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">No students found.</p>}

        {filtered.map(s => (
          <button
            key={s._id}
            onClick={() => navigate(`/students/${s._id}`)}
            className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition text-left"
          >
            <div>
              <p className="font-semibold text-gray-800">{s.name}</p>
              <p className="text-sm text-gray-500">{s.className} · Last: {s.lastAssessment ? new Date(s.lastAssessment).toLocaleDateString() : 'N/A'}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${GRADE_BADGE[s.gradeStatus] || 'bg-gray-100 text-gray-500'}`}>
              {s.gradeStatus || 'Unassessed'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
