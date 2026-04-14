import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  mockCompetencies,
  mockVacancies,
  mockCandidates,
  mockPlans,
  mockInterviewers,
  mockSessions,
  mockBlockEvaluations,
  mockSummaries
} from '../src/data/mocks';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Users (Interviewers)
  const defaultPassword = await bcrypt.hash('password', 10);
  
  const getEmailForInt = (id: string) => {
     if (id === 'int-1') return 'hr@demo.local';
     if (id === 'int-2') return 'interviewer1@demo.local';
     if (id === 'int-3') return 'interviewer2@demo.local';
     if (id === 'int-4') return 'frontend@demo.local';
     if (id === 'int-5') return 'backend@demo.local';
     if (id === 'int-6') return 'design@demo.local';
     if (id === 'int-7') return 'em@demo.local';
     if (id === 'int-8') return 'data@demo.local';
     return `${id}@demo.local`;
  }

  for (const int of mockInterviewers) {
    const email = getEmailForInt(int.id);
    await prisma.user.upsert({
      where: { email },
      update: { password: defaultPassword },
      create: {
        id: int.id,
        email: email,
        password: defaultPassword,
        name: int.name,
        role: int.id === 'int-1' ? 'HR' : 'INTERVIEWER',
      },
    });
  }
  console.log('Users seeded');

  // 2. Competencies
  for (const comp of mockCompetencies) {
    await prisma.competency.upsert({
      where: { id: comp.id },
      update: {},
      create: {
        id: comp.id,
        name: comp.name,
        description: comp.description,
      },
    });
  }
  console.log('Competencies seeded');

  // 3. Vacancy & VacancyCompetency
  for (const vac of mockVacancies) {
    await prisma.vacancy.upsert({
      where: { id: vac.id },
      update: {},
      create: {
        id: vac.id,
        title: vac.title,
        level: vac.level,
        status: vac.status,
        createdAt: new Date(vac.createdAt),
        competencies: {
          create: vac.competencies.map((c: any) => ({
            competencyId: c.id
          }))
        }
      },
    });
  }
  console.log('Vacancies seeded');

  // 4. InterviewPlans, Blocks, Questions
  for (const plan of mockPlans) {
    await prisma.interviewPlan.upsert({
      where: { vacancyId: plan.vacancyId },
      update: {},
      create: {
        id: plan.id,
        vacancyId: plan.vacancyId,
        blocks: {
          create: plan.blocks.map((block: any) => ({
            id: block.id,
            competencyId: block.competencyId,
            title: block.title,
            required: block.required,
            questions: {
              create: block.questions.map((q: any) => ({ text: q }))
            }
          }))
        }
      }
    });
  }
  console.log('Plans seeded');

  // 5. Applications (Candidates)
  for (const cand of mockCandidates) {
    await prisma.application.upsert({
      where: { id: cand.id },
      update: {},
      create: {
        id: cand.id,
        vacancyId: cand.vacancyId,
        name: cand.name,
        contactEmail: `${cand.id}@candidate.com`,
        status: cand.status,
        currentCompany: cand.currentCompany,
        experienceYears: cand.experienceYears,
      }
    });
    
    // Create Interview Assignments (assign all interviewers to each candidate for simplicity)
    for (const int of mockInterviewers) {
      await prisma.interviewAssignment.upsert({
        where: {
          applicationId_interviewerId: {
            applicationId: cand.id,
            interviewerId: int.id
          }
        },
        update: {},
        create: {
          applicationId: cand.id,
          interviewerId: int.id
        }
      });
    }
  }
  console.log('Applications seeded');

  // 6. InterviewSessions & BlockEvaluations
  for (const sess of mockSessions) {
    // Upsert session
    const createdSess = await prisma.interviewSession.upsert({
      where: { id: sess.id },
      update: {},
      create: {
        id: sess.id,
        applicationId: sess.candidateId,
        interviewerId: sess.interviewerId,
        status: sess.status,
        scheduledAt: sess.scheduledAt ? new Date(sess.scheduledAt) : new Date(),
        overallNotes: 'Demo Overall Notes',
        confidence: 'HIGH'
      }
    });

    // Create block evaluations linked to this session
    const evals = mockBlockEvaluations.filter(e => e.sessionId === sess.id);
    for (const ev of evals) {
      await prisma.blockEvaluation.upsert({
        where: {
          sessionId_blockId: {
            sessionId: ev.sessionId,
            blockId: ev.blockId
          }
        },
        update: {},
        create: {
          id: ev.id,
          sessionId: ev.sessionId,
          blockId: ev.blockId,
          score: ev.score,
          notes: ev.notes,
          signal: ev.score >= 4 ? 'STRONG' : ev.score <= 2 ? 'CONCERN' : 'MIXED'
        }
      });
    }
  }
  console.log('Sessions & Evaluations seeded');

  // 7. Summaries & DisagreementFlags
  for (const sum of mockSummaries) {
    await prisma.candidateSummary.upsert({
      where: { applicationId: sum.candidateId },
      update: {},
      create: {
        id: sum.id,
        applicationId: sum.candidateId,
        overallScore: sum.overallScore,
        recommendation: sum.recommendation,
        rationale: sum.rationale || 'Mock rationale',
        strengths: sum.strengths,
        risks: sum.risks,
        notableEvidence: sum.notableEvidence || [],
        discrepanciesText: sum.discrepancies,
        nextStepSuggestion: sum.nextStepSuggestion || 'Mock next step'
      }
    });

    // Create disagreement flags if discrepancies exist
    if (sum.discrepancies) {
      await prisma.disagreementFlag.create({
         data: {
            applicationId: sum.candidateId,
            blockTitle: 'Frontend System Design', // Hardcoded from mock scenario
            reason: sum.discrepancies,
            isRisk: true,
            recommendedAction: sum.recommendation,
            actionDescription: sum.nextStepSuggestion || 'Sync required'
         }
      });
    }
  }
  console.log('Summaries seeded');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
