import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  secret: process.env.AUTH_SECRET || 'super-secret-mvp-key-12345',
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      // Require login for everything except public assets
      if (!isLoggedIn) {
        return false;
      }

      // Role-based guarding
      const userRole = auth.user.role as string;
      const isVacancyRoute = nextUrl.pathname.startsWith('/vacancies') || nextUrl.pathname.startsWith('/candidates');
      const isInterviewsRoute = nextUrl.pathname.startsWith('/interviews');

      // If Interviewer tries to access vacancies dashboard, bounce them
      if (userRole === 'INTERVIEWER' && (nextUrl.pathname === '/' || nextUrl.pathname.startsWith('/vacancies'))) {
         return Response.redirect(new URL('/interviews', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // Add providers in auth.ts
} satisfies NextAuthConfig;
