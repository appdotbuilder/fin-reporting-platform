import { db } from '../db';
import { assetsTable, portfoliosTable } from '../db/schema';
import { type UpdateAssetInput, type Asset } from '../schema';
import { eq, sum } from 'drizzle-orm';

export async function updateAsset(input: UpdateAssetInput): Promise<Asset | null> {
  try {
    // First check if the asset exists
    const existingAsset = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, input.id))
      .execute();

    if (existingAsset.length === 0) {
      return null;
    }

    const currentAsset = existingAsset[0];

    // Verify referenced portfolio exists if portfolio_id is being updated
    if (input.portfolio_id && input.portfolio_id !== currentAsset.portfolio_id) {
      const portfolio = await db.select()
        .from(portfoliosTable)
        .where(eq(portfoliosTable.id, input.portfolio_id))
        .execute();

      if (portfolio.length === 0) {
        throw new Error(`Portfolio with ID ${input.portfolio_id} not found`);
      }
    }

    // Prepare update data with numeric field conversions
    const updateData: any = {
      updated_at: new Date(),
    };

    // Only include provided fields in update
    if (input.portfolio_id !== undefined) updateData.portfolio_id = input.portfolio_id;
    if (input.symbol !== undefined) updateData.symbol = input.symbol;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.asset_type !== undefined) updateData.asset_type = input.asset_type;
    if (input.quantity !== undefined) updateData.quantity = input.quantity.toString();
    if (input.unit_price !== undefined) updateData.unit_price = input.unit_price.toString();
    if (input.market_value !== undefined) updateData.market_value = input.market_value.toString();
    if (input.cost_basis !== undefined) updateData.cost_basis = input.cost_basis.toString();
    if (input.purchase_date !== undefined) updateData.purchase_date = input.purchase_date;

    // Update the asset
    const result = await db.update(assetsTable)
      .set(updateData)
      .where(eq(assetsTable.id, input.id))
      .returning()
      .execute();

    const updatedAsset = result[0];

    // Update portfolio total_value if market_value changed or portfolio changed
    const portfolioIdsToUpdate = new Set<number>();
    
    // Always update the current portfolio
    const finalPortfolioId = input.portfolio_id || currentAsset.portfolio_id;
    portfolioIdsToUpdate.add(finalPortfolioId);
    
    // If portfolio_id changed, also update the old portfolio
    if (input.portfolio_id && input.portfolio_id !== currentAsset.portfolio_id) {
      portfolioIdsToUpdate.add(currentAsset.portfolio_id);
    }

    // Update portfolio total_value for each affected portfolio
    for (const portfolioId of portfolioIdsToUpdate) {
      const portfolioAssets = await db.select()
        .from(assetsTable)
        .where(eq(assetsTable.portfolio_id, portfolioId))
        .execute();

      const totalValue = portfolioAssets.reduce((sum, asset) => {
        return sum + parseFloat(asset.market_value);
      }, 0);

      await db.update(portfoliosTable)
        .set({ 
          total_value: totalValue.toString(),
          updated_at: new Date()
        })
        .where(eq(portfoliosTable.id, portfolioId))
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...updatedAsset,
      quantity: parseFloat(updatedAsset.quantity),
      unit_price: parseFloat(updatedAsset.unit_price),
      market_value: parseFloat(updatedAsset.market_value),
      cost_basis: parseFloat(updatedAsset.cost_basis)
    };
  } catch (error) {
    console.error('Asset update failed:', error);
    throw error;
  }
}