import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type Asset } from '../schema';
import { eq } from 'drizzle-orm';

export async function getAssetsByPortfolio(portfolioId: number): Promise<Asset[]> {
  try {
    // Query assets by portfolio_id
    const results = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.portfolio_id, portfolioId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(asset => ({
      ...asset,
      quantity: parseFloat(asset.quantity),
      unit_price: parseFloat(asset.unit_price),
      market_value: parseFloat(asset.market_value),
      cost_basis: parseFloat(asset.cost_basis)
    }));
  } catch (error) {
    console.error('Failed to fetch assets by portfolio:', error);
    throw error;
  }
}