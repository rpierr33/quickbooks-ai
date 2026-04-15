import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { findUserById } from "@/lib/users";
import { query, findInStore, pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, unauthorized } = await requireAuth();
  if (unauthorized) return unauthorized;

  const user = await findUserById(((session as any)?.user?.id as string) ?? "");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const companyId = user.company_id;

  try {
    let subscription: Record<string, any> | null = null;

    if (pool) {
      const result = await query(
        `SELECT * FROM subscriptions WHERE company_id = $1 LIMIT 1`,
        [companyId]
      );
      subscription = result.rows[0] ?? null;
    } else {
      subscription = await findInStore(
        "subscriptions",
        (s) => s.company_id === companyId
      );
    }

    if (!subscription) {
      // No subscription record — company is on free trial
      return NextResponse.json({
        plan: "free_trial",
        status: "active",
        stripe_customer_id: null,
        stripe_subscription_id: null,
      });
    }

    return NextResponse.json({
      plan: subscription.plan ?? "free_trial",
      status: subscription.status ?? "active",
      stripe_customer_id: subscription.stripe_customer_id ?? null,
      stripe_subscription_id: subscription.stripe_subscription_id ?? null,
      current_period_start: subscription.current_period_start ?? null,
      current_period_end: subscription.current_period_end ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch subscription";
    console.error("[subscription] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
