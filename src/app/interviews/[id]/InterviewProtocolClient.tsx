"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitInterviewProtocol } from "@/actions/interview.actions";

type SignalType = 'STRONG' | 'MIXED' | 'CONCERN' | null;
type ConfidenceType = 'HIGH' | 'MEDIUM' | 'LOW' | null;

interface BlockState {
  score: number | null;
  notes: string;
  signal: SignalType;
}

export default function InterviewProtocolClient({ session }: { session: any }) {
  const router = useRouter();

  // Load from props
  const candidate = session.application;
  const vacancy = candidate?.vacancy;
  const plan = vacancy?.interviewPlan;

  // Form State
  const [formState, setFormState] = useState<Record<string, BlockState>>({});
  const [overallNotes, setOverallNotes] = useState("");
  const [confidence, setConfidence] = useState<ConfidenceType>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize form state
  useEffect(() => {
    if (plan && Object.keys(formState).length === 0) {
      const initial: Record<string, BlockState> = {};
      plan.blocks.forEach((b:any) => {
        // Load existing evaluations if any
        const existing = session.evaluations.find((e:any) => e.blockId === b.id);
        initial[b.id] = { 
            score: existing?.score || null, 
            notes: existing?.notes || "", 
            signal: (existing?.signal as SignalType) || null 
        };
      });
      setFormState(initial);
      
      if (session.overallNotes) setOverallNotes(session.overallNotes);
      if (session.confidence) setConfidence(session.confidence as ConfidenceType);
    }
  }, [plan, formState, session]);

  // Simulate Autosave
  useEffect(() => {
    if (Object.keys(formState).length === 0) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);
    return () => clearTimeout(timer);
  }, [formState, overallNotes, confidence]);

  if (!session || !plan) {
    return <div className="p-10 text-center">Сессия или план не найдены</div>;
  }

  // Validation
  const requiredBlocks = plan.blocks.filter((b:any) => b.required);
  const completeRequired = requiredBlocks.every((b:any) => formState[b.id]?.score !== null && formState[b.id]?.notes.trim().length > 5);
  const canSubmit = completeRequired && confidence !== null && overallNotes.trim().length > 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setIsSaving(true);
    const evals = Object.entries(formState).map(([blockId, state]) => ({
       blockId,
       score: state.score!,
       notes: state.notes,
       signal: state.signal || undefined
    }));

    await submitInterviewProtocol({
       sessionId: session.id,
       evaluations: evals,
       overallNotes,
       confidence: confidence!
    });
    
    setIsSaving(false);
    router.push(`/candidates/${candidate.id}`);
  };

  const updateBlock = (blockId: string, field: keyof BlockState, value: any) => {
    setFormState(prev => ({
      ...prev,
      [blockId]: { ...prev[blockId], [field]: value }
    }));
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full pb-24">
      {/* 1. Protocol Header */}
      <div className="flex items-center gap-4 mb-6">
         <Link href="/interviews" className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors">
            &larr;
         </Link>
         <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Интервью: {candidate?.name}</h1>
            <p className="text-sm font-medium text-zinc-500">{vacancy?.title} • Session Setup</p>
         </div>
         <div className="ml-auto flex items-center gap-2 text-xs font-medium text-zinc-400">
            {isSaving ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Сохранение...
                </>
            ) : lastSaved ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Сохранено {lastSaved.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </>
            ) : (
                "Автосохранение включено"
            )}
         </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
        {/* 2. Intelligent Scoring Blocks */}
        {plan.blocks.map((block:any, i:number) => {
            const state = formState[block.id];
            if (!state) return null;

            return (
                <div key={block.id} className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-colors ${
                    state.score ? 'border-zinc-200' : block.required ? 'border-violet-200 shadow-violet-50' : 'border-zinc-200'
                }`}>
                    
                    {/* Block Info Section (Top half) */}
                    <div className="bg-zinc-50/50 p-6 border-b border-zinc-100 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-bold text-zinc-900">{i+1}. {block.title}</h3>
                                  {block.required && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-800">Required</span>}
                               </div>
                               {/* Added dynamic check for goal (with fallback) */}
                               <p className="text-sm font-medium text-zinc-500 max-w-2xl">Цель: {(block as any).goal || "Оценить компетенции кандидата в этой области."}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Вопросы для обсуждения</h4>
                            <ul className="text-sm text-zinc-700 list-disc list-inside space-y-1.5 marker:text-violet-400">
                                {block.questions.map((q:any, idx:number) => <li key={idx}>{q.text}</li>)}
                            </ul>
                        </div>
                    </div>

                    {/* Block Scoring Section (Bottom half) */}
                    <div className="p-6 flex flex-col gap-6">
                        
                        {/* Scoring Matrix */}
                        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                            <div>
                               <label className="block text-xs font-bold text-zinc-900 uppercase tracking-widest mb-3">Оценка компетенции</label>
                               <div className="flex items-center gap-2">
                                  {[1,2,3,4,5].map(num => (
                                     <button 
                                        key={num}
                                        type="button"
                                        onClick={() => updateBlock(block.id, 'score', num)}
                                        onDoubleClick={() => updateBlock(block.id, 'score', null)} // to reset
                                        className={`w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all focus:outline-none flex flex-col items-center justify-center
                                            ${state.score === num 
                                                ? (num >= 4 ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : num === 3 ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-rose-50 border-rose-500 text-rose-700')
                                                : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:bg-zinc-50'
                                            }
                                        `}
                                     >
                                         {num}
                                     </button>
                                  ))}
                                  <span className="text-xs font-medium text-zinc-400 ml-2">1 = Слабо, 5 = Идеально</span>
                               </div>
                            </div>
                            
                            {/* Quick Signal */}
                            <div className="md:ml-auto">
                                <label className="block text-xs font-bold text-zinc-900 uppercase tracking-widest mb-3 md:text-right">Quick Signal</label>
                                <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
                                    <button 
                                        type="button"
                                        onClick={() => updateBlock(block.id, 'signal', 'STRONG')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${state.signal === 'STRONG' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-transparent text-zinc-500 hover:text-zinc-900'}`}
                                    >Strong</button>
                                    <button 
                                        type="button"
                                        onClick={() => updateBlock(block.id, 'signal', 'MIXED')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${state.signal === 'MIXED' ? 'bg-amber-500 text-white shadow-sm' : 'bg-transparent text-zinc-500 hover:text-zinc-900'}`}
                                    >Mixed</button>
                                    <button 
                                        type="button"
                                        onClick={() => updateBlock(block.id, 'signal', 'CONCERN')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${state.signal === 'CONCERN' ? 'bg-rose-500 text-white shadow-sm' : 'bg-transparent text-zinc-500 hover:text-zinc-900'}`}
                                    >Concern</button>
                                </div>
                            </div>
                        </div>

                        {/* Notes Input */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-widest mb-2 flex items-center justify-between">
                                Детальные заметки
                                <span className={`text-[10px] ${state.notes.trim().length > 5 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {block.required && state.notes.trim().length < 6 ? 'Необходимо краткое обоснование оценки' : ''}
                                </span>
                            </label>
                            <textarea 
                                rows={3}
                                value={state.notes}
                                onChange={(e) => updateBlock(block.id, 'notes', e.target.value)}
                                placeholder="Опишите, как ответил кандидат, на чем запнулся, какие сильные стороны проявил..."
                                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 resize-none transition-all placeholder:text-zinc-400"
                            />
                        </div>

                    </div>
                </div>
            )
        })}

        {/* 3. Global Section */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-900 p-8 shadow-md text-white mt-4 flex flex-col gap-6">
            <div>
               <h3 className="text-xl font-bold tracking-tight mb-1">Итоговое впечатление (Overall Impression)</h3>
               <p className="text-sm text-zinc-400">Резюмируйте свои мысли. Это поможет сгенерировать точное ИИ-summary.</p>
            </div>

            <textarea 
                rows={4}
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder="Как вам кандидат в целом? Насколько он мэтчится с командой?..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-white outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 resize-none transition-all placeholder:text-zinc-600"
            />

            <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Ваша уверенность в оценках (Confidence Level)</label>
               <div className="grid grid-cols-3 gap-3">
                   <button 
                       type="button"
                       onClick={() => setConfidence('HIGH')}
                       className={`rounded-xl border py-3 text-sm font-bold transition-all ${confidence === 'HIGH' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}
                   >
                       Высокая (Все ясно)
                   </button>
                   <button 
                       type="button"
                       onClick={() => setConfidence('MEDIUM')}
                       className={`rounded-xl border py-3 text-sm font-bold transition-all ${confidence === 'MEDIUM' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}
                   >
                       Средняя
                   </button>
                   <button 
                       type="button"
                       onClick={() => setConfidence('LOW')}
                       className={`rounded-xl border py-3 text-sm font-bold transition-all ${confidence === 'LOW' ? 'bg-violet-600 border-violet-500 text-white' : 'bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}
                   >
                       Низкая (Сомневаюсь)
                   </button>
               </div>
            </div>
        </div>

        {/* 4. Submission */}
        <div className="sticky bottom-6 z-10 flex items-center justify-between mt-4 rounded-full border border-zinc-200 bg-white/90 backdrop-blur-md p-2 shadow-lg ring-1 ring-zinc-900/5 px-6">
            <span className="text-sm font-medium text-zinc-500">
               {completeRequired 
                   ? (confidence !== null && overallNotes.length > 10 ? '✓ Все данные заполнены' : 'Заполните итоговое впечатление и уверенность')
                   : '⚠️ Заполните все обязательные блоки'}
            </span>
            <button 
                type="submit"
                disabled={!canSubmit}
                className={`rounded-full px-8 py-3 text-sm font-bold shadow-sm transition-all focus:ring-4 focus:ring-violet-100 ${
                    canSubmit ? 'bg-zinc-900 text-white hover:bg-black' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                }`}
            >
                Отправить Протокол
            </button>
        </div>

      </form>
    </div>
  );
}
