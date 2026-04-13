"use server";

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitInterviewProtocol(data: {
  sessionId: string;
  evaluations: Array<{ blockId: string; score: number; notes: string; signal?: string }>;
  overallNotes: string;
  confidence: string;
}) {
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
  });

  revalidatePath(`/interviews/${data.sessionId}`);
}

export async function updateCandidateSummary(applicationId: string, summaryData: any) {
   // This would be called by the AI generation route/action.
   const summary = await prisma.candidateSummary.upsert({
      where: { applicationId },
      update: summaryData,
      create: {
         applicationId,
         ...summaryData
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
