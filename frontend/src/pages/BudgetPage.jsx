import React, { useState, useEffect, useCallback } from 'react';
import { budgetAPI, categoryAPI } from '../api';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0}).format(n||0);
const MOS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function Form({ initial, categories, onSave, onClose }) {
  const now = new Date();

  // FIX: Properly handle initial values without duplicate keys
  const [f, setF] = useState(() => {
    const defaultValues = {
      name: '',
      amount: '',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      categoryId: '',
      alertThreshold: 80
    };

    if (initial) {
      return {
        ...defaultValues,
        ...initial,
        // Ensure amount is properly set from initial
        amount: initial.amount || ''
      };
    }
    return defaultValues;
  });

  const [saving, setSaving] = useState(false);
  const s = k => e => setF(p => ({...p, [k]: e.target.value}));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...f,
        amount: parseFloat(f.amount),
        categoryId: f.categoryId ? +f.categoryId : null,
        alertThreshold: +f.alertThreshold
      });
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  return (
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Budget Name *</label>
          <input
              className="input-field"
              placeholder="e.g. Monthly Groceries"
              value={f.name}
              onChange={s('name')}
              required
          />
        </div>

        <div>
          <label className="label">Amount *</label>
          <input
              type="number"
              step="0.01"
              min="0.01"
              className="input-field"
              placeholder="0.00"
              value={f.amount}
              onChange={s('amount')}
              required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Month</label>
            <select
                className="input-field"
                value={f.month}
                onChange={e => setF(p => ({...p, month: +e.target.value}))}
            >
              {MOS.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select
                className="input-field"
                value={f.year}
                onChange={e => setF(p => ({...p, year: +e.target.value}))}
            >
              {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Category (optional)</label>
          <select
              className="input-field"
              value={f.categoryId}
              onChange={s('categoryId')}
          >
            <option value="">All Expenses</option>
            {categories.filter(c => c.type !== 'INCOME').map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">
            Alert at: <span className="text-primary-600 font-semibold">{f.alertThreshold}%</span>
          </label>
          <input
              type="range"
              min="50"
              max="100"
              step="5"
              className="w-full accent-primary-600"
              value={f.alertThreshold}
              onChange={e => setF(p => ({...p, alertThreshold: +e.target.value}))}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving…' : initial?.id ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
  );
}

function BudgetCard({ b, onEdit, onDelete }) {
  const pct   = Math.min(b.percentageUsed, 100);
  const color = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981';
  const over  = pct >= 100;
  const warn  = pct >= b.alertThreshold && !over;

  return (
      <div className="card-hover">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-lg">
              {b.category?.icon || '🎯'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{b.name}</h3>
              <p className="text-xs text-gray-400">{MOS[b.month - 1]} {b.year}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {over && <span className="badge-red badge">🚨 Exceeded</span>}
            {warn && <span className="badge-yellow badge">⚠️ Alert</span>}
            {!over && !warn && <span className="badge-green badge">✅ On Track</span>}
            <button onClick={() => onEdit(b)} className="btn-icon text-blue-500 hover:bg-blue-50 ml-1">✏️</button>
            <button onClick={() => onDelete(b.id)} className="btn-icon text-red-500 hover:bg-red-50">🗑️</button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Spent</span>
            <span className="font-semibold text-gray-800">{fmt(b.spent)}</span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%`, background: color }}/>
          </div>

          <div className="flex justify-between text-sm">
            <span style={{ color }} className="font-medium">{pct.toFixed(1)}% used</span>
            <span className="text-gray-500">Budget: {fmt(b.amount)}</span>
          </div>

          <div className="flex justify-between text-sm pt-1 border-t border-gray-50">
            <span className="text-gray-500">Remaining</span>
            <span className={`font-semibold ${b.remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {fmt(Math.abs(b.remaining))} {b.remaining < 0 ? 'over' : 'left'}
          </span>
          </div>

          {b.category && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Category</span>
                <span className="badge-blue badge">{b.category.icon} {b.category.name}</span>
              </div>
          )}
        </div>
      </div>
  );
}

export default function BudgetPage() {
  const [budgets,    setBudgets]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [edit,       setEdit]       = useState(null);
  const [delId,      setDelId]      = useState(null);
  const now = new Date();
  const [fm, setFm] = useState(now.getMonth() + 1);
  const [fy, setFy] = useState(now.getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [br, cr] = await Promise.all([
        budgetAPI.getAll({ month: fm, year: fy }),
        categoryAPI.getAll()
      ]);
      setBudgets(br.data.data || []);
      setCategories(cr.data.data || []);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [fm, fy]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (payload) => {
    try {
      if (edit?.id) {
        await budgetAPI.update(edit.id, payload);
        toast.success('Budget updated successfully');
      } else {
        await budgetAPI.create(payload);
        toast.success('Budget created successfully');
      }
      await load();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save budget');
      throw error;
    }
  };

  const deleteBudget = async () => {
    try {
      await budgetAPI.delete(delId);
      toast.success('Budget deleted successfully');
      setDelId(null);
      await load();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete budget');
    }
  };

  const totBudget = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totSpent  = budgets.reduce((s, b) => s + parseFloat(b.spent || 0), 0);
  const exceeded  = budgets.filter(b => b.percentageUsed >= 100).length;

  return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Budgets 🎯</h1>
            <p className="text-gray-500 mt-1">
              {budgets.length} budgets
              {exceeded > 0 && <> · <span className="text-red-500 font-medium">{exceeded} exceeded</span></>}
            </p>
          </div>
          <button
              onClick={() => {
                setEdit(null);
                setModal(true);
              }}
              className="btn-primary"
          >
            + Create Budget
          </button>
        </div>

        {/* Summary Cards */}
        {budgets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Budget',  value: fmt(totBudget), icon: '🎯', cls: 'text-primary-600' },
                { label: 'Total Spent',   value: fmt(totSpent),  icon: '💸', cls: 'text-red-500' },
                { label: 'Remaining',     value: fmt(totBudget - totSpent), icon: '💰', cls: 'text-green-500' },
              ].map(s => (
                  <div key={s.label} className="card text-center">
                    <div className="text-3xl mb-1">{s.icon}</div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className={`text-xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
                  </div>
              ))}
            </div>
        )}

        {/* Filters */}
        <div className="card flex flex-wrap items-center gap-4">
          <div>
            <label className="label">Month</label>
            <select
                className="input-field py-2 w-36"
                value={fm}
                onChange={e => setFm(+e.target.value)}
            >
              {MOS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select
                className="input-field py-2 w-24"
                value={fy}
                onChange={e => setFy(+e.target.value)}
            >
              {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Budget Cards */}
        {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"/>
            </div>
        ) : budgets.length === 0 ? (
            <div className="card flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-4xl mb-3">🎯</span>
              <p className="font-medium">No budgets for this period</p>
              <p className="text-sm mt-1">Create a budget to track your spending</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {budgets.map(b => (
                  <BudgetCard
                      key={b.id}
                      b={b}
                      onEdit={b => {
                        setEdit(b);
                        setModal(true);
                      }}
                      onDelete={setDelId}
                  />
              ))}
            </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
            isOpen={modal}
            onClose={() => setModal(false)}
            title={edit ? 'Edit Budget' : 'Create Budget'}
        >
          <Form
              initial={edit}
              categories={categories}
              onSave={save}
              onClose={() => setModal(false)}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
            isOpen={!!delId}
            onClose={() => setDelId(null)}
            title="Confirm Delete"
            size="sm"
        >
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-gray-700 mb-2 font-medium">Delete this budget?</p>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={deleteBudget} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </Modal>
      </div>
  );
}