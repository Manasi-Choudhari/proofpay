import { NextResponse } from "next/server";
import { notFound, withAuth } from "@/lib/api";
import { getMission } from "@/lib/store";

export const GET = withAuth<{ id: string }>(async (_req, session, { id }) => {
  const m = getMission(id, session.email);
  return m ? NextResponse.json(m) : notFound();
});
