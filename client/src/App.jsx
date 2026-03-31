import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login            from './pages/Login';
import Signup           from './pages/Signup';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard   from './pages/AdminDashboard';
import ClassDetail      from './pages/ClassDetail';
import AssessmentForm   from './pages/AssessmentForm';
import Students         from './pages/Students';
import StudentDetail    from './pages/StudentDetail';

function PrivateRoute({ children, role }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to={user?.role === 'admin' ? '/admin' : '/teacher'} replace />;
  return children;
}

function RootRedirect() {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/teacher'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<RootRedirect />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />

          <Route path="/teacher" element={<PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>} />
          <Route path="/teacher/class/:id" element={<PrivateRoute role="teacher"><ClassDetail /></PrivateRoute>} />
          <Route path="/assess"  element={<PrivateRoute><AssessmentForm /></PrivateRoute>} />
          <Route path="/students" element={<PrivateRoute><Students /></PrivateRoute>} />
          <Route path="/students/:id" element={<PrivateRoute><StudentDetail /></PrivateRoute>} />

          <Route path="/admin"   element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />

          {/* legacy dashboard redirect */}
          <Route path="/dashboard" element={<RootRedirect />} />
          <Route path="*"        element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
