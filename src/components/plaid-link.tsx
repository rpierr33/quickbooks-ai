'use client';

import { useState, useCallback } from 'react';

// ── Types ──

interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
}

interface SyncResult {
  added: number;
  modified: number;
  removed: number;
  transactions: Record<string, unknown>[];
}

type ConnectionStatus =
  | 'idle'
  | 'loading'
  | 'not_configured'
  | 'link_ready'
  | 'exchanging'
  | 'connected'
  | 'syncing'
  | 'synced'
  | 'error';

// ── Component ──

export function PlaidLink() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  // Check if Plaid is configured and request a link token
  const handleConnect = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      // First check if Plaid is configured
      const checkRes = await fetch('/api/plaid');
      const checkData = await checkRes.json();

      if (!checkData.configured) {
        setStatus('not_configured');
        return;
      }

      // Request a link token
      const res = await fetch('/api/plaid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_link_token' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create link token');
      }

      const data = await res.json();
      setLinkToken(data.link_token);
      setStatus('link_ready');

      // ──────────────────────────────────────────────────────────────
      // TODO: Initialize Plaid Link with react-plaid-link
      //
      // To enable the full Plaid Link flow:
      //   1. npm install react-plaid-link
      //   2. Replace the simulated exchange below with:
      //
      //   import { usePlaidLink } from 'react-plaid-link';
      //
      //   const { open, ready } = usePlaidLink({
      //     token: data.link_token,
      //     onSuccess: async (publicToken, metadata) => {
      //       await handleExchange(publicToken);
      //     },
      //     onExit: (err) => {
      //       if (err) setError(err.display_message || 'Link exited');
      //       setStatus('idle');
      //     },
      //   });
      //
      //   if (ready) open();
      //
      // For now, the component shows the link token was created
      // successfully and offers a manual "Simulate Exchange" button
      // for sandbox testing.
      // ──────────────────────────────────────────────────────────────
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      setStatus('error');
    }
  }, []);

  // Exchange a public token for an access token (sandbox testing)
  const handleExchange = useCallback(async (publicToken: string) => {
    setStatus('exchanging');
    setError(null);

    try {
      const res = await fetch('/api/plaid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'exchange_token',
          public_token: publicToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to exchange token');
      }

      const data = await res.json();
      setConnectionId(data.connection_id);
      setAccounts(data.accounts || []);
      setStatus('connected');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Exchange failed';
      setError(message);
      setStatus('error');
    }
  }, []);

  // Sync transactions from Plaid
  const handleSync = useCallback(async () => {
    if (!connectionId) return;

    setStatus('syncing');
    setError(null);

    try {
      const res = await fetch('/api/plaid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          connection_id: connectionId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sync failed');
      }

      const data = await res.json();
      setSyncResult({
        added: data.added,
        modified: data.modified,
        removed: data.removed,
        transactions: data.transactions,
      });
      setStatus('synced');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
      setStatus('error');
    }
  }, [connectionId]);

  // Reset to initial state
  const handleReset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setConnectionId(null);
    setAccounts([]);
    setSyncResult(null);
    setLinkToken(null);
  }, []);

  return (
    <div className="rounded-xl bg-white border border-slate-200/80 shadow-sm shadow-slate-100">
      <div className="px-6 pt-6 pb-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Bank Feed Sync
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Connect your bank account to automatically import transactions
        </p>
      </div>

      <div className="px-6 pb-6">
        {/* ── Not Configured State ── */}
        {status === 'not_configured' && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
                <svg
                  className="h-3 w-3 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Bank sync requires Plaid credentials
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Add{' '}
                  <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono text-amber-900">
                    PLAID_CLIENT_ID
                  </code>{' '}
                  and{' '}
                  <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono text-amber-900">
                    PLAID_SECRET
                  </code>{' '}
                  to your environment variables.
                </p>
                <button
                  onClick={handleReset}
                  className="mt-3 text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Idle State ── */}
        {status === 'idle' && (
          <button
            onClick={handleConnect}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Connect Bank Account
          </button>
        )}

        {/* ── Loading State ── */}
        {status === 'loading' && (
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            Connecting to Plaid...
          </div>
        )}

        {/* ── Link Ready State ── */}
        {status === 'link_ready' && linkToken && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-800">
                Link token created successfully. In production, the Plaid Link
                UI would open automatically.
              </p>
              <p className="mt-1 text-xs text-green-600 font-mono break-all">
                Token: {linkToken.slice(0, 24)}...
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Install{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">
                react-plaid-link
              </code>{' '}
              to enable the full bank connection UI.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Exchanging State ── */}
        {status === 'exchanging' && (
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            Linking bank account...
          </div>
        )}

        {/* ── Connected State ── */}
        {status === 'connected' && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-800">
                Bank account connected
              </p>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Linked Accounts
                </p>
                {accounts.map((acct) => (
                  <div
                    key={acct.account_id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {acct.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {acct.type}
                        {acct.subtype ? ` - ${acct.subtype}` : ''}
                        {acct.mask ? ` (...${acct.mask})` : ''}
                      </p>
                    </div>
                    <div className="flex h-6 items-center rounded-full bg-green-100 px-2.5">
                      <span className="text-xs font-medium text-green-700">
                        Connected
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSync}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Sync Transactions
            </button>
          </div>
        )}

        {/* ── Syncing State ── */}
        {status === 'syncing' && (
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            Syncing transactions from your bank...
          </div>
        )}

        {/* ── Synced State ── */}
        {status === 'synced' && syncResult && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                Sync complete
              </p>
              <div className="mt-2 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-900">
                    {syncResult.added}
                  </p>
                  <p className="text-xs text-green-700">Added</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {syncResult.modified}
                  </p>
                  <p className="text-xs text-slate-500">Modified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {syncResult.removed}
                  </p>
                  <p className="text-xs text-slate-500">Removed</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSync}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Sync Again
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {status === 'error' && error && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
