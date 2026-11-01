import { eventBus, TIMELINE_EVENT, TimelineEventPayload } from "./event-bus";
import { logActivity } from "../timeline.service";
import prisma from "../../../database/prisma-client";

/**
 * Registers the timeline event listener.
 * Call this once during app startup (e.g. in server.ts).
 *
 * Usage (emit from anywhere):
 *   import { eventBus, TIMELINE_EVENT } from '../timeline/events/event-bus';
 *   eventBus.emit(TIMELINE_EVENT, { candidateId, type: 'STATUS_CHANGED', title: '...' });
 */
export const registerTimelineListener = () => {
    eventBus.on(TIMELINE_EVENT, async (payload: TimelineEventPayload) => {
        // Resolve department: use payload value if provided, otherwise look up from actor
        let department = payload.department;
        if (department === undefined && payload.actorId) {
            const actor = await prisma.user.findUnique({
                where: { id: payload.actorId },
                select: { department: true },
            });
            department = actor?.department ?? null;
        }

        await logActivity({
            type: payload.type,
            actorId: payload.actorId,
            entityType: payload.candidateId ? "Candidate" : "Application",
            entityId: payload.applicationId || payload.candidateId,
            description: payload.title + (payload.description ? `: ${payload.description}` : ""),
            department,
        });
    });

    console.log("[TimelineListener] Registered and listening for timeline events.");
};
