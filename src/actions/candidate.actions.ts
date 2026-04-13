"use server";

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getCandidatesByVacancyId(vacancyId: string) {
  const applications = await prisma.application.findMany({
    where: { vacancyId },
    include: {
      summary: true,
      sessions: {
        include: { interviewer: true }
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
