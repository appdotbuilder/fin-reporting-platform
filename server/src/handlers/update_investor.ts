import { db } from '../db';
import { investorsTable } from '../db/schema';
import { type UpdateInvestorInput, type Investor } from '../schema';
import { eq } from 'drizzle-orm';

export const updateInvestor = async (input: UpdateInvestorInput): Promise<Investor | null> => {
  try {
    const { id, ...updateData } = input;

    // Convert numeric fields to strings for database storage
    const dbUpdateData: any = { ...updateData };
    if (updateData.total_invested !== undefined) {
      dbUpdateData.total_invested = updateData.total_invested.toString();
    }

    // Add updated_at timestamp
    dbUpdateData.updated_at = new Date();

    // Update the investor record
    const result = await db.update(investorsTable)
      .set(dbUpdateData)
      .where(eq(investorsTable.id, id))
      .returning()
      .execute();

    // Return null if no investor was found
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const investor = result[0];
    return {
      ...investor,
      total_invested: parseFloat(investor.total_invested)
    };
  } catch (error) {
    console.error('Investor update failed:', error);
    throw error;
  }
};