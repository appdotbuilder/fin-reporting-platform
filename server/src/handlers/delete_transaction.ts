import { db } from '../db';
import { transactionsTable, accountsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteTransaction(id: number): Promise<boolean> {
  try {
    // First, find the transaction to get account info and amount
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .execute();

    if (transactions.length === 0) {
      return false; // Transaction not found
    }

    const transaction = transactions[0];
    const amount = parseFloat(transaction.amount);

    // Get current account balance
    const accounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, transaction.account_id))
      .execute();

    if (accounts.length === 0) {
      return false; // Account not found
    }

    const account = accounts[0];
    const currentBalance = parseFloat(account.balance);

    // Calculate new balance by reversing the transaction
    // If it was a credit (added to balance), subtract it
    // If it was a debit (subtracted from balance), add it back
    const adjustmentAmount = transaction.transaction_type === 'credit' ? -amount : amount;
    const newBalance = currentBalance + adjustmentAmount;

    // Start transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Update account balance
      await tx.update(accountsTable)
        .set({
          balance: newBalance.toString(),
          updated_at: new Date()
        })
        .where(eq(accountsTable.id, transaction.account_id))
        .execute();

      // Delete the transaction
      await tx.delete(transactionsTable)
        .where(eq(transactionsTable.id, id))
        .execute();
    });

    return true;
  } catch (error) {
    console.error('Transaction deletion failed:', error);
    throw error;
  }
}