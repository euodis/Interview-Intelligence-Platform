"use server";

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function getCandidatesByVacancyId(vacancyId: string) {
  const applications = await prisma.application.findMany({
    where: { vacancyId },
    include: {
      summary: true,
      sessions: {
        include: { 
          interviewer: true,
          evaluations: true
        }
      },
      assignments: {
        include: { interviewer: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return applications;
}

export async function getCandidateById(id: string) {
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      vacancy: {
        include: {
          competencies: {
             include: { competency: true }
          },
          interviewPlan: {
             include: { blocks: { include: { competency: true } } }
          }
        }
      },
      summary: true,
      sessions: {
        include: {
           interviewer: true,
           evaluations: {
              include: { block: true }
           }
        }
      },
      assignments: {
        include: { interviewer: true }
      },
      disagreementFlags: true
    }
  });

  if (!application) return null;

  return {
    ...application,
    vacancy: {
       ...application.vacancy,
       competencies: application.vacancy.competencies.map(vc => vc.competency)
    }
  };
}

export async function createCandidate(data: { name: string, email: string, vacancyId: string, currentCompany?: string, experienceYears?: number, resumeSummary?: string }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'HR') {
    throw new Error('Unauthorized');
  }

  const application = await prisma.application.create({
    data: {
      name: data.name,
      contactEmail: data.email,
      vacancyId: data.vacancyId,
      status: 'НОВЫЙ',
      currentCompany: data.currentCompany,
      experienceYears: data.experienceYears,
      resumeSummary: data.resumeSummary
    }
  });

  // Assign a default HR/Interviewer if needed, or leave to manual assignment.
  // We'll leave it simple for now.

  await prisma.auditEvent.create({
    data: {
      entityType: 'Application',
      entityId: application.id,
      action: 'CREATED',
      details: 'HR manually added a candidate'
    }
  });

  revalidatePath(`/vacancies/${data.vacancyId}`);
  return application;
}

export async function updateCandidateInterviewers(applicationId: string, interviewerIds: string[]) {
   const session = await auth();
   if (!session?.user || (session.user as any).role !== 'HR') {
     throw new Error('Unauthorized: Only HR can assign interviewers');
   }
 
   if (interviewerIds.length < 2 || interviewerIds.length > 4) {
      throw new Error('Необходимо назначить от 2 до 4 экспертов');
   }

   const existingSessions = await prisma.interviewSession.findMany({
      where: { applicationId },
      include: { evaluations: true }
   });

   const hasStarted = existingSessions.some(s => s.status === 'ЗАВЕРШЕНО' || s.evaluations.length > 0);
   if (hasStarted) {
      throw new Error('Изменение состава экспертов запрещено: интервью уже начаты');
   }
 
   await prisma.$transaction(async (tx) => {
      // Get current candidate to check status
      const candidate = await tx.application.findUnique({
         where: { id: applicationId },
         select: { status: true }
      });

      await tx.interviewAssignment.deleteMany({ where: { applicationId } });
      await tx.interviewSession.deleteMany({ where: { applicationId } });

      for (const interviewerId of interviewerIds) {
         await tx.interviewAssignment.create({
            data: { applicationId, interviewerId }
         });
         await tx.interviewSession.create({
            data: {
               applicationId,
               interviewerId,
               status: 'ОЖИДАЕТ'
            }
         });
      }

      // Transition status if new
      if (candidate?.status === 'НОВЫЙ') {
         await tx.application.update({
            where: { id: applicationId },
            data: { status: 'ИНТЕРВЬЮ' }
         });
      }
   });

   revalidatePath(`/candidates/${applicationId}`);
   revalidatePath(`/`);
}
