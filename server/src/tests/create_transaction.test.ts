import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, accountsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestAccount = async (accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense', balance: number = 1000) => {
    const result = await db.insert(accountsTable)
      .values({
        name: `Test ${accountType} Account`,
        account_number: `ACC-${accountType.toUpperCase()}`,
        account_type: accountType,
        balance: balance.toString(),
        description: `Test ${accountType} account for testing`
      })
      .returning()
      .execute();
    return result[0];
  };

  describe('Asset Account Transactions', () => {
    it('should create a debit transaction and increase asset account balance', async () => {
      const account = await createTestAccount('asset', 1000);

      const testInput: CreateTransactionInput = {
        account_id: account.id,
        transaction_type: 'debit',
        amount: 500,
        description: 'Test debit transaction',
        transaction_date: new Date('2024-01-01'),
        reference_number: 'REF-001'
      };

      const result = await createTransaction(testInput);

      // Verify transaction creation
      expect(result.account_id).toEqual(account.id);
      expect(result.transaction_type).toEqual('debit');
      expect(result.amount).toEqual(500);
      expect(result.description).toEqual('Test debit transaction');
      expect(result.transaction_date).toEqual(new Date('2024-01-01'));
      expect(result.reference_number).toEqual('REF-001');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);

      // Verify account balance was updated (1000 + 500 = 1500)
      const updatedAccount = await db.select()
        .from(accountsTable)
        .where(eq(accountsTable.id, account.id))
        .execute();

      expect(parseFloat(updatedAccount[0].balance)).toEqual(1500);
    });

    it('should create a credit transaction and decrease asset account balance', async () => {
      const account = await createTestAccount('asset', 1000);

      const testInput: CreateTransactionInput = {
        account_id: account.id,
        transaction_type: 'credit',
        amount: 300,
        description: 'Test credit transaction',
        transaction_date: new Date('2024-01-02'),
        reference_number: null
      };

      const result = await createTransaction(testInput);

      // Verify transaction creation
      expect(result.transaction_type).toEqual('credit');
      expect(result.amount).toEqual(300);
      expect(result.reference_number).toBeNull();

      // Verify account balance was updated (1000 - 300 = 700)
      const updatedAccount = await db.select()
        .from(accountsTable)
        .where(eq(accountsTable.id, account.id))
        .execute();

      expect(parseFloat(updatedAccount[0].balance)).toEqual(700);
    });
  });

  describe('Liability Account Transactions', () => {
    it('should create a debit transaction and decrease liability account balance', async () => {
      const account = await createTestAccount('liability', 2000);

      const testInput: CreateTransactionInput = {
        account_id: account.id,
        transaction_type: 'debit',
        amount: 400,
        description: 'Test liability debit',
        transaction_date: new Date('2024-01-03'),
        reference_number: 'REF-002'
      };

      const result = await createTransaction(testInput);

      expect(result.transaction_type).toEqual('debit');
      expect(result.amount).toEqual(400);

      // Verify liability account balance was decreased (2000 - 400 = 1600)
      const updatedAccount = await db.select()
        .from(accountsTable)
        .where(eq(accountsTable.id, account.id))
        .execute();

      expect(parseFloat(updatedAccount[0].balance)).toEqual(1600);
    });

    it('should create a credit transaction and increase liability account balance', async () => {
      const account = await createTestAccount('liability', 2000);

      const testInput: CreateTransactionInput = {
        account_id: account.id,
        transaction_type: 'credit',
        amount: 600,
        description: 'Test liability credit',
        transaction_date: new Date('2024-01-04'),
        reference_number: 'REF-003'
      };

      await createTransaction(testInput);

      // Verify liability account balance was increased (2000 + 600 = 2600)
      const updatedAccount = await db.select()
        .from(accountsTable)
        .where(eq(accountsTable.id, account.id))
        .execute();

      expect(parseFloat(updatedAccount[0].balance)).toEqual(2600);
    });
  });

  describe('Revenue Account Transactions', () => {
    it('should create a credit transaction and increase revenue account balance', async () => {
      const account = await createTestAccount('revenue', 0);

      const testInput: CreateTransactionInput = {
        account_id: account.id,
        transaction_type: 'credit',
        amount: 1500,
        description: 'Revenue earned',
        transaction_date: new Date('2024-01-05'),
        reference_number: 'REV-001'
      };

      await createTransaction(testInput);

      // Verify revenue account balance was increased (0 + 1500 = 1500)
      const updatedAccount = await db.select()
        .from(accountsTable)
        .where(eq(accountsTable.id, account.id))
        .execute();

      expect(parseFloat(updatedAccount[0].balance)).toEqual(1500);
    });
  });

  describe('Expense Account Transactions', () => {
    it('should create a debit transaction and increase expense account balance', async () => {
      const account = await createTestAccount('expense', 500);

      const testInput: CreateTransactionInput = {
        account_id: account.id,
        transaction_type: 'debit',
        amount: 200,
        description: 'Office supplies expense',
        transaction_date: new Date('2024-01-06'),
        reference_number: 'EXP-001'
      };

      await createTransaction(testInput);

      // Verify expense account balance was increased (500 + 200 = 700)
      const updatedAccount = await db.select()
        .from(accountsTable)
        .where(eq(accountsTable.id, account.id))
        .execute();

      expect(parseFloat(updatedAccount[0].balance)).toEqual(700);
    });
  });

  describe('Database Persistence', () => {
    it('should save transaction to database with correct data types', async () => {
      const account = await createTestAccount('asset');

      const testInput: CreateTransactionInput = {
        account_id: account.id,
        transaction_type: 'debit',
        amount: 250.75,
        description: 'Test decimal amount',
        transaction_date: new Date('2024-01-07T10:30:00Z'),
        reference_number: 'REF-DECIMAL'
      };

      const result = await createTransaction(testInput);

      // Query transaction from database
      const transactions = await db.select()
        .from(transactionsTable)
        .where(eq(transactionsTable.id, result.id))
        .execute();

      expect(transactions).toHaveLength(1);
      const savedTransaction = transactions[0];
      
      expect(savedTransaction.account_id).toEqual(account.id);
      expect(savedTransaction.transaction_type).toEqual('debit');
      expect(parseFloat(savedTransaction.amount)).toEqual(250.75);
      expect(savedTransaction.description).toEqual('Test decimal amount');
      expect(savedTransaction.transaction_date).toEqual(new Date('2024-01-07T10:30:00Z'));
      expect(savedTransaction.reference_number).toEqual('REF-DECIMAL');
      expect(savedTransaction.created_at).toBeInstanceOf(Date);
      expect(savedTransaction.updated_at).toBeInstanceOf(Date);

      // Verify result has proper numeric type
      expect(typeof result.amount).toBe('number');
    });

    it('should handle null optional fields correctly', async () => {
      const account = await createTestAccount('asset');

      const testInput: CreateTransactionInput = {
        account_id: account.id,
        transaction_type: 'credit',
        amount: 100,
        description: null,
        transaction_date: new Date(),
        reference_number: null
      };

      const result = await createTransaction(testInput);

      expect(result.description).toBeNull();
      expect(result.reference_number).toBeNull();

      // Verify in database
      const transactions = await db.select()
        .from(transactionsTable)
        .where(eq(transactionsTable.id, result.id))
        .execute();

      expect(transactions[0].description).toBeNull();
      expect(transactions[0].reference_number).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when account does not exist', async () => {
      const testInput: CreateTransactionInput = {
        account_id: 99999, // Non-existent account
        transaction_type: 'debit',
        amount: 100,
        description: 'Test transaction',
        transaction_date: new Date(),
        reference_number: 'REF-ERROR'
      };

      await expect(createTransaction(testInput)).rejects.toThrow(/Account with ID 99999 not found/i);
    });

    it('should not create transaction when account validation fails', async () => {
      const testInput: CreateTransactionInput = {
        account_id: 88888, // Non-existent account
        transaction_type: 'debit',
        amount: 100,
        description: 'Test transaction',
        transaction_date: new Date(),
        reference_number: 'REF-ERROR'
      };

      try {
        await createTransaction(testInput);
      } catch (error) {
        // Expected error
      }

      // Verify no transaction was created
      const transactions = await db.select()
        .from(transactionsTable)
        .where(eq(transactionsTable.account_id, 88888))
        .execute();

      expect(transactions).toHaveLength(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple transactions on same account correctly', async () => {
      const account = await createTestAccount('asset', 1000);

      // First transaction: debit 200
      await createTransaction({
        account_id: account.id,
        transaction_type: 'debit',
        amount: 200,
        description: 'First transaction',
        transaction_date: new Date(),
        reference_number: 'REF-1'
      });

      // Second transaction: credit 100
      await createTransaction({
        account_id: account.id,
        transaction_type: 'credit',
        amount: 100,
        description: 'Second transaction',
        transaction_date: new Date(),
        reference_number: 'REF-2'
      });

      // Check final balance: 1000 + 200 - 100 = 1100
      const updatedAccount = await db.select()
        .from(accountsTable)
        .where(eq(accountsTable.id, account.id))
        .execute();

      expect(parseFloat(updatedAccount[0].balance)).toEqual(1100);

      // Verify both transactions exist
      const transactions = await db.select()
        .from(transactionsTable)
        .where(eq(transactionsTable.account_id, account.id))
        .execute();

      expect(transactions).toHaveLength(2);
    });
  });
});