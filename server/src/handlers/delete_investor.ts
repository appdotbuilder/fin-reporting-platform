import { db } from '../db';
import { investorsTable, portfoliosTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteInvestor(id: number): Promise<boolean> {
  try {
    // Check if investor exists first
    const existingInvestor = await db.select()
      .from(investorsTable)
      .where(eq(investorsTable.id, id))
      .execute();

    if (existingInvestor.length === 0) {
      return false; // Investor doesn't exist
    }

    // Check for dependent portfolios
    const dependentPortfolios = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.investor_id, id))
      .execute();

    if (dependentPortfolios.length > 0) {
      // Cannot delete investor with existing portfolios due to foreign key constraint
      throw new Error(`Cannot delete investor with ID ${id}: investor has ${dependentPortfolios.length} associated portfolio(s)`);
    }

    // Delete the investor
    await db.delete(investorsTable)
      .where(eq(investorsTable.id, id))
      .execute();

    return true; // Deletion successful
  } catch (error) {
    console.error('Investor deletion failed:', error);
    throw error;
  }
}