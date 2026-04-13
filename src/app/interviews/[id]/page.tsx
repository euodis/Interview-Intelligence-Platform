import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import InterviewProtocolClient from './InterviewProtocolClient';

export default async function InterviewProtocolPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
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
      evaluations: true
    }
  });

  if (!session) return notFound();

  return <InterviewProtocolClient session={session} />;
}
