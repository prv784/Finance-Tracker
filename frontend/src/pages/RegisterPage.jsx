import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register({ firstName:form.firstName, lastName:form.lastName, email:form.email, password:form.password });
      navigate('/verify-otp', { state: { email: form.email } });
    } catch {}
    finally { setLoading(false); }
  };

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_,i)=>(<div key={i} className="absolute rounded-full border border-white"
            style={{width:`${(i+1)*150}px`,height:`${(i+1)*150}px`,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>))}
        </div>
        <div className="relative z-10 text-center text-white space-y-4">
          <div className="text-7xl">🚀</div>
          <h1 className="text-4xl font-bold">Get Started Free</h1>
          <p className="text-xl text-white/80">Your AI-powered finance journey starts here</p>
          {['✅ Free account','✅ Gemini AI insights','✅ Budget alerts','✅ Spending analysis'].map(t=>(
            <p key={t} className="text-white/90">{t}</p>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
            <p className="text-gray-500 mb-6">Start your financial journey today</p>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">First Name</label>
                  <input className="input-field" placeholder="John" value={form.firstName} onChange={set('firstName')} required /></div>
                <div><label className="label">Last Name</label>
                  <input className="input-field" placeholder="Doe" value={form.lastName} onChange={set('lastName')} required /></div>
              </div>
              <div><label className="label">Email</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={set('email')} required /></div>
              <div><label className="label">Password</label>
                <input type="password" className="input-field" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required minLength={8} /></div>
              <div><label className="label">Confirm Password</label>
                <input type="password" className="input-field" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required /></div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating...</span> : 'Create Account'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-semibold">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
