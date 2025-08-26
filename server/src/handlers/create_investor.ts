import { db } from '../db';
import { investorsTable } from '../db/schema';
import { type CreateInvestorInput, type Investor } from '../schema';

export async function createInvestor(input: CreateInvestorInput): Promise<Investor> {
  try {
    // Insert investor record
    const result = await db.insert(investorsTable)
      .values({
        name: input.name,
        email: input.email,
        investor_type: input.investor_type,
        total_invested: input.total_invested.toString(), // Convert number to string for numeric column
        phone: input.phone,
        address: input.address
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const investor = result[0];
    return {
      ...investor,
      total_invested: parseFloat(investor.total_invested) // Convert string back to number
    };
  } catch (error) {
    console.error('Investor creation failed:', error);
    throw error;
  }
}