import { EventEmitter } from "events";

export type TimelineEventPayload = {
    candidateId: string;
    applicationId?: string;
    type: string;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
    actorId?: string;
    department?: string | null;
};

class EventBus extends EventEmitter {}

export const eventBus = new EventBus();

export const TIMELINE_EVENT = "timeline:event";
