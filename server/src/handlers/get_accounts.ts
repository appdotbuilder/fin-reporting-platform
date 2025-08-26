import { db } from '../db';
import { accountsTable } from '../db/schema';
import { type Account } from '../schema';

export const getAccounts = async (): Promise<Account[]> => {
  try {
    const results = await db.select()
      .from(accountsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(account => ({
      ...account,
      balance: parseFloat(account.balance) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    throw error;
  }
};