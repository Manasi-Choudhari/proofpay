import { NextResponse } from "next/server";
import { AuthError, requireApiSession, type Session } from "./auth";

type Ctx<P> = { params: Promise<P> };

export function withAuth<P = Record<string, never>>(
  handler: (req: Request, session: Session, params: P) => Promise<Response>,
) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const session = await requireApiSession();
      return await handler(req, session, (await ctx?.params) as P);
    } catch (e) {
      if (e instanceof AuthError) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
      console.error(e);
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  };
}

export const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
export const bad = (error: string) => NextResponse.json({ error }, { status: 400 });
