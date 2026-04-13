"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getAIComparison } from "@/actions/interview.actions";
import { ComparisonAnalysis } from "@/lib/ai";

export default function CompareClient({ 
  vacancy, 
  candidates,
  primaryCandidateId 
}: { 
  vacancy: any, 
  candidates: any[],
  primaryCandidateId?: string
}) {
  const vacancyId = vacancy?.id;

  // Only candidates that match the vacancy and have some evaluations (status ОЦЕНЕН)
  const availableCandidates = candidates.filter(c => c.status === 'ОЦЕНЕН');
  
  // Default pick: primary candidate + the next best one if available
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
      if (primaryCandidateId && availableCandidates.find(c => c.id === primaryCandidateId)) {
          const others = availableCandidates.filter(c => c.id !== primaryCandidateId);
          return [primaryCandidateId, ...(others.length > 0 ? [others[0].id] : [])];
      }
      return availableCandidates.slice(0, 2).map(c => c.id);
  });

  const [aiAnalysis, setAiAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const plan = vacancy?.interviewPlan;

  const toggleCandidate = (id: string) => {
      setSelectedIds(prev => {
          if (prev.includes(id)) {
              // Don't allow deselecting everything
              if (prev.length === 1) return prev;
              return prev.filter(p => p !== id);
          }
          if (prev.length >= 2) {
              // Replace the second candidate if already have 2
              return [prev[0], id];
          }
          return [...prev, id];
      });
      // Reset AI analysis if selection changes
      setAiAnalysis(null);
  };

  const handleAIAnalyze = async () => {
      if (selectedIds.length !== 2) return;
      setIsAnalyzing(true);
      try {
          const result = await getAIComparison(selectedIds, vacancyId);
          setAiAnalysis(result);
      } catch (err) {
          console.error("AI Analysis failed", err);
      } finally {
          setIsAnalyzing(false);
      }
  };

  // Prepare comparison data
  const comparisonData = selectedIds.map(id => {
      const candidate = availableCandidates.find(c => c.id === id)!;
      const summary = candidate.summary;
      const sessions = candidate.sessions.filter((s:any) => s.status === 'ЗАВЕРШЕНО');
      
      // Compute avg scores per block
      const blockScores: Record<string, number | null> = {};
      plan?.blocks.forEach((block:any) => {
          const evals = sessions.flatMap((s:any) => s.evaluations || []).filter((e:any) => e && e.blockId === block.id && e.score !== null);
          if (evals.length > 0) {
              const avg = evals.reduce((acc:any, curr:any) => acc + curr.score, 0) / evals.length;
              blockScores[block.id] = avg;
          } else {
              blockScores[block.id] = null;
          }
      });

      return {
          candidate,
          summary,
          blockScores
      };
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20">
      
      {/* 1. Header & Selector */}
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 mt-2">
         <div className="text-sm font-medium text-zinc-500">
           <Link href={`/vacancies/${vacancyId}`} className="hover:text-zinc-900 transition-colors">&larr; Дашборд Вакансии</Link> 
         </div>
         <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
               <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Сравнение Кандидатов</h1>
               <p className="text-zinc-500 mt-1">Оцените показатели side-by-side для принятия взвешенного решения.</p>
            </div>
            
            {selectedIds.length === 2 && (
                <button 
                   onClick={handleAIAnalyze}
                   disabled={isAnalyzing}
                   className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow-lg transition-all focus:ring-4 focus:ring-violet-100 ${
                       isAnalyzing 
                         ? 'bg-violet-400 text-white cursor-not-allowed' 
                         : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white hover:scale-[1.02] active:scale-[0.98]'
                   }`}
                >
                   {isAnalyzing ? (
                       <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Анализ...
                       </>
                   ) : (
                       <>
                          <span className="text-lg leading-none">✨</span>
                          Сравнить через ИИ
                       </>
                   )}
                </button>
            )}
         </div>

         {/* Candidate Pill Selector */}
         <div className="flex items-center gap-2 mt-2 flex-wrap">
             <span className="text-sm font-bold text-zinc-500 mr-2 uppercase tracking-widest">Кандидаты (Max 2):</span>
             {availableCandidates.map(c => {
                 const isSelected = selectedIds.includes(c.id);
                 return (
                     <button 
                         key={c.id} 
                         onClick={() => toggleCandidate(c.id)}
                         className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                             isSelected 
                               ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                               : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                         }`}
                     >
                         {c.name} {isSelected && '✓'}
                     </button>
                 )
             })}
         </div>
      </div>

      {/* 2. Empty State */}
      {selectedIds.length < 2 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-12 flex flex-col items-center justify-center text-center mt-6">
              <span className="text-5xl mb-4">⚖️</span>
              <h3 className="text-lg font-bold text-zinc-900">Выберите кандидатов</h3>
              <p className="text-zinc-500 max-w-sm mt-1">Для начала сравнения выберите минимум двух кандидатов в панели выше (максимум трёх).</p>
          </div>
      )}

      {/* 3. Comparison Grid */}
      {selectedIds.length >= 2 && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ gridTemplateColumns: `minmax(250px, 1fr) repeat(${selectedIds.length}, minmax(0, 2fr))`}}>
              
              {/* HEADER ROW - EMPTY CELL */}
              <div className="hidden md:block"></div>
              {/* HEADER CELLS */}
              {comparisonData.map(({ candidate, summary }, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between">
                         <h2 className="text-xl font-bold text-zinc-900 truncate" title={candidate.name}>{candidate.name}</h2>
                         <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 shrink-0">
                             {candidate.name.charAt(0)}
                         </div>
                      </div>
                      <p className="text-sm font-medium text-zinc-500">{candidate.currentCompany}</p>
                      
                      <div className="mt-4 flex flex-col items-start gap-3">
                         {/* Recommendation */}
                         {summary ? (
                            <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest
                                ${summary.recommendation === 'НАЗНАЧИТЬ_ОФФЕР' ? 'bg-emerald-100 text-emerald-800' : ''}
                                ${summary.recommendation === 'СИНХРОНИЗАЦИЯ' ? 'bg-amber-100 text-amber-800' : ''}
                                ${summary.recommendation === 'ОТКАЗ' ? 'bg-rose-100 text-rose-800' : ''}
                                ${summary.recommendation === 'ДОП_ИНТЕРВЬЮ' ? 'bg-blue-100 text-blue-800' : ''}
                            `}>
                                {summary.recommendation.replace('_', ' ')}
                            </span>
                         ) : <span className="text-xs text-zinc-400">Ожидание...</span>}

                         {/* Discrepancy Flag */}
                         {summary?.discrepancies && (
                             <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200" title={summary.discrepancies}>
                                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                 Разногласия экспертов
                             </div>
                         )}
                      </div>

                      {/* Overall Score giant visual */}
                      <div className="absolute -bottom-6 -right-4 opacity-[0.03] select-none pointer-events-none">
                          <span className="text-[120px] font-black">{summary?.overallScore.toFixed(1)}</span>
                      </div>
                  </div>
              ))}

              {/* OVERALL SCORE ROW */}
              <div className="flex items-center text-sm font-bold text-zinc-500 uppercase tracking-widest pl-2">Overall Score</div>
              {comparisonData.map(({ summary }, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                      <span className="text-4xl font-black text-zinc-900">{summary?.overallScore.toFixed(1) || '-'}</span>
                      {summary && <span className="text-lg text-zinc-400 font-medium">/ 5</span>}
                  </div>
              ))}

              <div className="col-span-full h-px bg-zinc-200 my-2"></div>

              {/* COMPETENCIES BLOCKS */}
              {plan?.blocks.map((block) => (
                  <div className="col-span-full grid" style={{ gridTemplateColumns: 'inherit' }} key={block.id}>
                      <div className="flex items-center text-sm font-bold text-zinc-900 py-3 pr-4 leading-tight">{block.title}</div>
                      {comparisonData.map(({ blockScores }, idx) => {
                          const avg = blockScores[block.id];
                          if (avg === null || avg === undefined) {
                              return <div key={idx} className="flex items-center text-xs text-zinc-400 italic py-3">N/A</div>
                          }
                          
                          // Quick visual bar + score
                          return (
                              <div key={idx} className="flex flex-col justify-center gap-1.5 py-3 pr-8">
                                  <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold text-zinc-900">{avg.toFixed(1)}</span>
                                  </div>
                                  <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                     <div className={`h-full transition-all duration-500 ${avg >= 4 ? 'bg-emerald-500' : avg <= 2 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${(avg / 5) * 100}%` }}></div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              ))}

              <div className="col-span-full h-px bg-zinc-200 my-4"></div>

              {/* STRENGTHS */}
              <div className="flex items-start text-xs font-bold text-emerald-600 uppercase tracking-widest pl-2">
                 <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 mt-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Сильные стороны
                 </div>
              </div>
              {comparisonData.map(({ summary }, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                     <ul className="text-sm text-zinc-700 space-y-2.5">
                         {summary?.strengths?.map((str, i) => (
                             <li key={i} className="flex gap-2">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span className="leading-relaxed font-medium">{str}</span>
                             </li>
                         )) || <li className="text-zinc-400 italic">Нет данных</li>}
                     </ul>
                  </div>
              ))}

              <div className="col-span-full h-px border-t border-dashed border-zinc-200 my-2"></div>

              {/* RISKS */}
              <div className="flex items-start text-xs font-bold text-rose-600 uppercase tracking-widest pl-2">
                 <div className="flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 mt-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Зоны Риска
                 </div>
              </div>
              {comparisonData.map(({ summary }, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                     <ul className="text-sm text-zinc-700 space-y-2.5">
                         {summary?.risks?.map((str, i) => (
                             <li key={i} className="flex gap-2">
                                <span className="text-rose-500 font-bold">•</span>
                                <span className="leading-relaxed font-medium">{str}</span>
                             </li>
                         )) || <li className="text-zinc-400 italic">Нет данных</li>}
                     </ul>
                  </div>
              ))}

              <div className="col-span-full h-px bg-zinc-200 my-2"></div>

              {/* ACTIONS */}
              <div></div> {/* Empty for first col */}
              {comparisonData.map(({ candidate }, idx) => (
                 <div key={idx} className="pt-2">
                     <Link href={`/candidates/${candidate.id}`} className="block w-full text-center py-2.5 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-sm hover:bg-zinc-200 hover:text-zinc-900 transition-colors">
                        Смотреть профиль &rarr;
                     </Link>
                 </div>
              ))}

          </div>
      )}
       {/* 4. AI Comparison Results */}
       {aiAnalysis && (
           <div className="flex flex-col gap-6 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="rounded-2xl border-2 border-violet-100 bg-gradient-to-b from-violet-50/50 to-white p-8 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                       <span className="text-9xl">✨</span>
                   </div>
                   
                   <div className="relative">
                       <div className="flex items-center gap-3 mb-6">
                           <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center text-white text-xl shadow-lg shadow-violet-200">
                               ⚖️
                           </div>
                           <h2 className="text-2xl font-black text-zinc-900 tracking-tight">ИИ-Сравнительный Анализ</h2>
                       </div>

                       <p className="text-zinc-600 text-lg font-medium leading-relaxed mb-8 border-l-4 border-violet-500 pl-6 py-1">
                           {aiAnalysis.summary}
                       </p>

                       <div className="grid md:grid-cols-2 gap-8 mb-10">
                           {aiAnalysis.comparisonPoints.map((point, i) => (
                               <div key={i} className="flex flex-col gap-2 p-5 rounded-2xl bg-white border border-violet-100 shadow-sm hover:shadow-md transition-shadow">
                                   <h4 className="font-black text-xs uppercase tracking-[0.2em] text-violet-600">{point.area}</h4>
                                   <p className="text-sm text-zinc-700 leading-relaxed font-medium">{point.analysis}</p>
                               </div>
                           ))}
                       </div>

                       <div className="rounded-2xl bg-zinc-900 p-8 text-white flex flex-col md:flex-row gap-8 items-center justify-between shadow-2xl">
                           <div className="flex flex-col gap-2">
                               <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Рекомендация ИИ</span>
                               <h3 className="text-3xl font-black tracking-tight">
                                   {aiAnalysis.winnerSuggestion === 'Draw' || aiAnalysis.winnerSuggestion === 'Ничья' 
                                      ? 'Оба кандидата равны' 
                                      : <span className="text-violet-400">В пользу {aiAnalysis.winnerSuggestion}</span>
                                   }
                               </h3>
                           </div>
                           <div className="max-w-md border-l border-zinc-700 pl-6 py-2">
                               <p className="text-zinc-300 text-sm italic leading-relaxed">
                                   "{aiAnalysis.rationale}"
                               </p>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}
