"use server";

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function submitInterviewProtocol(data: {
   sessionId: string;
   evaluations: Array<{ blockId: string; score: number; notes: string; signal?: string }>;
   overallNotes: string;
   confidence: string;
}) {
   // Permission check: only the assigned interviewer can submit
   const authSession = await auth();
   if (!authSession?.user) throw new Error('Unauthorized');

   const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: data.sessionId }
   });
   if (!interviewSession) throw new Error('Session not found');
   if (interviewSession.interviewerId !== authSession.user.id) {
      throw new Error('Только назначенный интервьюер может отправить протокол');
   }
   if (interviewSession.status === 'ЗАВЕРШЕНО') {
      throw new Error('Протокол уже был отправлен');
   }
   // Use a transaction to ensure all evaluations are saved atomically
   await prisma.$transaction(async (tx) => {
      // 1. Update Session Status
      await tx.interviewSession.update({
         where: { id: data.sessionId },
         data: {
            status: 'ЗАВЕРШЕНО',
            overallNotes: data.overallNotes,
            confidence: data.confidence,
            updatedAt: new Date()
         }
      });

      // 2. Upsert Evaluations
      for (const ev of data.evaluations) {
         await tx.blockEvaluation.upsert({
            where: {
               sessionId_blockId: {
                  sessionId: data.sessionId,
                  blockId: ev.blockId
               }
            },
            update: {
               score: ev.score,
               notes: ev.notes,
               signal: ev.signal
            },
            create: {
               sessionId: data.sessionId,
               blockId: ev.blockId,
               score: ev.score,
               notes: ev.notes,
               signal: ev.signal
            }
         });
      }

      // 3. Log Audit Event
      await tx.auditEvent.create({
         data: {
            entityType: 'InterviewSession',
            entityId: data.sessionId,
            action: 'UPDATED',
            details: 'Interviewer submitted protocol with scores'
         }
      });

      // 4. Check if all sessions for this candidate are completed
      const allSessions = await tx.interviewSession.findMany({
         where: { applicationId: interviewSession.applicationId }
      });

      const allCompleted = allSessions.every(s => s.status === 'ЗАВЕРШЕНО');

      if (allCompleted) {
         await tx.application.update({
            where: { id: interviewSession.applicationId },
            data: { status: 'ОЦЕНЕН' }
         });
      }
   });

   revalidatePath(`/interviews/${data.sessionId}`);
}

export async function updateCandidateSummary(applicationId: string, summaryData: any) {
   // Map discrepancies to discrepanciesText because the Prisma schema uses discrepanciesText
   const { discrepancies, ...rest } = summaryData;
   const mappedData = {
      ...rest,
      discrepanciesText: discrepancies
   };

   // This would be called by the AI generation route/action.
   const summary = await prisma.candidateSummary.upsert({
      where: { applicationId },
      update: mappedData,
      create: {
         applicationId,
         ...mappedData
      }
   });

   await prisma.auditEvent.create({
      data: {
         entityType: 'CandidateSummary',
         entityId: applicationId,
         action: 'AI_GENERATED',
         details: 'AI Summary replaced or created'
      }
   });

   revalidatePath(`/candidates/${applicationId}`);
   return summary;
}
