import { db } from '../db';
import { accountsTable } from '../db/schema';
import { type CreateAccountInput, type Account } from '../schema';

export const createAccount = async (input: CreateAccountInput): Promise<Account> => {
  try {
    // Insert account record
    const result = await db.insert(accountsTable)
      .values({
        name: input.name,
        account_number: input.account_number,
        account_type: input.account_type,
        balance: input.balance.toString(), // Convert number to string for numeric column
        description: input.description
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const account = result[0];
    return {
      ...account,
      balance: parseFloat(account.balance) // Convert string back to number
    };
  } catch (error) {
    console.error('Account creation failed:', error);
    throw error;
  }
};