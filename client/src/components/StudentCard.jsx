import { BookOpen, Calculator } from 'lucide-react';

const GRADE_STYLE = {
  'At Grade Level':    'bg-green-100 text-green-700',
  'Below Grade Level': 'bg-red-100 text-red-600',
};

export default function StudentCard({ student, onClick }) {
  return (
    <button
      onClick={() => onClick?.(student)}
      className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-gray-800">{student.name}</p>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${GRADE_STYLE[student.gradeStatus] || 'bg-gray-100 text-gray-500'}`}>
          {student.gradeStatus || 'Unassessed'}
        </span>
      </div>
      <div className="flex gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1"><BookOpen size={13}/> {student.readingLevel}</span>
        <span className="flex items-center gap-1"><Calculator size={13}/> {student.arithmeticLevel}</span>
      </div>
    </button>
  );
}
