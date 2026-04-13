"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCandidate } from "@/actions/candidate.actions";

// Added dynamic time formatting function
const timeAgo = (date: Date) => {
  const diffHours = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Только что';
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffHours < 48) return 'Вчера';
  return new Date(date).toLocaleDateString('ru-RU');
};

export default function VacancyDashboardClient({ vacancy, candidates, userRole }: { vacancy: any, candidates: any[], userRole: string }) {
  const isHR = userRole === 'HR';
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Application Data
  const completedSessions = candidates.flatMap(c => c.sessions).filter((s:any) => s.status === 'ЗАВЕРШЕНО');
  
  const summaries = candidates.map(c => c.summary).filter(Boolean);
  const avgScore = summaries.length > 0 
    ? (summaries.reduce((acc, curr) => acc + curr.overallScore, 0) / summaries.length).toFixed(1)
    : 'N/A';
  
  const disagreementsCount = summaries.filter(s => !!s.discrepancies).length;

  // Filter & Sort State
  const [filterRec, setFilterRec] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'SCORE' | 'NAME' | 'STATUS'>('SCORE');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Process data for table
  let tableData = candidates.map(candidate => {
    const summary = candidate.summary;
    const candidateSessions = candidate.sessions;
    const assignedInterviewers = candidate.assignments.map((a:any) => a.interviewer);
    
    return {
      candidate,
      summary,
      sessions: candidateSessions,
      interviewers: assignedInterviewers,
      lastUpdated: timeAgo(candidate.updatedAt),
    };
  });

  if (filterRec !== 'ALL') {
    tableData = tableData.filter(row => row.summary?.recommendation === filterRec);
  }

  tableData.sort((a, b) => {
      let valA, valB;
      if (sortField === 'SCORE') {
         valA = a.summary?.overallScore || 0;
         valB = b.summary?.overallScore || 0;
      } else if (sortField === 'NAME') {
         valA = a.candidate.name;
         valB = b.candidate.name;
      } else {
         valA = a.candidate.status;
         valB = b.candidate.status;
      }

      if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
  });

  const handleSort = (field: 'SCORE' | 'NAME' | 'STATUS') => {
      if (sortField === field) {
          setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
      } else {
          setSortField(field);
          setSortOrder('DESC');
      }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header Information */}
      <div className="flex flex-col gap-4">
         <div className="text-sm border-b border-zinc-200 pb-2">
           <Link href="/" className="text-zinc-500 hover:text-zinc-900 border-b border-zinc-500 pb-0.5">Все Вакансии</Link>{' '} <span className="text-zinc-400 mx-1">/</span> <span className="text-zinc-900 font-medium">{vacancy.title}</span>
         </div>
         <div className="flex items-start justify-between">
            <div>
               <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
                  {vacancy.title}
                  <span className="text-sm font-semibold bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full uppercase tracking-widest">{vacancy.level}</span>
               </h1>
               <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <span className="text-sm text-zinc-500 mr-2">Core competencies:</span>
                  {vacancy.competencies.map(c => (
                      <span key={c.id} className="text-xs font-medium border border-zinc-200 bg-white px-2 py-1 rounded-md text-zinc-600 shadow-sm">{c.name}</span>
                  ))}
               </div>
            </div>
            <button className="rounded-xl border border-zinc-200 bg-white px-4 py-2 font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 transition-colors">
               Edit Vacancy
            </button>
         </div>
      </div>

      {/* 2. Top Insights (AI Overview) */}
      <div className="rounded-2xl border-l-[3px] border-violet-500 border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-3">
         <div className="flex items-center gap-2">
             <span className="text-xl leading-none">✨</span>
             <h3 className="font-semibold text-zinc-900">AI Overview for Pipeline</h3>
         </div>
         <p className="text-sm text-zinc-700 leading-relaxed max-w-4xl">
            У нас {candidates.length} активных кандидатов. {summaries.length > 0 ? `Завершены интервью у ${completedSessions.length} чел. Средний балл по пайплайну: ${avgScore}. ` : `В данный момент данных для детальной аналитики недостаточно. `}
            {summaries.some(s => s.recommendation === 'НАЗНАЧИТЬ_ОФФЕР') ? `Есть сильные фавориты, готовые к офферу. ` : ''}
            {disagreementsCount > 0 ? `По ${disagreementsCount} кандидатам обнаружены **столкновения в оценках** технических экспертов — требуется ваша вовлеченность.` : ''}
         </p>
      </div>

      {/* 3. Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-medium text-zinc-500">Кандидаты (Всего)</h4>
            <p className="text-3xl font-bold text-zinc-900 mt-2">{candidates.length}</p>
         </div>
         <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-medium text-zinc-500">Интервью (Завершено)</h4>
            <p className="text-3xl font-bold text-zinc-900 mt-2">{completedSessions.length}</p>
         </div>
         <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-medium text-zinc-500">Средний балл</h4>
            <p className="text-3xl font-bold text-zinc-900 mt-2">
               {avgScore !== 'N/A' ? (
                  <>{avgScore} <span className="text-base font-medium text-zinc-400">/ 5</span></>
               ) : (
                  <span className="text-lg font-medium text-zinc-400">Нет оценок</span>
               )}
            </p>
         </div>
         <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <h4 className="text-sm font-medium text-amber-800 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
               Расхождения
            </h4>
            <p className="text-3xl font-bold text-amber-900 mt-2">{disagreementsCount}</p>
         </div>
      </div>

      {/* 4. Candidates Table */}
      <div className="flex flex-col gap-4 mt-4">
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Список кандидатов</h2>
            
            {/* Add Candidate + Filters */}
            <div className="flex items-center gap-3">
               {isHR && (
                 <button
                   onClick={() => setShowAddCandidate(true)}
                   className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors flex items-center gap-2"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                   Добавить кандидата
                 </button>
               )}
            <div className="flex items-center gap-2">
               <span className="text-sm text-zinc-500">Фильтр:</span>
               <select 
                  className="text-sm border border-zinc-200 rounded-lg px-3 py-1.5 bg-white text-zinc-700 outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-1"
                  value={filterRec}
                  onChange={(e) => setFilterRec(e.target.value)}
               >
                  <option value="ALL">Все рекомендации</option>
                  <option value="НАЗНАЧИТЬ_ОФФЕР">Назначить Оффер</option>
                  <option value="ДОП_ИНТЕРВЬЮ">Доп. Интервью</option>
                  <option value="СИНХРОНИЗАЦИЯ">Требует Синхронизации</option>
                  <option value="ОТКАЗ">Отказ</option>
               </select>
            </div>
            </div>         </div>

         <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left min-w-max">
               <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase text-zinc-500">
                  <tr>
                     <th className="px-6 py-4 font-semibold cursor-pointer hover:text-zinc-900" onClick={() => handleSort('NAME')}>
                        Кандидат {sortField==='NAME' && (sortOrder==='ASC'?'↑':'↓')}
                     </th>
                     <th className="px-6 py-4 font-semibold cursor-pointer hover:text-zinc-900" onClick={() => handleSort('STATUS')}>
                        Статус {sortField==='STATUS' && (sortOrder==='ASC'?'↑':'↓')}
                     </th>
                     <th className="px-6 py-4 font-semibold">Интервьюеры</th>
                     <th className="px-6 py-4 font-semibold cursor-pointer hover:text-zinc-900" onClick={() => handleSort('SCORE')}>
                        Оценка (Avg) {sortField==='SCORE' && (sortOrder==='ASC'?'↑':'↓')}
                     </th>
                     <th className="px-6 py-4 font-semibold">Рекомендация</th>
                     <th className="px-6 py-4 font-semibold text-center">Disagreements</th>
                     <th className="px-6 py-4 font-semibold">Обновлено</th>
                     <th className="px-6 py-4"></th>
                  </tr>
               </thead>
               <tbody className="text-zinc-700">
                  {tableData.length === 0 && (
                     <tr><td colSpan={8} className="px-6 py-8 text-center text-zinc-500">Нет кандидатов по данным фильтрам</td></tr>
                  )}
                  {tableData.map((row) => (
                     <tr key={row.candidate.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                        {/* Candidate */}
                        <td className="px-6 py-4">
                           <div className="font-semibold text-zinc-900">{row.candidate.name}</div>
                           <div className="text-xs text-zinc-400 mt-1">{row.candidate.currentCompany} • {row.candidate.experienceYears} лет</div>
                        </td>
                        
                        {/* Status */}
                        <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm
                                 ${row.candidate.status === 'ОЦЕНЕН' ? 'bg-zinc-900 text-white' : 
                                   row.candidate.status === 'ИНТЕРВЬЮ' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                   'bg-blue-50 text-blue-700 border border-blue-200'}
                              `}>
                                 {row.candidate.status}
                              </span>
                        </td>

                        {/* Interviewers */}
                        <td className="px-6 py-4">
                           <div className="flex -space-x-2">
                              {row.interviewers.map((int: any) => (
                                 <div key={int.id} title={int.name} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600 shadow-sm">
                                    {int.name.charAt(0)}
                                 </div>
                              ))}
                              {row.interviewers.length === 0 && <span className="text-zinc-400 text-xs italic">Не назначены</span>}
                           </div>
                        </td>

                        {/* Score */}
                        <td className="px-6 py-4 font-medium">
                           {row.summary ? (
                              <div className="flex items-center gap-2">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="text-amber-500 fill-amber-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                 <span className="text-zinc-900">{row.summary.overallScore.toFixed(1)}</span>
                              </div>
                           ) : <span className="text-zinc-400">-</span>}
                        </td>

                        {/* Recommendation */}
                        <td className="px-6 py-4">
                           {row.summary ? (
                               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-tight
                                  ${row.summary.recommendation === 'НАЗНАЧИТЬ_ОФФЕР' && 'bg-emerald-100 text-emerald-800'}
                                  ${row.summary.recommendation === 'СИНХРОНИЗАЦИЯ' && 'bg-amber-100 text-amber-800'}
                                  ${row.summary.recommendation === 'ОТКАЗ' && 'bg-rose-100 text-rose-800'}
                                  ${row.summary.recommendation === 'ДОП_ИНТЕРВЬЮ' && 'bg-indigo-100 text-indigo-800'}
                               `}>
                                  {row.summary.recommendation.replace('_', ' ')}
                               </span>
                           ) : <span className="text-zinc-400 text-xs text-center w-full block">—</span>}
                        </td>

                        {/* Disagreement Flag */}
                        <td className="px-6 py-4 text-center">
                           {row.summary?.discrepancies ? (
                               <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600" title="Расхождение в оценках экспертов">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                               </div>
                           ) : <span className="text-zinc-300">-</span>}
                        </td>

                        {/* Last Update */}
                        <td className="px-6 py-4 text-xs text-zinc-500 whitespace-nowrap">
                           {row.lastUpdated}
                        </td>

                        {/* Action */}
                           <td className="px-6 py-4 text-right">
                              <Link href={`/candidates/${row.candidate.id}`} className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all
                                 ${row.summary || row.candidate.status === 'ОЦЕНЕН' 
                                   ? 'bg-zinc-900 text-white hover:bg-zinc-800' 
                                   : 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50'}
                              `}>
                                 {row.summary || row.candidate.status === 'ОЦЕНЕН' ? 'Отчет' : 'Профиль'}
                              </Link>
                           </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddCandidate(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-lg mx-4 p-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Добавить кандидата</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAddError(null);
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const email = formData.get('email') as string;
                const currentCompany = formData.get('currentCompany') as string;
                const experienceYears = parseInt(formData.get('experienceYears') as string) || undefined;

                if (!name.trim()) { setAddError('Укажите имя кандидата'); return; }

                startTransition(async () => {
                  try {
                    await createCandidate({
                      name: name.trim(),
                      email: email.trim() || `${Date.now()}@candidate.local`,
                      vacancyId: vacancy.id,
                      currentCompany: currentCompany.trim() || undefined,
                      experienceYears,
                    });
                    setShowAddCandidate(false);
                    router.refresh();
                  } catch (err: any) {
                    setAddError(err.message || 'Ошибка при создании');
                  }
                });
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">ФИО *</label>
                <input name="name" required className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" placeholder="Иван Иванов" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                <input name="email" type="email" className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" placeholder="candidate@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Компания</label>
                  <input name="currentCompany" className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" placeholder="Google" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Опыт (лет)</label>
                  <input name="experienceYears" type="number" min="0" max="40" className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" placeholder="5" />
                </div>
              </div>
              {addError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{addError}</div>
              )}
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowAddCandidate(false)} className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">Отмена</button>
                <button type="submit" disabled={isPending} className="rounded-xl bg-zinc-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors disabled:opacity-50">
                  {isPending ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
