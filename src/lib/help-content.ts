export interface HelpStep {
  icon: string;
  title: string;
  description: string;
}

export interface PageHelp {
  title: string;
  subtitle: string;
  benefit: string;
  steps: HelpStep[];
  tips: string[];
}

export const HELP_CONTENT: Record<string, PageHelp> = {
  '/': {
    title: 'Your Dashboard',
    subtitle: 'Your financial command center',
    benefit:
      'See your entire business health at a glance — revenue, expenses, profit, and what needs your attention today. No more spreadsheet hunting.',
    steps: [
      {
        icon: '📊',
        title: 'KPI Cards (top row)',
        description:
          'Cash Balance, Revenue, Expenses, and Net Profit update in real-time. Click any card to drill into the underlying transactions.',
      },
      {
        icon: '📈',
        title: 'Monthly Overview chart',
        description:
          'Green bars = revenue, red bars = expenses. Click any bar to jump to that month\'s transactions and see every line item.',
      },
      {
        icon: '✨',
        title: 'AI Insights panel',
        description:
          'Ledgr\'s AI surfaces unusual spending patterns, profit opportunities, and forecasts. Click any insight to take action.',
      },
      {
        icon: '🔔',
        title: 'Needs Attention',
        description:
          'Overdue invoices and upcoming bills appear here in priority order. Click any item to resolve it immediately.',
      },
      {
        icon: '⚡',
        title: 'Quick Actions',
        description:
          'The three buttons at the top right (Transaction, Invoice, Scan Receipt) are your fastest path to common tasks — no navigation required.',
      },
    ],
    tips: [
      'Check your dashboard at the start of every work week to catch cash flow issues early.',
      'The Net Profit card is your most important number — watch the income/expense ratio bar change as you add data.',
    ],
  },

  '/transactions': {
    title: 'Transactions',
    subtitle: 'Track every dollar in and out',
    benefit:
      'Every expense and payment you record here flows automatically into your reports, tax summaries, and AI insights. Miss a transaction, miss the truth.',
    steps: [
      {
        icon: '➕',
        title: 'Add a Transaction',
        description:
          'Click "+ Add Transaction" in the top right. Fill in: description, amount, type (income or expense), date, and category. Hit Save — it appears instantly.',
      },
      {
        icon: '🔍',
        title: 'Search and Filter',
        description:
          'Use the search bar to find any transaction by description. Use the Type and Date dropdowns to narrow the list by income/expense or time range.',
      },
      {
        icon: '✏️',
        title: 'Edit or Delete',
        description:
          'Hover any row to reveal the Edit (pencil) and Delete (trash) icons on the right. Changes apply immediately and update all reports.',
      },
      {
        icon: '📥',
        title: 'Import from CSV',
        description:
          'Got transactions from your bank? Go to Import in the sidebar. Download your bank\'s CSV and upload it here — Ledgr maps columns automatically.',
      },
    ],
    tips: [
      'Categorize every transaction as you add it — this is what makes your financial reports meaningful.',
      'Use the receipt scanner (sidebar) to photograph a receipt and auto-create the expense. No typing.',
    ],
  },

  '/invoices': {
    title: 'Invoicing',
    subtitle: 'Get paid faster',
    benefit:
      'Professional invoices sent in under a minute. Track exactly who owes you what, when it\'s due, and send reminders with one click.',
    steps: [
      {
        icon: '📝',
        title: 'Create an Invoice',
        description:
          'Click "+ Create Invoice". Step 1: select or create a client. Step 2: add line items with descriptions and amounts. Step 3: set payment terms. Click Send.',
      },
      {
        icon: '📧',
        title: 'Send and Track',
        description:
          'After sending, the invoice moves from Draft → Sent. You\'ll see its status on every card: Sent, Viewed, Overdue, Paid. Overdue invoices turn red automatically.',
      },
      {
        icon: '💰',
        title: 'Mark as Paid',
        description:
          'When payment arrives, open the invoice and click "Mark as Paid". This records the income in your transactions and updates your cash balance.',
      },
      {
        icon: '📄',
        title: 'Download PDF',
        description:
          'Click the PDF icon on any invoice card to download a clean, professional PDF you can email manually or print for your records.',
      },
    ],
    tips: [
      'Set payment terms as Net 15 or Net 30 — invoices without terms get paid 40% slower on average.',
      'Send a reminder the day before and the day after the due date. One click from the invoice detail view.',
    ],
  },

  '/accounts': {
    title: 'Chart of Accounts',
    subtitle: 'The backbone of your books',
    benefit:
      'A chart of accounts organizes every dollar into categories (assets, liabilities, income, expenses). This is what makes your financial reports accurate and tax-ready.',
    steps: [
      {
        icon: '🗂️',
        title: 'Understand the structure',
        description:
          'Accounts are grouped into five types: Assets, Liabilities, Equity, Income, and Expenses. Your bank account lives under Assets. Your sales go under Income.',
      },
      {
        icon: '➕',
        title: 'Add an Account',
        description:
          'Click "+ Add Account". Give it a name (e.g., "Advertising"), select a type (e.g., Expense), and optionally assign an account number. Click Save.',
      },
      {
        icon: '✏️',
        title: 'Edit or Archive',
        description:
          'Click the Edit icon to rename an account or change its type. Accounts with transactions can\'t be deleted — archive them instead to clean up your list.',
      },
      {
        icon: '🔗',
        title: 'Link to Transactions',
        description:
          'When adding a transaction, the Category dropdown pulls from this list. The more specific your accounts, the cleaner your reports.',
      },
    ],
    tips: [
      'Keep your chart of accounts simple at first — you can add more accounts as your needs grow.',
      'Match your accounts to your tax categories for easier year-end filing.',
    ],
  },

  '/clients': {
    title: 'Client Management',
    subtitle: 'Your customer directory',
    benefit:
      'Store every client\'s contact info, payment terms, and invoice history in one place. Never chase down an email address or wonder about a client\'s balance again.',
    steps: [
      {
        icon: '👤',
        title: 'Add a Client',
        description:
          'Click "+ Add Client". Fill in name, email, phone, address, and default payment terms. This client will appear in the invoice creation flow automatically.',
      },
      {
        icon: '📋',
        title: 'View Client History',
        description:
          'Click any client name to open their profile. You\'ll see their total billed, total paid, outstanding balance, and a list of every invoice.',
      },
      {
        icon: '📧',
        title: 'Client Contacts',
        description:
          'Store the billing email carefully — this is where invoice emails get sent. Add a secondary contact if invoices go to accounts payable.',
      },
      {
        icon: '✏️',
        title: 'Edit or Remove',
        description:
          'Click Edit on any client card to update their info. Clients with invoices can\'t be deleted — archive them to hide them from dropdowns.',
      },
    ],
    tips: [
      'Fill in default payment terms per client — this pre-populates every invoice you create for them.',
      'Add a phone number so you have it on hand when following up on overdue invoices.',
    ],
  },

  '/reports': {
    title: 'Financial Reports',
    subtitle: 'Know your numbers',
    benefit:
      'Profit & Loss, Balance Sheet, Cash Flow — the three reports your accountant and the IRS need. Generated automatically from your transactions.',
    steps: [
      {
        icon: '📊',
        title: 'Profit & Loss',
        description:
          'The P&L shows your revenue, costs, and net profit for any time period. Use the date range picker to compare months, quarters, or years.',
      },
      {
        icon: '⚖️',
        title: 'Balance Sheet',
        description:
          'Shows what you own (assets), what you owe (liabilities), and the difference (equity) at a specific point in time. Updated as you add transactions.',
      },
      {
        icon: '💸',
        title: 'Cash Flow',
        description:
          'Tracks when money actually moves in and out. Different from P&L — an invoice is income on P&L but only cash flow when it\'s paid.',
      },
      {
        icon: '💾',
        title: 'Export Reports',
        description:
          'Click the Export button on any report to download a PDF or CSV. Share with your accountant or attach to a loan application.',
      },
    ],
    tips: [
      'Run your P&L monthly to catch expense creep before it becomes a problem.',
      'Share your reports link with your accountant — they can view without needing a Ledgr account.',
    ],
  },

  '/scanner': {
    title: 'Receipt Scanner',
    subtitle: 'Never lose an expense',
    benefit:
      'Photograph a receipt and Ledgr\'s AI reads the vendor, amount, date, and category — no manual entry. Every scanned receipt becomes a transaction automatically.',
    steps: [
      {
        icon: '📸',
        title: 'Scan a Receipt',
        description:
          'Click "Scan Receipt" and either upload an image file or take a photo on mobile. Supported formats: JPG, PNG, PDF.',
      },
      {
        icon: '🤖',
        title: 'AI Extraction',
        description:
          'Ledgr reads the receipt and fills in the vendor name, amount, date, and best-guess category. Review and correct any field before saving.',
      },
      {
        icon: '✅',
        title: 'Confirm and Save',
        description:
          'Once the fields look right, click Save. The expense is added to your transactions with the receipt image attached as proof.',
      },
      {
        icon: '🔍',
        title: 'Find Scanned Receipts',
        description:
          'In the Transactions list, scanned receipts have a camera icon. Click any transaction to view the original receipt image.',
      },
    ],
    tips: [
      'Scan receipts the same day — older receipts are harder to read and easier to forget.',
      'Works best with clear lighting and a flat receipt. Crumpled receipts may need manual correction.',
    ],
  },

  '/budgets': {
    title: 'Budget Tracking',
    subtitle: 'Spend with intention',
    benefit:
      'Set spending limits per category and watch your actual expenses fill the bar in real-time. Know when you\'re about to overspend before it\'s too late.',
    steps: [
      {
        icon: '🎯',
        title: 'Set a Budget',
        description:
          'Click "+ Add Budget". Choose a category (e.g., Advertising), set a monthly limit, and choose the period. Ledgr tracks actuals automatically.',
      },
      {
        icon: '📊',
        title: 'Track Progress',
        description:
          'Each budget card shows a progress bar: green = under budget, yellow = approaching limit, red = over budget. Updated as transactions are categorized.',
      },
      {
        icon: '⚠️',
        title: 'Overspend Alerts',
        description:
          'When spending hits 80% of a budget limit, an alert appears in your dashboard\'s Needs Attention section so you can adjust before going over.',
      },
      {
        icon: '📅',
        title: 'Monthly Reset',
        description:
          'Budgets reset automatically at the start of each month. You can view previous months\'s performance in the history tab.',
      },
    ],
    tips: [
      'Start with your top 5 expense categories — you don\'t need a budget for every account right away.',
      'Set your marketing budget first — it\'s the category most businesses overspend without realizing it.',
    ],
  },

  '/bills': {
    title: 'Bills & Payables',
    subtitle: 'Never miss a payment',
    benefit:
      'Track every bill you owe — rent, subscriptions, vendor invoices. Ledgr shows upcoming due dates so you\'re never surprised by a late fee.',
    steps: [
      {
        icon: '➕',
        title: 'Add a Bill',
        description:
          'Click "+ Add Bill". Enter the vendor, amount, due date, and category. Recurring bills (like rent) can be set to auto-add monthly.',
      },
      {
        icon: '📅',
        title: 'Upcoming Bills',
        description:
          'Bills are sorted by due date. Bills due within 7 days appear in red on your dashboard Needs Attention section.',
      },
      {
        icon: '✅',
        title: 'Mark as Paid',
        description:
          'When you pay a bill, click "Mark Paid". This adds the expense to your transactions automatically — no double entry needed.',
      },
      {
        icon: '🔄',
        title: 'Recurring Bills',
        description:
          'For bills that repeat (subscriptions, rent, utilities), enable "Recurring" and choose the frequency. They\'ll auto-populate each period.',
      },
    ],
    tips: [
      'Add all your subscriptions as recurring bills — most businesses overpay by 15-20% on forgotten subscriptions.',
      'Schedule bill payments 2-3 days before due date to avoid late fees, especially for slow bank transfers.',
    ],
  },

  '/mileage': {
    title: 'Mileage Tracking',
    subtitle: 'Turn driving into deductions',
    benefit:
      'Business miles are tax-deductible. Track every business trip here and Ledgr calculates the deduction at the IRS standard rate automatically.',
    steps: [
      {
        icon: '🚗',
        title: 'Log a Trip',
        description:
          'Click "+ Log Trip". Enter the date, starting point, destination, purpose (e.g., "Client meeting"), and miles. Or let the app calculate miles from addresses.',
      },
      {
        icon: '💰',
        title: 'See Your Deduction',
        description:
          'Ledgr multiplies your miles by the current IRS rate (67 cents/mile in 2025) and shows your running deduction total for the year.',
      },
      {
        icon: '📋',
        title: 'Export for Taxes',
        description:
          'Click Export to download a mileage log in the format your accountant needs. Includes date, route, purpose, and deduction per trip.',
      },
      {
        icon: '📱',
        title: 'Mobile-First',
        description:
          'Log trips from your phone immediately after each drive while the details are fresh. Takes about 30 seconds per entry.',
      },
    ],
    tips: [
      'Log every business trip — even short ones. They add up to hundreds of dollars in deductions over a year.',
      'The IRS requires a contemporaneous mileage log (recorded at time of trip), not one created later. Log as you go.',
    ],
  },

  '/time-tracking': {
    title: 'Time Tracking',
    subtitle: 'Bill every hour you work',
    benefit:
      'Log hours against clients and projects. Ledgr auto-calculates billable amounts at your rate and can create an invoice from time entries in one click.',
    steps: [
      {
        icon: '⏱️',
        title: 'Start a Timer',
        description:
          'Click the Play button to start tracking time right now. Select the client and project, then click Stop when done. Time is logged automatically.',
      },
      {
        icon: '✏️',
        title: 'Manual Entry',
        description:
          'Prefer to log after the fact? Click "+ Log Time". Enter the client, project, hours, date, and description. Your hourly rate auto-fills from client settings.',
      },
      {
        icon: '🧾',
        title: 'Create Invoice from Time',
        description:
          'Select unbilled time entries and click "Create Invoice". Ledgr groups the entries by client, calculates totals, and creates a draft invoice instantly.',
      },
      {
        icon: '📊',
        title: 'View by Client/Project',
        description:
          'Use the filter to see time logged per client or project. Check if you\'re over or under estimated hours on any project.',
      },
    ],
    tips: [
      'Log time as you work, not at the end of the day — most people underestimate their time by 20-30% when reconstructing.',
      'Set a minimum billing increment (e.g., 15 minutes) in settings to avoid undercharging for short tasks.',
    ],
  },

  '/recurring': {
    title: 'Recurring Transactions',
    subtitle: 'Automate the repetitive',
    benefit:
      'Set up income or expenses that repeat on a schedule (weekly, monthly, quarterly). They auto-populate into your transactions so your books stay current without manual entry.',
    steps: [
      {
        icon: '🔄',
        title: 'Create a Recurring Entry',
        description:
          'Click "+ Add Recurring". Fill in the description, amount, type (income/expense), category, and start date. Choose the frequency: daily, weekly, monthly, quarterly, or yearly.',
      },
      {
        icon: '📅',
        title: 'Set the Schedule',
        description:
          'Choose when it recurs and when it ends (or leave end date blank for ongoing). Ledgr creates the transaction automatically on each due date.',
      },
      {
        icon: '✏️',
        title: 'Edit or Pause',
        description:
          'Amounts change? Click Edit on any recurring entry to update it. Toggle the Active switch to pause without deleting.',
      },
      {
        icon: '📋',
        title: 'Review Upcoming',
        description:
          'The Upcoming tab shows all pending recurring transactions for the next 30 days so you can anticipate your cash position.',
      },
    ],
    tips: [
      'Set up recurring entries for rent, subscriptions, and regular client retainers — it eliminates the most tedious bookkeeping.',
      'Review your recurring list quarterly to catch subscriptions you no longer use.',
    ],
  },

  '/projects': {
    title: 'Project Tracking',
    subtitle: 'See if every project is profitable',
    benefit:
      'Track revenue, expenses, and time per project. Know at a glance which projects are profitable and which are costing you money.',
    steps: [
      {
        icon: '📁',
        title: 'Create a Project',
        description:
          'Click "+ New Project". Give it a name, assign a client, set a budget, and add a start and end date. Projects appear in transaction and time entry dropdowns.',
      },
      {
        icon: '💰',
        title: 'Tag Transactions',
        description:
          'When adding a transaction, select the project from the dropdown. The transaction\'s revenue or expense is automatically counted toward that project\'s P&L.',
      },
      {
        icon: '⏱️',
        title: 'Track Time',
        description:
          'Log time to a project from the Time Tracking page. Hours are billed at your project rate and shown in the project\'s financial summary.',
      },
      {
        icon: '📊',
        title: 'Project P&L',
        description:
          'Open any project to see total revenue, total costs, profit margin, and hours logged. Compare budget vs. actual at a glance.',
      },
    ],
    tips: [
      'Create a project for every engagement — even small ones. You\'ll often discover that "quick jobs" aren\'t actually profitable.',
      'Set a project budget before starting work so you get alerts before going over.',
    ],
  },

  '/payroll': {
    title: 'Payroll',
    subtitle: 'Pay your team on time, every time',
    benefit:
      'Run payroll, track employee compensation, and record payroll expenses — all feeding directly into your financial reports so nothing is double-counted.',
    steps: [
      {
        icon: '👥',
        title: 'Add Employees',
        description:
          'Go to the Employees tab and click "+ Add Employee". Enter name, role, salary or hourly rate, pay frequency, and tax details.',
      },
      {
        icon: '💳',
        title: 'Run Payroll',
        description:
          'Click "Run Payroll" at the start of each pay period. Review the payroll summary (gross pay, taxes, net pay per employee) and confirm to process.',
      },
      {
        icon: '📊',
        title: 'Payroll Expenses',
        description:
          'Each payroll run automatically creates expense transactions categorized as "Payroll" so your P&L and cash flow reports reflect actual labor costs.',
      },
      {
        icon: '📋',
        title: 'Pay Stubs',
        description:
          'Download pay stubs as PDFs for each employee from the payroll run history. Employees can also view their stubs from their own login.',
      },
    ],
    tips: [
      'Run payroll on the same day each period to build a habit and avoid late payments.',
      'Save payroll records for at least 7 years — this is an IRS requirement for employment taxes.',
    ],
  },

  '/contractors': {
    title: '1099 Contractors',
    subtitle: 'Track contractor payments for tax time',
    benefit:
      'Pay contractors $600+ in a year? You\'re required to send a 1099-NEC. Ledgr tracks every payment and generates pre-filled 1099s at year-end.',
    steps: [
      {
        icon: '👤',
        title: 'Add a Contractor',
        description:
          'Click "+ Add Contractor". Enter their name, business name (if applicable), EIN or SSN, address, and email. You\'ll need this for the 1099.',
      },
      {
        icon: '💰',
        title: 'Log Payments',
        description:
          'Each time you pay a contractor, log the payment here (or tag an existing expense transaction as contractor payment). The running total updates automatically.',
      },
      {
        icon: '⚠️',
        title: '1099 Threshold Alert',
        description:
          'When a contractor reaches $600, Ledgr flags them in the 1099 section. You\'ll see who qualifies and what you\'ve paid them all year.',
      },
      {
        icon: '📄',
        title: 'Generate 1099 Forms',
        description:
          'At year-end, click "Generate 1099s". Ledgr creates pre-filled PDFs for each qualifying contractor. Send them by January 31st.',
      },
    ],
    tips: [
      'Collect W-9 forms from contractors before their first payment — it\'s much harder to collect later.',
      'The $600 threshold applies per year, not per project. Track all payments to the same contractor.',
    ],
  },

  '/estimates': {
    title: 'Estimates & Quotes',
    subtitle: 'Win jobs with professional proposals',
    benefit:
      'Send polished estimates to prospects and convert them to invoices with one click when they approve. No re-entering data.',
    steps: [
      {
        icon: '📝',
        title: 'Create an Estimate',
        description:
          'Click "+ New Estimate". Select a client, add line items with descriptions and prices, set an expiration date, and add notes. Click Send.',
      },
      {
        icon: '📧',
        title: 'Track Status',
        description:
          'Estimates move through: Draft → Sent → Viewed → Accepted/Declined. You\'ll see when a client viewed the estimate.',
      },
      {
        icon: '✅',
        title: 'Convert to Invoice',
        description:
          'When a client accepts, open the estimate and click "Convert to Invoice". All line items and client info carry over — zero re-entry.',
      },
      {
        icon: '⏰',
        title: 'Expiration Dates',
        description:
          'Set a valid-through date on estimates to create urgency. Expired estimates are archived automatically but can be duplicated and resent.',
      },
    ],
    tips: [
      'Set 30-day expiration dates on estimates — quotes without deadlines often get ignored indefinitely.',
      'Include a clear scope of work in the notes to prevent scope creep disputes later.',
    ],
  },

  '/reconciliation': {
    title: 'Bank Reconciliation',
    subtitle: 'Confirm your books match reality',
    benefit:
      'Reconciliation catches errors, missing transactions, and fraud by comparing your Ledgr records against your actual bank statement. Do it monthly.',
    steps: [
      {
        icon: '🏦',
        title: 'Start Reconciliation',
        description:
          'Click "Reconcile" on an account. Enter your bank statement\'s ending balance and statement date. Ledgr loads all transactions in that period.',
      },
      {
        icon: '✅',
        title: 'Match Transactions',
        description:
          'Go through each transaction and check the box if it appears on your bank statement. Matched totals update as you go.',
      },
      {
        icon: '⚠️',
        title: 'Investigate Differences',
        description:
          'If the difference at the bottom isn\'t $0.00, you have a missing or incorrect transaction. Check for typos, duplicates, or transactions recorded in the wrong account.',
      },
      {
        icon: '✔️',
        title: 'Finish Reconciliation',
        description:
          'When the difference reaches $0.00, click "Finish". Ledgr marks all matched transactions as reconciled and saves the reconciliation report.',
      },
    ],
    tips: [
      'Reconcile monthly, right after your statement closes. Waiting until year-end makes it 10x harder.',
      'Common cause of differences: bank fees that weren\'t recorded, or a transposition error (e.g., $1,200 entered as $1,020).',
    ],
  },

  '/settings': {
    title: 'Settings',
    subtitle: 'Make Ledgr yours',
    benefit:
      'Configure your company details, invoice appearance, tax settings, and integrations. Set it once and everything flows through automatically.',
    steps: [
      {
        icon: '🏢',
        title: 'Company Profile',
        description:
          'Add your company name, logo, address, and tax ID. These appear on every invoice and report you export.',
      },
      {
        icon: '🎨',
        title: 'Invoice Customization',
        description:
          'Choose invoice colors, add a logo, set default payment terms, and write a default footer message (e.g., "Thank you for your business!").',
      },
      {
        icon: '💱',
        title: 'Currency & Fiscal Year',
        description:
          'Set your default currency and fiscal year start month. Important for accurate year-over-year comparisons in reports.',
      },
      {
        icon: '🔔',
        title: 'Notifications',
        description:
          'Choose when to get email alerts: overdue invoices, bills due soon, budget overruns, payroll reminders. Customize each type.',
      },
    ],
    tips: [
      'Add your company logo before sending your first invoice — it instantly looks more professional.',
      'Set your fiscal year start to match when you actually started your business, not just January 1st.',
    ],
  },

  '/billing': {
    title: 'Plans & Billing',
    subtitle: 'Manage your subscription',
    benefit:
      'Upgrade your plan to unlock more features as your business grows. Downgrade or cancel anytime — no lock-ins.',
    steps: [
      {
        icon: '📋',
        title: 'View Current Plan',
        description:
          'Your active plan, billing cycle, and next renewal date are shown at the top. Click "Manage Subscription" to upgrade, downgrade, or cancel.',
      },
      {
        icon: '⬆️',
        title: 'Upgrade Your Plan',
        description:
          'Click on any higher tier to see what\'s included. Upgrades take effect immediately — you\'re charged the prorated difference.',
      },
      {
        icon: '💳',
        title: 'Update Payment Method',
        description:
          'Click "Update Card" to change your credit card on file. Ledgr uses Stripe — your card details are never stored on our servers.',
      },
      {
        icon: '📄',
        title: 'Download Invoices',
        description:
          'All your past billing invoices are listed here. Download any as a PDF for expense tracking or reimbursement.',
      },
    ],
    tips: [
      'Start on the free trial to explore all features before committing to a paid plan.',
      'Annual plans save 20% compared to month-to-month — consider switching once you know Ledgr works for you.',
    ],
  },

  '/ai': {
    title: 'AI Assistant',
    subtitle: 'Your financial advisor on demand',
    benefit:
      'Ask anything about your finances in plain English. "What was my most profitable month?" or "How can I reduce my expenses?" — Ledgr\'s AI has real answers from your real data.',
    steps: [
      {
        icon: '💬',
        title: 'Ask a Question',
        description:
          'Type any financial question in the chat box. The AI has full access to your transactions, invoices, and reports — no need to give context.',
      },
      {
        icon: '📊',
        title: 'Get Insights',
        description:
          'Ask for analysis like "Show me my top 5 expense categories" or "Which clients owe me the most?" The AI responds with charts and summaries.',
      },
      {
        icon: '🔮',
        title: 'Cash Flow Forecast',
        description:
          'Ask "What will my cash flow look like in 60 days?" The AI models your recurring revenue and known expenses to project your balance.',
      },
      {
        icon: '💡',
        title: 'Get Recommendations',
        description:
          'Ask "How can I improve my profit margin?" or "Am I spending too much on [category]?" You\'ll get specific, data-backed suggestions.',
      },
    ],
    tips: [
      'The more transactions you have logged, the more accurate and useful the AI\'s responses become.',
      'Save useful AI responses by copying them — the chat doesn\'t persist between sessions.',
    ],
  },

  '/journal': {
    title: 'Journal Entries',
    subtitle: 'Manual double-entry accounting',
    benefit:
      'For adjustments, depreciation, owner contributions, and complex transactions that don\'t fit the standard transaction form. Keeps your books GAAP-compliant.',
    steps: [
      {
        icon: '📓',
        title: 'Create a Journal Entry',
        description:
          'Click "+ New Journal Entry". Add a date and description. Then add two or more lines — each line has an account, debit amount, and credit amount.',
      },
      {
        icon: '⚖️',
        title: 'Balance the Entry',
        description:
          'Total debits must equal total credits. The form shows the running difference — it must reach $0.00 before you can save. This is double-entry accounting.',
      },
      {
        icon: '🔍',
        title: 'Review Past Entries',
        description:
          'The journal log shows every entry in reverse chronological order. Click any entry to view the full debit/credit breakdown.',
      },
      {
        icon: '↩️',
        title: 'Reverse an Entry',
        description:
          'Made an error? Click "Reverse" on any entry to create an offsetting entry automatically — this is cleaner than deleting.',
      },
    ],
    tips: [
      'If you\'re not sure whether you need a journal entry, you probably don\'t — use regular transactions for 95% of cases.',
      'Always add a clear description to journal entries so your accountant understands them during year-end review.',
    ],
  },

  '/import': {
    title: 'Import Data',
    subtitle: 'Bring in your existing data',
    benefit:
      'Already have data in another tool or a bank CSV? Import it all into Ledgr in minutes. No manual re-entry of months of history.',
    steps: [
      {
        icon: '📁',
        title: 'Prepare Your CSV',
        description:
          'Export a CSV from your bank or previous accounting tool. Required columns: Date, Description, Amount. Optional: Category, Type. Download our template if unsure.',
      },
      {
        icon: '⬆️',
        title: 'Upload the File',
        description:
          'Click "Upload CSV" and select your file. Ledgr shows a preview of the first 10 rows and maps the columns automatically.',
      },
      {
        icon: '🗂️',
        title: 'Map Columns',
        description:
          'If the auto-mapping isn\'t right, use the dropdowns to match your CSV columns to Ledgr\'s fields. Required: Date, Description, Amount.',
      },
      {
        icon: '✅',
        title: 'Review and Import',
        description:
          'Ledgr shows how many transactions will be imported and flags any rows with issues. Fix or skip flagged rows, then click Import.',
      },
    ],
    tips: [
      'Import in chronological order (oldest first) to keep your transaction history clean.',
      'After importing, run through the transactions and categorize any that weren\'t assigned a category automatically.',
    ],
  },

  '/inventory': {
    title: 'Inventory',
    subtitle: 'Track what you have in stock',
    benefit:
      'Know exactly what\'s on your shelves, get low-stock alerts before you run out, and see the cost of goods automatically reflected in your P&L.',
    steps: [
      {
        icon: '📦',
        title: 'Add an Item',
        description:
          'Click "+ Add Item". Enter the name, SKU (optional), quantity on hand, cost per unit, and selling price. Set the low-stock threshold for alerts.',
      },
      {
        icon: '🔄',
        title: 'Record Stock Movement',
        description:
          'When you receive inventory, click "+ Restock" and enter the quantity and cost. When you sell, click "Sell" and enter the quantity — COGS is calculated automatically.',
      },
      {
        icon: '⚠️',
        title: 'Low Stock Alerts',
        description:
          'Items at or below their low-stock threshold appear in red. You\'ll also see a low-stock alert in the dashboard Needs Attention section.',
      },
      {
        icon: '📊',
        title: 'Inventory Value',
        description:
          'The Inventory Value card shows the total cost of all stock on hand. This feeds into your Balance Sheet as an asset.',
      },
    ],
    tips: [
      'Do a physical inventory count quarterly to catch discrepancies between records and reality.',
      'Set low-stock thresholds based on lead time — if it takes 2 weeks to restock, set the threshold at 2 weeks\' worth of sales.',
    ],
  },

  '/purchase-orders': {
    title: 'Purchase Orders',
    subtitle: 'Order from vendors professionally',
    benefit:
      'Create formal purchase orders for vendors. Track what you\'ve ordered, what\'s been received, and what\'s outstanding — so you\'re never surprised by a delivery.',
    steps: [
      {
        icon: '📋',
        title: 'Create a PO',
        description:
          'Click "+ New PO". Select a vendor (add them first in Clients if needed), add line items with quantities and unit costs, and set the expected delivery date.',
      },
      {
        icon: '📧',
        title: 'Send to Vendor',
        description:
          'Click Send to email the PO to the vendor\'s email address. The PO PDF is attached automatically. The PO status changes from Draft to Sent.',
      },
      {
        icon: '✅',
        title: 'Receive Items',
        description:
          'When inventory arrives, open the PO and click "Receive Items". Mark which items arrived and in what quantities. Partial receipts are tracked.',
      },
      {
        icon: '💰',
        title: 'Match to Bill',
        description:
          'When the vendor sends an invoice, click "Create Bill" from the PO. The bill is pre-filled from the PO quantities and prices.',
      },
    ],
    tips: [
      'Use PO numbers consistently — it makes it much easier to match vendor invoices to what you actually ordered.',
      'Keep POs even after delivery — they\'re your record if a vendor bills you for something you didn\'t receive.',
    ],
  },

  '/activity': {
    title: 'Activity Log',
    subtitle: 'Every action, fully audited',
    benefit:
      'A complete audit trail of everything that happens in your account — who changed what, when. Essential for team accountability and fraud detection.',
    steps: [
      {
        icon: '🕒',
        title: 'View Recent Activity',
        description:
          'The log shows the most recent actions at the top: transactions added, invoices sent, settings changed, logins, and more.',
      },
      {
        icon: '🔍',
        title: 'Filter by Type',
        description:
          'Use the filter to narrow to specific event types: transactions, invoices, auth events, settings changes. Filter by date range or user.',
      },
      {
        icon: '👤',
        title: 'See Who Did What',
        description:
          'Every entry shows the user who performed the action (name + email), the action taken, and the timestamp. Multi-user accounts show each user separately.',
      },
      {
        icon: '⬇️',
        title: 'Export Log',
        description:
          'Click Export to download the full activity log as a CSV. Useful for audits, compliance reviews, or investigating discrepancies.',
      },
    ],
    tips: [
      'Review the activity log weekly if you have multiple team members with access — catch unauthorized changes early.',
      'For security, failed login attempts also appear in the log. Multiple failures from an unknown IP is a red flag.',
    ],
  },
};
