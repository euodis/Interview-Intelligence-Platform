import { mockPlans, mockSessions, mockCandidates, mockVacancies } from "@/data/mocks";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function InterviewProtocol({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = mockSessions.find(s => s.id === resolvedParams.id);
  if (!session) return notFound();
  
  const candidate = mockCandidates.find(c => c.id === session.candidateId);
  const vacancy = mockVacancies.find(v => v.id === candidate?.vacancyId);
  const plan = mockPlans.find(p => p.vacancyId === vacancy?.id);

  if (!plan) return notFound();

  return (
    <div className="h-[calc(100vh-8rem)] w-full flex flex-col pt-0">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
         <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Вы проводите собеседование: {candidate?.name || 'Неизвестно'}</h1>
            <p className="text-sm text-zinc-500 mt-1">Должность: {vacancy?.title}</p>
         </div>
         <Link href="/interviews" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
             &larr; Назад к списку
         </Link>
      </div>

      <div className="flex flex-1 overflow-hidden mt-4 gap-6">
          {/* Left Panel: AI Plan */}
          <div className="w-1/2 flex flex-col bg-zinc-50/50 rounded-2xl border border-zinc-200 shadow-inner overflow-y-auto">
             <div className="p-4 border-b border-zinc-200 bg-white sticky top-0 bg-opacity-90 backdrop-blur z-10">
                <h3 className="font-semibold text-zinc-900">ИИ-План Интервью</h3>
             </div>
             <div className="p-4 flex flex-col gap-4">
                {plan.blocks.map((block, i) => (
                    <div key={block.id} className="bg-white border text-left border-zinc-200 rounded-xl p-4 shadow-sm hover:border-violet-300 transition-colors cursor-pointer group relative">
                        <div className="flex items-start justify-between font-medium text-zinc-900">
                           <span className="pr-4">{i+1}. {block.title}</span>
                           {block.required && <span className="shrink-0 text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full ring-1 ring-rose-200 mt-0.5">Обязательно</span>}
                        </div>
                        <ul className="mt-3 text-sm text-zinc-600 list-disc list-outside space-y-2 ml-4">
                           {block.questions.map((q, idx) => <li key={idx} className="leading-relaxed">{q}</li>)}
                        </ul>
                    </div>
                ))}
             </div>
          </div>

          {/* Right Panel: Scoring Form */}
          <div className="w-1/2 flex flex-col bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden relative">
             <div className="p-4 border-b border-zinc-200 bg-zinc-50 sticky top-0 flex justify-between items-center z-10">
                <h3 className="font-semibold text-zinc-900">Заполнение Протокола</h3>
                <span className="text-xs text-zinc-500 font-medium">Автосохранение включено</span>
             </div>
             
             <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-10">
                 {plan.blocks.map((block, idx) => (
                     <div key={block.id} className={`flex flex-col gap-3 pb-8 ${idx !== plan.blocks.length - 1 ? 'border-b border-zinc-100' : ''}`}>
                        <h4 className="font-medium text-zinc-900">{idx+1}. Оценка для: {block.title}</h4>
                        
                        <div className="flex items-center gap-2 mt-1">
                           {[1,2,3,4,5].map(num => (
                              <button key={num} title={`Поставить ${num}`} className="w-12 h-12 rounded-xl border border-zinc-200 font-semibold text-zinc-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-colors focus:bg-violet-600 focus:text-white focus:border-violet-600">
                                  {num}
                              </button>
                           ))}
                        </div>

                        <textarea 
                            rows={3} 
                            placeholder="Добавьте свои комментарии по этому блоку..." 
                            className="w-full mt-3 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-4 focus:ring-violet-100 resize-none transition-all"
                        />
                     </div>
                 ))}
             </div>

             <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end shrink-0 z-10">
                <button className="rounded-xl bg-zinc-900 px-8 py-3 text-sm font-medium text-white shadow-sm hover:bg-black transition-colors focus:ring-4 focus:ring-zinc-200">
                   Отправить Протокол
                </button>
             </div>
          </div>
      </div>
    </div>
  );
}
