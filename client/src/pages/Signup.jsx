import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/teacher');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📚</div>
          <h1 className="text-2xl font-bold text-indigo-700">ShikshaTrack</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Full Name" required value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          <input type="email" placeholder="Email" required value={form.email}
            onChange={e => set('email', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          <input type="password" placeholder="Password" required value={form.password}
            onChange={e => set('password', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          <select value={form.role} onChange={e => set('role', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}
