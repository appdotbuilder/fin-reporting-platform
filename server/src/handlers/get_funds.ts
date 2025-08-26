import { db } from '../db';
import { fundsTable } from '../db/schema';
import { type Fund } from '../schema';

export async function getFunds(): Promise<Fund[]> {
  try {
    const results = await db.select()
      .from(fundsTable)
      .execute();

    // Convert numeric fields from strings to numbers
    return results.map(fund => ({
      ...fund,
      nav: parseFloat(fund.nav),
      total_assets: parseFloat(fund.total_assets),
      management_fee: parseFloat(fund.management_fee)
    }));
  } catch (error) {
    console.error('Failed to fetch funds:', error);
    throw error;
  }
}