import { db } from '../db';
import { investorsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Investor } from '../schema';

export const getInvestorById = async (id: number): Promise<Investor | null> => {
  try {
    const results = await db.select()
      .from(investorsTable)
      .where(eq(investorsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const investor = results[0];
    
    // Convert numeric fields back to numbers
    return {
      ...investor,
      total_invested: parseFloat(investor.total_invested)
    };
  } catch (error) {
    console.error('Failed to fetch investor by ID:', error);
    throw error;
  }
};