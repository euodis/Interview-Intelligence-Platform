import { prisma } from "@/lib/db";
import Link from "next/link";
import { auth } from "@/auth";

export default async function InterviewsDashboard() {
  const session = await auth();
  if (!session?.user) return null;

  const userRole = (session.user as any).role;
  const isInterviewer = userRole === 'INTERVIEWER';
  const isHR = userRole === 'HR';

  // Fetch sessions from DB based on role
  const sessions = await prisma.interviewSession.findMany({
    where: isInterviewer ? { interviewerId: session.user.id } : {},
    include: {
       application: {
         include: { vacancy: true }
       },
       interviewer: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {isHR ? 'Все собеседования' : 'Мои собеседования'}
          </h1>
          <p className="text-zinc-500 mt-1">
            {isHR ? 'Обзор всех запланированных и завершённых интервью.' : 'Кандидаты, назначенные вам для оценки.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {sessions.length === 0 && (
            <div className="col-span-2 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
               <span className="text-4xl mb-3 block">📋</span>
               <h3 className="font-semibold text-zinc-900">Нет назначенных интервью</h3>
               <p className="text-sm text-zinc-500 mt-1">Когда HR назначит вам кандидатов, они появятся здесь.</p>
            </div>
         )}
         {sessions.map(s => {
            const candidate = s.application;
            const vacancy = candidate?.vacancy;
            return (
                <div key={s.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg text-zinc-900">{candidate?.name || 'Неизвестно'}</h3>
                            <p className="text-sm text-zinc-500">{vacancy?.title}</p>
                            {isHR && (
                               <p className="text-xs text-zinc-400 mt-1">Интервьюер: {s.interviewer?.name}</p>
                            )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            s.status === 'ЗАВЕРШЕНО' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                            {s.status}
                        </span>
                    </div>

                    <div className="border-t border-zinc-100 pt-4 flex items-center justify-end">
                        {isInterviewer && s.status === 'ОЖИДАЕТ' ? (
                           <Link href={`/interviews/${s.id}`} className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 w-full text-center">
                              Начать Интервью
                           </Link>
                        ) : s.status === 'ЗАВЕРШЕНО' ? (
                           <Link href={`/interviews/${s.id}`} className="rounded-xl bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200 w-full text-center transition-colors">
                              {isHR ? 'Посмотреть протокол' : 'Протокол отправлен'}
                           </Link>
                        ) : isHR ? (
                           <span className="rounded-xl bg-amber-50 border border-amber-100 px-5 py-2 text-sm font-medium text-amber-700 w-full text-center">
                              Ожидает интервьюера
                           </span>
                        ) : (
                           <button disabled className="rounded-xl bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-400 w-full text-center">
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
