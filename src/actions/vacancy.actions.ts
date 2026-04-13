"use server";

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getVacancies() {
  const vacancies = await prisma.vacancy.findMany({
    include: {
      competencies: {
        include: { competency: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return vacancies.map(v => ({
    ...v,
    competencies: v.competencies.map(vc => vc.competency)
  }));
}

export async function getVacancyById(id: string) {
  const v = await prisma.vacancy.findUnique({
    where: { id },
    include: {
      competencies: {
        include: { competency: true }
      },
      interviewPlan: {
        include: {
          blocks: {
            include: { questions: true, competency: true }
          }
        }
      }
    }
  });

  if (!v) return null;

  return {
    ...v,
    competencies: v.competencies.map(vc => vc.competency),
    plan: v.interviewPlan
  };
}

export async function createVacancy(data: { 
  title: string, 
  level: string, 
  competencyIds: string[],
  planBlocks?: Array<{ title: string, goal: string | null, required: boolean, questions: string[] }>
}) {
  const newVacancy = await prisma.vacancy.create({
    data: {
      title: data.title,
      level: data.level,
      competencies: {
         create: data.competencyIds.map(id => ({ competencyId: id }))
      },
      ...(data.planBlocks && data.planBlocks.length > 0 ? {
        interviewPlan: {
          create: {
            blocks: {
              create: data.planBlocks.map(b => ({
                title: b.title,
                goal: b.goal,
                required: b.required,
                questions: {
                  create: b.questions.map(q => ({ text: q }))
                }
              }))
            }
          }
        }
      } : {})
    }
  });

  // Audit Log
  await prisma.auditEvent.create({
    data: {
      entityType: 'Vacancy',
      entityId: newVacancy.id,
      action: 'CREATED',
      details: 'HR created a new vacancy'
    }
  });

  revalidatePath('/');
  return newVacancy;
}

export async function getCompetencies() {
  return await prisma.competency.findMany();
}
