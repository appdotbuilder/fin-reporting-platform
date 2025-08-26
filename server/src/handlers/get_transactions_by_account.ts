import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Transaction } from '../schema';

export async function getTransactionsByAccount(accountId: number): Promise<Transaction[]> {
  try {
    // Query transactions filtered by account_id
    const results = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.account_id, accountId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch transactions by account:', error);
    throw error;
  }
}