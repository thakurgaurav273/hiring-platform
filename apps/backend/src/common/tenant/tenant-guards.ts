import { StatusCodes } from "http-status-codes";
import prisma from "../../database/prisma-client";
import { AppError } from "../errors/app-error";

/**
 * Tenant ownership checks. Each throws 404 (not 403) when the record belongs
 * to another organization, so its existence isn't revealed.
 */

const notFound = (what: string) => new AppError(`${what} not found`, StatusCodes.NOT_FOUND);

export async function assertCandidateInOrg(candidateId: string, organizationId: string) {
    const ok = await prisma.candidate.count({ where: { id: candidateId, organizationId } });
    if (!ok) throw notFound("Candidate");
}

export async function assertApplicationInOrg(applicationId: string, organizationId: string) {
    const ok = await prisma.application.count({ where: { id: applicationId, job: { organizationId } } });
    if (!ok) throw notFound("Application");
}

export async function assertInterviewInOrg(interviewId: string, organizationId: string) {
    const ok = await prisma.interview.count({ where: { id: interviewId, application: { job: { organizationId } } } });
    if (!ok) throw notFound("Interview");
}

export async function assertNoteInOrg(noteId: string, organizationId: string) {
    const ok = await prisma.note.count({ where: { id: noteId, candidate: { organizationId } } });
    if (!ok) throw notFound("Note");
}

export async function assertFeedbackInOrg(feedbackId: string, organizationId: string) {
    const ok = await prisma.feedback.count({ where: { id: feedbackId, application: { job: { organizationId } } } });
    if (!ok) throw notFound("Feedback");
}

export async function assertResumeInOrg(resumeId: string, organizationId: string) {
    const ok = await prisma.resume.count({ where: { id: resumeId, candidate: { organizationId } } });
    if (!ok) throw notFound("Resume");
}

export async function assertUsersInOrg(userIds: string[], organizationId: string) {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (!unique.length) return;
    const count = await prisma.user.count({ where: { id: { in: unique }, organizationId } });
    if (count !== unique.length) throw new AppError("One or more users are not in this organization", StatusCodes.BAD_REQUEST);
}
