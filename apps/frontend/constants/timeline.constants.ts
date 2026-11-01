// Timeline constants — centralized icon map and activity type metadata.

import {
  Calendar,
  CheckCircle2,
  ArrowRightLeft,
  UserPlus,
  Award,
  Briefcase,
} from "lucide-react";
import type { ElementType } from "react";
import type { TimelineEvent } from "@/lib/types";

// Maps each TimelineEvent type to a display icon
export const ACTIVITY_ICONS: Record<TimelineEvent["type"], ElementType> = {
  job_posted:           Briefcase,
  referral_added:       UserPlus,
  stage_changed:        ArrowRightLeft,
  interview_scheduled:  Calendar,
  interview_completed:  CheckCircle2,
  onboarded:            Award,
};

// Human-readable labels for each activity type
export const ACTIVITY_LABELS: Record<TimelineEvent["type"], string> = {
  job_posted:           "Posted a new job",
  referral_added:       "Added a referral",
  stage_changed:        "Moved candidate to new stage",
  interview_scheduled:  "Scheduled an interview",
  interview_completed:  "Completed an interview",
  onboarded:            "Onboarded candidate",
};
