import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createAccountInputSchema,
  updateAccountInputSchema,
  createTransactionInputSchema,
  updateTransactionInputSchema,
  createFundInputSchema,
  updateFundInputSchema,
  createInvestorInputSchema,
  updateInvestorInputSchema,
  createPortfolioInputSchema,
  updatePortfolioInputSchema,
  createAssetInputSchema,
  updateAssetInputSchema,
} from './schema';

// Import handlers
import { createAccount } from './handlers/create_account';
import { getAccounts } from './handlers/get_accounts';
import { getAccountById } from './handlers/get_account_by_id';
import { updateAccount } from './handlers/update_account';
import { deleteAccount } from './handlers/delete_account';

import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';
import { getTransactionsByAccount } from './handlers/get_transactions_by_account';
import { updateTransaction } from './handlers/update_transaction';
import { deleteTransaction } from './handlers/delete_transaction';

import { createFund } from './handlers/create_fund';
import { getFunds } from './handlers/get_funds';
import { getFundById } from './handlers/get_fund_by_id';
import { updateFund } from './handlers/update_fund';
import { deleteFund } from './handlers/delete_fund';

import { createInvestor } from './handlers/create_investor';
import { getInvestors } from './handlers/get_investors';
import { getInvestorById } from './handlers/get_investor_by_id';
import { updateInvestor } from './handlers/update_investor';
import { deleteInvestor } from './handlers/delete_investor';

import { createPortfolio } from './handlers/create_portfolio';
import { getPortfolios } from './handlers/get_portfolios';
import { getPortfolioById } from './handlers/get_portfolio_by_id';
import { getPortfoliosByInvestor } from './handlers/get_portfolios_by_investor';
import { updatePortfolio } from './handlers/update_portfolio';
import { deletePortfolio } from './handlers/delete_portfolio';

import { createAsset } from './handlers/create_asset';
import { getAssets } from './handlers/get_assets';
import { getAssetById } from './handlers/get_asset_by_id';
import { getAssetsByPortfolio } from './handlers/get_assets_by_portfolio';
import { updateAsset } from './handlers/update_asset';
import { deleteAsset } from './handlers/delete_asset';

import { getDashboardSummary } from './handlers/get_dashboard_summary';
import { getFundSummary } from './handlers/get_fund_summary';
import { getPortfolioSummary } from './handlers/get_portfolio_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Account routes
  createAccount: publicProcedure
    .input(createAccountInputSchema)
    .mutation(({ input }) => createAccount(input)),
  
  getAccounts: publicProcedure
    .query(() => getAccounts()),
  
  getAccountById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getAccountById(input.id)),
  
  updateAccount: publicProcedure
    .input(updateAccountInputSchema)
    .mutation(({ input }) => updateAccount(input)),
  
  deleteAccount: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteAccount(input.id)),

  // Transaction routes
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),
  
  getTransactions: publicProcedure
    .query(() => getTransactions()),
  
  getTransactionsByAccount: publicProcedure
    .input(z.object({ accountId: z.number() }))
    .query(({ input }) => getTransactionsByAccount(input.accountId)),
  
  updateTransaction: publicProcedure
    .input(updateTransactionInputSchema)
    .mutation(({ input }) => updateTransaction(input)),
  
  deleteTransaction: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTransaction(input.id)),

  // Fund routes
  createFund: publicProcedure
    .input(createFundInputSchema)
    .mutation(({ input }) => createFund(input)),
  
  getFunds: publicProcedure
    .query(() => getFunds()),
  
  getFundById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getFundById(input.id)),
  
  updateFund: publicProcedure
    .input(updateFundInputSchema)
    .mutation(({ input }) => updateFund(input)),
  
  deleteFund: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteFund(input.id)),

  // Investor routes
  createInvestor: publicProcedure
    .input(createInvestorInputSchema)
    .mutation(({ input }) => createInvestor(input)),
  
  getInvestors: publicProcedure
    .query(() => getInvestors()),
  
  getInvestorById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getInvestorById(input.id)),
  
  updateInvestor: publicProcedure
    .input(updateInvestorInputSchema)
    .mutation(({ input }) => updateInvestor(input)),
  
  deleteInvestor: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteInvestor(input.id)),

  // Portfolio routes
  createPortfolio: publicProcedure
    .input(createPortfolioInputSchema)
    .mutation(({ input }) => createPortfolio(input)),
  
  getPortfolios: publicProcedure
    .query(() => getPortfolios()),
  
  getPortfolioById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPortfolioById(input.id)),
  
  getPortfoliosByInvestor: publicProcedure
    .input(z.object({ investorId: z.number() }))
    .query(({ input }) => getPortfoliosByInvestor(input.investorId)),
  
  updatePortfolio: publicProcedure
    .input(updatePortfolioInputSchema)
    .mutation(({ input }) => updatePortfolio(input)),
  
  deletePortfolio: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePortfolio(input.id)),

  // Asset routes
  createAsset: publicProcedure
    .input(createAssetInputSchema)
    .mutation(({ input }) => createAsset(input)),
  
  getAssets: publicProcedure
    .query(() => getAssets()),
  
  getAssetById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getAssetById(input.id)),
  
  getAssetsByPortfolio: publicProcedure
    .input(z.object({ portfolioId: z.number() }))
    .query(({ input }) => getAssetsByPortfolio(input.portfolioId)),
  
  updateAsset: publicProcedure
    .input(updateAssetInputSchema)
    .mutation(({ input }) => updateAsset(input)),
  
  deleteAsset: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteAsset(input.id)),

  // Dashboard and summary routes
  getDashboardSummary: publicProcedure
    .query(() => getDashboardSummary()),
  
  getFundSummary: publicProcedure
    .query(() => getFundSummary()),
  
  getPortfolioSummary: publicProcedure
    .query(() => getPortfolioSummary()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Financial Analytics TRPC server listening at port: ${port}`);
}

start();