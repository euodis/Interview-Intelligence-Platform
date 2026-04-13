export type CandidateStatus = 'НОВЫЙ' | 'ИНТЕРВЬЮ' | 'ОЦЕНЕН' | 'ОТКЛОНЕН' | 'ПРИНЯТ' | 'ДОП_ЭТАП';
export type RecommendationType = 'НАЗНАЧИТЬ_ОФФЕР' | 'ОТКАЗ' | 'ДОП_ИНТЕРВЬЮ' | 'СИНХРОНИЗАЦИЯ';
export type SessionStatus = 'ОЖИДАЕТ' | 'ЗАВЕРШЕНО';
export type SeniorityLevel = 'Middle' | 'Senior' | 'Lead';

export interface Interviewer {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface Competency {
  id: string;
  name: string;
  description: string;
}

export interface Vacancy {
  id: string;
  title: string;
  level: SeniorityLevel;
  status: 'АКТИВНА' | 'ЗАКРЫТА';
  competencies: Competency[];
  createdAt: string;
}

export interface InterviewBlock {
  id: string;
  competencyId: string;
  title: string;
  questions: string[];
  required: boolean;
}

export interface InterviewPlan {
  id: string;
  vacancyId: string;
  blocks: InterviewBlock[];
}

export interface Candidate {
  id: string;
  vacancyId: string;
  name: string;
  status: CandidateStatus;
  currentCompany?: string;
  experienceYears?: number;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  interviewerId: string;
  status: SessionStatus;
  scheduledAt: string;
}

export interface BlockEvaluation {
  id: string;
  sessionId: string;
  blockId: string;
  score: number; // 1-5
  notes: string;
}

export interface CandidateSummary {
  id: string;
  candidateId: string;
  overallScore: number;
  strengths: string[];
  risks: string[];
  discrepancies: string | null;
  recommendation: RecommendationType;
}

// Утилита для агрегации, которую мы будем использовать в UI:
export interface AggregatedCandidateData {
  candidate: Candidate;
  sessions: InterviewSession[];
  evaluations: BlockEvaluation[];
  summary?: CandidateSummary;
}
