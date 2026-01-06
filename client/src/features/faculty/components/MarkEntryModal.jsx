import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Toast from '../../../shared/components/Toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  CheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const DEFAULT_META = Object.freeze({
  attendance: 'present',
  pat: false
});

const MarkEntryModal = ({ isOpen, onClose, review, team, onSuccess }) => {
  /* --- State --- */
  const [marks, setMarks] = useState({});
  const [meta, setMeta] = useState({});
  const [teamMeta, setTeamMeta] = useState({ pptApproved: false, teamComment: '' });

  // Workflow State
  const [workflowPhase, setWorkflowPhase] = useState('marking'); // 'marking' | 'student_transition' | 'team_dashboard'
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);
  const [activeRubricIndex, setActiveRubricIndex] = useState(0);

  // Interaction State
  const [isReadingPhase, setIsReadingPhase] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null); // ID of student being edited in dashboard

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /* --- Derived Data --- */
  const rubrics = review?.rubric_structure || [];
  // Enhanced MOCK Data for Demo Purposes
  const mockRubrics = rubrics.length > 0 ? rubrics : [
    {
      rubric_id: 'mock_concept',
      component_name: 'Concept Innovation',
      component_description: 'Evaluates the novelty, feasibility, and impact of the project idea on a comprehensive scale.',
      max_marks: 10,
      levels: Array.from({ length: 11 }, (_, i) => ({
        score: i,
        label: i === 0 ? 'None' : i === 10 ? 'Perfection' : i < 5 ? 'Emerging' : 'Proficient',
        description: `Level ${i} performance. ${i === 10 ? 'Absolutely flawless execution with unique insights.' : i > 5 ? 'Strong understanding and application.' : 'Basic attempt with gaps.'}`
      }))
    },
    {
      rubric_id: 'mock_presentation',
      component_name: 'Presentation',
      component_description: 'Assesses clarity, confidence, and visual aids used during the presentation.',
      max_marks: 5,
      levels: [
        { score: 1, label: 'Poor', description: 'Disorganized, unclear delivery. No visual aids.' },
        { score: 2, label: 'Fair', description: 'Somewhat clear but lacks confidence. Basic visuals.' },
        { score: 3, label: 'Good', description: 'Clear delivery with decent flow. Adequate visuals.' },
        { score: 4, label: 'Very Good', description: 'Engaging, confident delivery. Professional visuals.' },
        { score: 5, label: 'Excellent', description: 'Compelling, masterful presentation. High-impact visuals.' }
      ]
    },
    {
      rubric_id: 'mock_qa',
      component_name: 'Q&A',
      component_description: 'Ability to answer questions effectively.',
      max_marks: 3,
      levels: [
        { score: 1, label: 'Basic', description: 'Struggled to answer.' },
        { score: 2, label: 'Competent', description: 'Answered most questions.' },
        { score: 3, label: 'Advanced', description: 'Insightful answers.' }
      ]
    }
  ];

  /* --- Initialization --- */
  useEffect(() => {
    if (!isOpen || !team) return;
    const initMarks = {};
    const initMeta = {};
    team.students.forEach(s => {
      initMarks[s.student_id] = {};
      initMeta[s.student_id] = { ...DEFAULT_META };
    });
    setMarks(initMarks);
    setMeta(initMeta);
    setActiveStudentIndex(0);
    setActiveRubricIndex(0);
    setWorkflowPhase('marking');
    setIsReadingPhase(false);
    setEditingStudentId(null);
  }, [isOpen, team]);

  const activeStudent = team?.students[activeStudentIndex];
  const currentRubric = mockRubrics[activeRubricIndex];
  const currentScore = marks[activeStudent?.student_id]?.[currentRubric?.rubric_id];
  const currentMeta = meta[activeStudent?.student_id] || DEFAULT_META;

  // No delay logic needed anymore

  /* --- Handlers --- */
  const updateMeta = (sid, patch) => {
    setMeta(prev => ({ ...prev, [sid]: { ...prev[sid], ...patch } }));
    setHasChanges(true);
  };

  const selectScore = (score) => {
    if (isReadingPhase) return;

    setMarks(prev => ({
      ...prev,
      [activeStudent.student_id]: { ...prev[activeStudent.student_id], [currentRubric.rubric_id]: score }
    }));
    setHasChanges(true);

    // Auto Advance Logic
    if (activeRubricIndex < mockRubrics.length - 1) {
      // Next Rubric
      // Small visual delay for feedback, but functional 'instant' feel
      setTimeout(() => {
        setActiveRubricIndex(prev => prev + 1);
      }, 250);
    } else {
      // End of Student
      if (activeStudentIndex < team.students.length - 1) {
        handleStudentTransition();
      } else {
        setWorkflowPhase('team_dashboard');
      }
    }
  };

  const handleStudentTransition = () => {
    setWorkflowPhase('student_transition');
    // Auto-advance to next student after short success display
    setTimeout(() => {
      setActiveStudentIndex(prev => prev + 1);
      setActiveRubricIndex(0);
      setWorkflowPhase('marking');
    }, 1000); // 1s transition
  };

  const handleSave = async () => {
    if (teamMeta.teamComment.trim().length < 10) {
      setToast({ type: 'error', message: 'Team comments are required (min 10 chars).' });
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    onSuccess?.({ marks, meta, teamMeta });
    setSaving(false);
    setHasChanges(false);
    onClose();
  };

  const updateStudentMark = (sid, rid, val) => {
    setMarks(prev => ({
      ...prev,
      [sid]: { ...prev[sid], [rid]: val }
    }));
    setHasChanges(true);
  };

  /* --- Render Helpers --- */
  const getStudentTotal = (sid) => {
    return mockRubrics.reduce((sum, r) => {
      const s = marks[sid]?.[r.rubric_id];
      if (s === undefined) return sum;
      return sum + (s / Math.max(...r.levels.map(l => l.score))) * r.max_marks;
    }, 0).toFixed(1);
  };

  const hasStudentMarks = (sid) => {
    // Check if any marks exist for this student
    return mockRubrics.some(r => marks[sid]?.[r.rubric_id] !== undefined);
  };

  if (!isOpen || !team) return null;

  /* --- VIEWS --- */

  // 1. STUDENT TRANSITION OVERLAY (AUTO)
  if (workflowPhase === 'student_transition') {
    const nextStudent = team.students[activeStudentIndex + 1];
    return (
      <Modal isOpen={true} onClose={() => { }} size="full" hideHeader noPadding>
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-8 animate-fadeIn">
          <div className="text-center max-w-2xl">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-scaleIn">
              <CheckCircleIcon className="w-14 h-14" />
            </div>
            <h2 className="text-4xl font-bold text-slate-800 mb-2">Saved</h2>
            <p className="text-xl text-slate-500 mb-12">Moving to next student...</p>
            <div className="flex items-center justify-center gap-3 text-blue-600">
              <ArrowPathIcon className="w-6 h-6 animate-spin" />
              <span className="font-bold text-lg">Loading {nextStudent.student_name}</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // 2. TEAM DASHBOARD
  if (workflowPhase === 'team_dashboard') {
    const isValid = teamMeta.teamComment.trim().length >= 10;
    const grandHeader = mockRubrics.reduce((s, r) => s + r.max_marks, 0);

    return (
      <Modal isOpen={true} onClose={hasChanges ? () => setShowCloseConfirm(true) : onClose} size="full" hideHeader noPadding>
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden animate-fadeIn">

          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm shrink-0 z-10">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Grading Summary</h1>
              <p className="text-slate-500 text-sm">{team.team_name}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Back to Guided View - More Visible */}
              <Button
                onClick={() => { setActiveStudentIndex(0); setActiveRubricIndex(0); setWorkflowPhase('marking'); }}
                variant="secondary"
                className="shadow-sm border-slate-300"
              >
                Back to Guided View
              </Button>
              <div className="h-8 w-px bg-slate-200"></div>
              <Button variant="ghost" onClick={hasChanges ? () => setShowCloseConfirm(true) : onClose} className="text-slate-400 hover:text-red-500">
                Close
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">

            {/* Student Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-48 whitespace-nowrap">Student</th>
                    {mockRubrics.map(r => (
                      <th key={r.rubric_id} className="px-4 py-4 text-xs font-bold text-slate-500 uppercase text-center w-24 whitespace-normal">
                        {r.component_name} <br /> <span className="text-[10px] text-slate-400">({r.max_marks} pts)</span>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-xs font-bold text-slate-900 uppercase text-right w-24 whitespace-nowrap">Total</th>
                    <th className="px-6 py-4 text-right w-24 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.students.map((s, idx) => {
                    const m = meta[s.student_id];
                    const blocked = m.attendance === 'absent' || m.pat;
                    const isEditing = editingStudentId === s.student_id;

                    return (
                      <tr key={s.student_id} className={`transition-colors ${isEditing ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{s.student_name}</div>
                          <div className="text-xs text-slate-400">{s.roll_number}</div>
                          {blocked && <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded uppercase ${m.attendance === 'absent' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{m.attendance === 'absent' ? 'Absent' : 'PAT'}</span>}
                        </td>
                        {mockRubrics.map(r => (
                          <td key={r.rubric_id} className="px-4 py-4 text-center font-medium text-slate-600">
                            {isEditing && !blocked ? (
                              <input
                                type="number"
                                min={0}
                                max={r.max_marks}
                                value={(marks[s.student_id]?.[r.rubric_id] !== undefined) ? marks[s.student_id][r.rubric_id] : ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val >= 0 && val <= r.max_marks) {
                                    updateStudentMark(s.student_id, r.rubric_id, val);
                                  } else if (e.target.value === '') {
                                    // Allow clearing for UX, but maybe handle empty save
                                    updateStudentMark(s.student_id, r.rubric_id, '');
                                  }
                                }}
                                className="w-full text-center p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm font-bold"
                              />
                            ) : (
                              blocked ? '-' : marks[s.student_id]?.[r.rubric_id] || '-'
                            )}
                          </td>
                        ))}
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold text-slate-900">{blocked ? (m.attendance === 'absent' ? '0' : 'PAT') : getStudentTotal(s.student_id)}</span>
                          <span className="text-sm text-slate-400"> / {grandHeader}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingStudentId(null)} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200" title="Save">
                                <CheckIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            !blocked && (
                              <button
                                onClick={() => setEditingStudentId(s.student_id)}
                                className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                title="Quick Edit"
                              >
                                <PencilSquareIcon className="w-5 h-5" />
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Team Feedback Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Final Team Comments <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={teamMeta.teamComment}
                  onChange={e => { setTeamMeta(p => ({ ...p, teamComment: e.target.value })); setHasChanges(true); }}
                  className={`w-full h-40 p-5 rounded-2xl border-2 resize-none focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg
                              ${isValid ? 'border-slate-200 bg-white' : 'border-red-200 bg-red-50 focus:border-red-400'}`}
                  placeholder="Enter constructive feedback for the entire team..."
                />
              </div>

              <div className="space-y-4">
                <div
                  onClick={() => { setTeamMeta(p => ({ ...p, pptApproved: !p.pptApproved })); setHasChanges(true); }}
                  className={`cursor-pointer p-6 rounded-2xl border-2 transition-all group ${teamMeta.pptApproved ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 hover:border-blue-400'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">Presentation Approved</h4>
                    {teamMeta.pptApproved ? <CheckCircleIcon className="w-6 h-6" /> : <div className="w-6 h-6 rounded border-2 border-slate-300" />}
                  </div>
                  <p className={`text-sm ${teamMeta.pptApproved ? 'text-blue-100' : 'text-slate-500'}`}>Confirm that the presentation slides meet the required standard.</p>
                </div>

                <div>
                  <button
                    onClick={handleSave}
                    disabled={!isValid || saving}
                    className={`w-full py-5 rounded-2xl font-bold text-xl shadow-xl transition-all
                                ${isValid && !saving
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:translate-y-[-2px] hover:shadow-blue-200'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    {saving ? 'Saving...' : 'Submit Grades'}
                  </button>
                  {!isValid && (
                    <p className="text-center text-xs text-red-500 mt-2 font-medium">
                      {10 - teamMeta.teamComment.trim().length} more characters required for comments.
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </Modal>
    );
  }

  // 3. MARKING INTERFACE
  const isHighDensity = currentRubric.levels.length > 6;
  const currentLevelDetails = currentRubric.levels.find(l => l.score === currentScore) || {};

  return (
    <>
      <Modal isOpen={true} onClose={hasChanges ? () => setShowCloseConfirm(true) : onClose} size="full" hideHeader noPadding>
        <div className="flex h-screen bg-white font-sans text-slate-800 overflow-hidden relative">

          {/* LEFT SIDEBAR */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 hidden md:flex flex-col z-10 shrink-0">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 truncate text-lg">{team.team_name}</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Project Assessment</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {team.students.map((s, idx) => {
                const m = meta[s.student_id];
                const isAbsent = m?.attendance === 'absent';
                const isPat = m?.pat;
                const isMarked = !isAbsent && !isPat && hasStudentMarks(s.student_id);

                return (
                  <div
                    key={s.student_id}
                    onClick={() => {
                      if (workflowPhase === 'marking') {
                        setActiveStudentIndex(idx);
                        setActiveRubricIndex(0);
                      }
                    }}
                    className={`p-4 rounded-xl text-sm font-medium flex justify-between items-center cursor-pointer transition-all border
                        ${idx === activeStudentIndex
                        ? 'bg-white text-blue-700 shadow-sm border-blue-200 ring-1 ring-blue-100'
                        : idx < activeStudentIndex || isMarked || isAbsent || isPat
                          ? 'text-slate-600 border-transparent hover:bg-white hover:shadow-sm'
                          : 'text-slate-400 border-transparent hover:bg-white hover:shadow-sm'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === activeStudentIndex ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                        {s.student_name.charAt(0)}
                      </div>
                      <span>{s.student_name}</span>
                    </div>
                    {isAbsent && <XCircleIcon className="w-5 h-5 text-red-500" title="Absent" />}
                    {isPat && <ClockIcon className="w-5 h-5 text-blue-500" title="PAT" />}
                    {isMarked && <CheckCircleIcon className="w-5 h-5 text-green-500" title="Marked" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col relative w-full h-full bg-white">

            {/* Top Bar */}
            <div className="h-20 border-b border-slate-100 px-8 flex items-center justify-between shrink-0 z-20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Student {activeStudentIndex + 1} of {team.students.length}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{activeStudent.student_name}</h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <button
                    onClick={() => updateMeta(activeStudent.student_id, { attendance: currentMeta.attendance === 'absent' ? 'present' : 'absent', pat: false })}
                    className={`
                              px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wide transition-all
                              ${currentMeta.attendance === 'absent'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-gray-200'}
                           `}
                  >
                    {currentMeta.attendance === 'absent' ? 'Absent' : 'Mark Absent'}
                  </button>

                  <button
                    onClick={() => updateMeta(activeStudent.student_id, { pat: !currentMeta.pat, attendance: 'present' })}
                    className={`
                              px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wide transition-all
                              ${currentMeta.pat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-gray-200'}
                           `}
                  >
                    PAT
                  </button>
                </div>
                <div className="w-px h-8 bg-slate-100 mx-2"></div>
                <Button variant="ghost" onClick={hasChanges ? () => setShowCloseConfirm(true) : onClose} className="text-slate-400 hover:text-slate-600">
                  Exit
                </Button>
              </div>
            </div>

            {/* ACTIVE AREA */}
            <div className="flex-1 overflow-hidden relative flex flex-col items-center bg-white p-6 md:p-12">

              {(!currentMeta.pat && currentMeta.attendance !== 'absent') && (
                <div className="w-full max-w-5xl flex flex-col h-full animate-slideUp">

                  {/* QUESTION / RUBRIC HEADER */}
                  <div className="flex-shrink-0 mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                        Criterion {activeRubricIndex + 1} / {mockRubrics.length}
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                      {currentRubric.component_name}
                    </h2>
                    <p className="text-xl text-slate-600 leading-relaxed max-w-3xl">
                      {currentRubric.component_description}
                    </p>
                  </div>

                  {/* SCORE INPUT AREA */}
                  <div className="flex-1 flex flex-col justify-center">

                    {/* High Density: Horizontal Number Scale + Selection Detail */}
                    {isHighDensity ? (
                      <div className="space-y-8">
                        {/* Selected Detail View - Shows mostly when something IS selected */}
                        <div className={`min-h-[120px] p-6 rounded-2xl transition-all duration-300 border-l-4 ${currentScore !== undefined ? 'bg-blue-50 border-blue-500 opacity-100 translate-y-0' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                          {currentScore !== undefined ? (
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-4xl font-bold text-blue-600">{currentScore}</span>
                                <span className="text-lg font-bold text-slate-900 uppercase tracking-wide">{currentLevelDetails.label}</span>
                              </div>
                              <p className="text-slate-700 text-lg">{currentLevelDetails.description}</p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-lg font-medium">
                              Select a score from below to see details
                            </div>
                          )}
                        </div>

                        {/* Number Grid/Tape */}
                        <div className="flex flex-wrap gap-3 justify-start">
                          {currentRubric.levels.map(level => {
                            const isSel = currentScore === level.score;
                            return (
                              <button
                                key={level.score}
                                onClick={() => selectScore(level.score)}
                                className={`
                                                  w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-200 shadow-sm
                                                  ${isSel
                                    ? 'bg-blue-600 text-white shadow-blue-300 scale-110 ring-4 ring-blue-100'
                                    : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:-translate-y-1'}
                                              `}
                              >
                                {level.score}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Low Density: Card Grid (Refined) */
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {currentRubric.levels.map(level => {
                          const isSel = currentScore === level.score;
                          return (
                            <button
                              key={level.score}
                              onClick={() => selectScore(level.score)}
                              className={`
                                                  aspect-[4/5] p-5 rounded-2xl text-left border-2 transition-all duration-200 flex flex-col justify-between
                                                  ${isSel
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]'
                                  : 'bg-white border-slate-100 text-slate-500 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'}
                                              `}
                            >
                              <div>
                                <div className="text-3xl font-bold mb-1">{level.score}</div>
                                <div className={`text-xs font-bold uppercase tracking-wider mb-4 ${isSel ? 'text-blue-200' : 'text-blue-600'}`}>
                                  {level.label}
                                </div>
                                <p className={`text-sm leading-relaxed ${isSel ? 'text-indigo-100' : 'text-slate-400'}`}>
                                  {level.description}
                                </p>
                              </div>
                              {isSel && <div className="self-end"><CheckCircleIcon className="w-8 h-8 text-white" /></div>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BLOCKED STATE */}
              {(currentMeta.pat || currentMeta.attendance === 'absent') && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                  <div className="w-24 h-24 mx-auto mb-6 bg-slate-50 rounded-full flex items-center justify-center">
                    {currentMeta.pat ? <ClockIcon className="w-10 h-10 text-blue-500" /> : <XCircleIcon className="w-10 h-10 text-red-500" />}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{currentMeta.pat ? 'PAT Enabled' : 'Student Absent'}</h3>
                  <p className="mb-8 max-w-md mx-auto text-slate-500">Grading skipped for this student. You can proceed to the next student.</p>
                  <Button
                    onClick={() => {
                      if (activeStudentIndex < team.students.length - 1) {
                        handleStudentTransition();
                      } else {
                        setWorkflowPhase('team_dashboard');
                      }
                    }}
                    variant="primary"
                    className="mx-auto px-8 py-3 rounded-full shadow-lg"
                  >
                    Skip & Continue
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Close Confirmation */}
        {showCloseConfirm && (
          <Modal isOpen={showCloseConfirm} onClose={() => setShowCloseConfirm(false)} title="Unsaved Changes">
            <div className="space-y-4 p-4">
              <p className="text-slate-600">You have unsaved changes. All progress will be lost.</p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowCloseConfirm(false)}>Resume</Button>
                <Button variant="danger" onClick={() => { setShowCloseConfirm(false); onClose(); }}>Discard & Exit</Button>
              </div>
            </div>
          </Modal>
        )}

        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </Modal>
    </>
  );
};

export default MarkEntryModal;
