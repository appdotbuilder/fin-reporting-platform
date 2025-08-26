import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { accountsTable, transactionsTable } from '../db/schema';
import { type CreateAccountInput, type CreateTransactionInput } from '../schema';
import { deleteAccount } from '../handlers/delete_account';
import { eq } from 'drizzle-orm';

// Test data
const testAccount: CreateAccountInput = {
  name: 'Test Account',
  account_number: 'ACC001',
  account_type: 'asset',
  balance: 1000.50,
  description: 'A test account for deletion'
};

const testTransaction: CreateTransactionInput = {
  account_id: 1, // Will be updated with actual account ID
  transaction_type: 'debit',
  amount: 100.25,
  description: 'Test transaction',
  transaction_date: new Date(),
  reference_number: 'REF001'
};

describe('deleteAccount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an account successfully', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: testAccount.name,
        account_number: testAccount.account_number,
        account_type: testAccount.account_type,
        balance: testAccount.balance.toString(),
        description: testAccount.description
      })
      .returning()
      .execute();

    const accountId = accountResult[0].id;

    // Delete the account
    const result = await deleteAccount(accountId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify account no longer exists in database
    const accounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .execute();

    expect(accounts).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent account', async () => {
    const result = await deleteAccount(999);
    expect(result).toBe(false);
  });

  it('should delete account and all associated transactions', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: testAccount.name,
        account_number: testAccount.account_number,
        account_type: testAccount.account_type,
        balance: testAccount.balance.toString(),
        description: testAccount.description
      })
      .returning()
      .execute();

    const accountId = accountResult[0].id;

    // Create multiple transactions for this account
    await db.insert(transactionsTable)
      .values([
        {
          account_id: accountId,
          transaction_type: testTransaction.transaction_type,
          amount: testTransaction.amount.toString(),
          description: 'Transaction 1',
          transaction_date: new Date(),
          reference_number: 'REF001'
        },
        {
          account_id: accountId,
          transaction_type: 'credit',
          amount: '50.75',
          description: 'Transaction 2',
          transaction_date: new Date(),
          reference_number: 'REF002'
        }
      ])
      .execute();

    // Verify transactions exist before deletion
    const transactionsBeforeDeletion = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.account_id, accountId))
      .execute();

    expect(transactionsBeforeDeletion).toHaveLength(2);

    // Delete the account
    const result = await deleteAccount(accountId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify account no longer exists
    const accounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .execute();

    expect(accounts).toHaveLength(0);

    // Verify all associated transactions were deleted
    const transactionsAfterDeletion = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.account_id, accountId))
      .execute();

    expect(transactionsAfterDeletion).toHaveLength(0);
  });

  it('should handle deletion of account with no transactions', async () => {
    // Create test account with no transactions
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Account No Transactions',
        account_number: 'ACC002',
        account_type: 'liability',
        balance: '500.00',
        description: 'Account with no transactions'
      })
      .returning()
      .execute();

    const accountId = accountResult[0].id;

    // Delete the account
    const result = await deleteAccount(accountId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify account no longer exists
    const accounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .execute();

    expect(accounts).toHaveLength(0);
  });

  it('should maintain data integrity during transaction rollback', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: testAccount.name,
        account_number: testAccount.account_number,
        account_type: testAccount.account_type,
        balance: testAccount.balance.toString(),
        description: testAccount.description
      })
      .returning()
      .execute();

    const accountId = accountResult[0].id;

    // Create transaction for this account
    await db.insert(transactionsTable)
      .values({
        account_id: accountId,
        transaction_type: testTransaction.transaction_type,
        amount: testTransaction.amount.toString(),
        description: testTransaction.description,
        transaction_date: testTransaction.transaction_date,
        reference_number: testTransaction.reference_number
      })
      .execute();

    // Verify both account and transaction exist before deletion
    const accountsBefore = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .execute();

    const transactionsBefore = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.account_id, accountId))
      .execute();

    expect(accountsBefore).toHaveLength(1);
    expect(transactionsBefore).toHaveLength(1);

    // Delete the account (should handle the transaction cascade properly)
    const result = await deleteAccount(accountId);

    // Verify successful deletion
    expect(result).toBe(true);

    // Verify both account and transaction are gone
    const accountsAfter = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .execute();

    const transactionsAfter = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.account_id, accountId))
      .execute();

    expect(accountsAfter).toHaveLength(0);
    expect(transactionsAfter).toHaveLength(0);
  });
});