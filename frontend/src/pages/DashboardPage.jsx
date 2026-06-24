import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const fmt = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0}).format(n||0);

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-card-hover border border-gray-100 p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color}} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{background:p.color}}/>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

const PieLbl = ({cx,cy,midAngle,innerRadius,outerRadius,percent}) => {
  if (percent<0.05) return null;
  const R = Math.PI/180, r = innerRadius+(outerRadius-innerRadius)*0.5;
  return <text x={cx+r*Math.cos(-midAngle*R)} y={cy+r*Math.sin(-midAngle*R)}
    fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
    {`${(percent*100).toFixed(0)}%`}
  </text>;
};

const COLORS = ['#667eea','#764ba2','#f5576c','#f093fb','#4facfe','#43e97b','#fa709a','#fee140','#30cfd0','#a18cd1'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS  = [2022,2023,2024,2025,2026];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth()+1);
  const [year,  setYear]  = useState(new Date().getFullYear());

  const load = useCallback(async()=>{
    setLoading(true);
    try { const r = await dashboardAPI.get({month,year}); setData(r.data.data); } catch {}
    finally { setLoading(false); }
  },[month,year]);

  useEffect(()=>{ load(); },[load]);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );

  const stats = [
    { label:'Total Income',   value:fmt(data?.totalIncome),   icon:'💰', cls:'gradient-income',   badge:'+income' },
    { label:'Total Expenses', value:fmt(data?.totalExpenses), icon:'💸', cls:'gradient-expense',  badge:'this month' },
    { label:'Net Savings',    value:fmt(data?.totalSavings),  icon:'🏦', cls:'gradient-savings',  badge:'saved' },
    { label:'Savings Rate',   value:`${(data?.savingsRate||0).toFixed(1)}%`, icon:'📈', cls:'gradient-ai', badge:'of income' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard 👋</h1>
          <p className="text-gray-500 mt-1">Hello {user?.firstName}, here's your financial overview</p>
        </div>
        <div className="flex gap-3">
          <select value={month} onChange={e=>setMonth(+e.target.value)} className="input-field py-2 w-28">
            {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(+e.target.value)} className="input-field py-2 w-24">
            {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s=>(
          <div key={s.label} className="card-hover group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                <span className="badge-green badge mt-2">{s.badge}</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${s.cls} flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform`}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          <h3 className="section-title">Monthly Financial Trend</h3>
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={data?.monthlyData||[]} margin={{top:5,right:10,left:0,bottom:5}}>
              <defs>
                {[['incG','#10b981'],['expG','#ef4444'],['savG','#667eea']].map(([id,c])=>(
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={c} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="month" tick={{fill:'#9ca3af',fontSize:12}}/>
              <YAxis tick={{fill:'#9ca3af',fontSize:12}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<Tip/>}/>
              <Legend/>
              <Area type="monotone" dataKey="income"   stroke="#10b981" strokeWidth={2} fill="url(#incG)" name="Income"/>
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expG)" name="Expenses"/>
              <Area type="monotone" dataKey="savings"  stroke="#667eea" strokeWidth={2} fill="url(#savG)" name="Savings"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Expenses by Category</h3>
          {data?.expenseByCategory?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={data.expenseByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                    dataKey="amount" nameKey="category" labelLine={false} label={<PieLbl/>}>
                    {data.expenseByCategory.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>fmt(v)}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-hide mt-1">
                {data.expenseByCategory.slice(0,6).map((c,i)=>(
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>
                      <span className="text-gray-600 truncate max-w-[100px]">{c.category}</span>
                    </div>
                    <span className="font-semibold text-gray-700">{fmt(c.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-44 text-gray-400">
              <span className="text-4xl mb-2">📊</span><p className="text-sm">No expense data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data?.monthlyData||[]} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="month" tick={{fill:'#9ca3af',fontSize:12}}/>
              <YAxis tick={{fill:'#9ca3af',fontSize:12}} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<Tip/>}/>
              <Legend/>
              <Bar dataKey="income"   fill="#10b981" name="Income"   radius={[4,4,0,0]}/>
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Budget Status</h3>
          {data?.activeBudgets?.length > 0 ? (
            <div className="space-y-4 max-h-60 overflow-y-auto scrollbar-hide">
              {data.activeBudgets.map(b=>{
                const p = Math.min(b.percentageUsed,100);
                const color = p>=90?'#ef4444':p>=75?'#f59e0b':'#10b981';
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{b.category?.icon} {b.name}</span>
                      <span className="text-gray-500">{fmt(b.spent)}/{fmt(b.amount)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width:`${p}%`,background:color}}/>
                    </div>
                    <div className="flex justify-between text-xs mt-0.5">
                      <span style={{color}}>{p.toFixed(1)}% used</span>
                      <span className="text-gray-400">{fmt(b.remaining)} left</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-44 text-gray-400">
              <span className="text-4xl mb-2">🎯</span><p className="text-sm">No budgets for this month</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title">Recent Expenses</h3>
          {data?.recentExpenses?.length > 0 ? (
            <div className="space-y-2">
              {data.recentExpenses.slice(0,6).map(e=>(
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-expense flex items-center justify-center text-sm">{e.category?.icon||'💸'}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.title}</p>
                      <p className="text-xs text-gray-400">{e.category?.name} · {e.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-red-500">-{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <span className="text-3xl mb-2">💸</span><p className="text-sm">No expenses yet</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">Recent Income</h3>
          {data?.recentIncomes?.length > 0 ? (
            <div className="space-y-2">
              {data.recentIncomes.slice(0,6).map(i=>(
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-income flex items-center justify-center text-sm">💰</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{i.title}</p>
                      <p className="text-xs text-gray-400">{i.source} · {i.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-500">+{fmt(i.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <span className="text-3xl mb-2">💰</span><p className="text-sm">No income yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
