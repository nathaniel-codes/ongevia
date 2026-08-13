import { NextResponse } from "next/server";

/**
 * Shared collaborate mode is retired. Users connect their own Instagram.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Collaborate mode is no longer available. Connect your own Instagram account instead.",
    },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}
