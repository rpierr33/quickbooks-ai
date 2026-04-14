import { NextRequest, NextResponse } from 'next/server';
import { extractReceiptData } from '@/lib/ai';
import { addToStore } from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const { image, mimeType, fileName, fileSize } = body;

    if (!image || !mimeType) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPEG, PNG, WebP, or PDF.' }, { status: 400 });
    }

    // Validate decoded file size (base64 inflates ~33%, so 20M chars ≈ 15MB file)
    const estimatedBytes = Math.ceil(image.length * 3 / 4);
    if (estimatedBytes > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 15MB.' }, { status: 400 });
    }

    const extraction = await extractReceiptData(image, mimeType);

    const scannedReceipt = {
      id: crypto.randomUUID(),
      file_name: fileName || 'receipt',
      file_type: mimeType,
      file_size: fileSize || 0,
      extraction: {
        vendor: extraction.vendor,
        date: extraction.date,
        amount: extraction.amount,
        tax: extraction.tax,
        tip: extraction.tip,
        subtotal: extraction.subtotal,
        currency: extraction.currency,
        category: extraction.category,
        payment_method: extraction.payment_method,
        line_items: extraction.line_items,
        notes: extraction.notes,
      },
      confidence: extraction.confidence,
      status: 'scanned' as const,
      transaction_id: null,
      created_at: new Date().toISOString(),
    };

    await addToStore('scanned_receipts', scannedReceipt);

    return NextResponse.json(scannedReceipt, { status: 201 });
  } catch (error) {
    console.error('Scan receipt error:', error);
    return NextResponse.json({ error: 'Failed to scan receipt' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { unauthorized } = await requireAuth();
    if (unauthorized) return unauthorized;

    const { query } = await import('@/lib/db');
    const result = await query('SELECT * FROM scanned_receipts ORDER BY created_at DESC');

    const rows = result.rows.map(r => ({
      ...r,
      extraction: typeof r.extraction === 'string' ? JSON.parse(r.extraction) : r.extraction,
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Scanned receipts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch scanned receipts' }, { status: 500 });
  }
}
