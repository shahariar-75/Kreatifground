import { NextResponse } from "next/server";
import { ZodType } from "zod";

export async function parseJsonBody<TSchema extends ZodType>(
  request: Request,
  schema: TSchema,
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      error: NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "Validation failed.",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      ),
    };
  }

  return { data: parsed.data };
}
