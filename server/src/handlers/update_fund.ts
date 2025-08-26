import { db } from '../db';
import { fundsTable } from '../db/schema';
import { type UpdateFundInput, type Fund } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateFund(input: UpdateFundInput): Promise<Fund | null> {
  try {
    // First, check if the fund exists
    const existingFund = await db.select()
      .from(fundsTable)
      .where(eq(fundsTable.id, input.id))
      .execute();

    if (existingFund.length === 0) {
      return null; // Fund not found
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.name !== undefined) {
      updateData['name'] = input.name;
    }
    
    if (input.fund_type !== undefined) {
      updateData['fund_type'] = input.fund_type;
    }
    
    if (input.inception_date !== undefined) {
      updateData['inception_date'] = input.inception_date;
    }
    
    if (input.nav !== undefined) {
      updateData['nav'] = input.nav.toString(); // Convert number to string for numeric column
    }
    
    if (input.total_assets !== undefined) {
      updateData['total_assets'] = input.total_assets.toString(); // Convert number to string for numeric column
    }
    
    if (input.management_fee !== undefined) {
      updateData['management_fee'] = input.management_fee.toString(); // Convert number to string for numeric column
    }
    
    if (input.description !== undefined) {
      updateData['description'] = input.description;
    }

    // Always update the updated_at timestamp
    updateData['updated_at'] = new Date();

    // Perform the update
    const result = await db.update(fundsTable)
      .set(updateData)
      .where(eq(fundsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const fund = result[0];
    return {
      ...fund,
      nav: parseFloat(fund.nav),
      total_assets: parseFloat(fund.total_assets),
      management_fee: parseFloat(fund.management_fee)
    };
  } catch (error) {
    console.error('Fund update failed:', error);
    throw error;
  }
}