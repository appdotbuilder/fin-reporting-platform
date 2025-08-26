import { db } from '../db';
import { accountsTable, transactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteAccount(id: number): Promise<boolean> {
  try {
    // Use a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // First, delete all associated transactions
      await tx.delete(transactionsTable)
        .where(eq(transactionsTable.account_id, id))
        .execute();

      // Then delete the account
      const deleteResult = await tx.delete(accountsTable)
        .where(eq(accountsTable.id, id))
        .returning({ id: accountsTable.id })
        .execute();

      return deleteResult;
    });

    // Return true if account was deleted (result array has elements)
    return result.length > 0;
  } catch (error) {
    console.error('Account deletion failed:', error);
    throw error;
  }
}