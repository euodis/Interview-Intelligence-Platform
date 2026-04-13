import Link from 'next/link';
import { prisma } from '@/lib/db';

export default async function Home() {
  const vacancies = await prisma.vacancy.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      applications: true,
      competencies: {
        include: { competency: true }
      }
    }
  });

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Все Вакансии</h1>
          <p className="text-zinc-500 mt-1">Активные позиции и пайплайн кандидатов.</p>
        </div>
        <Link 
          href="/vacancies/new" 
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700 transition-colors"
        >
          + Создать Вакансию
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vacancies.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-zinc-200 bg-white p-10 flex flex-col items-center text-center">
             <span className="text-4xl mb-3">📭</span>
             <h3 className="text-lg font-bold text-zinc-900">Нет активных вакансий</h3>
             <p className="text-zinc-500 max-w-sm mt-1">Создайте новую вакансию, настройте профиль компетенций и запустите ИИ-генерацию плана интервью.</p>
             <Link href="/vacancies/new" className="mt-4 rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-all">
                Создать
             </Link>
          </div>
        ) : (
          vacancies.map(vacancy => (
            <Link key={vacancy.id} href={`/vacancies/${vacancy.id}`} className="block group">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-4 group-hover:shadow-md group-hover:border-violet-200 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 group-hover:text-violet-700 transition-colors">{vacancy.title}</h3>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-zinc-100 text-zinc-600">
                      {vacancy.level}
                    </span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-1.5 flex flex-col items-center">
                    <span className="text-xl font-bold text-zinc-900 leading-none">{vacancy.applications.length}</span>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mt-1">Кандидатов</span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4 flex items-center gap-2 flex-wrap">
                  {vacancy.competencies.slice(0, 3).map(vc => (
                    <span key={vc.competencyId} className="text-xs font-medium text-zinc-500 bg-zinc-50 px-2 py-1 rounded border border-zinc-200">
                      {vc.competency.name}
                    </span>
                  ))}
                  {vacancy.competencies.length > 3 && (
                     <span className="text-xs font-medium text-zinc-400">+{vacancy.competencies.length - 3}</span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
