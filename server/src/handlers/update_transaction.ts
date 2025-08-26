import { db } from '../db';
import { transactionsTable, accountsTable } from '../db/schema';
import { type UpdateTransactionInput, type Transaction } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function updateTransaction(input: UpdateTransactionInput): Promise<Transaction | null> {
  try {
    // Get current transaction to compare changes
    const currentTransaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, input.id))
      .execute();

    if (currentTransaction.length === 0) {
      return null;
    }

    const current = currentTransaction[0];
    
    // Check if amount or transaction type changed - need to adjust account balance
    const amountChanged = input.amount !== undefined && parseFloat(current.amount) !== input.amount;
    const typeChanged = input.transaction_type !== undefined && current.transaction_type !== input.transaction_type;
    const accountChanged = input.account_id !== undefined && current.account_id !== input.account_id;

    if (amountChanged || typeChanged || accountChanged) {
      // Revert the old transaction's effect on the original account
      const oldAmount = parseFloat(current.amount);
      const oldAccountId = current.account_id;
      const oldType = current.transaction_type;

      // Calculate reversal adjustment
      const oldAdjustment = oldType === 'debit' ? -oldAmount : oldAmount;

      // Apply reversal to old account
      await db.update(accountsTable)
        .set({
          balance: sql`balance - ${oldAdjustment.toString()}`,
          updated_at: new Date()
        })
        .where(eq(accountsTable.id, oldAccountId))
        .execute();

      // Apply new transaction effect
      const newAmount = input.amount ?? oldAmount;
      const newAccountId = input.account_id ?? oldAccountId;
      const newType = input.transaction_type ?? oldType;

      // Calculate new adjustment
      const newAdjustment = newType === 'debit' ? -newAmount : newAmount;

      // Apply new adjustment to new account
      await db.update(accountsTable)
        .set({
          balance: sql`balance + ${newAdjustment.toString()}`,
          updated_at: new Date()
        })
        .where(eq(accountsTable.id, newAccountId))
        .execute();
    }

    // Prepare update data with numeric conversions
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.account_id !== undefined) {
      updateData.account_id = input.account_id;
    }
    if (input.transaction_type !== undefined) {
      updateData.transaction_type = input.transaction_type;
    }
    if (input.amount !== undefined) {
      updateData.amount = input.amount.toString(); // Convert number to string for numeric column
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.transaction_date !== undefined) {
      updateData.transaction_date = input.transaction_date;
    }
    if (input.reference_number !== undefined) {
      updateData.reference_number = input.reference_number;
    }

    // Update the transaction
    const result = await db.update(transactionsTable)
      .set(updateData)
      .where(eq(transactionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction update failed:', error);
    throw error;
  }
}