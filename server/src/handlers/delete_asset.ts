import { db } from '../db';
import { assetsTable, portfoliosTable } from '../db/schema';
import { eq, sum } from 'drizzle-orm';

export async function deleteAsset(id: number): Promise<boolean> {
  try {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // First, get the asset to check if it exists and get portfolio_id
      const asset = await tx.select()
        .from(assetsTable)
        .where(eq(assetsTable.id, id))
        .limit(1)
        .execute();

      if (asset.length === 0) {
        return false; // Asset not found
      }

      const portfolioId = asset[0].portfolio_id;

      // Delete the asset
      const deleteResult = await tx.delete(assetsTable)
        .where(eq(assetsTable.id, id))
        .execute();

      if (deleteResult.rowCount === 0) {
        return false; // Nothing was deleted
      }

      // Recalculate portfolio total_value by summing remaining assets' market values
      const remainingAssetsValue = await tx.select({
        totalValue: sum(assetsTable.market_value)
      })
        .from(assetsTable)
        .where(eq(assetsTable.portfolio_id, portfolioId))
        .execute();

      const newTotalValue = remainingAssetsValue[0]?.totalValue || '0';

      // Update portfolio total_value
      await tx.update(portfoliosTable)
        .set({
          total_value: newTotalValue,
          updated_at: new Date()
        })
        .where(eq(portfoliosTable.id, portfolioId))
        .execute();

      return true;
    });
  } catch (error) {
    console.error('Asset deletion failed:', error);
    throw error;
  }
}