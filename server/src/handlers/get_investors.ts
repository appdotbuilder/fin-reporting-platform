import { db } from '../db';
import { investorsTable } from '../db/schema';
import { type Investor } from '../schema';

export const getInvestors = async (): Promise<Investor[]> => {
  try {
    const results = await db.select()
      .from(investorsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(investor => ({
      ...investor,
      total_invested: parseFloat(investor.total_invested)
    }));
  } catch (error) {
    console.error('Failed to fetch investors:', error);
    throw error;
  }
};