import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLineOfBusinessOptions } from "@/lib/business-options";

export const dynamic = "force-dynamic";

/** Line of Business options for application forms (built-ins + active fee categories). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const options = await getLineOfBusinessOptions();
  return NextResponse.json({ options });
}
