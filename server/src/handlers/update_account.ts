import { db } from '../db';
import { accountsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateAccountInput, type Account } from '../schema';

export const updateAccount = async (input: UpdateAccountInput): Promise<Account | null> => {
  try {
    const { id, ...updateData } = input;

    // Build the update object with proper numeric conversions
    const updateValues: any = {};
    
    if (updateData.name !== undefined) {
      updateValues.name = updateData.name;
    }
    
    if (updateData.account_number !== undefined) {
      updateValues.account_number = updateData.account_number;
    }
    
    if (updateData.account_type !== undefined) {
      updateValues.account_type = updateData.account_type;
    }
    
    if (updateData.balance !== undefined) {
      updateValues.balance = updateData.balance.toString(); // Convert number to string for numeric column
    }
    
    if (updateData.description !== undefined) {
      updateValues.description = updateData.description;
    }

    // Add updated_at timestamp
    updateValues.updated_at = new Date();

    // Perform the update operation
    const result = await db.update(accountsTable)
      .set(updateValues)
      .where(eq(accountsTable.id, id))
      .returning()
      .execute();

    // Return null if no account was found
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const account = result[0];
    return {
      ...account,
      balance: parseFloat(account.balance) // Convert string back to number
    };
  } catch (error) {
    console.error('Account update failed:', error);
    throw error;
  }
};