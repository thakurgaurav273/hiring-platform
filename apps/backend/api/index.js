let app;

try {
  app = require('../dist/app').default;
  const { registerTimelineListener } = require('../dist/modules/timeline/events/timeline.listener');
  
  // Initialize listeners required for the application to function
  registerTimelineListener();
  
  // Note: Prisma connects automatically on the first query.
  // Note: Cron jobs are omitted because Serverless environments do not support persistent background tasks.
} catch (err) {
  console.error("Failed to initialize serverless function:", err);
  // Fallback app to display the error directly in the browser instead of a generic 500
  app = (req, res) => {
    res.status(500).json({
      error: "Serverless Function Startup Crash",
      message: err.message,
      stack: err.stack
    });
  };
}

module.exports = app;
