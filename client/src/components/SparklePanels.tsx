import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock3, GraduationCap, ShieldCheck } from "lucide-react";

type LearningPlan = {
  id: number;
  status: string;
  title: string;
  topic: string;
  objectives: string[];
  activeRecall: string[];
  quizPrompts: string[];
  revisionSchedule: string[];
  masteryEvidence: string[];
  nextReviewAt: Date | string | null;
  lastReviewedAt: Date | string | null;
  reviewCount: number;
};

type AuditEntry = {
  id: number;
  action: string;
  specialist: string | null;
  permissionLevel: string;
  approvalStatus: string;
  requestSummary: string;
  failureDetails: string | null;
  createdAt: Date | string;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function ListBlock({ label, items, empty = "Nothing recorded." }: { label: string; items: string[]; empty?: string }) {
  return <div className="space-y-2"><p className="mono-label">{label}</p>{items.length ? <ul className="space-y-1.5">{items.map((item, index) => <li className="flex gap-2 text-sm leading-5 text-[#4f6158]" key={`${item}-${index}`}><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#80a48c]" />{item}</li>)}</ul> : <p className="text-sm text-[#87958d]">{empty}</p>}</div>;
}

export function LearningPlansPanel({ plans, onCreate, onCompleteReview, isReviewing }: { plans: LearningPlan[]; onCreate: () => void; onCompleteReview: (id: number) => void; isReviewing: boolean }) {
  if (!plans.length) return <div className="surface-card grid min-h-52 place-items-center p-7 text-center"><div className="max-w-sm space-y-3"><div className="mx-auto grid size-10 place-items-center rounded-2xl bg-[#edf2e9] text-[#356354]"><GraduationCap className="size-4" /></div><p className="font-display text-xl text-[#263b33]">Build a deliberate learning loop</p><p className="text-sm leading-6 text-[#75857b]">Create a plan with recall prompts, quizzes, revision spacing, and evidence of mastery.</p><Button onClick={onCreate} variant="outline" className="mt-2 rounded-xl border-[#ccd8cc] bg-white text-[#315d4d] hover:bg-[#edf2e9]">Create learning plan</Button></div></div>;
  return <div className="space-y-5">{plans.map(plan => <section className="surface-card p-5 sm:p-6" key={plan.id}><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="eyebrow">{plan.status}</p><h2 className="mt-1 font-display text-2xl text-[#314b40]">{plan.title}</h2><p className="mt-1 text-sm text-[#6e8076]">Topic: {plan.topic}</p></div><div className="flex items-center gap-3"><div className="rounded-xl bg-[#eef4eb] px-3 py-2 text-sm text-[#38634f]"><p className="mono-label">Next review</p><p className="mt-1 font-medium">{formatDate(plan.nextReviewAt)}</p></div><Button onClick={() => onCompleteReview(plan.id)} disabled={isReviewing} className="rounded-xl bg-[#153f35] text-white hover:bg-[#0f3028]"><CheckCircle2 className="mr-1.5 size-4" />{isReviewing ? "Recording…" : "Review now"}</Button></div></div><div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#72847a]"><span className="rounded-full bg-[#f0f4ed] px-2.5 py-1">{plan.reviewCount} reviews recorded</span><span className="rounded-full bg-[#f0f4ed] px-2.5 py-1">Last review: {formatDate(plan.lastReviewedAt)}</span><span className="rounded-full bg-[#f0f4ed] px-2.5 py-1">Each review schedules the next interval</span></div><div className="mt-6 grid gap-5 border-t border-[#e6ebe4] pt-5 md:grid-cols-2 xl:grid-cols-5"><ListBlock label="Objectives" items={plan.objectives} /><ListBlock label="Active recall" items={plan.activeRecall} /><ListBlock label="Quiz prompts" items={plan.quizPrompts} empty="No quiz prompts yet." /><ListBlock label="Revision" items={plan.revisionSchedule} /><ListBlock label="Mastery evidence" items={plan.masteryEvidence} /></div></section>)}</div>;
}

export function ProgressAuditPanel({ state, audit, onReview, isReviewing }: { state: { completionPercent: number; completed: string[]; inProgress: string[]; blocked: string[]; failedTests: string[] }; audit: AuditEntry[]; onReview: (id: number, decision: "approved" | "denied") => void; isReviewing: boolean }) {
  return <div className="space-y-6"><div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]"><section className="surface-card p-5 sm:p-6"><p className="eyebrow">Honest completion</p><p className="mt-3 font-display text-5xl text-[#315d4d]">{state.completionPercent}<span className="text-2xl">%</span></p><p className="mt-3 text-sm leading-6 text-[#718178]">Computed from completed tasks divided by all tasks. It is intentionally not inflated by plans, drafts, or chat activity.</p><Progress value={state.completionPercent} className="mt-5 h-2 bg-[#e5eae3]" /></section><section className="surface-card p-5 sm:p-6"><p className="eyebrow">State detail</p><div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><ListBlock label="Completed" items={state.completed} /><ListBlock label="In progress" items={state.inProgress} /><ListBlock label="Blocked" items={state.blocked} /><ListBlock label="Failed tests" items={state.failedTests} empty="No recorded failures." /></div></section></div><section className="surface-card overflow-hidden"><div className="flex items-center justify-between border-b border-[#e3e8e0] bg-[#fbfcf8] px-5 py-4"><div><p className="eyebrow">Audit log</p><h2 className="mt-1 font-display text-xl">Requests, permissions & outcomes</h2></div><Clock3 className="size-4 text-[#698176]" /></div>{audit.length ? <div>{audit.map(entry => <div key={entry.id} className="grid gap-3 border-b border-[#edf0eb] px-5 py-4 last:border-0 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center"><div><Badge className={`border-0 ${entry.approvalStatus === "failed" ? "bg-[#fdebe1] text-[#a8522d]" : entry.approvalStatus === "pending" ? "bg-[#fff2d8] text-[#96641a]" : "bg-[#e9f2e8] text-[#397150]"}`}>{entry.approvalStatus.replaceAll("_", " ")}</Badge><p className="mt-1.5 text-[10px] text-[#84928a]">{formatDate(entry.createdAt)}</p></div><div className="min-w-0"><p className="text-sm font-semibold capitalize text-[#40594d]">{entry.specialist || "general"} · {entry.action.replaceAll("_", " ")}</p><p className="mt-1 truncate text-xs text-[#75867c]">{entry.requestSummary}</p>{entry.failureDetails && <p className="mt-1 text-xs text-[#a55d38]">Failure: {entry.failureDetails}</p>}</div>{entry.approvalStatus === "pending" ? <div className="flex flex-wrap gap-2"><Button disabled={isReviewing} onClick={() => onReview(entry.id, "approved")} className="h-8 rounded-lg bg-[#153f35] px-3 text-xs text-white hover:bg-[#0f3028]">Record approval</Button><Button disabled={isReviewing} onClick={() => onReview(entry.id, "denied")} variant="outline" className="h-8 rounded-lg border-[#d5ded3] bg-white px-3 text-xs text-[#66776e] hover:bg-[#f2eee7]">Deny</Button><p className="basis-full text-[10px] leading-4 text-[#8b744f]">Records a decision only; it does not execute the request.</p></div> : <div className="text-xs text-[#65786d]">{entry.permissionLevel.replaceAll("_", " ")}</div>}</div>)}</div> : <div className="p-8 text-center text-sm text-[#819087]">No requests have been recorded yet.</div>}</section><div className="rounded-[1.25rem] border border-[#d6ded3] bg-[#eef4eb] p-4 text-sm text-[#597367]"><div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#356354]" /><p><strong className="text-[#315d4d]">Controlled actions remain stopped.</strong> Recording approval creates an audit record only. This private dashboard has no connected external action, publishing, finance, or account-access integration.</p></div></div></div>;
}
