import { db } from '../db';
import { fundsTable } from '../db/schema';
import { type CreateFundInput, type Fund } from '../schema';

export const createFund = async (input: CreateFundInput): Promise<Fund> => {
  try {
    // Insert fund record
    const result = await db.insert(fundsTable)
      .values({
        name: input.name,
        fund_type: input.fund_type,
        inception_date: input.inception_date,
        nav: input.nav.toString(), // Convert number to string for numeric column
        total_assets: input.total_assets.toString(), // Convert number to string for numeric column
        management_fee: input.management_fee.toString(), // Convert number to string for numeric column
        description: input.description
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const fund = result[0];
    return {
      ...fund,
      nav: parseFloat(fund.nav), // Convert string back to number
      total_assets: parseFloat(fund.total_assets), // Convert string back to number
      management_fee: parseFloat(fund.management_fee) // Convert string back to number
    };
  } catch (error) {
    console.error('Fund creation failed:', error);
    throw error;
  }
};