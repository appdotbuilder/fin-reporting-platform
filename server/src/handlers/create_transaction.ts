import { db } from '../db';
import { transactionsTable, accountsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  try {
    // Check if account exists
    const account = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, input.account_id))
      .execute();

    if (account.length === 0) {
      throw new Error(`Account with ID ${input.account_id} not found`);
    }

    const currentBalance = parseFloat(account[0].balance);

    // Calculate new balance based on transaction type
    let newBalance: number;
    if (input.transaction_type === 'debit') {
      // For asset/expense accounts, debit increases balance
      // For liability/equity/revenue accounts, debit decreases balance
      const accountType = account[0].account_type;
      if (accountType === 'asset' || accountType === 'expense') {
        newBalance = currentBalance + input.amount;
      } else {
        newBalance = currentBalance - input.amount;
      }
    } else {
      // Credit
      // For asset/expense accounts, credit decreases balance
      // For liability/equity/revenue accounts, credit increases balance
      const accountType = account[0].account_type;
      if (accountType === 'asset' || accountType === 'expense') {
        newBalance = currentBalance - input.amount;
      } else {
        newBalance = currentBalance + input.amount;
      }
    }

    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        account_id: input.account_id,
        transaction_type: input.transaction_type,
        amount: input.amount.toString(), // Convert number to string for numeric column
        description: input.description,
        transaction_date: input.transaction_date,
        reference_number: input.reference_number
      })
      .returning()
      .execute();

    // Update account balance
    await db.update(accountsTable)
      .set({
        balance: newBalance.toString(), // Convert number to string for numeric column
        updated_at: new Date()
      })
      .where(eq(accountsTable.id, input.account_id))
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
}