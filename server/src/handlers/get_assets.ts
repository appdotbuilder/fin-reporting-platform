import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type Asset } from '../schema';

export const getAssets = async (): Promise<Asset[]> => {
  try {
    // Query all assets from the database
    const results = await db.select()
      .from(assetsTable)
      .execute();

    // Convert numeric fields from strings to numbers
    return results.map(asset => ({
      ...asset,
      quantity: parseFloat(asset.quantity),
      unit_price: parseFloat(asset.unit_price),
      market_value: parseFloat(asset.market_value),
      cost_basis: parseFloat(asset.cost_basis)
    }));
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    throw error;
  }
};