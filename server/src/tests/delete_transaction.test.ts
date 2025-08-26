import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { accountsTable, transactionsTable } from '../db/schema';
import { deleteTransaction } from '../handlers/delete_transaction';
import { eq } from 'drizzle-orm';

describe('deleteTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a credit transaction and adjust account balance', async () => {
    // Create test account with initial balance
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Test Account',
        account_number: 'ACC-001',
        account_type: 'asset',
        balance: '1000.00',
        description: 'Test account for transactions'
      })
      .returning()
      .execute();

    const account = accountResult[0];

    // Create a credit transaction (increases balance)
    const transactionResult = await db.insert(transactionsTable)
      .values({
        account_id: account.id,
        transaction_type: 'credit',
        amount: '500.00',
        description: 'Test credit transaction',
        transaction_date: new Date(),
        reference_number: 'REF-001'
      })
      .returning()
      .execute();

    const transaction = transactionResult[0];

    // Update account balance to reflect the credit transaction
    await db.update(accountsTable)
      .set({ balance: '1500.00' })
      .where(eq(accountsTable.id, account.id))
      .execute();

    // Delete the transaction
    const result = await deleteTransaction(transaction.id);
    expect(result).toBe(true);

    // Verify transaction is deleted
    const deletedTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transaction.id))
      .execute();
    
    expect(deletedTransactions).toHaveLength(0);

    // Verify account balance is adjusted back (1500 - 500 = 1000)
    const updatedAccounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, account.id))
      .execute();

    expect(updatedAccounts).toHaveLength(1);
    expect(parseFloat(updatedAccounts[0].balance)).toEqual(1000.00);
  });

  it('should delete a debit transaction and adjust account balance', async () => {
    // Create test account with initial balance
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Test Account',
        account_number: 'ACC-002',
        account_type: 'asset',
        balance: '1000.00',
        description: 'Test account for transactions'
      })
      .returning()
      .execute();

    const account = accountResult[0];

    // Create a debit transaction (decreases balance)
    const transactionResult = await db.insert(transactionsTable)
      .values({
        account_id: account.id,
        transaction_type: 'debit',
        amount: '300.00',
        description: 'Test debit transaction',
        transaction_date: new Date(),
        reference_number: 'REF-002'
      })
      .returning()
      .execute();

    const transaction = transactionResult[0];

    // Update account balance to reflect the debit transaction
    await db.update(accountsTable)
      .set({ balance: '700.00' })
      .where(eq(accountsTable.id, account.id))
      .execute();

    // Delete the transaction
    const result = await deleteTransaction(transaction.id);
    expect(result).toBe(true);

    // Verify transaction is deleted
    const deletedTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transaction.id))
      .execute();
    
    expect(deletedTransactions).toHaveLength(0);

    // Verify account balance is adjusted back (700 + 300 = 1000)
    const updatedAccounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, account.id))
      .execute();

    expect(updatedAccounts).toHaveLength(1);
    expect(parseFloat(updatedAccounts[0].balance)).toEqual(1000.00);
  });

  it('should return false when transaction does not exist', async () => {
    const result = await deleteTransaction(999); // Non-existent ID
    expect(result).toBe(false);
  });

  it('should return false when account does not exist', async () => {
    // Create a transaction with invalid account_id (this shouldn't happen in real scenarios due to foreign key constraints)
    // But we'll test the handler's defensive behavior
    const result = await deleteTransaction(999);
    expect(result).toBe(false);
  });

  it('should handle decimal amounts correctly', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Decimal Test Account',
        account_number: 'ACC-003',
        account_type: 'asset',
        balance: '1234.56',
        description: 'Account for decimal testing'
      })
      .returning()
      .execute();

    const account = accountResult[0];

    // Create a credit transaction with decimal amount
    const transactionResult = await db.insert(transactionsTable)
      .values({
        account_id: account.id,
        transaction_type: 'credit',
        amount: '123.45',
        description: 'Decimal amount credit',
        transaction_date: new Date()
      })
      .returning()
      .execute();

    const transaction = transactionResult[0];

    // Update account balance
    await db.update(accountsTable)
      .set({ balance: '1358.01' }) // 1234.56 + 123.45
      .where(eq(accountsTable.id, account.id))
      .execute();

    // Delete the transaction
    const result = await deleteTransaction(transaction.id);
    expect(result).toBe(true);

    // Verify balance calculation with decimals
    const updatedAccounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, account.id))
      .execute();

    expect(parseFloat(updatedAccounts[0].balance)).toEqual(1234.56);
  });

  it('should update the account updated_at timestamp', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Timestamp Test Account',
        account_number: 'ACC-004',
        account_type: 'asset',
        balance: '1000.00'
      })
      .returning()
      .execute();

    const account = accountResult[0];
    const originalUpdatedAt = account.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create and delete a transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        account_id: account.id,
        transaction_type: 'credit',
        amount: '100.00',
        description: 'Timestamp test',
        transaction_date: new Date()
      })
      .returning()
      .execute();

    await deleteTransaction(transactionResult[0].id);

    // Verify updated_at was changed
    const updatedAccounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, account.id))
      .execute();

    expect(updatedAccounts[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle multiple transactions on same account correctly', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Multi Transaction Account',
        account_number: 'ACC-005',
        account_type: 'asset',
        balance: '1000.00'
      })
      .returning()
      .execute();

    const account = accountResult[0];

    // Create multiple transactions
    const transaction1 = await db.insert(transactionsTable)
      .values({
        account_id: account.id,
        transaction_type: 'credit',
        amount: '200.00',
        description: 'First transaction',
        transaction_date: new Date()
      })
      .returning()
      .execute();

    const transaction2 = await db.insert(transactionsTable)
      .values({
        account_id: account.id,
        transaction_type: 'debit',
        amount: '50.00',
        description: 'Second transaction',
        transaction_date: new Date()
      })
      .returning()
      .execute();

    // Update account balance to reflect both transactions (1000 + 200 - 50 = 1150)
    await db.update(accountsTable)
      .set({ balance: '1150.00' })
      .where(eq(accountsTable.id, account.id))
      .execute();

    // Delete the first transaction (credit of 200)
    const result = await deleteTransaction(transaction1[0].id);
    expect(result).toBe(true);

    // Verify balance is correct (1150 - 200 = 950)
    const updatedAccounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, account.id))
      .execute();

    expect(parseFloat(updatedAccounts[0].balance)).toEqual(950.00);

    // Verify second transaction still exists
    const remainingTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.account_id, account.id))
      .execute();

    expect(remainingTransactions).toHaveLength(1);
    expect(remainingTransactions[0].id).toEqual(transaction2[0].id);
  });
});