import { db } from '../db';
import { accountsTable } from '../db/schema';
import { type Account } from '../schema';
import { eq } from 'drizzle-orm';

export const getAccountById = async (id: number): Promise<Account | null> => {
  try {
    // Query the accounts table for the specific ID
    const result = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, id))
      .execute();

    // Return null if account not found
    if (result.length === 0) {
      return null;
    }

    // Convert numeric field back to number and return the account
    const account = result[0];
    return {
      ...account,
      balance: parseFloat(account.balance) // Convert numeric field to number
    };
  } catch (error) {
    console.error('Failed to get account by ID:', error);
    throw error;
  }
};