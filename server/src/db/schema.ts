import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense']);
export const transactionTypeEnum = pgEnum('transaction_type', ['debit', 'credit']);
export const fundTypeEnum = pgEnum('fund_type', ['equity', 'fixed_income', 'mixed', 'alternative']);
export const investorTypeEnum = pgEnum('investor_type', ['individual', 'institutional']);
export const assetTypeEnum = pgEnum('asset_type', ['stock', 'bond', 'etf', 'mutual_fund', 'commodity', 'real_estate', 'alternative']);

// Accounts table
export const accountsTable = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  account_number: text('account_number').notNull().unique(),
  account_type: accountTypeEnum('account_type').notNull(),
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  account_id: integer('account_id').notNull().references(() => accountsTable.id),
  transaction_type: transactionTypeEnum('transaction_type').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  transaction_date: timestamp('transaction_date').notNull(),
  reference_number: text('reference_number'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Funds table
export const fundsTable = pgTable('funds', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  fund_type: fundTypeEnum('fund_type').notNull(),
  inception_date: timestamp('inception_date').notNull(),
  nav: numeric('nav', { precision: 15, scale: 4 }).notNull(), // Net Asset Value with higher precision
  total_assets: numeric('total_assets', { precision: 15, scale: 2 }).notNull(),
  management_fee: numeric('management_fee', { precision: 5, scale: 4 }).notNull(), // Percentage with 4 decimal precision
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Investors table
export const investorsTable = pgTable('investors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  investor_type: investorTypeEnum('investor_type').notNull(),
  total_invested: numeric('total_invested', { precision: 15, scale: 2 }).notNull(),
  phone: text('phone'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Portfolios table
export const portfoliosTable = pgTable('portfolios', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  investor_id: integer('investor_id').notNull().references(() => investorsTable.id),
  fund_id: integer('fund_id').notNull().references(() => fundsTable.id),
  total_value: numeric('total_value', { precision: 15, scale: 2 }).notNull(),
  cash_balance: numeric('cash_balance', { precision: 15, scale: 2 }).notNull(),
  performance: numeric('performance', { precision: 8, scale: 4 }).notNull(), // Performance percentage
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Assets table
export const assetsTable = pgTable('assets', {
  id: serial('id').primaryKey(),
  portfolio_id: integer('portfolio_id').notNull().references(() => portfoliosTable.id),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  asset_type: assetTypeEnum('asset_type').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 6 }).notNull(), // High precision for fractional shares
  unit_price: numeric('unit_price', { precision: 15, scale: 4 }).notNull(),
  market_value: numeric('market_value', { precision: 15, scale: 2 }).notNull(),
  cost_basis: numeric('cost_basis', { precision: 15, scale: 2 }).notNull(),
  purchase_date: timestamp('purchase_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const accountsRelations = relations(accountsTable, ({ many }) => ({
  transactions: many(transactionsTable),
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  account: one(accountsTable, {
    fields: [transactionsTable.account_id],
    references: [accountsTable.id],
  }),
}));

export const fundsRelations = relations(fundsTable, ({ many }) => ({
  portfolios: many(portfoliosTable),
}));

export const investorsRelations = relations(investorsTable, ({ many }) => ({
  portfolios: many(portfoliosTable),
}));

export const portfoliosRelations = relations(portfoliosTable, ({ one, many }) => ({
  investor: one(investorsTable, {
    fields: [portfoliosTable.investor_id],
    references: [investorsTable.id],
  }),
  fund: one(fundsTable, {
    fields: [portfoliosTable.fund_id],
    references: [fundsTable.id],
  }),
  assets: many(assetsTable),
}));

export const assetsRelations = relations(assetsTable, ({ one }) => ({
  portfolio: one(portfoliosTable, {
    fields: [assetsTable.portfolio_id],
    references: [portfoliosTable.id],
  }),
}));

// TypeScript types for table schemas
export type Account = typeof accountsTable.$inferSelect;
export type NewAccount = typeof accountsTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

export type Fund = typeof fundsTable.$inferSelect;
export type NewFund = typeof fundsTable.$inferInsert;

export type Investor = typeof investorsTable.$inferSelect;
export type NewInvestor = typeof investorsTable.$inferInsert;

export type Portfolio = typeof portfoliosTable.$inferSelect;
export type NewPortfolio = typeof portfoliosTable.$inferInsert;

export type Asset = typeof assetsTable.$inferSelect;
export type NewAsset = typeof assetsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  accounts: accountsTable,
  transactions: transactionsTable,
  funds: fundsTable,
  investors: investorsTable,
  portfolios: portfoliosTable,
  assets: assetsTable,
};