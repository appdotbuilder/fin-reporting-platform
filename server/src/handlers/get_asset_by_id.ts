import { db } from '../db';
import { assetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Asset } from '../schema';

export async function getAssetById(id: number): Promise<Asset | null> {
  try {
    const results = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const asset = results[0];
    
    // Convert numeric fields from strings to numbers
    return {
      ...asset,
      quantity: parseFloat(asset.quantity),
      unit_price: parseFloat(asset.unit_price),
      market_value: parseFloat(asset.market_value),
      cost_basis: parseFloat(asset.cost_basis)
    };
  } catch (error) {
    console.error('Failed to fetch asset by ID:', error);
    throw error;
  }
}