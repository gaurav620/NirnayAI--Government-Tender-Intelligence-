import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { extractValues } from "@/lib/ml-pipeline";

/**
 * POST /api/ml/extract-values
 * Proxies bidder document + criteria to Railway ML pipeline for value extraction.
 * Accepts multipart/form-data with 'file' and 'criteria' fields.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const criteria = formData.get("criteria") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!criteria) {
      return NextResponse.json({ error: "No criteria provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractValues(buffer, file.name, criteria);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ML pipeline error";
    console.error("[ML Pipeline] extract-values error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
