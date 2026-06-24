import React, { useState, useEffect, useCallback } from 'react';
import { expenseAPI, categoryAPI, aiAPI } from '../api';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n||0);
const PAY = ['Cash','Credit Card','Debit Card','UPI','Bank Transfer','Other'];
const REC = ['DAILY','WEEKLY','MONTHLY','YEARLY'];

function Form({ initial, categories, onSave, onClose }) {
  const [f, setF] = useState({
    title:'',
    description:'',
    amount:'',
    date: new Date().toISOString().split('T')[0],
    categoryId:'',
    paymentMethod:'Cash',
    notes:'',
    recurring:false,  // Changed from isRecurring to recurring
    recurrenceType:'',
    ...initial
  });
  const [saving, setSaving]   = useState(false);
  const [aiLoad, setAiLoad]   = useState(false);

  const aiCat = async () => {
    if (!f.title) return;
    setAiLoad(true);
    try {
      const r = await aiAPI.categorize({ title:f.title, description:f.description });
      const name = r.data.data;
      const match = categories.find(c=>c.name.toLowerCase()===name.toLowerCase());
      if (match) {
        setF(p=>({...p,categoryId:match.id.toString()}));
        toast.success(`AI: ${match.name}`);
      } else {
        toast(`AI suggests: ${name}`,{icon:'🤖'});
      }
    } catch (error) {
      console.error('AI categorization error:', error);
      toast.error('Failed to categorize with AI');
    } finally {
      setAiLoad(false);
    }
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...f,
        amount:parseFloat(f.amount),
        categoryId:f.categoryId ? +f.categoryId : null
      });
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const s = k => e => setF(p=>({...p,[k]: e.target.type==='checkbox' ? e.target.checked : e.target.value}));

  return (
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <div className="flex gap-2">
            <input
                className="input-field"
                placeholder="e.g. Lunch, Netflix"
                value={f.title}
                onChange={s('title')}
                required
            />
            <button
                type="button"
                onClick={aiCat}
                disabled={aiLoad || !f.title}
                title="AI Categorize"
                className="px-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50 transition-all text-lg"
            >
              {aiLoad ? '⏳' : '🤖'}
            </button>
          </div>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select
                className="input-field"
                value={f.categoryId}
                onChange={s('categoryId')}
            >
              <option value="">Select…</option>
              {categories.filter(c=>c.type!=='INCOME').map(c=>(
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Payment</label>
            <select
                className="input-field"
                value={f.paymentMethod}
                onChange={s('paymentMethod')}
            >
              {PAY.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
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
            {saving ? 'Saving…' : initial?.id ? 'Update' : 'Add Expense'}
          </button>
        </div>
      </form>
  );
}

export default function ExpensesPage() {
  const [expenses,   setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [edit,       setEdit]       = useState(null);
  const [delId,      setDelId]      = useState(null);
  const [filters,    setFilters]    = useState({ startDate:'', endDate:'', categoryId:'' });
  const [search,     setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate)  params.startDate  = filters.startDate;
      if (filters.endDate)    params.endDate    = filters.endDate;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      const [er, cr] = await Promise.all([
        expenseAPI.getAll(params),
        categoryAPI.getAll()
      ]);
      setExpenses(er.data.data || []);
      setCategories(cr.data.data || []);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async payload => {
    try {
      if (edit?.id) {
        await expenseAPI.update(edit.id, payload);
        toast.success('Expense updated successfully');
      } else {
        await expenseAPI.create(payload);
        toast.success('Expense added successfully');
      }
      await load();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save expense');
      throw error;
    }
  };

  const deleteExpense = async () => {
    try {
      await expenseAPI.delete(delId);
      toast.success('Expense deleted successfully');
      setDelId(null);
      await load();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete expense');
    }
  };

  const filtered = expenses.filter(e =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      (e.category?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  // Calculate category breakdown
  const categoryBreakdown = categories
      .filter(c => c.type !== 'INCOME')
      .map(cat => ({
        ...cat,
        amount: filtered.filter(e => e.category?.id === cat.id)
            .reduce((s, e) => s + parseFloat(e.amount || 0), 0),
        count: filtered.filter(e => e.category?.id === cat.id).length
      }))
      .filter(b => b.count > 0)
      .sort((a, b) => b.amount - a.amount);

  const clearFilters = () => {
    setFilters({ startDate:'', endDate:'', categoryId:'' });
    setSearch('');
  };

  return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Expenses 💸</h1>
            <p className="text-gray-500 mt-1">
              {filtered.length} transactions · Total: <span className="font-semibold text-red-500">{fmt(total)}</span>
            </p>
          </div>
          <button
              onClick={() => {
                setEdit(null);
                setModal(true);
              }}
              className="btn-primary"
          >
            + Add Expense
          </button>
        </div>

        {/* Category Breakdown Cards */}
        {categoryBreakdown.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categoryBreakdown.map(cat => (
                  <div key={cat.id} className="card-hover text-center p-4">
                    <div className="text-3xl mb-2">{cat.icon || '💸'}</div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{cat.name}</p>
                    <p className="text-lg font-bold text-red-500 mt-1">{fmt(cat.amount)}</p>
                    <p className="text-xs text-gray-400">{cat.count} {cat.count === 1 ? 'transaction' : 'transactions'}</p>
                  </div>
              ))}
            </div>
        )}

        {/* Filters Section */}
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Search</label>
              <input
                  className="input-field"
                  placeholder="Search by title or category…"
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
            <div>
              <label className="label">Category</label>
              <select
                  className="input-field"
                  value={filters.categoryId}
                  onChange={e => setFilters(f => ({...f, categoryId: e.target.value}))}
              >
                <option value="">All Categories</option>
                {categories.filter(c => c.type !== 'INCOME').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:underline"
            >
              Clear all filters
            </button>
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
                <span className="text-4xl mb-3">💸</span>
                <p className="font-medium">No expenses found</p>
                <p className="text-sm mt-1">Add your first expense to get started</p>
              </div>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header text-left">Title</th>
                    <th className="table-header text-left hidden sm:table-cell">Category</th>
                    <th className="table-header text-left hidden md:table-cell">Date</th>
                    <th className="table-header text-left hidden lg:table-cell">Payment</th>
                    <th className="table-header text-right">Amount</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filtered.map(e => (
                      <tr key={e.id} className="table-row hover:bg-gray-50 transition-colors">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg gradient-expense flex items-center justify-center text-sm">
                              {e.category?.icon || '💸'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{e.title}</p>
                              {e.recurring && (  // Changed from e.isRecurring
                                  <span className="badge-blue badge text-xs">
                              🔄 {e.recurrenceType?.toLowerCase() || 'recurring'}
                            </span>
                              )}
                              {e.description && (
                                  <p className="text-xs text-gray-400 mt-0.5">{e.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="table-cell hidden sm:table-cell">
                      <span className="badge-yellow badge">
                        {e.category?.icon || ''} {e.category?.name || 'Uncategorized'}
                      </span>
                        </td>
                        <td className="table-cell hidden md:table-cell text-gray-500">
                          {new Date(e.date).toLocaleDateString()}
                        </td>
                        <td className="table-cell hidden lg:table-cell text-gray-500">
                          {e.paymentMethod || 'N/A'}
                        </td>
                        <td className="table-cell text-right font-semibold text-red-500">
                          -{fmt(e.amount)}
                        </td>
                        <td className="table-cell text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                                onClick={() => {
                                  setEdit({
                                    ...e,
                                    categoryId: e.category?.id,
                                    date: e.date
                                  });
                                  setModal(true);
                                }}
                                className="btn-icon text-blue-500 hover:bg-blue-50"
                                title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                                onClick={() => setDelId(e.id)}
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
            title={edit ? 'Edit Expense' : 'Add Expense'}
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
            <p className="text-gray-700 mb-2 font-medium">Delete this expense?</p>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                  onClick={() => setDelId(null)}
                  className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                  onClick={deleteExpense}
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