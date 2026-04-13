"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Local types for the builder
interface BuilderBlock {
  id: string;
  title: string;
  goal: string;
  questions: string[];
  required: boolean;
}

const mockAIResponse: BuilderBlock[] = [
  {
    id: "b-1",
    title: "React Architecture & Patterns",
    goal: "Evaluate deep understanding of React ecosystem, performance characteristics, and ability to design complex frontend apps.",
    questions: [
      "Как работает алгоритм реконсиляции и Fiber?",
      "Приведите пример, когда useMemo/useCallback скорее навредят, чем помогут.",
      "Как организовать стейт в приложении с множеством потоков данных?"
    ],
    required: true,
  },
  {
    id: "b-2",
    title: "System Design",
    goal: "Check the ability to build scalable architecture, choose rendering strategies, and handle CI/CD pipelines.",
    questions: [
      "Спроектируйте архитектуру стриминговой платформы (напр., Twitch).",
      "Когда стоит выбрать SSR, а когда SSG или SPA?",
    ],
    required: true,
  },
  {
    id: "b-3",
    title: "Soft Skills & Engineering Culture",
    goal: "Assess mentorship experience, conflict resolution, and stakeholder management.",
    questions: [
      "Как вы проводите код-ревью для Junior разработчиков?",
      "Расскажите о случае, когда вам пришлось спорить с бизнесом из-за технического долга."
    ],
    required: false,
  }
];

