import { db } from '../db';
import { portfoliosTable, investorsTable, fundsTable } from '../db/schema';
import { type CreatePortfolioInput, type Portfolio } from '../schema';
import { eq } from 'drizzle-orm';

export const createPortfolio = async (input: CreatePortfolioInput): Promise<Portfolio> => {
  try {
    // Verify that the investor exists
    const investor = await db.select()
      .from(investorsTable)
      .where(eq(investorsTable.id, input.investor_id))
      .execute();

    if (investor.length === 0) {
      throw new Error(`Investor with id ${input.investor_id} does not exist`);
    }

    // Verify that the fund exists
    const fund = await db.select()
      .from(fundsTable)
      .where(eq(fundsTable.id, input.fund_id))
      .execute();

    if (fund.length === 0) {
      throw new Error(`Fund with id ${input.fund_id} does not exist`);
    }

    // Insert portfolio record
    const result = await db.insert(portfoliosTable)
      .values({
        name: input.name,
        investor_id: input.investor_id,
        fund_id: input.fund_id,
        total_value: input.total_value.toString(), // Convert number to string for numeric column
        cash_balance: input.cash_balance.toString(), // Convert number to string for numeric column
        performance: input.performance.toString(), // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const portfolio = result[0];
    return {
      ...portfolio,
      total_value: parseFloat(portfolio.total_value), // Convert string back to number
      cash_balance: parseFloat(portfolio.cash_balance), // Convert string back to number
      performance: parseFloat(portfolio.performance), // Convert string back to number
    };
  } catch (error) {
    console.error('Portfolio creation failed:', error);
    throw error;
  }
};