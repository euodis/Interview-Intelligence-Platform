import { getCandidateById } from "@/actions/candidate.actions";
import { notFound } from "next/navigation";
import SummaryClient from "./SummaryClient";

export default async function CandidateSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const candidateInfo = await getCandidateById(resolvedParams.id);

  if (!candidateInfo) return notFound();

  return <SummaryClient candidateInfo={candidateInfo} />;
}
