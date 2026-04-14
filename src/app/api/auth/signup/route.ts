import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/users";

export const dynamic = "force-dynamic";

interface SignupBody {
  email?: string;
  password?: string;
  name?: string;
  companyName?: string;
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  let body: SignupBody;
  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim();
  const companyName = (body.companyName ?? "").trim();

  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const user = await createUser({
      email,
      password,
      name,
      companyName: companyName || undefined,
    });
    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: user.company_id,
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signup failed";
    const status = msg.toLowerCase().includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
