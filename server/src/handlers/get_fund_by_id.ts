import { db } from '../db';
import { fundsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Fund } from '../schema';

export const getFundById = async (id: number): Promise<Fund | null> => {
  try {
    const results = await db.select()
      .from(fundsTable)
      .where(eq(fundsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const fund = results[0];
    
    // Convert numeric fields back to numbers
    return {
      ...fund,
      nav: parseFloat(fund.nav),
      total_assets: parseFloat(fund.total_assets),
      management_fee: parseFloat(fund.management_fee)
    };
  } catch (error) {
    console.error('Fund retrieval failed:', error);
    throw error;
  }
};