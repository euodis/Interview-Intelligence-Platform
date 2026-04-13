import Link from 'next/link';
import { ReactNode } from 'react';
import { auth } from '@/auth';
import { logOut } from '@/actions/auth.actions';

export async function Shell({ children }: { children: ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const isInterviewer = (user as any)?.role === 'INTERVIEWER';
  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-50 font-sans text-zinc-900">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-200 bg-white px-6 shadow-sm">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl tracking-tight text-zinc-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <span className="text-lg">II</span>
          </div>
          <span className="hidden sm:inline">Платформа Интервью</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {user && (
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold border border-violet-200">
                      {user.name?.charAt(0) || 'U'}
                   </div>
                   <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
                      <span className="text-sm font-semibold text-zinc-900">{user.name}</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{(user as any).role}</span>
                   </div>
                </div>
                <form action={logOut}>
                   <button type="submit" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg">
                      Выйти
                   </button>
                </form>
             </div>
          )}
        </div>
      </header>
      <div className="flex flex-1">
        {user && (
          <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white p-4 sm:flex shrink-0">
            <nav className="flex flex-col gap-2">
              {!isInterviewer && (
                <>
                  <Link href="/" className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                    Дашборд Вакансии
                  </Link>
                  <Link href="/vacancies/new" className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                    Создать Вакансию
                  </Link>
                  <div className="my-2 border-t border-zinc-100" />
                </>
              )}
              <Link href="/interviews" className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                Мои собеседования
              </Link>
            </nav>
          </aside>
        )}
        <main className="flex-1 p-6 md:p-8 shrink-0 overflow-x-hidden min-h-0">
            {/* Added a consistent max-width wrapper so all pages have the same horizontal padding & alignment */}
            <div className="max-w-5xl mx-auto w-full">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}
