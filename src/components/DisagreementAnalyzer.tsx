"use client";

import { useState, useEffect } from "react";
import { analyzeDisagreements, DisagreementInterpretation } from "@/lib/ai";

export type DisagreementConflict = {
    blockId: string;
    blockTitle: string;
    evaluations: Array<{ interviewer: string; score: number; notes: string }>;
};

export default function DisagreementAnalyzer({ 
    candidateName, 
    conflicts 
}: { 
    candidateName: string, 
    conflicts: DisagreementConflict[] 
}) {
    const [interpretations, setInterpretations] = useState<DisagreementInterpretation[] | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    if (conflicts.length === 0) return null;

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeDisagreements({
                candidateName,
                conflicts: conflicts.map((c: DisagreementConflict) => ({
                    blockTitle: c.blockTitle,
                    evaluations: c.evaluations
                }))
            });
            setInterpretations(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 shadow-sm relative overflow-hidden flex flex-col mt-4">
            {/* Header Area */}
            <div className="p-6 pb-4 flex items-start gap-4 border-b border-amber-200/50">
               <div className="flex-shrink-0 bg-amber-100 text-amber-600 w-12 h-12 rounded-full flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
               </div>
               <div className="z-10 flex-1">
                   <div className="flex items-center justify-between">
                       <h3 className="text-lg font-bold text-amber-900 mb-1">Выявлены полярные оценки</h3>
                       {!interpretations && !isAnalyzing && (
                           <button 
                               onClick={handleAnalyze}
                               className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                           >
                               <span className="text-sm">✨</span> Анализировать расхождение
                           </button>
                       )}
                   </div>
                   <p className="text-amber-800 font-medium leading-relaxed max-w-4xl text-sm">
                      Разница между оценками экспертов превышает 2 балла по {conflicts.length} компетенциям. Это может свидетельствовать о разном понимании требований или сильных сторонах кандидата в нетипичных областях.
                   </p>
               </div>
            </div>

            {/* Analysis Loading State */}
            {isAnalyzing && (
                <div className="p-8 flex flex-col items-center justify-center gap-4 bg-amber-50/50">
                   <svg className="animate-spin h-6 w-6 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   <p className="text-sm font-semibold text-amber-700 animate-pulse">ИИ изучает заметки экспертов...</p>
                </div>
            )}

            {/* Analysis Results */}
            {interpretations && (
                <div className="flex flex-col bg-white">
                    {conflicts.map((conflict: DisagreementConflict, idx: number) => {
                        const aiInterp = interpretations.find(i => i.blockTitle === conflict.blockTitle);
                        
                        return (
                            <div key={idx} className="p-6 border-b border-zinc-100 last:border-0 flex flex-col gap-6">
                                {/* Context */}
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-3">Блок: {conflict.blockTitle}</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {conflict.evaluations.map((ev: any, i: number) => (
                                            <div key={i} className="flex gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                                                <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg font-bold text-sm shadow-sm ring-1 ring-inset ${
                                                    ev.score >= 4 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : ev.score <= 2 ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-amber-50 text-amber-700 ring-amber-200'
                                                }`}>{ev.score}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-zinc-500 mb-1">{ev.interviewer}</span>
                                                    <p className="text-sm text-zinc-700 italic leading-relaxed">"{ev.notes}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* AI Interpretation */}
                                {aiInterp && (
                                    <div className="flex flex-col gap-3 p-5 rounded-xl border border-violet-100 bg-violet-50/50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">✨</span>
                                            <h5 className="font-bold text-violet-900 text-sm">ИИ-Объяснение конфликта</h5>
                                        </div>
                                        
                                        <div className="flex flex-col gap-4 mt-2">
                                            <p className="text-sm text-zinc-800 font-medium leading-relaxed">
                                                {aiInterp.reason}
                                            </p>
                                            
                                            <div className="flex flex-wrap gap-4 items-center pt-3 border-t border-violet-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Сигнал:</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest
                                                        ${aiInterp.isRisk ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}
                                                    `}>{aiInterp.isRisk ? 'Red Flag / Risk' : 'Healthy Disagreement'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Рекомендация:</span>
                                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-violet-200 shadow-sm">
                                                        <span className="text-[10px] font-black text-violet-700 uppercase tracking-widest">{aiInterp.recommendedAction.replace('_', ' ')}</span>
                                                        <span className="text-xs text-zinc-600 font-medium border-l border-zinc-200 pl-2">{aiInterp.actionDescription}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
