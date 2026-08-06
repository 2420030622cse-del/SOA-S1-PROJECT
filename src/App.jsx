import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Search, Plus, Upload, Eye, TrendingUp, Trash2, X, ArrowUpDown,
  Users, Building2, RotateCcw, FileSpreadsheet, AlertTriangle, CheckCircle2,
  ArrowUp, ArrowDown, Minus, LayoutGrid, Table2, ClipboardList
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const POSITIVE_EVENTS = [
  { key: 'completed_task', label: 'Completed Task', base: 5 },
  { key: 'high_priority_task', label: 'High Priority Task Completed', base: 8 },
  { key: 'client_appreciation', label: 'Client Appreciation', base: 10 },
  { key: 'fixed_critical_bug', label: 'Fixed Critical Bug', base: 10 },
  { key: 'certification_completed', label: 'Certification Completed', base: 8 },
  { key: 'innovation', label: 'Innovation', base: 12 },
];

const NEGATIVE_EVENTS = [
  { key: 'missed_deadline', label: 'Missed Deadline', base: 5 },
  { key: 'task_reopened', label: 'Task Reopened', base: 4 },
  { key: 'client_complaint', label: 'Client Complaint', base: 10 },
  { key: 'critical_bug_introduced', label: 'Critical Bug Introduced', base: 12 },
  { key: 'security_violation', label: 'Security Violation', base: 15 },
];

const LEVELS = [
  { min: 95, label: 'Outstanding', color: '#0F766E' },
  { min: 85, label: 'Excellent', color: '#16A34A' },
  { min: 75, label: 'Very Good', color: '#65A30D' },
  { min: 65, label: 'Good', color: '#CA8A04' },
  { min: 50, label: 'Needs Improvement', color: '#EA580C' },
  { min: 0, label: 'Performance Review Required', color: '#DC2626' },
];

const INITIAL_SCORE = 70;
const STORAGE_KEY = 'employee_records';

const SEED_DATA = [
  mkSeed('EMP001', 'Rahul Sharma', 'Development', 'Software Engineer', 2, [
    ev('positive', 'Completed Task', 5, 70, 71.5),
    ev('positive', 'Client Appreciation', 10, 71.5, 74.35),
  ]),
  mkSeed('EMP002', 'Priya Nair', 'Testing', 'QA Engineer', 1, [
    ev('negative', 'Missed Deadline', 5, 70, 66.5),
  ]),
  mkSeed('EMP003', 'Arjun Patel', 'Development', 'Backend Developer', 4, [
    ev('positive', 'Fixed Critical Bug', 10, 70, 73),
    ev('positive', 'Innovation', 12, 73, 76.24),
    ev('positive', 'Certification Completed', 8, 76.24, 78.14),
  ]),
  mkSeed('EMP004', 'Sneha Reddy', 'Support', 'Support Engineer', 3, [
    ev('negative', 'Client Complaint', 10, 70, 65),
    ev('negative', 'Task Reopened', 4, 65, 61.4),
  ]),
  mkSeed('EMP005', 'Vikram Singh', 'Development', 'Senior Software Engineer', 6, [
    ev('positive', 'High Priority Task Completed', 8, 70, 72.4),
    ev('positive', 'Innovation', 12, 72.4, 75.71),
    ev('positive', 'Client Appreciation', 10, 75.71, 78.14),
    ev('positive', 'Fixed Critical Bug', 10, 78.14, 80.33),
  ]),
];

function ev(type, event, base, prevScore, newScore) {
  return { type, event, base, prevScore, newScore, delta: +(newScore - prevScore).toFixed(2), date: new Date(Date.now() - Math.random() * 1e10).toISOString() };
}
function mkSeed(employeeId, name, department, designation, experience, history) {
  const score = history.length ? history[history.length - 1].newScore : INITIAL_SCORE;
  return { employeeId, name, department, designation, experience, score, history };
}

/* ------------------------------------------------------------------ */
/*  Scoring engine                                                     */
/* ------------------------------------------------------------------ */

