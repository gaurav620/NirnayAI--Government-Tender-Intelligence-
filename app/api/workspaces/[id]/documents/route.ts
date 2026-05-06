import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { docStatusDbToFe } from "../../route";

const statusFeToDbDoc: Record<string, string> = {
  queued: "QUEUED",
  scanning: "SCANNING",
  complete: "COMPLETE",
  failed: "FAILED",
};

function transformDoc(d: any) {
  return {
    id: d.id,
    name: d.name,
    size: d.size,
    type: d.type,
    status: docStatusDbToFe[d.status] || d.status,
    uploadedAt: d.uploadedAt,
    extractedText: d.extractedText || null,
  };
}

// POST /api/workspaces/[id]/documents — add documents to a workspace
export async function POST(
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
  const workspace = await prisma.fileWorkspace.findFirst({
    where: { id, userId: user.id },
  });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // body.documents = [{ name, size, type }]
  const docs = await Promise.all(
    body.documents.map((doc: { name: string; size: number; type: string }) =>
      prisma.document.create({
        data: {
          name: doc.name,
          size: doc.size,
          type: doc.type,
          fileWorkspaceId: id,
        },
      })
    )
  );

  // Update tender status to SCANNING
  await prisma.fileWorkspace.update({
    where: { id },
    data: { tenderStatus: "SCANNING" },
  });

  return NextResponse.json(docs.map(transformDoc), { status: 201 });
}

// PATCH /api/workspaces/[id]/documents — update document status or extractedText
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await params; // consume params
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.status !== undefined) {
    updateData.status = statusFeToDbDoc[body.status] || body.status;
  }
  if (body.extractedText !== undefined) {
    updateData.extractedText = body.extractedText;
  }

  const doc = await prisma.document.update({
    where: { id: body.documentId },
    data: updateData,
  });

  return NextResponse.json(transformDoc(doc));
}
