import { NextRequest, NextResponse } from 'next/server';
import { categorizeTransaction } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;
    const { transactions } = await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'transactions array is required' }, { status: 400 });
    }

    const results = await Promise.all(
      transactions.map(async (tx: { description: string; amount: number }) => {
        const result = await categorizeTransaction(tx.description, tx.amount);
        return { ...tx, ...result };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to categorize' }, { status: 500 });
  }
}
