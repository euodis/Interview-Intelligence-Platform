import { mockSessions, mockCandidates, mockVacancies } from "@/data/mocks";
import Link from "next/link";

export default function InterviewerDashboard() {
  const sessions = mockSessions;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Мои собеседования</h1>
          <p className="text-zinc-500 mt-1">Кандидаты, назначенные вам для оценки.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {sessions.map(session => {
            const candidate = mockCandidates.find(c => c.id === session.candidateId);
            const vacancy = mockVacancies.find(v => v.id === candidate?.vacancyId);
            return (
                <div key={session.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg text-zinc-900">{candidate?.name || 'Неизвестно'}</h3>
                            <p className="text-sm text-zinc-500">{vacancy?.title}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            session.status === 'ЗАВЕРШЕНО' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                            {session.status}
                        </span>
                    </div>

                    <div className="border-t border-zinc-100 pt-4 flex items-center justify-end">
                        {session.status === 'ОЖИДАЕТ' ? (
                           <Link href={`/interviews/${session.id}`} className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 w-full text-center">
                              Начать Интервью
                           </Link>
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