function clamp(n) { return Math.min(100, Math.max(0, n)); }
function calcIncrease(base, current) { return base * (100 - current) / 100; }
function calcDecrease(base, current) { return base * (0.5 + current / 100); }
function getLevel(score) { return LEVELS.find(l => score >= l.min) || LEVELS[LEVELS.length - 1]; }
function applyEvent(currentScore, type, base) {
  const raw = type === 'positive'
    ? currentScore + calcIncrease(base, currentScore)
    : currentScore - calcDecrease(base, currentScore);
  return +clamp(raw).toFixed(2);
}

/* ------------------------------------------------------------------ */
/*  Small presentational pieces                                        */
/* ------------------------------------------------------------------ */

function GaugeRing({ score, size = 60, stroke = 6 }) {
  const level = getLevel(score);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamp(score) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={level.color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono font-semibold text-slate-800" style={{ fontSize: size * 0.24 }}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}

function LevelBadge({ level, size = 'sm' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${pad}`}
      style={{ backgroundColor: level.color + '1A', color: level.color }}
    >
      {level.label}
    </span>
  );
}

function DeltaTag({ delta }) {
  if (delta === 0) return <span className="inline-flex items-center gap-0.5 text-slate-400 text-xs font-mono"><Minus size={12} />0.0</span>;
  const positive = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-mono font-semibold ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
      {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(delta).toFixed(2)}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.variant === 'error';
  return (
    <div className="fixed bottom-5 right-5 z-[100] animate-[fadeIn_0.2s_ease]">
      <div className={`flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg border text-sm font-medium ${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-800'}`}>
        {isError ? <AlertTriangle size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
        {toast.message}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, width = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full ${width} bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors rounded-full p-1 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main app                                                           */
/* ------------------------------------------------------------------ */

export default function EmployeePerformanceTracker() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [sortDir, setSortDir] = useState('none');
  const [toast, setToast] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [scoreEmployee, setScoreEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toastTimer = useRef(null);

  const notify = useCallback((message, variant = 'success') => {
    setToast({ message, variant });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---- load / persist (browser localStorage — works on GitHub Pages, no backend required) ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setEmployees(JSON.parse(raw));
      } else {
        setEmployees(SEED_DATA);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      }
    } catch (e) {
      setEmployees(SEED_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((next, message, variant = 'success') => {
    setEmployees(next);
    if (message) notify(message, variant);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      notify('Saved locally, but browser storage quota may be exceeded.', 'error');
    }
  }, [notify]);

  /* ---- derived data ---- */
  const departments = useMemo(() => ['All', ...Array.from(new Set(employees.map(e => e.department))).sort()], [employees]);

  const filtered = useMemo(() => {
    let list = employees.filter(e => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || e.employeeId.toLowerCase().includes(q) || e.name.toLowerCase().includes(q);
      const matchesDept = deptFilter === 'All' || e.department === deptFilter;
      return matchesSearch && matchesDept;
    });
    if (sortDir === 'asc') list = [...list].sort((a, b) => a.score - b.score);
    if (sortDir === 'desc') list = [...list].sort((a, b) => b.score - a.score);
    return list;
  }, [employees, search, deptFilter, sortDir]);

  const stats = useMemo(() => {
    const total = employees.length;
    const avg = total ? employees.reduce((s, e) => s + e.score, 0) / total : 0;
    const deptCount = new Set(employees.map(e => e.department)).size;
    const atRisk = employees.filter(e => e.score < 50).length;
    return { total, avg, deptCount, atRisk };
  }, [employees]);

  /* ---- actions ---- */
  const addEmployee = (form) => {
    if (employees.some(e => e.employeeId.toLowerCase() === form.employeeId.toLowerCase())) {
      notify(`Employee ID ${form.employeeId} already exists.`, 'error');
      return false;
    }
    const newEmp = {
      employeeId: form.employeeId.trim(),
      name: form.name.trim(),
      department: form.department.trim(),
      designation: form.designation.trim(),
      experience: Number(form.experience),
      score: INITIAL_SCORE,
      history: [],
    };
    persist([newEmp, ...employees], `${newEmp.name} added with a starting score of ${INITIAL_SCORE}.`);
    setShowAdd(false);
    return true;
  };

  const importEmployees = (rows) => {
    const existingIds = new Set(employees.map(e => e.employeeId.toLowerCase()));
    const toAdd = [];
    rows.forEach(r => {
      if (r.status !== 'ok') return;
      existingIds.add(r.employeeId.toLowerCase());
      toAdd.push({
        employeeId: r.employeeId, name: r.name, department: r.department,
        designation: r.designation, experience: Number(r.experience),
        score: INITIAL_SCORE, history: [],
      });
    });
    if (toAdd.length === 0) {
      notify('No valid rows to import.', 'error');
      return;
    }
    persist([...toAdd, ...employees], `Imported ${toAdd.length} employee${toAdd.length === 1 ? '' : 's'}.`);
    setShowImport(false);
    setView('table');
  };

  const updateScore = (employeeId, type, eventDef) => {
    const next = employees.map(e => {
      if (e.employeeId !== employeeId) return e;
      const newScore = applyEvent(e.score, type, eventDef.base);
      const entry = {
        type, event: eventDef.label, base: eventDef.base,
        prevScore: e.score, newScore, delta: +(newScore - e.score).toFixed(2),
        date: new Date().toISOString(),
      };
      return { ...e, score: newScore, history: [entry, ...e.history] };
    });
    const emp = next.find(e => e.employeeId === employeeId);
    persist(next, `${emp.name}'s score updated to ${emp.score.toFixed(1)} (${getLevel(emp.score).label}).`);
    setScoreEmployee(null);
  };

  const deleteEmployee = (employeeId) => {
    const emp = employees.find(e => e.employeeId === employeeId);
    persist(employees.filter(e => e.employeeId !== employeeId), `${emp.name} removed.`);
    setDeleteTarget(null);
  };

  const resetData = () => {
    persist(SEED_DATA, 'Sample data restored.');
    setShowResetConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-[#F7F7F5]">
        <div className="text-slate-400 text-sm">Loading employee records…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: translateY(0);} }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.05rem' }}>
                Performance Tracker
              </h1>
              <p className="text-xs text-slate-400">Employee scoring &amp; records</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Upload size={15} /> Import
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <Plus size={15} /> Add Employee
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={<Users size={16} />} label="Total Employees" value={stats.total} />
          <StatCard icon={<TrendingUp size={16} />} label="Average Score" value={stats.avg.toFixed(1)} accent={getLevel(stats.avg).color} />
          <StatCard icon={<Building2 size={16} />} label="Departments" value={stats.deptCount} />
          <StatCard icon={<AlertTriangle size={16} />} label="Needs Review" value={stats.atRisk} accent={stats.atRisk > 0 ? '#DC2626' : undefined} />
        </div>

        {/* View toggle + reset */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <ViewTab active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutGrid size={14} />} label="Dashboard" />
            <ViewTab active={view === 'table'} onClick={() => setView('table')} icon={<Table2 size={14} />} label="Table" />
          </div>
          <button onClick={() => setShowResetConfirm(true)} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <RotateCcw size={13} /> Reset sample data
          </button>
        </div>

        {/* Search / filter / sort */}
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID or name…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
            />
          </div>
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
          <button
            onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : sortDir === 'asc' ? 'none' : 'desc')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowUpDown size={14} />
            {sortDir === 'desc' ? 'Score: High → Low' : sortDir === 'asc' ? 'Score: Low → High' : 'Sort by Score'}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl bg-white">
            No employees match your search.
          </div>
        ) : view === 'dashboard' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(emp => (
              <EmployeeCard key={emp.employeeId} emp={emp} onView={() => setViewEmployee(emp)} onScore={() => setScoreEmployee(emp)} />
            ))}
          </div>
        ) : (
          <EmployeeTable
            rows={filtered}
            onView={setViewEmployee}
            onScore={setScoreEmployee}
            onDelete={setDeleteTarget}
          />
        )}
      </main>

      {/* Modals */}
      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} onSubmit={addEmployee} />}
      {showImport && <BulkImportModal onClose={() => setShowImport(false)} onConfirm={importEmployees} existingIds={employees.map(e => e.employeeId)} />}
      {viewEmployee && <ViewEmployeeModal emp={viewEmployee} onClose={() => setViewEmployee(null)} />}
      {scoreEmployee && <UpdateScoreModal emp={scoreEmployee} onClose={() => setScoreEmployee(null)} onApply={updateScore} />}
      {deleteTarget && (
        <ConfirmModal
          title="Delete employee?"
          message={`This will permanently remove ${deleteTarget.name} (${deleteTarget.employeeId}) and their event history.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteEmployee(deleteTarget.employeeId)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {showResetConfirm && (
        <ConfirmModal
          title="Reset to sample data?"
          message="This replaces all current employee records with the original demo dataset."
          confirmLabel="Reset"
          danger
          onConfirm={resetData}
          onClose={() => setShowResetConfirm(false)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-2">{icon}{label}</div>
      <div className="font-mono text-2xl font-semibold" style={{ color: accent || '#0F172A' }}>{value}</div>
    </div>
  );
}

function ViewTab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
    >
      {icon} {label}
    </button>
  );
}

function EmployeeCard({ emp, onView, onScore }) {
  const level = getLevel(emp.score);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{emp.name}</p>
          <p className="font-mono text-xs text-slate-400">{emp.employeeId}</p>
        </div>
        <GaugeRing score={emp.score} />
      </div>
      <div className="mt-3 space-y-1 text-sm text-slate-600">
        <p className="truncate">{emp.designation}</p>
        <p className="text-slate-400 truncate">{emp.department} · {emp.experience} yr{emp.experience === 1 ? '' : 's'}</p>
      </div>
      <div className="mt-3"><LevelBadge level={level} /></div>
      <div className="mt-4 flex gap-2">
        <button onClick={onView} className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Eye size={13} /> View
        </button>
        <button onClick={onScore} className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800">
          <TrendingUp size={13} /> Update Score
        </button>
      </div>
    </div>
  );
}

function EmployeeTable({ rows, onView, onScore, onDelete }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
      <table className="w-full text-sm min-w-[820px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
            <th className="px-4 py-3 font-medium">Employee ID</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Designation</th>
            <th className="px-4 py-3 font-medium">Experience</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Level</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(emp => {
            const level = getLevel(emp.score);
            return (
              <tr key={emp.employeeId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{emp.employeeId}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{emp.name}</td>
                <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                <td className="px-4 py-3 text-slate-600">{emp.designation}</td>
                <td className="px-4 py-3 text-slate-600">{emp.experience} yr{emp.experience === 1 ? '' : 's'}</td>
                <td className="px-4 py-3 font-mono font-semibold" style={{ color: level.color }}>{emp.score.toFixed(1)}</td>
                <td className="px-4 py-3"><LevelBadge level={level} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn onClick={() => onView(emp)} title="View"><Eye size={14} /></IconBtn>
                    <IconBtn onClick={() => onScore(emp)} title="Update Score"><TrendingUp size={14} /></IconBtn>
                    <IconBtn onClick={() => onDelete(emp)} title="Delete" danger><Trash2 size={14} /></IconBtn>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${danger ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs font-medium text-slate-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300";

function AddEmployeeModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ employeeId: '', name: '', department: '', designation: '', experience: '' });
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.name || !form.department || !form.designation || form.experience === '') {
      setError('All fields are required.');
      return;
    }
    if (Number(form.experience) < 0) {
      setError('Experience cannot be negative.');
      return;
    }
    setError('');
    onSubmit(form);
  };

  return (
    <Modal title="Add Employee" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Employee ID">
          <input className={inputCls} placeholder="EMP006" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} />
        </Field>
        <Field label="Name">
          <input className={inputCls} placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Department">
          <input className={inputCls} placeholder="e.g. Development" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
        </Field>
        <Field label="Designation">
          <input className={inputCls} placeholder="e.g. Software Engineer" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
        </Field>
        <Field label="Experience (years)">
          <input type="number" min="0" step="0.5" className={inputCls} placeholder="2" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
        </Field>
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        <p className="text-xs text-slate-400 mb-4">New employees start with a performance score of {INITIAL_SCORE}.</p>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800">Add Employee</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---- Bulk import ---- */

function normalizeHeader(h) {
  return String(h).toLowerCase().replace(/[^a-z]/g, '');
}
const HEADER_MAP = {
  employeeid: 'employeeId', id: 'employeeId',
  name: 'name', employeename: 'name',
  department: 'department', dept: 'department',
  designation: 'designation', role: 'designation',
  experience: 'experience', experienceyears: 'experience', exp: 'experience',
};

function rowsFrom2D(rows2D) {
  if (!rows2D.length) return [];
  const firstRow = rows2D[0].map(c => normalizeHeader(c));
  const hasHeader = firstRow.some(c => HEADER_MAP[c]);
  let colMap = ['employeeId', 'name', 'department', 'designation', 'experience'];
  let dataRows = rows2D;
  if (hasHeader) {
    colMap = firstRow.map(c => HEADER_MAP[c] || null);
    dataRows = rows2D.slice(1);
  }
  return dataRows
    .filter(r => r.some(cell => String(cell).trim() !== ''))
    .map(r => {
      const obj = {};
      colMap.forEach((key, i) => { if (key) obj[key] = r[i] !== undefined ? String(r[i]).trim() : ''; });
      return obj;
    });
}

function parseDelimited(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  const rows2D = lines.map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
  return rowsFrom2D(rows2D);
}

function validateRows(rawRows, existingIds) {
  const seen = new Set();
  return rawRows.map(r => {
    const employeeId = r.employeeId || '';
    const name = r.name || '';
    const department = r.department || '';
    const designation = r.designation || '';
    const experience = r.experience || '';
    let status = 'ok', reason = '';

    if (!employeeId || !name || !department || !designation || experience === '') {
      status = 'invalid'; reason = 'Missing required field';
    } else if (isNaN(Number(experience)) || Number(experience) < 0) {
      status = 'invalid'; reason = 'Invalid experience value';
    } else if (existingIds.has(employeeId.toLowerCase()) || seen.has(employeeId.toLowerCase())) {
      status = 'duplicate'; reason = 'Employee ID already exists';
    }
    seen.add(employeeId.toLowerCase());
    return { employeeId, name, department, designation, experience, status, reason };
  });
}

function BulkImportModal({ onClose, onConfirm, existingIds }) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const existingSet = useMemo(() => new Set(existingIds.map(i => i.toLowerCase())), [existingIds]);

  const handleFile = async (file) => {
    setParseError('');
    setFileName(file.name);
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'csv' || ext === 'txt') {
        const text = await file.text();
        setRows(validateRows(parseDelimited(text), existingSet));
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows2D = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        setRows(validateRows(rowsFrom2D(rows2D), existingSet));
      } else {
        setParseError('Unsupported file type. Please upload .csv, .txt, or .xlsx.');
        setRows([]);
      }
    } catch (e) {
      setParseError('Could not read this file. Please check the format.');
      setRows([]);
    }
  };

  const okCount = rows.filter(r => r.status === 'ok').length;
  const skipCount = rows.length - okCount;

  return (
    <Modal title="Bulk Import Employees" onClose={onClose} width="max-w-2xl">
      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-300 transition-colors"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      >
        <FileSpreadsheet size={28} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500 mb-1">Drag &amp; drop a .xlsx, .csv, or .txt file, or</p>
        <label className="inline-block cursor-pointer text-sm font-medium text-slate-900 underline underline-offset-2">
          browse files
          <input type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
        </label>
        <p className="text-xs text-slate-400 mt-2">Columns: EmployeeID, Name, Department, Designation, Experience</p>
      </div>

      {fileName && <p className="text-xs text-slate-400 mt-3">File: <span className="font-mono">{fileName}</span></p>}
      {parseError && <p className="text-xs text-red-600 mt-2">{parseError}</p>}

      {rows.length > 0 && (
        <>
          <div className="mt-4 flex gap-3 text-xs">
            <span className="text-emerald-600 font-medium">{okCount} ready to import</span>
            {skipCount > 0 && <span className="text-red-500 font-medium">{skipCount} skipped</span>}
          </div>
          <div className="mt-2 border border-slate-100 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">ID</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Department</th>
                  <th className="px-3 py-2 text-left font-medium">Designation</th>
                  <th className="px-3 py-2 text-left font-medium">Exp.</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-t border-slate-50 ${r.status !== 'ok' ? 'bg-red-50/40' : ''}`}>
                    <td className="px-3 py-1.5 font-mono">{r.employeeId || '—'}</td>
                    <td className="px-3 py-1.5">{r.name || '—'}</td>
                    <td className="px-3 py-1.5">{r.department || '—'}</td>
                    <td className="px-3 py-1.5">{r.designation || '—'}</td>
                    <td className="px-3 py-1.5">{r.experience || '—'}</td>
                    <td className="px-3 py-1.5">
                      {r.status === 'ok'
                        ? <span className="text-emerald-600 font-medium">Ready</span>
                        : <span className="text-red-500 font-medium" title={r.reason}>{r.reason}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex gap-2 justify-end mt-5">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
        <button
          disabled={okCount === 0}
          onClick={() => onConfirm(rows)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Import {okCount > 0 ? okCount : ''} Employee{okCount === 1 ? '' : 's'}
        </button>
      </div>
    </Modal>
  );
}

/* ---- View / detail ---- */

function ViewEmployeeModal({ emp, onClose }) {
  const level = getLevel(emp.score);
  return (
    <Modal title="Employee Profile" onClose={onClose}>
      <div className="flex items-center gap-4 mb-5">
        <GaugeRing score={emp.score} size={72} stroke={7} />
        <div>
          <p className="font-semibold text-slate-900 text-lg">{emp.name}</p>
          <p className="font-mono text-xs text-slate-400 mb-1">{emp.employeeId}</p>
          <LevelBadge level={level} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-5">
        <InfoRow label="Department" value={emp.department} />
        <InfoRow label="Designation" value={emp.designation} />
        <InfoRow label="Experience" value={`${emp.experience} yr${emp.experience === 1 ? '' : 's'}`} />
        <InfoRow label="Current Score" value={emp.score.toFixed(1)} />
      </div>
      <p className="text-xs font-medium text-slate-500 mb-2">Event History</p>
      {emp.history.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No events recorded yet.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {emp.history.map((h, i) => (
            <div key={i} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm text-slate-700">{h.event}</p>
                <p className="text-xs text-slate-400">{new Date(h.date).toLocaleDateString()} · {h.prevScore.toFixed(1)} → {h.newScore.toFixed(1)}</p>
              </div>
              <DeltaTag delta={h.delta} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-slate-800 font-medium">{value}</p>
    </div>
  );
}

/* ---- Update score ---- */

function UpdateScoreModal({ emp, onClose, onApply }) {
  const [type, setType] = useState('positive');
  const [eventKey, setEventKey] = useState(null);

  const events = type === 'positive' ? POSITIVE_EVENTS : NEGATIVE_EVENTS;
  const selected = events.find(e => e.key === eventKey);
  const preview = selected ? applyEvent(emp.score, type, selected.base) : null;
  const previewLevel = preview !== null ? getLevel(preview) : null;

  return (
    <Modal title={`Update Score — ${emp.name}`} onClose={onClose}>
      <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
        <GaugeRing score={emp.score} size={48} stroke={5} />
        <div>
          <p className="text-sm font-medium text-slate-700">Current score</p>
          <p className="font-mono text-lg font-semibold text-slate-900">{emp.score.toFixed(1)}</p>
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 mb-4">
        <button
          onClick={() => { setType('positive'); setEventKey(null); }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type === 'positive' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
        >
          Positive Event
        </button>
        <button
          onClick={() => { setType('negative'); setEventKey(null); }}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${type === 'negative' ? 'bg-red-600 text-white' : 'text-slate-500'}`}
        >
          Negative Event
        </button>
      </div>

      <div className="space-y-1.5 mb-4">
        {events.map(ev => (
          <button
            key={ev.key}
            onClick={() => setEventKey(ev.key)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm text-left transition-colors ${eventKey === ev.key ? (type === 'positive' ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50') : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <span className="text-slate-700">{ev.label}</span>
            <span className="font-mono text-xs text-slate-400">base {ev.base}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-lg border border-slate-200 p-3 mb-4 text-sm">
          <p className="text-xs text-slate-400 font-mono mb-1">
            {type === 'positive'
              ? `${selected.base} × (100 − ${emp.score.toFixed(1)}) / 100`
              : `${selected.base} × (0.5 + ${emp.score.toFixed(1)} / 100)`}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-slate-600">New score</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold" style={{ color: previewLevel.color }}>{preview.toFixed(1)}</span>
              <DeltaTag delta={+(preview - emp.score).toFixed(2)} />
            </div>
          </div>
          <div className="mt-1.5"><LevelBadge level={previewLevel} /></div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
        <button
          disabled={!selected}
          onClick={() => onApply(emp.employeeId, type, selected)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Apply &amp; Save
        </button>
      </div>
    </Modal>
  );
}

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose} width="max-w-sm">
      <p className="text-sm text-slate-600 mb-5">{message}</p>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
