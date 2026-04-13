"use client";

import { useState } from "react";
import Link from "next/link";
import { generateCandidateSummary, GeneratedCandidateSummary } from "@/lib/ai";
import { updateCandidateSummary } from "@/actions/interview.actions";

export default function SummaryClient({ candidateInfo }: { candidateInfo: any }) {
   const candidateId = candidateInfo.id;
   const initialSummary = candidateInfo.summary;

   const [summary, setSummary] = useState<GeneratedCandidateSummary | null>(initialSummary || null);
   const [isGenerating, setIsGenerating] = useState(false);

   // Prepare evaluations payload for AI
   const targetSessions = candidateInfo.sessions.filter((s: any) => s.status === 'ЗАВЕРШЕНО');
   const evalsToSubmit: any[] = [];

   targetSessions.forEach((session: any) => {
      const inter = session.interviewer;
      session.evaluations?.forEach((ev: any) => {
         if (!ev) return;
         const blockTitle = ev.block?.title || "Unknown Block";
         evalsToSubmit.push({
            interviewer: inter?.name,
            interviewerRole: inter?.role,
            blockTitle,
            score: ev.score,
            notes: ev.notes,
         });
      });
   });
   const evaluationsPayload = evalsToSubmit;

   const handleGenerate = async () => {
      if (!candidateInfo) return;
      setIsGenerating(true);
      setSummary(null);

      try {
         const result = await generateCandidateSummary({
            candidateName: candidateInfo.name,
            role: candidateInfo.vacancy.title,
            level: candidateInfo.vacancy.level,
            evaluations: evaluationsPayload
         });

         // Save to DB via Server Action
         await updateCandidateSummary(candidateId, result);
         setSummary(result);
      } catch (e) {
         console.error(e);
      } finally {
         setIsGenerating(false);
      }
   };

   if (!candidateInfo) return <div className="p-8 text-center text-zinc-500">Загрузка данных...</div>;

   return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-20">

         {/* 1. Header */}
         <div className="flex flex-col gap-3 border-b border-zinc-200 pb-6 mt-2">
            <div className="text-sm font-medium text-zinc-500">
               <Link href={`/candidates/${candidateId}`} className="hover:text-zinc-900 transition-colors">&larr; Вернуться в профиль</Link>
            </div>
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
                     AI Сводный Отчет (Summary)
                  </h1>
                  <p className="text-zinc-500 mt-1">Кандидат: <span className="font-semibold text-zinc-700">{candidateInfo.name}</span> • Вакансия: {candidateInfo.vacancy.title}</p>
               </div>

               <button
                  onClick={handleGenerate}
                  disabled={isGenerating || evaluationsPayload.length === 0}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-sm transition-all focus:ring-4 focus:ring-violet-100 ${isGenerating ? 'bg-violet-400 text-white cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 text-white'
                     }`}
               >
                  {isGenerating ? (
                     <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Нейросеть анализирует протоколы...
                     </>
                  ) : (
                     <>
                        <span className="text-lg leading-none">✨</span>
                        Сгенерировать Отчет
                     </>
                  )}
               </button>
            </div>
            <p className="text-xs font-medium text-zinc-400">В ИИ-анализ будет передано {evaluationsPayload.length} зафиксированных оценок от экспертов.</p>
         </div>

         {/* 2. Content */}
         {isGenerating && (
            <div className="flex flex-col gap-6 animate-pulse">

               {/* VERDICT CARD SKELETON */}
               <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-stretch">
                  <div className="flex flex-col items-center justify-center shrink-0 w-48 border-r border-zinc-50 pr-4">
                     <div className="h-3 bg-zinc-200 rounded w-24 mb-4"></div>
                     <div className="h-20 bg-zinc-200 rounded w-20"></div>
                     <div className="h-6 bg-zinc-200 rounded-full w-full mt-4"></div>
                  </div>

                  <div className="flex flex-col gap-4 justify-center w-full">
                     <div className="h-5 bg-zinc-200 rounded w-64 mb-2"></div>
                     <div className="h-4 bg-zinc-100 rounded w-full"></div>
                     <div className="h-4 bg-zinc-100 rounded w-full"></div>
                     <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                  </div>
               </div>

               {/* PROS AND CONS SKELETON */}
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/30 p-6 flex flex-col gap-3">
                     <div className="h-4 bg-zinc-200 rounded w-48 mb-2"></div>
                     <div className="h-3 bg-zinc-100 rounded w-full"></div>
                     <div className="h-3 bg-zinc-100 rounded w-5/6"></div>
                     <div className="h-3 bg-zinc-100 rounded w-4/5"></div>
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50/30 p-6 flex flex-col gap-3">
                     <div className="h-4 bg-zinc-200 rounded w-48 mb-2"></div>
                     <div className="h-3 bg-zinc-100 rounded w-full"></div>
                     <div className="h-3 bg-zinc-100 rounded w-9/12"></div>
                     <div className="h-3 bg-zinc-100 rounded w-full"></div>
                  </div>
               </div>
            </div>
         )}

         {summary && !isGenerating && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

               {/* VERDICT CARD */}
               <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md flex flex-col md:flex-row gap-8 items-center md:items-stretch">
                  <div className="flex flex-col items-center justify-center shrink-0 w-48 border-r border-zinc-100 pr-4">
                     <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 text-center">Итоговый Балл</span>
                     <span className="text-6xl font-black text-zinc-900 tracking-tighter">{summary.overallScore.toFixed(1)}</span>
                     <span className={`mt-4 w-full flex items-center justify-center px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-center
                        ${summary.recommendation === 'НАЗНАЧИТЬ_ОФФЕР' ? 'bg-emerald-100 text-emerald-800' : ''}
                        ${summary.recommendation === 'СИНХРОНИЗАЦИЯ' ? 'bg-amber-100 text-amber-800' : ''}
                        ${summary.recommendation === 'ОТКАЗ' ? 'bg-rose-100 text-rose-800' : ''}
                        ${summary.recommendation === 'ДОП_ИНТЕРВЬЮ' ? 'bg-blue-100 text-blue-800' : ''}
                   `}>
                        {summary.recommendation.replace('_', ' ')}
                     </span>
                  </div>

                  <div className="flex flex-col gap-3 justify-center">
                     <h3 className="text-xl font-bold text-zinc-900">Обоснование решения (Rationale)</h3>
                     <p className="text-zinc-600 leading-relaxed font-medium">
                        {summary.rationale}
                     </p>
                  </div>
               </div>

               {/* DISCREPANCY BLOCK */}
               {summary.discrepancies && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm flex flex-col gap-2">
                     <h4 className="text-sm font-bold text-amber-900 uppercase tracking-widest flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        Внимание: Расхождение в оценках
                     </h4>
                     <p className="text-sm text-amber-800 font-medium">
                        {summary.discrepancies}
                     </p>
                  </div>
               )}

               {/* PROS AND CONS */}
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6">
                     <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Подтвержденные Сильные Стороны
                     </h4>
                     <ul className="text-sm text-zinc-700 space-y-3">
                        {summary.strengths.map((str, i) => (
                           <li key={i} className="flex gap-2">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span className="font-medium leading-relaxed">{str}</span>
                           </li>
                        ))}
                     </ul>
                  </div>

                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-6">
                     <h4 className="text-xs font-bold text-rose-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Выявленные Зоны Риска
                     </h4>
                     <ul className="text-sm text-zinc-700 space-y-3">
                        {summary.risks.map((str, i) => (
                           <li key={i} className="flex gap-2">
                              <span className="text-rose-500 font-bold">•</span>
                              <span className="font-medium leading-relaxed">{str}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>

               {/* EVIDENCE TRACKER */}
               <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-100 pb-3">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                     Доказательная База (Notable Evidence)
                  </h3>
                  <div className="flex flex-col gap-3">
                     {summary.notableEvidence.map((ev, i) => (
                        <div key={i} className="rounded-xl bg-zinc-50 px-4 py-3 border-l-4 border-l-violet-300 border border-zinc-100">
                           <p className="text-sm text-zinc-700 italic font-medium">"{ev}"</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* NEXT STEPS */}
               <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-6 flex items-center justify-between text-white mt-2">
                  <div className="flex flex-col max-w-2xl">
                     <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Рекомендуемый следующий шаг</h3>
                     <p className="text-lg font-semibold">{summary.nextStepSuggestion}</p>
                  </div>
                  <Link
                     href={`/candidates/${candidateId}`}
                     className="px-6 py-2.5 bg-white text-zinc-900 rounded-xl font-bold hover:bg-zinc-100 transition-colors"
                  >
                     Утвердить решение
                  </Link>
               </div>
            </div>
         )}

         {/* Empty State */}
         {!summary && !isGenerating && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-12 flex flex-col items-center justify-center text-center mt-6">
               <span className="text-5xl mb-4">🧠</span>
               <h3 className="text-lg font-bold text-zinc-900">Готовы подвести итоги?</h3>
               <p className="text-zinc-500 mb-6 max-w-sm mt-1">ИИ проанализирует все тексты, оценки и возможные противоречия между интервьюерами.</p>
               <button
                  onClick={handleGenerate}
                  className="rounded-xl px-6 py-3 bg-zinc-900 text-white font-bold hover:bg-black transition-colors"
               >
                  Запустить генерацию отчета
               </button>
            </div>
         )}

      </div>
   );
}
