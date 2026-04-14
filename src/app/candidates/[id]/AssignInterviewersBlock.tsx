'use client';

import { useState, useTransition } from 'react';
import { updateCandidateInterviewers } from '@/actions/candidate.actions';

interface Props {
  applicationId: string;
  currentInterviewerIds: string[];
  allInterviewers: { id: string; name: string; role: string }[];
  isFrozen: boolean;
  sessions: { id: string; interviewerId: string; status: string; interviewerName: string }[];
}

export default function AssignInterviewersBlock({ applicationId, currentInterviewerIds, allInterviewers, isFrozen, sessions }: Props) {
  const [selected, setSelected] = useState<string[]>(currentInterviewerIds);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleInterviewer = (id: string) => {
    setError(null);
    setSelected(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (selected.length < 2) {
      setError('Минимум 2 эксперта');
      return;
    }
    if (selected.length > 4) {
      setError('Максимум 4 эксперта');
      return;
    }

    startTransition(async () => {
      try {
        await updateCandidateInterviewers(applicationId, selected);
        setIsEditing(false);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Ошибка при сохранении');
      }
    });
  };

  const handleCancel = () => {
    setSelected(currentInterviewerIds);
    setIsEditing(false);
    setError(null);
  };

  const statusLabel = (status: string) => {
    if (status === 'ЗАВЕРШЕНО') return { text: 'Завершено', color: 'bg-emerald-100 text-emerald-800' };
    return { text: 'Ожидает', color: 'bg-amber-100 text-amber-800' };
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-zinc-900">Панель интервьюеров</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Назначьте от 2 до 4 экспертов для проведения интервью</p>
        </div>
        {!isFrozen && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors"
          >
            Изменить состав
          </button>
        )}
        {isFrozen && (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Состав заморожен
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Current assignments summary */}
        {!isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sessions.length === 0 && (
              <div className="col-span-2 text-center py-8">
                <span className="text-3xl mb-2 block">👥</span>
                <p className="text-sm text-zinc-500">Интервьюеры пока не назначены</p>
              </div>
            )}
            {sessions.map((s: any) => {
              const int = allInterviewers.find(i => i.id === s.interviewerId) || { id: s.interviewerId, name: s.interviewerName, role: 'Эксперт' };
              const label = statusLabel(s.status);
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50/50">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold border border-violet-200 shrink-0">
                    {int.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{int.name}</p>
                    <p className="text-xs text-zinc-500">{int.role}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${label.color}`}>
                    {label.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit mode */}
        {isEditing && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allInterviewers.map((int: any) => {
                const isSelected = selected.includes(int.id);
                return (
                  <button
                    key={int.id}
                    type="button"
                    onClick={() => toggleInterviewer(int.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isSelected 
                        ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-200' 
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border shrink-0 ${
                      isSelected ? 'bg-violet-100 text-violet-700 border-violet-300' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                    }`}>
                      {int.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">{int.name}</p>
                      <p className="text-xs text-zinc-500">{int.role}</p>
                    </div>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600 shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Выбрано: <span className={`font-bold ${selected.length < 2 || selected.length > 4 ? 'text-rose-600' : 'text-emerald-600'}`}>{selected.length}</span> / 2–4
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending || selected.length < 2 || selected.length > 4}
                  className={`rounded-xl px-5 py-2 text-sm font-medium shadow-sm transition-all ${
                    selected.length >= 2 && selected.length <= 4
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                      : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  {isPending ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
