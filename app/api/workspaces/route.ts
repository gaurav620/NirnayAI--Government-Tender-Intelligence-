import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Status mapping: DB enum → frontend string
const statusDbToFe: Record<string, string> = {
  AWAITING_DOCS: "awaiting_docs",
  SCANNING: "scanning",
  CLARIFYING: "clarifying",
  READY: "ready",
};

const statusFeToDb: Record<string, string> = {
  awaiting_docs: "AWAITING_DOCS",
  scanning: "SCANNING",
  clarifying: "CLARIFYING",
  ready: "READY",
};

const docStatusDbToFe: Record<string, string> = {
  QUEUED: "queued",
  SCANNING: "scanning",
  COMPLETE: "complete",
  FAILED: "failed",
};

// Transform a workspace from DB shape → frontend shape
function transformWorkspace(ws: any) {
  return {
    id: ws.id,
    name: ws.name,
    createdAt: ws.createdAt,
    tenderStatus: statusDbToFe[ws.tenderStatus] || ws.tenderStatus,
    tenderOverview: ws.tenderOverview || null,
    tenderDocs: (ws.tenderDocs || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      size: d.size,
      type: d.type,
      status: docStatusDbToFe[d.status] || d.status,
      uploadedAt: d.uploadedAt,
    })),
    bidders: (ws.bidders || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      createdAt: b.createdAt,
      docs: (b.docs || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        size: d.size,
        type: d.type,
        status: docStatusDbToFe[d.status] || d.status,
        uploadedAt: d.uploadedAt,
      })),
      evaluationResult: b.evaluation
        ? {
            overallVerdict: b.evaluation.overallVerdict,
            criteria: (b.evaluation.criteria || []).map((c: any) => ({
              id: c.criterionId,
              description: c.description,
              category: c.category,
              mandatory: c.mandatory,
              verdict: c.verdict,
              sourceDocument: c.sourceDocument,
              extractedValue: c.extractedValue,
              reason: c.reason,
              confidence: c.confidence,
            })),
          }
        : null,
    })),
    clarificationLog: (ws.clarificationLogs || []).map((l: any) => ({
      role: l.role,
      content: l.content,
    })),
  };
}

// Helper: get or create the DB user from Clerk session
async function getOrCreateUser(clerkId: string, email?: string, name?: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        email: email || `${clerkId}@clerk.user`,
        name: name || "Officer",
      },
    });
  }
  return user;
}

const WORKSPACE_INCLUDE = {
  tenderDocs: true,
  bidders: {
    include: {
      docs: true,
      evaluation: {
        include: { criteria: true },
      },
    },
  },
  clarificationLogs: {
    orderBy: { createdAt: "asc" as const },
  },
};

// GET /api/workspaces — list all workspaces for the authenticated user
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUser(userId);

  const workspaces = await prisma.fileWorkspace.findMany({
    where: { userId: user.id },
    include: WORKSPACE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workspaces.map(transformWorkspace));
}

// POST /api/workspaces — create a new workspace
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUser(userId);
  const body = await request.json();

  const workspace = await prisma.fileWorkspace.create({
    data: {
      name: body.name,
      userId: user.id,
    },
    include: WORKSPACE_INCLUDE,
  });

  return NextResponse.json(transformWorkspace(workspace), { status: 201 });
}

// DELETE /api/workspaces — delete a workspace
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUser(userId);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("id");

  if (!workspaceId) return NextResponse.json({ error: "Missing workspace id" }, { status: 400 });

  // Verify ownership
  const workspace = await prisma.fileWorkspace.findFirst({
    where: { id: workspaceId, userId: user.id },
    include: {
      bidders: {
        include: {
          evaluation: true,
        },
      },
    },
  });

  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    // Delete in correct order to respect foreign key constraints
    // NOTE: PrismaNeon adapter does NOT support interactive transactions,
    // so we delete sequentially instead.

    // 1. Delete criteria (belongs to evaluations)
    const evalIds = workspace.bidders
      .map((b: any) => b.evaluation?.id)
      .filter(Boolean) as string[];
    if (evalIds.length > 0) {
      await prisma.criterion.deleteMany({ where: { evaluationId: { in: evalIds } } });
      await prisma.evaluation.deleteMany({ where: { id: { in: evalIds } } });
    }

    // 2. Delete bidder documents
    const bidderIds = workspace.bidders.map((b: any) => b.id);
    if (bidderIds.length > 0) {
      await prisma.document.deleteMany({ where: { bidderId: { in: bidderIds } } });
    }

    // 3. Delete bidders
    await prisma.bidder.deleteMany({ where: { fileWorkspaceId: workspaceId } });

    // 4. Delete tender documents
    await prisma.document.deleteMany({ where: { fileWorkspaceId: workspaceId } });

    // 5. Delete clarification logs
    await prisma.clarificationLog.deleteMany({ where: { fileWorkspaceId: workspaceId } });

    // 6. Finally delete the workspace itself
    await prisma.fileWorkspace.delete({ where: { id: workspaceId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE workspace] Error:", error);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
}

export { statusFeToDb, docStatusDbToFe, transformWorkspace, getOrCreateUser, WORKSPACE_INCLUDE };
