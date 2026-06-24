import React, { useState, useEffect, useCallback } from 'react';
import { incomeAPI } from '../api';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n||0);
const SOURCES = ['SALARY','FREELANCE','BUSINESS','INVESTMENT','RENTAL','GIFT','BONUS','OTHER'];
const ICONS   = {SALARY:'💼',FREELANCE:'💻',BUSINESS:'🏢',INVESTMENT:'📈',RENTAL:'🏠',GIFT:'🎁',BONUS:'🎉',OTHER:'💵'};
const REC     = ['DAILY','WEEKLY','MONTHLY','YEARLY'];

function Form({ initial, onSave, onClose }) {
  const [f, setF] = useState({
    title:'',
    description:'',
    amount:'',
    date:new Date().toISOString().split('T')[0],
    source:'SALARY',
    notes:'',
    recurring:false,  // Changed from isRecurring to recurring
    recurrenceType:'',
    ...initial
  });
  const [saving, setSaving] = useState(false);

  const s = k => e => setF(p=>({...p,[k]: e.target.type==='checkbox'?e.target.checked:e.target.value}));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({...f, amount:parseFloat(f.amount)});
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save income');
    } finally {
      setSaving(false);
    }
  };

  return (
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input
              className="input-field"
              placeholder="e.g. Monthly Salary"
              value={f.title}
              onChange={s('title')}
              required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="label">Date *</label>
            <input
                type="date"
                className="input-field"
                value={f.date}
                onChange={s('date')}
                required
            />
          </div>
        </div>

        <div>
          <label className="label">Source</label>
          <select className="input-field" value={f.source} onChange={s('source')}>
            {SOURCES.map(s=><option key={s} value={s}>{ICONS[s]} {s}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
              className="input-field resize-none"
              rows={2}
              value={f.description}
              onChange={s('description')}
              placeholder="Optional…"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
              type="checkbox"
              id="rec"
              checked={f.recurring}  // Changed from f.isRecurring
              onChange={s('recurring')}  // Changed from s('isRecurring')
              className="w-4 h-4 accent-primary-600"
          />
          <label htmlFor="rec" className="text-sm text-gray-700">Recurring</label>
          {f.recurring && (  // Changed from f.isRecurring
              <select
                  className="input-field py-1.5"
                  value={f.recurrenceType}
                  onChange={s('recurrenceType')}
              >
                <option value="">Select Frequency</option>
                {REC.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
              type="submit"
              className="btn-primary flex-1"
              disabled={saving}
          >
            {saving ? 'Saving…' : initial?.id ? 'Update' : 'Add Income'}
          </button>
        </div>
      </form>
  );
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [edit,    setEdit]    = useState(null);
  const [delId,   setDelId]   = useState(null);
  const [filters, setFilters] = useState({ startDate:'', endDate:'' });
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate)   params.endDate   = filters.endDate;
      const response = await incomeAPI.getAll(params);
      setIncomes(response.data.data || []);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load incomes');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (payload) => {
    try {
      if (edit?.id) {
        await incomeAPI.update(edit.id, payload);
        toast.success('Income updated successfully');
      } else {
        await incomeAPI.create(payload);
        toast.success('Income added successfully');
      }
      await load();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save income');
      throw error;
    }
  };

  const deleteIncome = async () => {
    try {
      await incomeAPI.delete(delId);
      toast.success('Income deleted successfully');
      setDelId(null);
      await load();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete income');
    }
  };

  const filtered = incomes.filter(i =>
      i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.source?.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, i) => s + parseFloat(i.amount || 0), 0);

  const breakdown = SOURCES
      .map(src => ({
        src,
        icon: ICONS[src] || '💰',
        amount: filtered.filter(i => i.source === src).reduce((s, i) => s + parseFloat(i.amount || 0), 0),
        count: filtered.filter(i => i.source === src).length
      }))
      .filter(b => b.count > 0);

  return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Income 💰</h1>
            <p className="text-gray-500 mt-1">
              {filtered.length} entries · Total: <span className="font-semibold text-green-500">{fmt(total)}</span>
            </p>
          </div>
          <button
              onClick={() => {
                setEdit(null);
                setModal(true);
              }}
              className="btn-primary"
          >
            + Add Income
          </button>
        </div>

        {/* Breakdown Cards */}
        {breakdown.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {breakdown.map(b => (
                  <div key={b.src} className="card-hover text-center p-4">
                    <div className="text-3xl mb-2">{b.icon}</div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{b.src}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{fmt(b.amount)}</p>
                    <p className="text-xs text-gray-400">{b.count} {b.count === 1 ? 'entry' : 'entries'}</p>
                  </div>
              ))}
            </div>
        )}

        {/* Filters Section */}
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Search</label>
              <input
                  className="input-field"
                  placeholder="Search by title or source…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="label">From</label>
              <input
                  type="date"
                  className="input-field"
                  value={filters.startDate}
                  onChange={e => setFilters(f => ({...f, startDate: e.target.value}))}
              />
            </div>
            <div>
              <label className="label">To</label>
              <input
                  type="date"
                  className="input-field"
                  value={filters.endDate}
                  onChange={e => setFilters(f => ({...f, endDate: e.target.value}))}
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"/>
              </div>
          ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <span className="text-4xl mb-3">💰</span>
                <p className="font-medium">No income entries found</p>
                <p className="text-sm mt-1">Start by adding your first income</p>
              </div>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header text-left">Title</th>
                    <th className="table-header text-left hidden sm:table-cell">Source</th>
                    <th className="table-header text-left hidden md:table-cell">Date</th>
                    <th className="table-header text-right">Amount</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filtered.map(i => (
                      <tr key={i.id} className="table-row hover:bg-gray-50 transition-colors">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg gradient-income flex items-center justify-center text-sm">
                              {ICONS[i.source] || '💰'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{i.title}</p>
                              {i.recurring && (  // Changed from i.isRecurring
                                  <span className="badge-blue badge text-xs">
                              🔄 {i.recurrenceType?.toLowerCase() || 'recurring'}
                            </span>
                              )}
                              {i.description && (
                                  <p className="text-xs text-gray-400 mt-0.5">{i.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell hidden sm:table-cell">
                          <span className="badge-green badge">{i.source}</span>
                        </td>
                        <td className="table-cell hidden md:table-cell text-gray-500">
                          {new Date(i.date).toLocaleDateString()}
                        </td>
                        <td className="table-cell text-right font-semibold text-green-500">
                          +{fmt(i.amount)}
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                                onClick={() => {
                                  setEdit(i);
                                  setModal(true);
                                }}
                                className="btn-icon text-blue-500 hover:bg-blue-50"
                                title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                                onClick={() => setDelId(i.id)}
                                className="btn-icon text-red-500 hover:bg-red-50"
                                title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
            isOpen={modal}
            onClose={() => setModal(false)}
            title={edit ? 'Edit Income' : 'Add Income'}
        >
          <Form
              initial={edit}
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
            <p className="text-gray-700 mb-2 font-medium">Are you sure you want to delete this income?</p>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                  onClick={() => setDelId(null)}
                  className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                  onClick={deleteIncome}
                  className="btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
  );
}