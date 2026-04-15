import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { pool, findInStore, addToStore, updateInStore } from '@/lib/db';
import { asRecord, getString, getNumber, ValidationError } from '@/lib/validate';

export const dynamic = 'force-dynamic';

function defaultSettings(companyId: string) {
  return {
    id: crypto.randomUUID(),
    company_id: companyId,
    tax_name: 'Sales Tax',
    tax_rate: 0,
    tax_number: null,
    white_label_enabled: false,
    white_label_logo: null,
    white_label_footer: null,
    updated_at: new Date().toISOString(),
  };
}

export async function GET(_request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No company in session' }, { status: 400 });
    }

    if (pool) {
      // Try to get existing settings
      const result = await pool.query(
        'SELECT * FROM company_settings WHERE company_id = $1',
        [companyId]
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return NextResponse.json({
          ...row,
          tax_rate: parseFloat(row.tax_rate ?? '0'),
        });
      }
      // Create defaults
      const defaults = defaultSettings(companyId);
      await pool.query(
        `INSERT INTO company_settings (id, company_id, tax_name, tax_rate, tax_number, white_label_enabled, white_label_logo, white_label_footer, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          defaults.id, defaults.company_id, defaults.tax_name,
          defaults.tax_rate, defaults.tax_number, defaults.white_label_enabled,
          defaults.white_label_logo, defaults.white_label_footer, defaults.updated_at,
        ]
      );
      return NextResponse.json(defaults);
    }

    // Mock path
    const existing = await findInStore('company_settings', (r) => r.company_id === companyId);
    if (existing) {
      return NextResponse.json({
        ...existing,
        tax_rate: parseFloat(String(existing.tax_rate ?? '0')),
      });
    }
    const defaults = defaultSettings(companyId);
    await addToStore('company_settings', defaults);
    return NextResponse.json(defaults);
  } catch (error) {
    console.error('settings.GET failed', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { unauthorized, session } = await requireAuth();
    if (unauthorized) return unauthorized;
    const companyId = (session?.user as any)?.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'No company in session' }, { status: 400 });
    }

    const body = asRecord(await request.json());
    const patch: Record<string, unknown> = {};

    const taxName = getString(body, 'tax_name', { max: 100 });
    if (taxName !== undefined) patch.tax_name = taxName;

    const taxRate = getNumber(body, 'tax_rate', { min: 0, max: 100 });
    if (taxRate !== undefined) patch.tax_rate = taxRate;

    const taxNumber = getString(body, 'tax_number', { max: 100 });
    if (taxNumber !== undefined) patch.tax_number = taxNumber;

    if ('white_label_enabled' in body) {
      patch.white_label_enabled = body.white_label_enabled === true || body.white_label_enabled === 'true';
    }

    const wlLogo = getString(body, 'white_label_logo', { max: 300_000 }); // ~225KB binary after base64
    if (wlLogo !== undefined) {
      // Enforce a hard server-side limit: reject base64 strings larger than ~200KB binary
      if (wlLogo !== null && wlLogo.length > 300_000) {
        return NextResponse.json(
          { error: 'Logo must be under 150KB. Try a smaller image or use SVG format.' },
          { status: 413 }
        );
      }
      patch.white_label_logo = wlLogo;
    }

    const wlFooter = getString(body, 'white_label_footer', { max: 500 });
    if (wlFooter !== undefined) patch.white_label_footer = wlFooter;

    patch.updated_at = new Date().toISOString();

    if (pool) {
      // Upsert
      const existing = await pool.query(
        'SELECT id FROM company_settings WHERE company_id = $1',
        [companyId]
      );
      if (existing.rows.length === 0) {
        // Insert with defaults + patch
        const defaults = defaultSettings(companyId);
        const merged = { ...defaults, ...patch };
        await pool.query(
          `INSERT INTO company_settings (id, company_id, tax_name, tax_rate, tax_number, white_label_enabled, white_label_logo, white_label_footer, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            merged.id, merged.company_id, merged.tax_name,
            merged.tax_rate, merged.tax_number, merged.white_label_enabled,
            merged.white_label_logo, merged.white_label_footer, merged.updated_at,
          ]
        );
        return NextResponse.json({ ...merged, tax_rate: parseFloat(String(merged.tax_rate ?? '0')) });
      }
      const settingsId = existing.rows[0].id;
      const keys = Object.keys(patch);
      const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const vals = [settingsId, ...keys.map((k) => patch[k])];
      const updated = await pool.query(
        `UPDATE company_settings SET ${sets} WHERE id = $1 RETURNING *`,
        vals
      );
      const row = updated.rows[0];
      return NextResponse.json({ ...row, tax_rate: parseFloat(row.tax_rate ?? '0') });
    }

    // Mock path
    const existing = await findInStore('company_settings', (r) => r.company_id === companyId);
    if (!existing) {
      const defaults = defaultSettings(companyId);
      const merged = { ...defaults, ...patch };
      await addToStore('company_settings', merged);
      return NextResponse.json(merged);
    }
    const updated = await updateInStore('company_settings', existing.id, patch);
    return NextResponse.json({
      ...updated,
      tax_rate: parseFloat(String(updated?.tax_rate ?? '0')),
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('settings.PUT failed', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
