import { NextResponse } from "next/server";

/** Shared platform IG marking is retired. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Shared Instagram accounts are no longer supported. Users connect their own accounts.",
    },
    { status: 410 }
  );
}
