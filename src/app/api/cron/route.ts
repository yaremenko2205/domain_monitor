import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  const secret = request.headers.get("x-cron-secret");

  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/check-all`, {
    method: "POST",
    headers: {
      "x-internal": "true",
      "Content-Type": "application/json",
    },
  });

  const result = await response.json();
  return NextResponse.json(result);
}
