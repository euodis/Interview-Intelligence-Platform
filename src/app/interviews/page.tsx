import { prisma } from "@/lib/db";
import Link from "next/link";
import { auth } from "@/auth";

export default async function InterviewsDashboard({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const currentFilter = resolvedSearchParams.status || 'all';

  const session = await auth();
  if (!session?.user) return null;

  const userRole = (session.user as any).role;
  const isInterviewer = userRole === 'INTERVIEWER';
  const isHR = userRole === 'HR';

  // Map filter to Prisma status
  const statusMapping: Record<string, string> = {
    'active': 'ОЖИДАЕТ',
    'completed': 'ЗАВЕРШЕНО'
  };

  const statusFilter = statusMapping[currentFilter];

  // Fetch sessions from DB based on role and filter
  const sessions = await prisma.interviewSession.findMany({
    where: {
      ...(isInterviewer ? { interviewerId: session.user.id } : {}),
      ...(statusFilter ? { status: statusFilter } : {})
    },
    include: {
      application: {
        include: { vacancy: true }
      },
      interviewer: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const TabLink = ({ filter, label }: { filter: string, label: string }) => {
    const isActive = currentFilter === filter;
    return (
      <Link
        href={`/interviews${filter === 'all' ? '' : `?status=${filter}`}`}
        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${isActive
          ? 'bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-900'
          : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {isHR ? 'Все собеседования' : 'Мои собеседования'}
          </h1>
          <p className="text-zinc-500 mt-1">
            {isHR ? 'Обзор всех запланированных и завершённых интервью.' : 'Кандидаты, назначенные вам для оценки.'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-zinc-50 border border-zinc-200 rounded-2xl w-fit">
          <TabLink filter="all" label="Все" />
          <TabLink filter="active" label="Активные" />
          <TabLink filter="completed" label="Завершенные" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-16 text-center">
            <span className="text-5xl mb-4 block opacity-50">📋</span>
            <h3 className="text-lg font-bold text-zinc-900">Ничего не найдено</h3>
            <p className="text-sm text-zinc-500 mt-1">В этой категории пока нет собеседований.</p>
            {currentFilter !== 'all' && (
              <Link href="/interviews" className="inline-block mt-4 text-sm font-bold text-violet-600 hover:text-violet-700 underline-offset-4 hover:underline">
                Сбросить фильтры
              </Link>
            )}
          </div>
        )}
        {sessions.map(s => {
          const candidate = s.application;
          const vacancy = candidate?.vacancy;
          return (
            <div key={s.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-4 hover:shadow-xl hover:border-zinc-300 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-zinc-900 truncate group-hover:text-violet-600 transition-colors">{candidate?.name || 'Неизвестно'}</h3>
                  <p className="text-sm font-medium text-zinc-500 truncate">{vacancy?.title}</p>
                  {isHR && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500 border border-zinc-200">
                        {s.interviewer?.name?.charAt(0)}
                      </div>
                      <p className="text-[11px] font-semibold text-zinc-400">Интервьюер: {s.interviewer?.name}</p>
                    </div>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${s.status === 'ЗАВЕРШЕНО' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                  {s.status === 'ЗАВЕРШЕНО' ? 'Готово' : 'Активно'}
                </span>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-end gap-2">
                {isInterviewer && s.status === 'ОЖИДАЕТ' ? (
                  <Link href={`/interviews/${s.id}`} className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-black w-full text-center transition-all hover:scale-[1.02] active:scale-[0.98]">
                    Начать Интервью
                  </Link>
                ) : s.status === 'ЗАВЕРШЕНО' ? (
                  <Link href={`/interviews/${s.id}`} className="rounded-xl bg-zinc-50 border border-zinc-200 px-5 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-100 w-full text-center transition-all">
                    {isHR ? 'Протокол' : 'Протокол отправлен'}
                  </Link>
                ) : isHR ? (
                  <span className="rounded-xl bg-zinc-50 border border-zinc-100 px-5 py-2.5 text-sm font-bold text-zinc-400 w-full text-center">
                    В процессе...
                  </span>
                ) : (
                  <button disabled className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-bold text-zinc-300 w-full text-center">
                    Протокол Отправлен
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
