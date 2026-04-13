import Link from "next/link";
import { notFound } from "next/navigation";
import DisagreementAnalyzer, { DisagreementConflict } from "@/components/DisagreementAnalyzer";
import { getCandidateById } from "@/actions/candidate.actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import AssignInterviewersBlock from "./AssignInterviewersBlock";

export default async function CandidateProfile({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const authSession = await auth();
    if (!authSession?.user) return null;

    const userRole = (authSession.user as any).role;
    const isHR = userRole === 'HR';
    const isInterviewer = userRole === 'INTERVIEWER';

    const candidate = await getCandidateById(resolvedParams.id);
    if (!candidate) return notFound();

    const vacancy = candidate.vacancy;
    const plan = vacancy.interviewPlan;
    const aiSummary = candidate.summary;

    // All sessions assigned to this candidate
    const allSessions = candidate.sessions;
    const completedSessions = allSessions.filter(s => s.status === 'ЗАВЕРШЕНО');

    // Progress
    const progressPercent = allSessions.length === 0 ? 0 : Math.round((completedSessions.length / allSessions.length) * 100);

    // Interviewers
    const assignedInterviewers = candidate.assignments.map(a => a.interviewer);

    // Find if the current user (if interviewer) has a pending session for this candidate
    const myPendingSession = isInterviewer
        ? allSessions.find(s => s.interviewerId === authSession.user!.id && s.status === 'ОЖИДАЕТ')
        : null;

    // Compute Disagreements
    const conflicts: DisagreementConflict[] = [];
    if (plan && completedSessions.length > 1) {
        plan.blocks.forEach(block => {
            const evalsForBlock = completedSessions.map(s => s.evaluations.find(e => e.blockId === block.id)).filter(Boolean);
            if (evalsForBlock.length > 1) {
                const scores = evalsForBlock.map(e => e!.score!);
                const maxScore = Math.max(...scores);
                const minScore = Math.min(...scores);

                if (maxScore - minScore >= 2) {
                    conflicts.push({
                        blockId: block.id,
                        blockTitle: block.title,
                        evaluations: evalsForBlock.map(e => {
                            const ownerSess = completedSessions.find(s => s.id === e!.sessionId);
                            return {
                                interviewer: ownerSess?.interviewer?.name || 'Unknown',
                                score: e!.score!,
                                notes: e!.notes || ''
                            }
                        })
                    });
                }
            }
        });
    }

    // Fetch all available interviewers for assignment (HR only)
    const allInterviewers = isHR ? await prisma.user.findMany({
        where: { role: 'INTERVIEWER' },
        select: { id: true, name: true, role: true }
    }) : [];

    // Check if any session has started (for freezing assignments)
    const hasStartedInterviews = allSessions.some(s => s.status === 'ЗАВЕРШЕНО' || s.evaluations.length > 0);

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20">

            {/* 1. Page Header */}
            <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 mt-2">
                <div className="text-sm font-medium text-zinc-500">
                    <Link href="/" className="hover:text-zinc-900 transition-colors">Вакансии</Link>
                    <span className="mx-2">/</span>
                    <Link href={`/vacancies/${vacancy?.id}`} className="hover:text-zinc-900 transition-colors">{vacancy?.title || 'Unknown'}</Link>
                    <span className="mx-2">/</span>
                    <span className="text-zinc-900">{candidate.name}</span>
                </div>

                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
                            {candidate.name}
                            <span className={`px-2.5 py-1 text-[11px] font-black rounded-full uppercase tracking-widest
                  ${candidate.status === 'ОЦЕНЕН' ? 'bg-zinc-800 text-white shadow-sm' : 'bg-blue-100 text-blue-800'}
              `}>{candidate.status}</span>
                        </h1>
                        <p className="text-lg text-zinc-500">{candidate.currentCompany} • {candidate.experienceYears} лет опыта</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={`/vacancies/${vacancy?.id}/compare`} className="flex items-center gap-2 rounded-xl bg-white border border-zinc-200 px-4 py-2 font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors focus:ring-4 focus:ring-zinc-100">
                            Сравнить с другими
                        </Link>
                        <Link href={`/candidates/${candidate.id}/summary`} className="flex items-center gap-2 rounded-xl bg-violet-50 text-violet-700 px-4 py-2 font-medium shadow-sm hover:bg-violet-100 transition-colors">
                            <span className="text-lg">✨</span> Полный ИИ-отчет
                        </Link>
                        {/* Interviewer: show "Start Interview" only if they have a pending session */}
                        {isInterviewer && myPendingSession && (
                            <Link href={`/interviews/${myPendingSession.id}`} className="rounded-xl bg-zinc-900 px-5 py-2 font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors">
                                Начать интервью
                            </Link>
                        )}
                        {/* HR: show a link to view completed protocols */}
                        {isHR && completedSessions.length > 0 && (
                            <Link href={`/interviews/${completedSessions[0].id}`} className="rounded-xl bg-zinc-100 border border-zinc-200 px-5 py-2 font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors">
                                Посмотреть протокол
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Top Stats & Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Прогресс интервью</h3>
                    <div>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-2xl font-bold text-zinc-900">{completedSessions.length} <span className="text-zinc-400 text-lg">/ {allSessions.length}</span></span>
                            <span className="text-sm font-medium text-zinc-500">{progressPercent}% завершено</span>
                        </div>
                        <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Статус Кандидата</h3>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100">
                            <span className="text-sm text-zinc-500">Этап</span>
                            <span className="text-sm font-bold text-zinc-900">{candidate.status}</span>
                        </div>
                        <div className="flex justify-between items-center bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100">
                            <span className="text-sm text-zinc-500">Добавлен</span>
                            <span className="text-sm font-medium text-zinc-900">{new Date(candidate.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">Средний Балл (Avg)</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-4xl font-black text-zinc-900">{aiSummary ? aiSummary.overallScore.toFixed(1) : '-'}</span>
                        {aiSummary && <span className="text-xl text-zinc-400">/ 5</span>}
                    </div>
                </div>
            </div>

            {/* Assign Interviewers Block — HR only */}
            {isHR && (
                <AssignInterviewersBlock
                    applicationId={candidate.id}
                    currentInterviewerIds={assignedInterviewers.map((i: any) => i.id)}
                    allInterviewers={allInterviewers}
                    isFrozen={hasStartedInterviews}
                    sessions={allSessions.map(s => ({ id: s.id, interviewerId: s.interviewerId, status: s.status, interviewerName: s.interviewer?.name || 'N/A' }))}
                />
            )}

            {/* Dynamic Disagreement Tool */}
            <DisagreementAnalyzer candidateName={candidate.name} conflicts={conflicts} />

            <div className="flex flex-col lg:flex-row gap-6 mt-2 items-start">

                {/* 3. AI Summary Review */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                    <div className="rounded-2xl border-l-[4px] border-l-violet-500 border border-zinc-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">✨</span>
                                <h2 className="text-lg font-bold text-zinc-900">AI Вердикт</h2>
                            </div>

                            {aiSummary ? (
                                <>
                                    <div className="flex justify-center">
                                        <span className={`inline-flex rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-center w-full justify-center
                                  ${aiSummary.recommendation === 'НАЗНАЧИТЬ_ОФФЕР' && 'bg-emerald-100 text-emerald-800'}
                                  ${aiSummary.recommendation === 'СИНХРОНИЗАЦИЯ' && 'bg-amber-100 text-amber-800'}
                                  ${aiSummary.recommendation === 'ОТКАЗ' && 'bg-rose-100 text-rose-800'}
                                  ${aiSummary.recommendation === 'ДОП_ИНТЕРВЬЮ' && 'bg-blue-100 text-blue-800'}
                              `}>
                                            {aiSummary.recommendation.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-5">
                                        <div>
                                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                Сильные стороны
                                            </h4>
                                            <ul className="text-sm text-zinc-700 space-y-1.5">
                                                {aiSummary.strengths.map((str, i) => <li key={i} className="flex gap-2"><span className="text-zinc-400">•</span> {str}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                Зоны риска
                                            </h4>
                                            <ul className="text-sm text-zinc-700 space-y-1.5">
                                                {aiSummary.risks.map((r, i) => <li key={i} className="flex gap-2"><span className="text-zinc-400">•</span> {r}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-zinc-500 italic">Саммари будет сгенерировано после завершения интервью.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Blocks Heatmap / Interview Matrix */}
                <div className="w-full lg:w-2/3 flex flex-col gap-4">
                    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
                            <h3 className="font-bold text-zinc-900">Блоки компетенций & Оценки</h3>
                        </div>

                        {plan && allSessions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white border-b border-zinc-200 text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
                                        <tr>
                                            <th className="px-6 py-4 min-w-[200px]">Блок компетенции</th>
                                            {allSessions.map(session => {
                                                const inter = session.interviewer;
                                                const isCompleted = session.status === 'ЗАВЕРШЕНО';
                                                return (
                                                    <th key={session.id} className="px-4 py-4 min-w-[150px] border-l border-zinc-100">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-zinc-900">{inter.name}</span>
                                                                <span className="text-zinc-400 font-medium normal-case">{inter.role}</span>
                                                            </div>
                                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider w-fit
                                                   ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}
                                                `}>
                                                                {isCompleted ? 'Готово' : 'Ожидает'}
                                                            </span>
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="text-zinc-700">
                                        {plan.blocks.map(block => {
                                            return (
                                                <tr key={block.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                                                    <td className="px-6 py-5 font-semibold text-zinc-900 w-1/3">{block.title}</td>
                                                    {allSessions.map(session => {
                                                        const ev = session.evaluations.find(e => e.blockId === block.id);
                                                        if (session.status !== 'ЗАВЕРШЕНО') {
                                                            return (
                                                                <td key={session.id} className="px-4 py-5 border-l border-zinc-100 text-zinc-300 italic text-[11px] align-middle bg-zinc-50/30">
                                                                    <div className="flex flex-col items-center opacity-40">
                                                                        <span className="text-lg">🕒</span>
                                                                        <span>Нет данных</span>
                                                                    </div>
                                                                </td>
                                                            );
                                                        }
                                                        if (!ev || ev.score === null) {
                                                            return <td key={session.id} className="px-4 py-5 border-l border-zinc-100 text-zinc-400 italic text-xs align-middle">Н/Д</td>;
                                                        }

                                                        return (
                                                            <td key={session.id} className="px-4 py-5 border-l border-zinc-100 align-top">
                                                                <div className="flex flex-col gap-2">
                                                                    <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg font-bold shadow-sm ring-1 ring-inset
                                                                ${ev.score >= 4 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : ev.score <= 2 ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}
                                                            `}>{ev.score}</span>
                                                                    <p className="text-sm text-zinc-600 mt-1 leading-relaxed line-clamp-3 hover:line-clamp-none cursor-pointer" title={ev.notes || ''}>{ev.notes}</p>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-10 flex flex-col items-center justify-center text-center">
                                <span className="text-4xl mb-3">📋</span>
                                <h4 className="font-semibold text-zinc-900">Эксперты еще не назначены</h4>
                                <p className="text-zinc-500 text-sm mt-1 max-w-sm">Назначьте интервьюеров выше, чтобы начать процесс сбора обратной связи.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
