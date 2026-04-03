// ACTIVATION: npm install plaid && set PLAID_CLIENT_ID and PLAID_SECRET env vars
//
// This module uses dynamic imports so the app compiles without the `plaid`
// package installed. Once you run `npm install plaid`, every function here
// becomes fully operational.

// ── Plaid SDK types (declared locally so the file compiles without the package) ──

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string | null;
  category?: string[] | null;
  pending: boolean;
  iso_currency_code?: string | null;
  payment_channel: string;
}

interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    iso_currency_code: string | null;
  };
}

interface PlaidSyncResponse {
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: { transaction_id: string }[];
  next_cursor: string;
  has_more: boolean;
}

export interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
}

export interface PlaidExchangeResponse {
  access_token: string;
  item_id: string;
}

export interface PlaidAccountsResponse {
  accounts: PlaidAccount[];
}

export interface PlaidTransactionsResponse {
  transactions: PlaidTransaction[];
  total_transactions: number;
}

export type { PlaidTransaction, PlaidAccount, PlaidSyncResponse };

// ── Configuration helpers ──

export function isConfigured(): boolean {
  return Boolean(
    process.env.PLAID_CLIENT_ID &&
    process.env.PLAID_CLIENT_ID.length > 0 &&
    process.env.PLAID_SECRET &&
    process.env.PLAID_SECRET.length > 0
  );
}

function getEnvironment(): string {
  return process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
}

/**
 * Lazily creates the Plaid API client via dynamic import so the rest of the
 * app compiles even when the `plaid` npm package is not installed.
 */
async function getClient(): Promise<any> {
  if (!isConfigured()) {
    throw new Error(
      'Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET environment variables.'
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const plaid = require('plaid');
    const { Configuration, PlaidApi, PlaidEnvironments } = plaid;

    const env = getEnvironment();
    const basePath =
      env === 'production'
        ? PlaidEnvironments.production
        : PlaidEnvironments.sandbox;

    const configuration = new Configuration({
      basePath,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
          'PLAID-SECRET': process.env.PLAID_SECRET!,
        },
      },
    });

    return new PlaidApi(configuration);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    if (message.includes("Cannot find module") || message.includes("MODULE_NOT_FOUND")) {
      throw new Error(
        'The "plaid" package is not installed. Run: npm install plaid'
      );
    }
    throw error;
  }
}

// ── Exported Plaid functions ──

/**
 * Creates a Plaid Link token for the given user. The frontend passes this
 * token to the Plaid Link UI component.
 */
export async function createLinkToken(userId: string): Promise<PlaidLinkTokenResponse> {
  try {
    const client = await getClient();

    const response = await client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Ledgr Accounting',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
      // Optional: restrict to specific account types
      account_filters: {
        depository: {
          account_subtypes: ['checking', 'savings'],
        },
        credit: {
          account_subtypes: ['credit card'],
        },
      },
    });

    return {
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Plaid createLinkToken error:', message);
    throw new Error(`Failed to create link token: ${message}`);
  }
}

/**
 * Exchanges a public token (received from Plaid Link on the frontend) for a
 * permanent access token that can be stored server-side.
 */
export async function exchangePublicToken(publicToken: string): Promise<PlaidExchangeResponse> {
  try {
    const client = await getClient();

    const response = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return {
      access_token: response.data.access_token,
      item_id: response.data.item_id,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Plaid exchangePublicToken error:', message);
    throw new Error(`Failed to exchange public token: ${message}`);
  }
}

/**
 * Fetches all accounts linked to the given access token.
 */
export async function getAccounts(accessToken: string): Promise<PlaidAccountsResponse> {
  try {
    const client = await getClient();

    const response = await client.accountsGet({
      access_token: accessToken,
    });

    return {
      accounts: response.data.accounts.map((acct: any) => ({
        account_id: acct.account_id,
        name: acct.name,
        official_name: acct.official_name ?? null,
        type: acct.type,
        subtype: acct.subtype ?? null,
        mask: acct.mask ?? null,
        balances: {
          available: acct.balances.available,
          current: acct.balances.current,
          limit: acct.balances.limit ?? null,
          iso_currency_code: acct.balances.iso_currency_code ?? null,
        },
      })),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Plaid getAccounts error:', message);
    throw new Error(`Failed to fetch accounts: ${message}`);
  }
}

/**
 * Fetches transactions for the given date range using the standard
 * transactionsGet endpoint. Handles pagination automatically.
 */
export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<PlaidTransactionsResponse> {
  try {
    const client = await getClient();

    const allTransactions: PlaidTransaction[] = [];
    let totalTransactions = 0;
    let offset = 0;
    const count = 500; // max per request

    // Paginate through all transactions
    do {
      const response = await client.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: { count, offset },
      });

      const data = response.data;
      totalTransactions = data.total_transactions;

      const mapped: PlaidTransaction[] = data.transactions.map((t: any) => ({
        transaction_id: t.transaction_id,
        account_id: t.account_id,
        amount: t.amount,
        date: t.date,
        name: t.name,
        merchant_name: t.merchant_name ?? null,
        category: t.category ?? null,
        pending: t.pending,
        iso_currency_code: t.iso_currency_code ?? null,
        payment_channel: t.payment_channel,
      }));

      allTransactions.push(...mapped);
      offset += data.transactions.length;
    } while (allTransactions.length < totalTransactions);

    return {
      transactions: allTransactions,
      total_transactions: totalTransactions,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Plaid getTransactions error:', message);
    throw new Error(`Failed to fetch transactions: ${message}`);
  }
}

/**
 * Uses the Plaid Transactions Sync endpoint for incremental updates.
 * Pass the cursor from the previous sync to get only new/modified/removed
 * transactions. Pass no cursor (or empty string) for the initial full sync.
 */
export async function syncTransactions(
  accessToken: string,
  cursor?: string
): Promise<PlaidSyncResponse> {
  try {
    const client = await getClient();

    const added: PlaidTransaction[] = [];
    const modified: PlaidTransaction[] = [];
    const removed: { transaction_id: string }[] = [];
    let hasMore = true;
    let nextCursor = cursor || '';

    while (hasMore) {
      const response = await client.transactionsSync({
        access_token: accessToken,
        cursor: nextCursor || undefined,
        count: 500,
      });

      const data = response.data;

      const mapTxn = (t: any): PlaidTransaction => ({
        transaction_id: t.transaction_id,
        account_id: t.account_id,
        amount: t.amount,
        date: t.date,
        name: t.name,
        merchant_name: t.merchant_name ?? null,
        category: t.category ?? null,
        pending: t.pending,
        iso_currency_code: t.iso_currency_code ?? null,
        payment_channel: t.payment_channel,
      });

      added.push(...data.added.map(mapTxn));
      modified.push(...data.modified.map(mapTxn));
      removed.push(
        ...data.removed.map((r: any) => ({
          transaction_id: r.transaction_id,
        }))
      );

      hasMore = data.has_more;
      nextCursor = data.next_cursor;
    }

    return {
      added,
      modified,
      removed,
      next_cursor: nextCursor,
      has_more: false, // We looped until has_more was false
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Plaid syncTransactions error:', message);
    throw new Error(`Failed to sync transactions: ${message}`);
  }
}
