import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { docStatusDbToFe } from "../../route";

// POST /api/workspaces/[id]/bidders — create a new bidder
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

  const workspace = await prisma.fileWorkspace.findFirst({
    where: { id, userId: user.id },
  });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bidder = await prisma.bidder.create({
    data: {
      name: body.name,
      fileWorkspaceId: id,
    },
    include: {
      docs: true,
      evaluation: { include: { criteria: true } },
    },
  });

  // Transform to frontend shape
  return NextResponse.json({
    id: bidder.id,
    name: bidder.name,
    createdAt: bidder.createdAt,
    docs: bidder.docs.map((d: any) => ({
      id: d.id,
      name: d.name,
      size: d.size,
      type: d.type,
      status: docStatusDbToFe[d.status] || d.status,
      uploadedAt: d.uploadedAt,
    })),
    evaluationResult: null,
  }, { status: 201 });
}
