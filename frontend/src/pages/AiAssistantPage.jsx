import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../api';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';

const QUICK_PROMPTS = [
  'How can I reduce my monthly expenses?',
  'What is a good savings rate?',
  'Explain the 50/30/20 budgeting rule',
  'How do I build an emergency fund?',
  'Tips to avoid impulse spending',
  'How to invest my savings wisely?',
  'What expenses should I cut first?',
  'How much should I spend on rent?',
];

const GRADE_COLOR = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#ef4444' };

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
        {!isUser && (
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base flex-shrink-0 shadow-sm">🤖</div>
        )}
        <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
        ${isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
          <p className={`text-xs mt-1.5 ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
            {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {isUser && (
            <div className="w-9 h-9 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center text-base flex-shrink-0 shadow-sm">👤</div>
        )}
      </div>
  );
}

function TypingIndicator() {
  return (
      <div className="flex gap-3 justify-start">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base flex-shrink-0">🤖</div>
        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
              <span key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
  );
}

function HealthScoreGauge({ score, grade }) {
  const color = GRADE_COLOR[grade] || '#6366f1';
  const pct   = Math.min(Math.max(score, 0), 100);
  const dash  = (pct / 100) * 251.2;

  return (
      <div className="relative w-36 h-36 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx="50" cy="50" r="40" fill="none"
                  stroke={color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${dash} 251.2`}
                  style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black leading-none" style={{ color }}>{grade}</span>
          <span className="text-xs text-gray-500 mt-0.5">{pct.toFixed(0)}/100</span>
        </div>
      </div>
  );
}

function AnalysisTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await aiAPI.analyze(0, 0);
      setData(r.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTips = async () => {
    setTipsLoading(true);
    try {
      const r = await aiAPI.savingTips();
      setTips(r.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setTipsLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadTips();
  }, []);

  if (loading) return (
      <div className="flex flex-col items-center justify-center h-72 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Gemini 2.5 Engine processing spending history layers…</p>
      </div>
  );

  if (!data) return (
      <div className="flex flex-col items-center justify-center h-72 gap-4 text-gray-400">
        <span className="text-4xl">📊</span>
        <p>Failed to initialize remote inference dataset components.</p>
        <button onClick={load} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-sm">Retry Request</button>
      </div>
  );

  const radarData = [
    { axis: 'Savings',   value: Math.min(data.healthScore, 100) },
    { axis: 'Control',   value: Math.max(100 - data.healthScore * 0.3, 20) },
    { axis: 'Budget',    value: Math.min(data.healthScore * 1.1, 100) },
    { axis: 'Stability', value: Math.min(data.healthScore * 0.9, 100) },
    { axis: 'Diversity', value: Math.min(data.healthScore * 0.8, 100) },
  ];

  return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm text-center flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500 font-medium">Financial Health Index</p>
            <HealthScoreGauge score={data.healthScore} grade={data.healthGrade} />
            <div className="space-y-1">
              <p className="font-semibold text-gray-800">{data.spendingPattern}</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {['A','B','C','D'].map(g => (
                    <span key={g} className={`text-xs px-2 py-0.5 rounded-full font-semibold
                  ${data.healthGrade === g ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                          style={data.healthGrade === g ? { background: GRADE_COLOR[g] } : {}}>
                  {g}
                </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm md:col-span-2">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Structural Balance Metrics</h3>
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Radar dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip formatter={v => [`${Number(v).toFixed(0)}%`]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 bg-indigo-50/40 border-l-4 border-indigo-600 rounded-r-2xl">
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">📝 Gemini 2.5 Analysis Summary</p>
          <p className="text-gray-800 leading-relaxed text-sm">{data.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-sm">💡</span>
              Insights
            </h3>
            <ul className="space-y-2">
              {(data.insights || []).map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                    <span className="text-blue-500 flex-shrink-0">›</span>{s}
                  </li>
              ))}
            </ul>
          </div>

          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-sm">🎯</span>
              Suggestions
            </h3>
            <ul className="space-y-2">
              {(data.suggestions || []).map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                    <span className="text-green-500 flex-shrink-0">✓</span>{s}
                  </li>
              ))}
            </ul>
          </div>

          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-sm">⚠️</span>
              Warnings
            </h3>
            {(data.warnings || []).length > 0 ? (
                <ul className="space-y-2">
                  {data.warnings.map((w, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                        <span className="text-amber-500 flex-shrink-0">!</span>{w}
                      </li>
                  ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span>🌟</span> High operational parameter structural security verified.
                </p>
            )}
          </div>
        </div>

        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">🤖</span>
            Contextual Allocation Pointers
          </h3>
          {tipsLoading ? (
              <div className="flex items-center gap-3 text-gray-500 text-sm">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Compiling advice algorithms…
              </div>
          ) : tips.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tips.map((tip, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                    </div>
                ))}
              </div>
          ) : (
              <p className="text-sm text-gray-400">Add account transactions to enable tailored efficiency recommendations.</p>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={load} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl text-sm font-medium text-gray-700 flex items-center gap-2">
            🔄 Reload Model
          </button>
          <button onClick={loadTips} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl text-sm font-medium text-gray-700 flex items-center gap-2">
            💡 Request New Tips
          </button>
        </div>
      </div>
  );
}

function ChatTab({ messages, setMessages }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, ts: Date.now() }]);
    setLoading(true);
    try {
      const r = await aiAPI.chat({ message: msg });
      setMessages(prev => [...prev, { role: 'assistant', content: r.data.data, ts: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Terminal connectivity breakdown. Please confirm API server state loops.',
        ts: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm p-0 flex flex-col" style={{ height: '580px' }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base shadow-sm">🤖</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Gemini Context Interface</p>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                Runtime context engine: gemini-2.5-flash
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-100 p-4">
            <div className="flex gap-3">
            <textarea
                rows={1}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Query structural balance advice pointers..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                style={{ minHeight: '44px', maxHeight: '120px' }}
            />
              <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl disabled:opacity-50 transition-colors flex-shrink-0 flex items-center justify-center font-medium">
                {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                ) : 'Send'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Press Enter to deliver your sentence · Shift+Enter to introduce an empty structural line break</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">💡 Quick Vectors</h3>
            <div className="space-y-1.5">
              {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => send(p)} disabled={loading}
                          className="w-full text-left text-xs px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50
                  hover:text-indigo-700 transition-colors text-gray-600 disabled:opacity-50 leading-relaxed">
                    {p}
                  </button>
              ))}
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">✨ Core Capabilities</p>
            <ul className="space-y-2">
              {[
                'Spending pattern analysis',
                'Smart saving suggestions',
                'Budget advice & alerts',
                'Investment basics',
                'Debt management tips',
                'Financial goal planning',
              ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="text-indigo-500 font-bold">✓</span>{item}
                  </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  );
}

export default function AiAssistantPage() {
  const [tab, setTab] = useState('chat');
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "👋 Hi! I'm your AI Finance Assistant powered by Google Gemini. I can help you analyze your spending, suggest saving strategies, and answer any finance questions. What would you like to know?",
    ts: Date.now()
  }]);

  return (
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            AI Assistant 🤖
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold tracking-wide">Gemini 2.5 Flash</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Natively executing deep reasoning over active spending profiles</p>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { id: 'chat',      label: '💬 Interactive Chat' },
            { id: 'analysis', label: '📊 Core Metrics' },
          ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
          ))}
        </div>

        {tab === 'chat' && <ChatTab messages={messages} setMessages={setMessages} />}
        {tab === 'analysis' && <AnalysisTab />}
      </div>
  );
}
