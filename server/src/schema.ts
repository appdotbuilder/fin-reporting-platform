import { z } from 'zod';

// Account schema
export const accountSchema = z.object({
  id: z.number(),
  name: z.string(),
  account_number: z.string(),
  account_type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  balance: z.number(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Account = z.infer<typeof accountSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  account_id: z.number(),
  transaction_type: z.enum(['debit', 'credit']),
  amount: z.number(),
  description: z.string().nullable(),
  transaction_date: z.coerce.date(),
  reference_number: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Fund schema
export const fundSchema = z.object({
  id: z.number(),
  name: z.string(),
  fund_type: z.enum(['equity', 'fixed_income', 'mixed', 'alternative']),
  inception_date: z.coerce.date(),
  nav: z.number(), // Net Asset Value
  total_assets: z.number(),
  management_fee: z.number(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Fund = z.infer<typeof fundSchema>;

// Investor schema
export const investorSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  investor_type: z.enum(['individual', 'institutional']),
  total_invested: z.number(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Investor = z.infer<typeof investorSchema>;

// Portfolio schema
export const portfolioSchema = z.object({
  id: z.number(),
  name: z.string(),
  investor_id: z.number(),
  fund_id: z.number(),
  total_value: z.number(),
  cash_balance: z.number(),
  performance: z.number(), // Performance percentage
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Portfolio = z.infer<typeof portfolioSchema>;

// Asset schema
export const assetSchema = z.object({
  id: z.number(),
  portfolio_id: z.number(),
  symbol: z.string(),
  name: z.string(),
  asset_type: z.enum(['stock', 'bond', 'etf', 'mutual_fund', 'commodity', 'real_estate', 'alternative']),
  quantity: z.number(),
  unit_price: z.number(),
  market_value: z.number(),
  cost_basis: z.number(),
  purchase_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Asset = z.infer<typeof assetSchema>;

// Input schemas for creating entities
export const createAccountInputSchema = z.object({
  name: z.string(),
  account_number: z.string(),
  account_type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  balance: z.number(),
  description: z.string().nullable(),
});

export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;

export const createTransactionInputSchema = z.object({
  account_id: z.number(),
  transaction_type: z.enum(['debit', 'credit']),
  amount: z.number().positive(),
  description: z.string().nullable(),
  transaction_date: z.coerce.date(),
  reference_number: z.string().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

export const createFundInputSchema = z.object({
  name: z.string(),
  fund_type: z.enum(['equity', 'fixed_income', 'mixed', 'alternative']),
  inception_date: z.coerce.date(),
  nav: z.number().positive(),
  total_assets: z.number().nonnegative(),
  management_fee: z.number().nonnegative(),
  description: z.string().nullable(),
});

export type CreateFundInput = z.infer<typeof createFundInputSchema>;

export const createInvestorInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  investor_type: z.enum(['individual', 'institutional']),
  total_invested: z.number().nonnegative(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
});

export type CreateInvestorInput = z.infer<typeof createInvestorInputSchema>;

export const createPortfolioInputSchema = z.object({
  name: z.string(),
  investor_id: z.number(),
  fund_id: z.number(),
  total_value: z.number().nonnegative(),
  cash_balance: z.number().nonnegative(),
  performance: z.number(),
});

export type CreatePortfolioInput = z.infer<typeof createPortfolioInputSchema>;

export const createAssetInputSchema = z.object({
  portfolio_id: z.number(),
  symbol: z.string(),
  name: z.string(),
  asset_type: z.enum(['stock', 'bond', 'etf', 'mutual_fund', 'commodity', 'real_estate', 'alternative']),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  market_value: z.number().positive(),
  cost_basis: z.number().positive(),
  purchase_date: z.coerce.date(),
});

export type CreateAssetInput = z.infer<typeof createAssetInputSchema>;

// Input schemas for updating entities
export const updateAccountInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  account_number: z.string().optional(),
  account_type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']).optional(),
  balance: z.number().optional(),
  description: z.string().nullable().optional(),
});

export type UpdateAccountInput = z.infer<typeof updateAccountInputSchema>;

export const updateTransactionInputSchema = z.object({
  id: z.number(),
  account_id: z.number().optional(),
  transaction_type: z.enum(['debit', 'credit']).optional(),
  amount: z.number().positive().optional(),
  description: z.string().nullable().optional(),
  transaction_date: z.coerce.date().optional(),
  reference_number: z.string().nullable().optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

export const updateFundInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  fund_type: z.enum(['equity', 'fixed_income', 'mixed', 'alternative']).optional(),
  inception_date: z.coerce.date().optional(),
  nav: z.number().positive().optional(),
  total_assets: z.number().nonnegative().optional(),
  management_fee: z.number().nonnegative().optional(),
  description: z.string().nullable().optional(),
});

export type UpdateFundInput = z.infer<typeof updateFundInputSchema>;

export const updateInvestorInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  investor_type: z.enum(['individual', 'institutional']).optional(),
  total_invested: z.number().nonnegative().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

export type UpdateInvestorInput = z.infer<typeof updateInvestorInputSchema>;

export const updatePortfolioInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  investor_id: z.number().optional(),
  fund_id: z.number().optional(),
  total_value: z.number().nonnegative().optional(),
  cash_balance: z.number().nonnegative().optional(),
  performance: z.number().optional(),
});

export type UpdatePortfolioInput = z.infer<typeof updatePortfolioInputSchema>;

export const updateAssetInputSchema = z.object({
  id: z.number(),
  portfolio_id: z.number().optional(),
  symbol: z.string().optional(),
  name: z.string().optional(),
  asset_type: z.enum(['stock', 'bond', 'etf', 'mutual_fund', 'commodity', 'real_estate', 'alternative']).optional(),
  quantity: z.number().positive().optional(),
  unit_price: z.number().positive().optional(),
  market_value: z.number().positive().optional(),
  cost_basis: z.number().positive().optional(),
  purchase_date: z.coerce.date().optional(),
});

export type UpdateAssetInput = z.infer<typeof updateAssetInputSchema>;

// Dashboard summary schemas
export const fundSummarySchema = z.object({
  total_funds: z.number(),
  total_assets_under_management: z.number(),
  average_nav: z.number(),
  top_performing_fund: z.string().nullable(),
});

export type FundSummary = z.infer<typeof fundSummarySchema>;

export const portfolioSummarySchema = z.object({
  total_portfolios: z.number(),
  total_portfolio_value: z.number(),
  average_performance: z.number(),
  best_performing_portfolio: z.string().nullable(),
});

export type PortfolioSummary = z.infer<typeof portfolioSummarySchema>;

export const dashboardSummarySchema = z.object({
  fund_summary: fundSummarySchema,
  portfolio_summary: portfolioSummarySchema,
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;