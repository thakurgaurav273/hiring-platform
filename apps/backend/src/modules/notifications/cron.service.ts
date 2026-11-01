import cron from "node-cron";
import prisma from "../../database/prisma-client";
import logger from "../../shared/logger/logger";
import { notifyInterviewReminder } from "./notification.service";

class CronService {
    public static init() {
        logger.info("Initializing background cron jobs...");

        // 1. Cleanup job: Run every day at midnight (0 0 * * *)
        // Deletes all notifications older than 24 hours to reduce messy data.
        cron.schedule("0 0 * * *", async () => {
            logger.info("Running daily notification cleanup job...");
            try {
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const result = await prisma.notification.deleteMany({
                    where: {
                        createdAt: {
                            lt: twentyFourHoursAgo
                        }
                    }
                });
                logger.info(`Deleted ${result.count} old notifications.`);
            } catch (error) {
                logger.error("Failed to execute daily notification cleanup job", error);
            }
        });

        // 2. Interview Reminder job: Run every 5 minutes (*/5 * * * *)
        // Finds interviews starting in exactly 30 minutes (between 30-35 mins from now)
        // and sends reminders to panelists if their preferences allow it.
        cron.schedule("*/5 * * * *", async () => {
            logger.info("Running interview reminder job...");
            try {
                const now = new Date();
                const startWindow = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins from now
                const endWindow = new Date(now.getTime() + 35 * 60 * 1000); // 35 mins from now

                const upcomingInterviews = await prisma.interview.findMany({
                    where: {
                        status: "SCHEDULED",
                        scheduledAt: {
                            gte: startWindow,
                            lt: endWindow,
                        }
                    },
                    include: {
                        panelists: {
                            include: {
                                interviewer: {
                                    select: {
                                        id: true,
                                        notificationPreferences: true,
                                    }
                                }
                            }
                        },
                        application: {
                            include: {
                                candidate: {
                                    select: { id: true, firstName: true, lastName: true }
                                }
                            }
                        }
                    }
                });

                for (const interview of upcomingInterviews) {
                    const candidateName = `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`;
                    for (const panelist of interview.panelists) {
                        const prefs: any = panelist.interviewer.notificationPreferences;
                        // Default to sending the reminder if preferences don't strictly disable it
                        const wantsReminders = prefs?.interviewReminders !== false;
                        
                        if (wantsReminders) {
                            await notifyInterviewReminder({
                                userId: panelist.interviewerId,
                                interviewId: interview.id,
                                candidateName,
                                scheduledAt: interview.scheduledAt
                            }).catch(err => {
                                logger.error(`Failed to send reminder for interview ${interview.id} to user ${panelist.interviewerId}`, err);
                            });
                        }
                    }
                }
            } catch (error) {
                logger.error("Failed to execute interview reminder job", error);
            }
        });

        logger.info("Background cron jobs initialized.");
    }
}

export default CronService;
