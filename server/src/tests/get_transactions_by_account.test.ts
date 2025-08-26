import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { accountsTable, transactionsTable } from '../db/schema';
import { getTransactionsByAccount } from '../handlers/get_transactions_by_account';

describe('getTransactionsByAccount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return transactions for a specific account', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Test Account',
        account_number: 'ACC001',
        account_type: 'asset',
        balance: '1000.00',
        description: 'Test account for transactions'
      })
      .returning()
      .execute();
    
    const accountId = accountResult[0].id;

    // Create test transactions for this account
    await db.insert(transactionsTable)
      .values([
        {
          account_id: accountId,
          transaction_type: 'debit',
          amount: '250.50',
          description: 'Test debit transaction',
          transaction_date: new Date('2024-01-15'),
          reference_number: 'REF001'
        },
        {
          account_id: accountId,
          transaction_type: 'credit',
          amount: '100.75',
          description: 'Test credit transaction',
          transaction_date: new Date('2024-01-16'),
          reference_number: 'REF002'
        }
      ])
      .execute();

    // Fetch transactions for the account
    const result = await getTransactionsByAccount(accountId);

    expect(result).toHaveLength(2);
    
    // Verify transaction data and numeric conversion
    const debitTransaction = result.find(t => t.transaction_type === 'debit');
    expect(debitTransaction).toBeDefined();
    expect(debitTransaction!.account_id).toBe(accountId);
    expect(debitTransaction!.amount).toBe(250.50);
    expect(typeof debitTransaction!.amount).toBe('number');
    expect(debitTransaction!.description).toBe('Test debit transaction');
    expect(debitTransaction!.reference_number).toBe('REF001');
    expect(debitTransaction!.transaction_date).toBeInstanceOf(Date);

    const creditTransaction = result.find(t => t.transaction_type === 'credit');
    expect(creditTransaction).toBeDefined();
    expect(creditTransaction!.account_id).toBe(accountId);
    expect(creditTransaction!.amount).toBe(100.75);
    expect(typeof creditTransaction!.amount).toBe('number');
    expect(creditTransaction!.description).toBe('Test credit transaction');
    expect(creditTransaction!.reference_number).toBe('REF002');
    expect(creditTransaction!.transaction_date).toBeInstanceOf(Date);
  });

  it('should return empty array for account with no transactions', async () => {
    // Create test account without any transactions
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Empty Account',
        account_number: 'ACC002',
        account_type: 'liability',
        balance: '0.00',
        description: 'Account with no transactions'
      })
      .returning()
      .execute();
    
    const accountId = accountResult[0].id;

    const result = await getTransactionsByAccount(accountId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return transactions for specified account', async () => {
    // Create two test accounts
    const account1Result = await db.insert(accountsTable)
      .values({
        name: 'Account One',
        account_number: 'ACC003',
        account_type: 'asset',
        balance: '500.00',
        description: 'First test account'
      })
      .returning()
      .execute();

    const account2Result = await db.insert(accountsTable)
      .values({
        name: 'Account Two',
        account_number: 'ACC004',
        account_type: 'expense',
        balance: '300.00',
        description: 'Second test account'
      })
      .returning()
      .execute();
    
    const account1Id = account1Result[0].id;
    const account2Id = account2Result[0].id;

    // Create transactions for both accounts
    await db.insert(transactionsTable)
      .values([
        {
          account_id: account1Id,
          transaction_type: 'debit',
          amount: '150.00',
          description: 'Transaction for account 1',
          transaction_date: new Date('2024-01-10'),
          reference_number: 'REF003'
        },
        {
          account_id: account2Id,
          transaction_type: 'credit',
          amount: '200.00',
          description: 'Transaction for account 2',
          transaction_date: new Date('2024-01-11'),
          reference_number: 'REF004'
        },
        {
          account_id: account1Id,
          transaction_type: 'credit',
          amount: '75.25',
          description: 'Another transaction for account 1',
          transaction_date: new Date('2024-01-12'),
          reference_number: 'REF005'
        }
      ])
      .execute();

    // Fetch transactions only for account 1
    const result = await getTransactionsByAccount(account1Id);

    expect(result).toHaveLength(2);
    
    // Verify all returned transactions belong to account 1
    result.forEach(transaction => {
      expect(transaction.account_id).toBe(account1Id);
    });

    // Verify specific transaction details
    const debitTransaction = result.find(t => t.transaction_type === 'debit');
    expect(debitTransaction!.amount).toBe(150.00);
    expect(debitTransaction!.description).toBe('Transaction for account 1');

    const creditTransaction = result.find(t => t.transaction_type === 'credit');
    expect(creditTransaction!.amount).toBe(75.25);
    expect(creditTransaction!.description).toBe('Another transaction for account 1');
  });

  it('should handle non-existent account gracefully', async () => {
    const nonExistentAccountId = 99999;

    const result = await getTransactionsByAccount(nonExistentAccountId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle transactions with null optional fields', async () => {
    // Create test account
    const accountResult = await db.insert(accountsTable)
      .values({
        name: 'Test Account',
        account_number: 'ACC005',
        account_type: 'revenue',
        balance: '800.00',
        description: 'Account for null field testing'
      })
      .returning()
      .execute();
    
    const accountId = accountResult[0].id;

    // Create transaction with null optional fields
    await db.insert(transactionsTable)
      .values({
        account_id: accountId,
        transaction_type: 'debit',
        amount: '425.75',
        description: null, // Null description
        transaction_date: new Date('2024-01-20'),
        reference_number: null // Null reference number
      })
      .execute();

    const result = await getTransactionsByAccount(accountId);

    expect(result).toHaveLength(1);
    expect(result[0].account_id).toBe(accountId);
    expect(result[0].amount).toBe(425.75);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].description).toBeNull();
    expect(result[0].reference_number).toBeNull();
    expect(result[0].transaction_date).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});