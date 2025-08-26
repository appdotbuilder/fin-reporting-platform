import { db } from '../db';
import { portfoliosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Portfolio } from '../schema';

export const getPortfoliosByInvestor = async (investorId: number): Promise<Portfolio[]> => {
  try {
    // Query portfolios filtered by investor_id
    const results = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.investor_id, investorId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(portfolio => ({
      ...portfolio,
      total_value: parseFloat(portfolio.total_value),
      cash_balance: parseFloat(portfolio.cash_balance),
      performance: parseFloat(portfolio.performance)
    }));
  } catch (error) {
    console.error('Failed to get portfolios by investor:', error);
    throw error;
  }
};