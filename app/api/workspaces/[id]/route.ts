import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { statusFeToDb, transformWorkspace, WORKSPACE_INCLUDE } from "../route";

// GET /api/workspaces/[id] — get a single workspace with all relations
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const workspace = await prisma.fileWorkspace.findFirst({
    where: { id, userId: user.id },
    include: WORKSPACE_INCLUDE,
  });

  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(transformWorkspace(workspace));
}

// PATCH /api/workspaces/[id] — update workspace fields (name, tenderStatus, tenderOverview)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Verify ownership
  const existing = await prisma.fileWorkspace.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.tenderStatus !== undefined) {
    // Convert frontend status string to DB enum
    updateData.tenderStatus = statusFeToDb[body.tenderStatus] || body.tenderStatus;
  }
  if (body.tenderOverview !== undefined) updateData.tenderOverview = body.tenderOverview;

  const workspace = await prisma.fileWorkspace.update({
    where: { id },
    data: updateData,
    include: WORKSPACE_INCLUDE,
  });

  return NextResponse.json(transformWorkspace(workspace));
}
