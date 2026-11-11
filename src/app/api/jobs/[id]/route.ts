import { NextResponse } from "next/server";
import { notFound, withAuth } from "@/lib/api";
import { getJob } from "@/lib/store";

export const GET = withAuth<{ id: string }>(async (_req, session, { id }) => {
  const job = getJob(id, session.email);
  return job ? NextResponse.json(job) : notFound();
});
