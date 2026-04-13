import Link from 'next/link';
import { ReactNode } from 'react';

export function Shell({ children }: { children: ReactNode }) {
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
          <select title="Роль" className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-1">
            <option value="HR">Вид: HR</option>
            <option value="INT1">Вид: Интервьюер (Анна)</option>
            <option value="INT2">Вид: Интервьюер (Джон)</option>
          </select>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white p-4 sm:flex shrink-0">
          <nav className="flex flex-col gap-2">
            <Link href="/" className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              Дашборд Вакансии
            </Link>
            <Link href="/vacancies/new" className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              Создать Вакансию
            </Link>
            <div className="my-2 border-t border-zinc-100" />
            <Link href="/interviews" className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
              Мои собеседования
            </Link>
          </nav>
        </aside>
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
