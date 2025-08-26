import { db } from '../db';
import { assetsTable, portfoliosTable } from '../db/schema';
import { type CreateAssetInput, type Asset } from '../schema';
import { eq } from 'drizzle-orm';

export const createAsset = async (input: CreateAssetInput): Promise<Asset> => {
  try {
    // Verify portfolio exists
    const existingPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, input.portfolio_id))
      .execute();

    if (existingPortfolio.length === 0) {
      throw new Error(`Portfolio with ID ${input.portfolio_id} not found`);
    }

    // Insert asset record
    const result = await db.insert(assetsTable)
      .values({
        portfolio_id: input.portfolio_id,
        symbol: input.symbol,
        name: input.name,
        asset_type: input.asset_type,
        quantity: input.quantity.toString(), // Convert number to string for numeric column
        unit_price: input.unit_price.toString(), // Convert number to string for numeric column
        market_value: input.market_value.toString(), // Convert number to string for numeric column
        cost_basis: input.cost_basis.toString(), // Convert number to string for numeric column
        purchase_date: input.purchase_date
      })
      .returning()
      .execute();

    // Update portfolio total_value by adding the new asset's market value
    const currentPortfolio = existingPortfolio[0];
    const newTotalValue = parseFloat(currentPortfolio.total_value) + input.market_value;
    
    await db.update(portfoliosTable)
      .set({
        total_value: newTotalValue.toString(),
        updated_at: new Date()
      })
      .where(eq(portfoliosTable.id, input.portfolio_id))
      .execute();

    // Convert numeric fields back to numbers before returning
    const asset = result[0];
    return {
      ...asset,
      quantity: parseFloat(asset.quantity), // Convert string back to number
      unit_price: parseFloat(asset.unit_price), // Convert string back to number
      market_value: parseFloat(asset.market_value), // Convert string back to number
      cost_basis: parseFloat(asset.cost_basis) // Convert string back to number
    };
  } catch (error) {
    console.error('Asset creation failed:', error);
    throw error;
  }
};