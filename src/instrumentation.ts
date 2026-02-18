export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("@/lib/scheduler");
    startScheduler(process.env.CHECK_SCHEDULE || "0 8 * * *");
  }
}
