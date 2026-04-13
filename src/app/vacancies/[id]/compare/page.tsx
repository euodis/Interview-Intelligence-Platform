import { getVacancyById } from '@/actions/vacancy.actions';
import { getCandidatesByVacancyId } from '@/actions/candidate.actions';
import CompareClient from './CompareClient';

export default async function CompareCandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const vacancy = await getVacancyById(resolvedParams.id);
  const applications = await getCandidatesByVacancyId(resolvedParams.id);

  return <CompareClient vacancy={vacancy} candidates={applications} />;
}
