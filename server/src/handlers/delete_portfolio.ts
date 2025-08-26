import { db } from '../db';
import { portfoliosTable, assetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deletePortfolio(id: number): Promise<boolean> {
  try {
    // First, delete all assets associated with this portfolio to avoid foreign key constraint violation
    await db.delete(assetsTable)
      .where(eq(assetsTable.portfolio_id, id))
      .execute();

    // Then delete the portfolio
    const result = await db.delete(portfoliosTable)
      .where(eq(portfoliosTable.id, id))
      .execute();

    // Return true if the portfolio was deleted (result.rowCount > 0), false if not found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Portfolio deletion failed:', error);
    throw error;
  }
}