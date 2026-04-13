import { getVacancyById } from '@/actions/vacancy.actions';
import { getCandidatesByVacancyId } from '@/actions/candidate.actions';
import { auth } from '@/auth';
import VacancyDashboardClient from './VacancyDashboardClient';

export default async function VacancyDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const authSession = await auth();
  const userRole = (authSession?.user as any)?.role || 'INTERVIEWER';
  
  const vacancy = await getVacancyById(resolvedParams.id);
  
  if (!vacancy) {
     return <div className="p-8 text-zinc-500">Вакансия не найдена.</div>;
  }

  const applications = await getCandidatesByVacancyId(vacancy.id);

  return <VacancyDashboardClient vacancy={vacancy} candidates={applications} userRole={userRole} />;
}

