import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Toast from '../../../shared/components/Toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowPathIcon
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
  const [isReadingPhase, setIsReadingPhase] = useState(true); // True = Reading Desc, False = Scoring

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /* --- Derived Data --- */
  const rubrics = review?.rubric_structure || [];
  // Enhanced MOCK Data for Demo Purposes if real data lacks descriptions
  const mockRubrics = rubrics.length > 0 ? rubrics : [
    {
      rubric_id: 'mock_concept',
      component_name: 'Concept Innovation',
      component_description: 'Evaluates the novelty, feasibility, and impact of the project idea.',
      max_marks: 10,
      levels: Array.from({ length: 11 }, (_, i) => ({
        score: i,
        label: i === 0 ? 'None' : i === 10 ? 'Perfect' : i < 5 ? 'Emerging' : 'Proficient',
        description: i === 0 ? 'No attempt made.' : `Demonstrates Level ${i} competence with specific strengths in area X.`
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
    setIsReadingPhase(true);
  }, [isOpen, team]);

  const activeStudent = team?.students[activeStudentIndex];
  const currentRubric = mockRubrics[activeRubricIndex];
  const currentScore = marks[activeStudent?.student_id]?.[currentRubric?.rubric_id];
  const currentMeta = meta[activeStudent?.student_id] || DEFAULT_META;

  // DELAY EFFECT
  useEffect(() => {
    if (workflowPhase === 'marking' && !currentMeta.pat && currentMeta.attendance !== 'absent') {
      setIsReadingPhase(true);
      const timer = setTimeout(() => {
        setIsReadingPhase(false);
      }, 1500); // 1.5s delay
      return () => clearTimeout(timer);
    } else {
      setIsReadingPhase(false);
    }
  }, [activeRubricIndex, activeStudentIndex, workflowPhase, currentMeta.pat, currentMeta.attendance]);

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
      setTimeout(() => {
        setActiveRubricIndex(prev => prev + 1);
      }, 300); // Quick transition
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
    }, 1500);
  };

  const jumpToReview = () => {
    setWorkflowPhase('team_dashboard');
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

  /* --- Render Helpers --- */
  const getStudentTotal = (sid) => {
    return mockRubrics.reduce((sum, r) => {
      const s = marks[sid]?.[r.rubric_id];
      if (s === undefined) return sum;
      return sum + (s / Math.max(...r.levels.map(l => l.score))) * r.max_marks;
    }, 0).toFixed(1);
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
          <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Grading Summary</h1>
              <p className="text-slate-500 text-sm">{team.team_name}</p>
            </div>
            <div className="flex gap-3">
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
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Student</th>
                    {mockRubrics.map(r => (
                      <th key={r.rubric_id} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">{r.component_name}</th>
                    ))}
                    <th className="px-6 py-4 text-xs font-bold text-slate-900 uppercase text-right">Total</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.students.map((s, idx) => {
                    const m = meta[s.student_id];
                    const blocked = m.attendance === 'absent' || m.pat;
                    return (
                      <tr key={s.student_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{s.student_name}</div>
                          <div className="text-xs text-slate-400">{s.roll_number}</div>
                          {blocked && <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">{m.attendance === 'absent' ? 'Absent' : 'PAT'}</span>}
                        </td>
                        {mockRubrics.map(r => (
                          <td key={r.rubric_id} className="px-6 py-4 text-center font-medium text-slate-600">
                            {blocked ? '-' : marks[s.student_id]?.[r.rubric_id] || '-'}
                          </td>
                        ))}
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold text-slate-900">{blocked ? (m.attendance === 'absent' ? '0' : 'PAT') : getStudentTotal(s.student_id)}</span>
                          <span className="text-sm text-slate-400"> / {grandHeader}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => { setActiveStudentIndex(idx); setActiveRubricIndex(0); setWorkflowPhase('marking'); setIsReadingPhase(true); }}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-full hover:bg-blue-50 font-bold text-sm transition-colors"
                          >
                            Edit
                          </button>
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
                <div className="flex justify-between mt-2 text-xs font-bold">
                  <span className={isValid ? 'text-green-600' : 'text-red-500'}>
                    {isValid ? 'Ready to submit' : `${10 - teamMeta.teamComment.trim().length} more characters required`}
                  </span>
                </div>
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
              </div>
            </div>

          </div>
        </div>
      </Modal>
    );
  }

  // 3. MARKING INTERFACE (CRITERIA FIRST + RUBRIC CARDS)
  return (
    <>
      <Modal isOpen={true} onClose={hasChanges ? () => setShowCloseConfirm(true) : onClose} size="full" hideHeader noPadding>
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">

          {/* LEFT SIDEBAR (Context Only) */}
          <div className="w-60 bg-white border-r border-slate-200 hidden md:flex flex-col z-10 shrink-0">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 truncate">{team.team_name}</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Review Mode</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {team.students.map((s, idx) => (
                <div key={s.student_id} className={`p-3 rounded-lg text-sm font-medium flex justify-between items-center ${idx === activeStudentIndex ? 'bg-slate-100 text-slate-900 font-bold' : idx < activeStudentIndex ? 'text-green-600' : 'text-slate-400'}`}>
                  <span>{s.student_name}</span>
                  {idx < activeStudentIndex && <CheckCircleIcon className="w-4 h-4" />}
                  {idx === activeStudentIndex && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                </div>
              ))}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col relative w-full h-full">

            {/* Top Bar: Progress & Student Info */}
            <div className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Grading Student {activeStudentIndex + 1} of {team.students.length}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-900">{activeStudent.student_name}</h1>
              </div>

              {/* Controls: Separate Buttons */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {/* ABSENT Toggle */}
                  <button
                    onClick={() => updateMeta(activeStudent.student_id, { attendance: currentMeta.attendance === 'absent' ? 'present' : 'absent', pat: false })}
                    className={`
                              px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all border
                              ${currentMeta.attendance === 'absent'
                        ? 'bg-red-600 text-white border-red-600 shadow-md transform scale-105'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-red-300 hover:text-red-600'}
                           `}
                  >
                    Absent
                  </button>

                  {/* PAT Toggle */}
                  <button
                    onClick={() => updateMeta(activeStudent.student_id, { pat: !currentMeta.pat, attendance: 'present' })}
                    className={`
                              px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all border
                              ${currentMeta.pat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}
                           `}
                  >
                    PAT Enabled
                  </button>
                </div>
                <div className="w-px h-8 bg-slate-200 mx-2"></div>
                <Button variant="ghost" onClick={hasChanges ? () => setShowCloseConfirm(true) : onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg px-2">
                  Esc
                </Button>
              </div>
            </div>

            {/* ACTIVE AREA */}
            <div className="flex-1 overflow-hidden relative flex flex-col items-center bg-slate-50 p-6 md:p-10">

              {/* NORMAL MARKING */}
              {(!currentMeta.pat && currentMeta.attendance !== 'absent') && (
                <div className="w-full max-w-7xl flex flex-col items-center animate-slideUp h-full">

                  {/* CRITERIA HEADER (Shows First) */}
                  <div className="text-center mb-8 max-w-3xl transition-all duration-500 flex-shrink-0">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">
                      Criterion {activeRubricIndex + 1} of {mockRubrics.length}
                    </h4>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                      {currentRubric.component_name}
                    </h2>
                    <p className="text-xl text-slate-600 leading-relaxed font-medium">
                      {currentRubric.component_description}
                    </p>
                    {/* Reading Phase Indicator */}
                    {isReadingPhase && (
                      <div className="mt-6 flex justify-center">
                        <div className="h-1 bg-slate-200 rounded-full w-32 overflow-hidden">
                          <div className="h-full bg-blue-500 animate-loading-bar"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RUBRIC CARDS GRID (Fades In) */}
                  <div className={`
                           flex-1 w-full grid gap-4 overflow-y-auto pb-4 transition-all duration-700
                           ${isReadingPhase ? 'opacity-0 translate-y-8 pointer-events-none blur-sm' : 'opacity-100 translate-y-0 pointer-events-auto blur-0'}
                           ${currentRubric.levels.length > 5 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'}
                        `}>
                    {currentRubric.levels.map(level => {
                      const isSelected = currentScore === level.score;
                      return (
                        <button
                          key={level.score}
                          onClick={() => selectScore(level.score)}
                          className={`
                                       flex flex-col p-4 rounded-xl text-left border-2 transition-all duration-200 group relative
                                       ${isSelected
                              ? 'bg-slate-800 border-slate-800 text-white shadow-xl scale-[1.02] z-10'
                              : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'
                            }
                                    `}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-4xl font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{level.score}</span>
                            {isSelected && <CheckCircleIcon className="w-6 h-6 text-green-400" />}
                          </div>
                          <span className={`text-xs font-bold uppercase tracking-wider mb-2 ${isSelected ? 'text-slate-300' : 'text-blue-600'}`}>
                            {level.label}
                          </span>
                          <p className={`text-sm leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {level.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BLOCKED STATE */}
              {(currentMeta.pat || currentMeta.attendance === 'absent') && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                  <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                    {currentMeta.pat ? <ClockIcon className="w-10 h-10 text-blue-500" /> : <XCircleIcon className="w-10 h-10 text-red-500" />}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">{currentMeta.pat ? 'PAT Enabled' : 'Student Absent'}</h3>
                  <p className="mb-8 max-w-md mx-auto">No marks required. You can proceed to the next student.</p>
                  <Button onClick={() => selectScore(0)} variant="primary" className="mx-auto px-8 py-3 rounded-full shadow-lg">Skip & Continue</Button>
                </div>
              )}

            </div>
          </div>
        </div>
      </Modal>

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
    </>
  );
};

export default MarkEntryModal;
