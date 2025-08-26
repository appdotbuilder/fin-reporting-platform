import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { accountsTable, transactionsTable } from '../db/schema';
import { getTransactions } from '../handlers/get_transactions';
import { eq } from 'drizzle-orm';

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();

    expect(result).toEqual([]);
  });

  it('should return all transactions', async () => {
    // Create test account first (required for foreign key)
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Test Account',
        account_number: 'ACC001',
        account_type: 'asset',
        balance: '1000.00',
        description: 'Test account'
      })
      .returning()
      .execute();

    const accountId = accountResult[0].id;

    // Create test transactions
    const transaction1 = {
      account_id: accountId,
      transaction_type: 'debit' as const,
      amount: '250.75',
      description: 'First transaction',
      transaction_date: new Date('2024-01-15'),
      reference_number: 'REF001'
    };

    const transaction2 = {
      account_id: accountId,
      transaction_type: 'credit' as const,
      amount: '500.00',
      description: 'Second transaction',
      transaction_date: new Date('2024-01-20'),
      reference_number: 'REF002'
    };

    await db.insert(transactionsTable)
      .values([transaction1, transaction2])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);

    // Verify first transaction
    const firstTransaction = result.find(t => t.description === 'First transaction');
    expect(firstTransaction).toBeDefined();
    expect(firstTransaction!.account_id).toEqual(accountId);
    expect(firstTransaction!.transaction_type).toEqual('debit');
    expect(firstTransaction!.amount).toEqual(250.75);
    expect(typeof firstTransaction!.amount).toBe('number');
    expect(firstTransaction!.description).toEqual('First transaction');
    expect(firstTransaction!.reference_number).toEqual('REF001');
    expect(firstTransaction!.transaction_date).toBeInstanceOf(Date);
    expect(firstTransaction!.created_at).toBeInstanceOf(Date);
    expect(firstTransaction!.updated_at).toBeInstanceOf(Date);
    expect(firstTransaction!.id).toBeDefined();

    // Verify second transaction
    const secondTransaction = result.find(t => t.description === 'Second transaction');
    expect(secondTransaction).toBeDefined();
    expect(secondTransaction!.account_id).toEqual(accountId);
    expect(secondTransaction!.transaction_type).toEqual('credit');
    expect(secondTransaction!.amount).toEqual(500.00);
    expect(typeof secondTransaction!.amount).toBe('number');
    expect(secondTransaction!.description).toEqual('Second transaction');
    expect(secondTransaction!.reference_number).toEqual('REF002');
  });

  it('should handle transactions with null fields', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Test Account',
        account_number: 'ACC002',
        account_type: 'liability',
        balance: '0.00',
        description: null
      })
      .returning()
      .execute();

    // Create transaction with null description and reference_number
    await db.insert(transactionsTable)
      .values({
        account_id: accountResult[0].id,
        transaction_type: 'debit',
        amount: '100.50',
        description: null,
        transaction_date: new Date(),
        reference_number: null
      })
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].reference_number).toBeNull();
    expect(result[0].amount).toEqual(100.50);
    expect(typeof result[0].amount).toBe('number');
  });

  it('should handle transactions with various transaction types', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Mixed Account',
        account_number: 'ACC003',
        account_type: 'revenue',
        balance: '2000.00'
      })
      .returning()
      .execute();

    const accountId = accountResult[0].id;

    // Create debit and credit transactions
    await db.insert(transactionsTable)
      .values([
        {
          account_id: accountId,
          transaction_type: 'debit',
          amount: '75.25',
          description: 'Debit transaction',
          transaction_date: new Date()
        },
        {
          account_id: accountId,
          transaction_type: 'credit',
          amount: '150.75',
          description: 'Credit transaction',
          transaction_date: new Date()
        }
      ])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);

    const debitTransaction = result.find(t => t.transaction_type === 'debit');
    const creditTransaction = result.find(t => t.transaction_type === 'credit');

    expect(debitTransaction).toBeDefined();
    expect(debitTransaction!.amount).toEqual(75.25);
    expect(creditTransaction).toBeDefined();
    expect(creditTransaction!.amount).toEqual(150.75);
  });

  it('should handle decimal precision correctly', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Precision Account',
        account_number: 'ACC004',
        account_type: 'expense',
        balance: '500.00'
      })
      .returning()
      .execute();

    // Create transaction with high decimal precision
    await db.insert(transactionsTable)
      .values({
        account_id: accountResult[0].id,
        transaction_type: 'debit',
        amount: '123.4567', // High precision amount
        description: 'Precision test',
        transaction_date: new Date()
      })
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBeCloseTo(123.46, 2); // Should be rounded to 2 decimal places in DB
    expect(typeof result[0].amount).toBe('number');
  });

  it('should return transactions from multiple accounts', async () => {
    // Create multiple accounts
    const account1 = await db.insert(accountsTable)
      .values({
        name: 'Account 1',
        account_number: 'ACC101',
        account_type: 'asset',
        balance: '1000.00'
      })
      .returning()
      .execute();

    const account2 = await db.insert(accountsTable)
      .values({
        name: 'Account 2',
        account_number: 'ACC102',
        account_type: 'liability',
        balance: '500.00'
      })
      .returning()
      .execute();

    // Create transactions for both accounts
    await db.insert(transactionsTable)
      .values([
        {
          account_id: account1[0].id,
          transaction_type: 'debit',
          amount: '200.00',
          description: 'Account 1 transaction',
          transaction_date: new Date()
        },
        {
          account_id: account2[0].id,
          transaction_type: 'credit',
          amount: '300.00',
          description: 'Account 2 transaction',
          transaction_date: new Date()
        }
      ])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);
    
    const account1Transaction = result.find(t => t.account_id === account1[0].id);
    const account2Transaction = result.find(t => t.account_id === account2[0].id);

    expect(account1Transaction).toBeDefined();
    expect(account1Transaction!.description).toEqual('Account 1 transaction');
    expect(account1Transaction!.amount).toEqual(200.00);

    expect(account2Transaction).toBeDefined();
    expect(account2Transaction!.description).toEqual('Account 2 transaction');
    expect(account2Transaction!.amount).toEqual(300.00);
  });
});