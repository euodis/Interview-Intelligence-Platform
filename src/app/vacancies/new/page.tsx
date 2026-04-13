export default function VacancySetup() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Создание Вакансии и ИИ-Плана</h1>
        <p className="text-zinc-500">Укажите ключевые компетенции, и ИИ сгенерирует структурированный план собеседования.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1.5">Название должности</label>
            <input 
              type="text" 
              placeholder="напр. Frontend Engineer (React)" 
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100 transition-all" 
              defaultValue="Senior Frontend Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1.5">Компетенции (теги)</label>
            <textarea 
              rows={3} 
              placeholder="напр. React, System Design, Communication..." 
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100 transition-all resize-none" 
              defaultValue="React, System Design, Communication"
            />
          </div>
          
          <div className="pt-2">
            <button className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700 transition-colors">
              <span className="text-lg leading-none">✨</span>
              Сгенерировать План Интервью
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-l-[3px] border-violet-500 border-y border-r border-y-zinc-200 border-r-zinc-200 bg-zinc-50/50 p-6 shadow-sm opacity-50 grayscale pointer-events-none">
        <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
           Редактор созданного плана (Preview)
        </h3>
        <p className="text-sm text-zinc-500 mb-6">Будет заполнено после нажатия кнопки "Сгенерировать".</p>
        
        <div className="flex flex-col gap-3">
          <div className="h-12 w-full bg-zinc-200 animate-pulse rounded-xl" />
          <div className="h-12 w-full bg-zinc-200 animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );
}
