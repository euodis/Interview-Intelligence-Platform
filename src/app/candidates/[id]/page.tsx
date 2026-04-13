import { mockCandidates, mockSummaries, mockSessions, mockBlockEvaluations, mockPlans, mockInterviewers, mockVacancies } from "@/data/mocks";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CandidateProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const candidate = mockCandidates.find(c => c.id === resolvedParams.id);
  
  if (!candidate) return notFound();

  const vacancy = mockVacancies.find(v => v.id === candidate.vacancyId);
  const plan = mockPlans.find(p => p.vacancyId === vacancy?.id);
  const aiSummary = mockSummaries.find(s => s.candidateId === candidate.id);
  
  // All sessions for this candidate
  const sessions = mockSessions.filter(s => s.candidateId === candidate.id && s.status === 'ЗАВЕРШЕНО');
  
  // To build the matrix, get unique blocks and interviewers
  const interviewersForCandidate = sessions.map(s => mockInterviewers.find(i => i.id === s.interviewerId)).filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="text-sm border-b border-zinc-200 pb-2">
           <Link href="/" className="text-zinc-500 hover:text-zinc-900 border-b border-zinc-500 pb-0.5">Вакансии</Link>{' '} / Кандидат: {candidate.name}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{candidate.name}</h1>
            <p className="text-zinc-500 mt-1">Отклик на: {vacancy?.title}</p>
          </div>
          <button className="rounded-xl bg-white border border-zinc-200 px-4 py-2 font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 transition-colors">
            Поделиться отчетом
          </button>
        </div>
      </div>

      {aiSummary ? (
          <div className="rounded-2xl border-l-2 border-l-violet-600 border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✨</span>
                <h2 className="text-lg font-semibold text-zinc-900">ИИ Рекомендация</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                <div className="col-span-1 p-4 rounded-xl bg-zinc-50 flex flex-col items-center justify-center gap-2 border border-zinc-100">
                    <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider text-center">Общий балл</span>
                    <span className="text-5xl font-bold text-zinc-900">{typeof aiSummary.overallScore === 'number' ? aiSummary.overallScore.toFixed(1) : aiSummary.overallScore} <span className="text-2xl text-zinc-300">/ 5</span></span>
                    
                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold tracking-tight mt-2 text-center
                        ${aiSummary.recommendation === 'НАЗНАЧИТЬ_ОФФЕР' && 'bg-emerald-100 text-emerald-800'}
                        ${aiSummary.recommendation === 'СИНХРОНИЗАЦИЯ' && 'bg-amber-100 text-amber-800'}
                        ${aiSummary.recommendation === 'ОТКАЗ' && 'bg-rose-100 text-rose-800'}
                        ${aiSummary.recommendation === 'ДОП_ИНТЕРВЬЮ' && 'bg-blue-100 text-blue-800'}
                    `}>
                      {aiSummary.recommendation.replace('_', ' ')}
                    </span>
                </div>

                <div className="col-span-2 flex flex-col gap-4 justify-center">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2">Сильные стороны</h4>
                      <ul className="text-sm text-zinc-700 list-disc list-inside space-y-1">
                          {aiSummary.strengths.map((str, i) => <li key={i}>{str}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-700 uppercase tracking-wider mb-2">Риски</h4>
                      <ul className="text-sm text-zinc-700 list-disc list-inside space-y-1">
                          {aiSummary.risks.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                </div>
            </div>

            {aiSummary.discrepancies && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex flex-col gap-2 mt-2">
                  <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Выявлено расхождение (Discrepancy)
                  </h4>
                  <p className="text-sm text-amber-800 leading-relaxed font-medium">
                    {aiSummary.discrepancies}
                  </p>
              </div>
            )}
          </div>
      ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-4 justify-center items-center h-48">
              <p className="text-zinc-500">Оценки интервьюеров еще собираются. ИИ-саммари пока недоступно.</p>
          </div>
      )}

      {/* Raw Score Matrix */}
      {plan && sessions.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-x-auto mt-4">
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-white sticky left-0 min-w-max">
                <h3 className="font-semibold text-zinc-900">Сырые оценки (Матрица)</h3>
                <span className="text-sm text-zinc-500">{sessions.length} Интервью(ер)</span>
            </div>
            <table className="w-full text-sm text-left min-w-max">
                <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="px-6 py-3 font-medium min-w-[200px]">Блок компетенции</th>
                      {sessions.map(session => {
                          const inter = mockInterviewers.find(i => i.id === session.interviewerId);
                          return (
                              <th key={session.id} className="px-6 py-3 font-medium border-l border-zinc-200 max-w-[300px]">
                                 {inter?.name} <span className="block text-xs font-normal text-zinc-400">{inter?.role}</span>
                              </th>
                          );
                      })}
                    </tr>
                </thead>
                <tbody className="text-zinc-700">
                    {plan.blocks.map(block => {
                        return (
                            <tr key={block.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                                <td className="px-6 py-4 font-medium text-zinc-900 align-top">{block.title}</td>
                                {sessions.map(session => {
                                   const ev = mockBlockEvaluations.find(e => e.sessionId === session.id && e.blockId === block.id);
                                   if (!ev) {
                                       return <td key={session.id} className="px-6 py-4 border-l border-zinc-100 text-zinc-400 italic align-top">Не оценивалось</td>;
                                   }

                                   return (
                                       <td key={session.id} className="px-6 py-4 border-l border-zinc-100 align-top max-w-[300px]">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-lg font-bold
                                                        ${ev.score >= 4 ? 'bg-emerald-100 text-emerald-800' : ev.score <= 2 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}
                                                    `}>{ev.score}</span>
                                                    <span className="text-xs text-zinc-400">/ 5 баллов</span>
                                                </div>
                                                <p className="text-sm text-zinc-600 whitespace-normal leading-relaxed">{ev.notes}</p>
                                            </div>
                                       </td>
                                   );
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
          </div>
      )}
    </div>
  );
}
