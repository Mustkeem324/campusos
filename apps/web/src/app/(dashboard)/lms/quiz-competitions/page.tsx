import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RoleType } from '@prisma/client';
import { ArrowLeft, Clock3, HelpCircle, Medal, Plus, Trophy } from 'lucide-react';

import { requireTenantContext } from '../../../../lib/tenant-context';
import { resolveAuthorisedCourses } from '../../../../lib/lms/course-listing';
import { QUIZ_COMPETITION_CONFIG_ACTION, configEntity, quizWindowState, type CompetitionConfig } from '../../../../lib/lms/quiz-competition';

export const dynamic = 'force-dynamic';

export default async function QuizCompetitionsHubPage() {
  let context;
  try { context = await requireTenantContext(); } catch { redirect('/login'); }
  const { db, session } = context;
  const authorised = await resolveAuthorisedCourses(context);
  const offeringIds = authorised.map((course) => course.id);

  const quizzes = offeringIds.length ? await db.quiz.findMany({
    where: { tenantId: session.tenantId, courseOfferingId: { in: offeringIds } },
    orderBy: [{ startTime: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, title: true, description: true, timeLimitMins: true, startTime: true, endTime: true,
      courseOffering: { select: { courseId: true, course: { select: { code: true, title: true } }, section: { select: { name: true } }, term: { select: { name: true } } } },
    },
  }) : [];

  const configRows = quizzes.length ? await db.auditLog.findMany({
    where: { tenantId: session.tenantId, action: QUIZ_COMPETITION_CONFIG_ACTION, entity: { in: quizzes.map((quiz) => configEntity(quiz.id)) } },
    select: { entity: true, diffJson: true },
  }) : [];
  const configs = new Map<string, CompetitionConfig>();
  for (const row of configRows) {
    if (!row.diffJson) continue;
    try { configs.set(row.entity.slice('QUIZ_COMPETITION:'.length), JSON.parse(row.diffJson) as CompetitionConfig); } catch { /* ignore malformed legacy row */ }
  }
  const competitions = quizzes.flatMap((quiz) => {
    const config = configs.get(quiz.id);
    return config ? [{ ...quiz, config, state: quizWindowState(quiz) }] : [];
  });

  let attemptMap = new Map<string, { used: number; completed: number; activeId: string | null; bestScore: number | null }>();
  if (session.role === RoleType.STUDENT && competitions.length) {
    const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (student) {
      const attempts = await db.quizAttempt.findMany({
        where: { studentId: student.id, quizId: { in: competitions.map((competition) => competition.id) } },
        select: { id: true, quizId: true, score: true, completedAt: true },
      });
      for (const competition of competitions) {
        const rows = attempts.filter((attempt) => attempt.quizId === competition.id);
        const completed = rows.filter((attempt) => attempt.completedAt);
        attemptMap.set(competition.id, {
          used: rows.length,
          completed: completed.length,
          activeId: rows.find((attempt) => !attempt.completedAt)?.id ?? null,
          bestScore: completed.length ? Math.max(...completed.map((attempt) => attempt.score ?? Number.NEGATIVE_INFINITY)) : null,
        });
      }
    }
  }

  const active = competitions.filter((competition) => competition.state === 'OPEN').length;
  const upcoming = competitions.filter((competition) => competition.state === 'UPCOMING').length;
  const closed = competitions.filter((competition) => competition.state === 'CLOSED').length;
  const questionTotal = competitions.reduce((sum, competition) => sum + competition.config.questionCount, 0);
  const canCreate = session.role !== RoleType.STUDENT;

  return <div className="space-y-6 pb-10">
    <section className="overflow-hidden rounded-[28px] border border-[#173456] bg-[#0B1F3A] px-6 py-7 text-white shadow-[0_24px_60px_rgba(11,31,58,0.18)] sm:px-8 sm:py-9">
      <Link href="/lms" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#AFC7E7] hover:text-white"><ArrowLeft className="h-4 w-4" /> Learning hub</Link>
      <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.15em] text-[#9FC0EE]">CampusOS competitive learning</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Quiz Competitions</h1><p className="mt-3 text-sm leading-6 text-[#C7D7EA]">Timed course competitions, large question banks, autosaved attempts and server-scored leaderboards across the courses you are authorised to access.</p></div><div className="grid grid-cols-4 gap-2"><HeroStat label="Open" value={active} /><HeroStat label="Upcoming" value={upcoming} /><HeroStat label="Closed" value={closed} /><HeroStat label="Questions" value={questionTotal} /></div></div>
    </section>

    {canCreate && authorised.length > 0 && <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#66758A]">Faculty tools</p><h2 className="mt-1 text-lg font-black text-[#17223B]">Create a competition</h2></div><Plus className="h-5 w-5 text-[#2459A9]" /></div><div className="mt-4 flex flex-wrap gap-2">{authorised.map((course) => <Link key={course.id} href={`/learning/courses/${course.courseId}/quiz-competitions/new`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D7E0EB] bg-[#F8FAFC] px-3 text-xs font-black text-[#36506F] transition hover:border-[#AFC5E3] hover:bg-white"><Plus className="h-3.5 w-3.5" /> {course.course.code}{course.section ? ` · ${course.section.name}` : ''}</Link>)}</div></section>}

    {competitions.length === 0 ? <section className="rounded-2xl border border-dashed border-[#CCD6E3] bg-white px-6 py-14 text-center"><Trophy className="mx-auto h-9 w-9 text-[#8A97A8]" /><p className="mt-3 text-sm font-black text-[#26364D]">No quiz competitions are available yet.</p><p className="mt-1 text-xs text-[#718096]">{canCreate ? 'Create the first competition from one of your authorised courses above.' : 'Competitions will appear here when your faculty publishes them.'}</p></section> : <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{competitions.map((competition) => { const attempt = attemptMap.get(competition.id); return <article key={competition.id} className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-[0_8px_26px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]"><div className="border-b border-[#E5EAF0] bg-[#F8FAFC] px-5 py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-[#EAF2FF] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#2459A9]">{competition.courseOffering.course.code}</span><StateBadge state={competition.state} /></div><h2 className="mt-3 line-clamp-2 text-lg font-black text-[#17223B]">{competition.title}</h2><p className="mt-1 text-xs text-[#718096]">{competition.courseOffering.course.title} · {competition.courseOffering.term.name}{competition.courseOffering.section ? ` · ${competition.courseOffering.section.name}` : ''}</p></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7E8] text-[#A15C07]"><Trophy className="h-5 w-5" /></span></div></div><div className="p-5"><div className="grid grid-cols-3 gap-2"><Mini icon={HelpCircle} label="Questions" value={competition.config.questionCount} /><Mini icon={Clock3} label="Minutes" value={competition.timeLimitMins ?? '—'} /><Mini icon={Medal} label="Marks" value={formatNumber(competition.config.totalMarks)} /></div>{competition.description && <p className="mt-4 line-clamp-2 text-xs leading-5 text-[#718096]">{competition.description}</p>}<div className="mt-4 space-y-1.5 text-[11px] font-semibold text-[#7A8798]"><p>Opens: {competition.startTime ? formatDateTime(competition.startTime) : 'Immediately'}</p><p>Closes: {competition.endTime ? formatDateTime(competition.endTime) : 'No fixed close'}</p>{attempt && <p>{attempt.activeId ? 'Attempt in progress' : `${attempt.used}/${competition.config.maxAttempts} attempts used`}{attempt.bestScore !== null ? ` · best ${formatNumber(attempt.bestScore)}` : ''}</p>}</div><Link href={`/learning/courses/${competition.courseOffering.courseId}/quiz-competitions/${competition.id}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-black text-white transition hover:bg-[#102E5D]">{attempt?.activeId ? 'Resume competition' : canCreate ? 'Open competition monitor' : competition.state === 'OPEN' ? 'Open competition' : 'View competition'} <Trophy className="h-4 w-4" /></Link></div></article>; })}</div>}
  </div>;
}

function StateBadge({ state }: { state: 'UPCOMING' | 'OPEN' | 'CLOSED' }) { const classes = state === 'OPEN' ? 'bg-[#EAF8F0] text-[#247A48]' : state === 'UPCOMING' ? 'bg-[#FFF7E8] text-[#A15C07]' : 'bg-[#EEF2F6] text-[#66758A]'; return <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${classes}`}>{state}</span>; }
function HeroStat({ label, value }: { label: string; value: string | number }) { return <div className="min-w-[4.7rem] rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center"><p className="text-xl font-black text-white">{value}</p><p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#AFC7E7]">{label}</p></div>; }
function Mini({ icon: Icon, label, value }: { icon: typeof HelpCircle; label: string; value: string | number }) { return <div className="rounded-xl border border-[#E1E7EE] bg-[#FAFBFD] px-3 py-3 text-center"><Icon className="mx-auto h-4 w-4 text-[#55708F]" /><p className="mt-1 text-sm font-black text-[#26364D]">{value}</p><p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8491A2]">{label}</p></div>; }
function formatDateTime(value: Date) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(value); }
function formatNumber(value: number) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value); }
