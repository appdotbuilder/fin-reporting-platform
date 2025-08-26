import { db } from '../db';
import { fundsTable, portfoliosTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteFund = async (id: number): Promise<boolean> => {
  try {
    // Check if the fund exists first
    const existingFund = await db.select()
      .from(fundsTable)
      .where(eq(fundsTable.id, id))
      .execute();

    if (existingFund.length === 0) {
      return false; // Fund doesn't exist
    }

    // Check for foreign key constraints - portfolios that reference this fund
    const relatedPortfolios = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.fund_id, id))
      .execute();

    if (relatedPortfolios.length > 0) {
      // Cannot delete fund with related portfolios due to foreign key constraint
      throw new Error(`Cannot delete fund: ${relatedPortfolios.length} portfolio(s) are still associated with this fund`);
    }

    // Delete the fund
    const result = await db.delete(fundsTable)
      .where(eq(fundsTable.id, id))
      .execute();

    return true; // Successfully deleted
  } catch (error) {
    console.error('Fund deletion failed:', error);
    throw error;
  }
};