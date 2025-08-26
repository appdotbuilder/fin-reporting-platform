import { db } from '../db';
import { portfoliosTable } from '../db/schema';
import { type Portfolio } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPortfolioById(id: number): Promise<Portfolio | null> {
  try {
    const results = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const portfolio = results[0];
    
    // Convert numeric fields back to numbers
    return {
      ...portfolio,
      total_value: parseFloat(portfolio.total_value),
      cash_balance: parseFloat(portfolio.cash_balance),
      performance: parseFloat(portfolio.performance)
    };
  } catch (error) {
    console.error('Portfolio retrieval failed:', error);
    throw error;
  }
}