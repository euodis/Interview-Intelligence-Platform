'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // We explicitly set redirectTo: '/' to avoid returning to a potentially restricted URL 
    // from a previous session with a different role.
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Неверные почта или пароль.';
        default:
          return 'Что-то пошло не так.';
      }
    }
    throw error;
  }
}

export async function logOut() {
    // Explicitly redirect to login to clear any session-specific callback URLs
    await signOut({ redirectTo: '/login' });
}
