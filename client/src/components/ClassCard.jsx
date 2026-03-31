import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

export default function ClassCard({ cls, studentCount = 0 }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/teacher/class/${cls._id}`)}
      className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition text-left"
    >
      <div className="flex items-center gap-3">
        <div className="bg-indigo-100 text-indigo-600 rounded-xl p-3">
          <Users size={20}/>
        </div>
        <div>
          <p className="font-semibold text-gray-800">{cls.name}</p>
          <p className="text-sm text-gray-500">{cls.grade} · {studentCount} students</p>
        </div>
      </div>
      <ChevronRight className="text-gray-400" size={20}/>
    </button>
  );
}
