import { db } from '../db';
import { portfoliosTable } from '../db/schema';
import { type Portfolio } from '../schema';

export async function getPortfolios(): Promise<Portfolio[]> {
  try {
    // Query all portfolios from the database
    const results = await db.select()
      .from(portfoliosTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(portfolio => ({
      ...portfolio,
      total_value: parseFloat(portfolio.total_value),
      cash_balance: parseFloat(portfolio.cash_balance),
      performance: parseFloat(portfolio.performance)
    }));
  } catch (error) {
    console.error('Failed to fetch portfolios:', error);
    throw error;
  }
}