export default function VacancySetup() {
  const router = useRouter();
  
  // Form State
  const [roleTitle, setRoleTitle] = useState("Senior Frontend Engineer");
  const [level, setLevel] = useState("Senior");
  const [competencies, setCompetencies] = useState("React, System Design, Communication");
  const [context, setContext] = useState("");

  // Editor State
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);

  // Handlers
  const handleGenerate = () => {
    if (!roleTitle || !competencies) return;
    setIsGenerating(true);
    setHasGenerated(false);
    
    // Simulate AI Generation
    setTimeout(() => {
        setBlocks(JSON.parse(JSON.stringify(mockAIResponse))); // Deep copy
        setIsGenerating(false);
        setHasGenerated(true);
    }, 2000);
  };

  const updateBlock = (blockId: string, field: keyof BuilderBlock, value: any) => {
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, [field]: value } : b));
  };

  const updateQuestion = (blockId: string, qIndex: number, newValue: string) => {
      setBlocks(prev => prev.map(b => {
          if (b.id !== blockId) return b;
          const newQ = [...b.questions];
          newQ[qIndex] = newValue;
          return { ...b, questions: newQ };
      }));
  };

  const removeQuestion = (blockId: string, qIndex: number) => {
      setBlocks(prev => prev.map(b => {
          if (b.id !== blockId) return b;
          const newQ = [...b.questions];
          newQ.splice(qIndex, 1);
          return { ...b, questions: newQ };
      }));
  };

  const addQuestion = (blockId: string) => {
      setBlocks(prev => prev.map(b => {
          if (b.id !== blockId) return b;
          return { ...b, questions: [...b.questions, ""] };
      }));
  };

  const addBlock = () => {
      setBlocks(prev => [...prev, {
          id: `new-${Date.now()}`,
          title: "Новый блок",
          goal: "",
          questions: [""],
          required: false,
      }]);
  };

  const removeBlock = (blockId: string) => {
      setBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const handleSave = () => {
      // Logic for saving would go here
      router.push("/");
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <div className="text-sm border-b border-zinc-200 pb-2 mb-2">
           <Link href="/" className="text-zinc-500 hover:text-zinc-900 border-zinc-500 pb-0.5">Все Вакансии</Link>{' '} / Создание плана
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Создание Вакансии и ИИ-Плана</h1>
        <p className="text-zinc-500">Укажите ключевые требования, и ИИ сгенерирует структурированную дорожную карту собеседования. Конечный контроль — за вами.</p>
      </div>

      {/* STEP 1: PARAMETERS */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm flex flex-col gap-6">
        <h3 className="text-lg font-semibold text-zinc-900 border-b border-zinc-100 pb-3">1. Вводные данные для ИИ</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
            <div className="col-span-1">
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">Должность (Role Title)</label>
                <input 
                    type="text" 
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer" 
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all font-medium text-zinc-900" 
                />
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">Уровень (Level)</label>
                <select 
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all font-medium text-zinc-900" 
                >
                    <option value="Middle">Middle</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                </select>
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">Компетенции (Через запятую)</label>
                <input 
                    type="text"
                    value={competencies}
                    onChange={(e) => setCompetencies(e.target.value)}
                    placeholder="Напр., React, System Design, Mentorship..." 
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all font-medium text-zinc-900" 
                />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">Доп. контекст (Optional)</label>
                <textarea 
                    rows={2} 
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Особенности проекта, стек технологий, на что сделать упор..." 
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all font-medium text-zinc-900 resize-none" 
                />
            </div>
        </div>
          
        <div className="pt-2 flex justify-end">
            <button 
               onClick={handleGenerate}
               disabled={isGenerating}
               className={`flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all focus:ring-4 focus:ring-violet-100 ${
                  isGenerating ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'
               }`}
            >
               {isGenerating ? (
                   <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Генерация плана...
                   </>
               ) : (
                   <>
                      <span className="text-lg leading-none">✨</span>
                      Сгенерировать План (AI)
                   </>
               )}
            </button>
        </div>
      </div>

      {/* STEP 2: PLAN EDITOR */}
      {blocks.length > 0 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-zinc-900 border-b-2 border-violet-600 pb-1 inline-block">2. Структура Интервью</h3>
                  <p className="text-sm text-zinc-500 font-medium">{blocks.length} Блока компетенций</p>
              </div>

              <div className="flex flex-col gap-6">
                  {blocks.map((block, bIndex) => (
                      <div key={block.id} className={`rounded-2xl border bg-white p-6 shadow-sm transition-all relative ${block.required ? 'border-violet-200 shadow-violet-50' : 'border-zinc-200'}`}>
                          
                          {/* Block Actions */}
                          <div className="absolute right-4 top-4 flex items-center gap-2">
                              <label className="flex items-center gap-2 text-sm text-zinc-600 font-medium cursor-pointer bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition-colors">
                                  <input 
                                     type="checkbox" 
                                     className="rounded text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                                     checked={block.required}
                                     onChange={(e) => updateBlock(block.id, 'required', e.target.checked)}
                                  />
                                  Required
                              </label>
                              <button 
                                 title="Удалить блок"
                                 onClick={() => removeBlock(block.id)}
                                 className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              </button>
                          </div>

                          <div className="flex flex-col gap-4 mt-2 max-w-[90%]">
                              {/* Block TiTle */}
                              <div>
                                 <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Название блока</label>
                                 <input 
                                     value={block.title}
                                     onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                                     placeholder="Краткое название компетенции"
                                     className="w-full text-lg font-bold text-zinc-900 border-0 bg-transparent px-1 pb-1 border-b border-dashed border-zinc-300 focus:ring-0 focus:border-violet-500 outline-none hover:border-zinc-400 transition-colors placeholder-zinc-300"
                                 />
                              </div>

                              {/* Block Goal */}
                              <div>
                                 <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1 mt-2">Цель блока</label>
                                 <input 
                                     value={block.goal}
                                     onChange={(e) => updateBlock(block.id, 'goal', e.target.value)}
                                     placeholder="Какую информацию мы хотим выяснить у кандидата?"
                                     className="w-full text-sm font-medium text-zinc-600 border-0 bg-transparent px-1 pb-1 border-b border-dashed border-zinc-300 focus:ring-0 focus:border-violet-500 outline-none hover:border-zinc-400 transition-colors placeholder-zinc-300"
                                 />
                              </div>

                              {/* Questions */}
                              <div className="mt-4 flex flex-col gap-3">
                                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1">Вопросы / Темы для обсуждения</label>
                                  {(block.questions || []).map((q, qIndex) => (
                                      <div key={qIndex} className="flex flex-col group relative">
                                          <div className="flex gap-3 items-start">
                                              <span className="text-zinc-400 font-bold mt-2.5 w-6 text-right shrink-0">{qIndex + 1}.</span>
                                              <textarea 
                                                  value={q}
                                                  onChange={(e) => updateQuestion(block.id, qIndex, e.target.value)}
                                                  placeholder="Сформулируйте вопрос..."
                                                  rows={useTextareaHeight(q)}
                                                  className="flex-1 rounded-xl border border-transparent hover:border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all font-medium text-zinc-900 resize-none shadow-sm"
                                              />
                                              <button 
                                                  onClick={() => removeQuestion(block.id, qIndex)}
                                                  className="w-8 h-8 rounded-lg mt-1 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100"
                                                  title="Удалить вопрос"
                                              >
                                                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                                  
                                  <div className="ml-9 mt-1">
                                     <button 
                                        onClick={() => addQuestion(block.id)}
                                        className="text-sm font-semibold text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1"
                                     >
                                         + Добавить вопрос
                                     </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
                  
                  <button 
                      onClick={addBlock}
                      className="w-full rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-6 flex items-center justify-center text-sm font-semibold text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
                  >
                      + Добавить пустой блок
                  </button>
              </div>

              {/* Final Actions */}
              <div className="mt-8 pt-6 border-t border-zinc-200 flex justify-between items-center sticky bottom-6 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-lg ring-1 ring-zinc-900/5">
                 <div className="flex flex-col">
                    <span className="text-zinc-900 font-bold">{roleTitle}</span>
                    <span className="text-xs text-zinc-500 font-medium">У ИИ-плана {blocks.length} секций для оценки</span>
                 </div>
                 <div className="flex gap-4">
                    <button className="px-6 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                       Отмена
                    </button>
                    <button onClick={handleSave} className="rounded-xl bg-zinc-900 px-8 py-2.5 text-sm font-medium text-white shadow-sm hover:focus:ring-4 hover:ring-zinc-200 hover:bg-black transition-all">
                       Утвердить и Сохранить Вакансию
                    </button>
                 </div>
              </div>
          </div>
      )}

      {/* Loading Skeleton */}
      {!hasGenerated && isGenerating && (
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm flex flex-col gap-6 animate-pulse mt-4">
             <div className="h-6 bg-zinc-200 rounded w-1/3 mb-4"></div>
             <div className="flex flex-col gap-3">
                 <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                 <div className="h-4 bg-zinc-200 rounded w-5/6"></div>
                 <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
             </div>
             <div className="h-40 bg-zinc-50 rounded-xl border border-zinc-100 mt-4"></div>
          </div>
      )}
    </div>
  );
}

// Utility for textarea autoheight (simple heuristic)
function useTextareaHeight(text: string) {
    if (!text) return 1;
    const lines = text.split('\n').length;
    return Math.max(1, Math.min(6, lines + Math.floor(text.length / 80)));
}
