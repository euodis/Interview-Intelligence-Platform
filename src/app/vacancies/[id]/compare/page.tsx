import { getVacancyById } from '@/actions/vacancy.actions';
import { getCandidatesByVacancyId } from '@/actions/candidate.actions';
import CompareClient from './CompareClient';

export default async function CompareCandidatesPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ candidateId?: string }> 
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const vacancy = await getVacancyById(resolvedParams.id);
  const applications = await getCandidatesByVacancyId(resolvedParams.id);

  return <CompareClient vacancy={vacancy} candidates={applications} primaryCandidateId={resolvedSearchParams.candidateId} />;
}
