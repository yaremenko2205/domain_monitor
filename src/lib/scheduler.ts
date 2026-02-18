import cron, { type ScheduledTask } from "node-cron";

let task: ScheduledTask | null = null;

export function startScheduler(cronExpression: string = "0 8 * * *") {
  if (task) {
    task.stop();
  }

  if (!cron.validate(cronExpression)) {
    console.error(`[Scheduler] Invalid cron expression: ${cronExpression}`);
    return;
  }

  task = cron.schedule(cronExpression, async () => {
    console.log(
      `[Scheduler] Running domain check at ${new Date().toISOString()}`
    );
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/check-all`, {
        method: "POST",
        headers: {
          "x-internal": "true",
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log(
        `[Scheduler] Domain check completed. Checked ${data.checked} domain(s)`
      );
    } catch (err) {
      console.error("[Scheduler] Domain check failed:", err);
    }
  });

  console.log(`[Scheduler] Started with schedule: ${cronExpression}`);
}

export function stopScheduler() {
  if (task) {
    task.stop();
    task = null;
    console.log("[Scheduler] Stopped");
  }
}
