import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import InterviewProtocolClient from './InterviewProtocolClient';

export default async function InterviewProtocolPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const authSession = await auth();
  if (!authSession?.user) redirect('/login');

  const userRole = (authSession.user as any).role;
  const userId = authSession.user.id;
  
  const session = await prisma.interviewSession.findUnique({
    where: { id: resolvedParams.id },
    include: {
      application: {
        include: {
          vacancy: {
            include: {
              interviewPlan: {
                include: {
                  blocks: {
                     include: { questions: true }
                  }
                }
              }
            }
          }
        }
      },
      evaluations: true,
      interviewer: true
    }
  });

  if (!session) return notFound();

  // Determine access mode
  const isOwner = session.interviewerId === userId;
  const isHR = userRole === 'HR';
  const isCompleted = session.status === 'ЗАВЕРШЕНО';

  // If neither HR nor the assigned interviewer, deny access
  if (!isOwner && !isHR) {
    redirect('/interviews');
  }

  // Read-only if: HR viewing, or protocol already submitted
  const readOnly = isHR || isCompleted;

  return <InterviewProtocolClient session={session} readOnly={readOnly} />;
}
