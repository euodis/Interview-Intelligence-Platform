'use client';

import { useActionState } from 'react';
import { authenticate } from '@/actions/auth.actions';

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticate,
    undefined,
  );

  const fillDemo = (email: string) => {
    const emailField = document.getElementById('email') as HTMLInputElement;
    const passwordField = document.getElementById('password') as HTMLInputElement;
    if (emailField && passwordField) {
      emailField.value = email;
      passwordField.value = 'password';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-sm border border-zinc-200">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white mx-auto">
             <span className="text-2xl font-bold">II</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900">
            Платформа Интервью
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500">
            Войдите под вашей ролью (MVP Demo)
          </p>
        </div>
        
        <form className="mt-8 space-y-6" action={dispatch}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email адрес</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 placeholder-zinc-500 text-zinc-900 rounded-lg focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm mt-1"
                placeholder="you@demo.local"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 placeholder-zinc-500 text-zinc-900 rounded-lg focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-zinc-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-900">
                Запомнить меня
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Вход в систему...' : 'Войти'}
            </button>
          </div>
          
          <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
            {errorMessage && (
              <p className="text-sm text-rose-500">{errorMessage}</p>
            )}
          </div>
        </form>

        <div className="mt-6 border-t border-zinc-100 pt-6">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mb-3 text-center">Демо-Аккаунты</p>
            <div className="flex flex-col gap-2">
                <button onClick={() => fillDemo('hr@demo.local')} type="button" className="text-sm w-full py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg font-medium transition-colors">
                    HR Director
                </button>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    <button onClick={() => fillDemo('interviewer1@demo.local')} type="button" className="text-xs py-2 px-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg font-medium transition-colors truncate">
                        Senior Frontend
                    </button>
                    <button onClick={() => fillDemo('interviewer2@demo.local')} type="button" className="text-xs py-2 px-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg font-medium transition-colors truncate">
                        Sys Architect
                    </button>
                    <button onClick={() => fillDemo('frontend@demo.local')} type="button" className="text-xs py-2 px-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg font-medium transition-colors truncate">
                        Frontend Lead
                    </button>
                    <button onClick={() => fillDemo('backend@demo.local')} type="button" className="text-xs py-2 px-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg font-medium transition-colors truncate">
                        Backend Lead
                    </button>
                    <button onClick={() => fillDemo('em@demo.local')} type="button" className="text-xs py-2 px-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg font-medium transition-colors truncate">
                        Eng Manager
                    </button>
                    <button onClick={() => fillDemo('design@demo.local')} type="button" className="text-xs py-2 px-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg font-medium transition-colors truncate">
                        Product Design
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
