import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function VerifyOtpPage() {
  const [otp, setOtp]           = useState(Array(6).fill(''));
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || '';

  useEffect(() => { if (!email) navigate('/register'); refs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(()=>setCountdown(c=>c-1),1000); return ()=>clearTimeout(t); }
  }, [countdown]);

  const change = (i, v) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i < 5) refs.current[i+1]?.focus();
    if (n.every(Boolean) && n.join('').length === 6) submit(n.join(''));
  };
  const keyDown = (i, e) => { if (e.key==='Backspace' && !otp[i] && i>0) refs.current[i-1]?.focus(); };
  const paste = e => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (p.length === 6) { setOtp(p.split('')); submit(p); }
  };

  const submit = async code => {
    const c = code || otp.join('');
    if (c.length < 6) return;
    setLoading(true);
    try { await verifyOtp(email, c); navigate('/dashboard'); } catch {}
    finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true);
    try { await authAPI.resendOtp(email); toast.success('OTP resent!'); setCountdown(60); setOtp(Array(6).fill('')); refs.current[0]?.focus(); } catch {}
    finally { setResending(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500/10 to-secondary-500/10 p-6">
      <div className="card w-full max-w-md text-center">
        <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg">📧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 mb-1">We sent a 6-digit code to</p>
        <p className="font-semibold text-primary-600 mb-8">{email}</p>
        <div className="flex gap-3 justify-center mb-8" onPaste={paste}>
          {otp.map((d,i) => (
            <input key={i} ref={el=>refs.current[i]=el} type="text" inputMode="numeric" maxLength={1}
              value={d} onChange={e=>change(i,e.target.value)} onKeyDown={e=>keyDown(i,e)}
              className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                ${d ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white'}
                focus:border-primary-500 focus:ring-2 focus:ring-primary-200`} />
          ))}
        </div>
        <button onClick={()=>submit()} disabled={loading||otp.join('').length<6} className="btn-primary w-full mb-4">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Verifying...</span> : 'Verify Account'}
        </button>
        <p className="text-sm text-gray-500">
          {countdown > 0
            ? <>Resend in <span className="font-semibold text-primary-600">{countdown}s</span></>
            : <button onClick={resend} disabled={resending} className="text-primary-600 font-semibold hover:underline disabled:opacity-50">{resending?'Resending...':'Resend Code'}</button>}
        </p>
      </div>
    </div>
  );
}
