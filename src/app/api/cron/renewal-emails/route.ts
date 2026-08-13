import { NextResponse } from "next/server";
import {
  runRenewalEmailNotifications,
  verifyCronSecret,
} from "@/lib/renewal-email-notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface CronRequestBody {
  dryRun?: boolean;
  businessRecordId?: string;
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CronRequestBody = {};
  try {
    const text = await request.text();
    if (text.trim().length > 0) {
      body = JSON.parse(text) as CronRequestBody;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const summary = await runRenewalEmailNotifications({
      dryRun: body.dryRun === true,
      businessRecordId: body.businessRecordId,
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[CRON renewal-emails] job failed", error);
    return NextResponse.json(
      {
        error: "Renewal email job failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
