import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ pw: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const token = params.get('token');
  const navigate = useNavigate();

  useEffect(() => { if (!token) navigate('/forgot-password'); }, [token]);

  const submit = async e => {
    e.preventDefault();
    if (form.pw !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, form.pw);
      setDone(true);
      toast.success('Password reset!');
      setTimeout(() => navigate('/login'), 2000);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500/10 to-secondary-500/10 p-6">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">🔑</div>
          <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-gray-500 mt-2">Create a new secure password</p>
        </div>
        {done ? (
          <div className="text-center space-y-3">
            <div className="text-5xl">✅</div>
            <p className="text-gray-700 font-medium">Password reset successfully!</p>
            <p className="text-gray-500 text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input-field" placeholder="Min 8 characters"
                value={form.pw} onChange={e=>setForm(f=>({...f,pw:e.target.value}))} required minLength={8} />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input-field" placeholder="Repeat password"
                value={form.confirm} onChange={e=>setForm(f=>({...f,confirm:e.target.value}))} required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Resetting...</span> : 'Reset Password'}
            </button>
            <p className="text-center text-sm">
              <Link to="/login" className="text-primary-600 font-semibold">Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
