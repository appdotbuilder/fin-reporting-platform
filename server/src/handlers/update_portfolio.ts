import { db } from '../db';
import { portfoliosTable } from '../db/schema';
import { type UpdatePortfolioInput, type Portfolio } from '../schema';
import { eq } from 'drizzle-orm';

export async function updatePortfolio(input: UpdatePortfolioInput): Promise<Portfolio | null> {
  try {
    // Prepare update values, converting numeric fields to strings
    const updateValues: any = {};
    
    if (input.name !== undefined) {
      updateValues.name = input.name;
    }
    
    if (input.investor_id !== undefined) {
      updateValues.investor_id = input.investor_id;
    }
    
    if (input.fund_id !== undefined) {
      updateValues.fund_id = input.fund_id;
    }
    
    if (input.total_value !== undefined) {
      updateValues.total_value = input.total_value.toString();
    }
    
    if (input.cash_balance !== undefined) {
      updateValues.cash_balance = input.cash_balance.toString();
    }
    
    if (input.performance !== undefined) {
      updateValues.performance = input.performance.toString();
    }

    // Add updated_at timestamp
    updateValues.updated_at = new Date();

    // Update the portfolio record
    const result = await db
      .update(portfoliosTable)
      .set(updateValues)
      .where(eq(portfoliosTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null; // Portfolio not found
    }

    // Convert numeric fields back to numbers before returning
    const portfolio = result[0];
    return {
      ...portfolio,
      total_value: parseFloat(portfolio.total_value),
      cash_balance: parseFloat(portfolio.cash_balance),
      performance: parseFloat(portfolio.performance)
    };
  } catch (error) {
    console.error('Portfolio update failed:', error);
    throw error;
  }
}