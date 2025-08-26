import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { accountsTable, transactionsTable } from '../db/schema';
import { type UpdateTransactionInput, type CreateAccountInput, type CreateTransactionInput } from '../schema';
import { updateTransaction } from '../handlers/update_transaction';
import { eq } from 'drizzle-orm';

// Test data
const testAccount: CreateAccountInput = {
  name: 'Test Account',
  account_number: 'ACC001',
  account_type: 'asset',
  balance: 1000.00,
  description: 'Test account for transaction updates'
};

const testAccount2: CreateAccountInput = {
  name: 'Second Account',
  account_number: 'ACC002',
  account_type: 'liability',
  balance: 500.00,
  description: 'Second test account'
};

const testTransaction: CreateTransactionInput = {
  account_id: 1, // Will be set after account creation
  transaction_type: 'debit',
  amount: 100.00,
  description: 'Test transaction',
  transaction_date: new Date('2024-01-15'),
  reference_number: 'REF001'
};

describe('updateTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent transaction', async () => {
    const updateInput: UpdateTransactionInput = {
      id: 999,
      amount: 200.00
    };

    const result = await updateTransaction(updateInput);
    expect(result).toBeNull();
  });

  it('should update basic transaction fields without balance changes', async () => {
    // Create account
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

    // Create transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        account_id: accountId,
        transaction_type: testTransaction.transaction_type,
        amount: testTransaction.amount.toString(),
        description: testTransaction.description,
        transaction_date: testTransaction.transaction_date,
        reference_number: testTransaction.reference_number
      })
      .returning()
      .execute();

    // Update account balance to reflect the transaction (100 debit reduces balance)
    await db.update(accountsTable)
      .set({ balance: '900.00' }) // 1000 - 100
      .where(eq(accountsTable.id, accountId))
      .execute();

    const transactionId = transactionResult[0].id;

    // Update only description and reference number (no balance effect)
    const updateInput: UpdateTransactionInput = {
      id: transactionId,
      description: 'Updated description',
      reference_number: 'REF002'
    };

    const result = await updateTransaction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(transactionId);
    expect(result!.description).toBe('Updated description');
    expect(result!.reference_number).toBe('REF002');
    expect(result!.amount).toBe(100.00); // Unchanged
    expect(result!.transaction_type).toBe('debit'); // Unchanged
    expect(typeof result!.amount).toBe('number');

    // Verify account balance unchanged (should remain at 900 since only description/reference changed)
    const updatedAccount = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .execute();

    expect(parseFloat(updatedAccount[0].balance)).toBe(900.00); // Should remain unchanged
  });

  it('should update amount and adjust account balance correctly', async () => {
    // Create account
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

    // Create transaction (100 debit - reduces balance by 100)
    const transactionResult = await db.insert(transactionsTable)
      .values({
        account_id: accountId,
        transaction_type: 'debit',
        amount: '100.00',
        description: testTransaction.description,
        transaction_date: testTransaction.transaction_date,
        reference_number: testTransaction.reference_number
      })
      .returning()
      .execute();

    // Update account balance to reflect the transaction
    await db.update(accountsTable)
      .set({ balance: '900.00' }) // 1000 - 100
      .where(eq(accountsTable.id, accountId))
      .execute();

    const transactionId = transactionResult[0].id;

    // Update amount from 100 to 150
    const updateInput: UpdateTransactionInput = {
      id: transactionId,
      amount: 150.00
    };

    const result = await updateTransaction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.amount).toBe(150.00);
    expect(typeof result!.amount).toBe('number');

    // Verify account balance adjustment
    // Original balance: 1000
    // Old transaction effect: -100 (debit)
    // Reversal: +100 (back to 1000)
    // New transaction effect: -150 (debit)
    // Final balance: 850
    const updatedAccount = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .execute();

    expect(parseFloat(updatedAccount[0].balance)).toBe(850.00);
  });

  it('should update transaction type and adjust account balance correctly', async () => {
    // Create account
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

    // Create debit transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        account_id: accountId,
        transaction_type: 'debit',
        amount: '100.00',
        description: testTransaction.description,
        transaction_date: testTransaction.transaction_date,
        reference_number: testTransaction.reference_number
      })
      .returning()
      .execute();

    // Update account balance to reflect the debit
    await db.update(accountsTable)
      .set({ balance: '900.00' }) // 1000 - 100
      .where(eq(accountsTable.id, accountId))
      .execute();

    const transactionId = transactionResult[0].id;

    // Change from debit to credit
    const updateInput: UpdateTransactionInput = {
      id: transactionId,
      transaction_type: 'credit'
    };

    const result = await updateTransaction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.transaction_type).toBe('credit');

    // Verify account balance adjustment
    // Original balance after debit: 900
    // Revert debit: +100 (back to 1000)
    // Apply credit: +100
    // Final balance: 1100
    const updatedAccount = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .execute();

    expect(parseFloat(updatedAccount[0].balance)).toBe(1100.00);
  });

  it('should move transaction to different account and adjust both balances', async () => {
    // Create two accounts
    const account1Result = await db.insert(accountsTable)
      .values({
        name: testAccount.name,
        account_number: testAccount.account_number,
        account_type: testAccount.account_type,
        balance: testAccount.balance.toString(),
        description: testAccount.description
      })
      .returning()
      .execute();

    const account2Result = await db.insert(accountsTable)
      .values({
        name: testAccount2.name,
        account_number: testAccount2.account_number,
        account_type: testAccount2.account_type,
        balance: testAccount2.balance.toString(),
        description: testAccount2.description
      })
      .returning()
      .execute();

    const account1Id = account1Result[0].id;
    const account2Id = account2Result[0].id;

    // Create transaction on account1
    const transactionResult = await db.insert(transactionsTable)
      .values({
        account_id: account1Id,
        transaction_type: 'debit',
        amount: '100.00',
        description: testTransaction.description,
        transaction_date: testTransaction.transaction_date,
        reference_number: testTransaction.reference_number
      })
      .returning()
      .execute();

    // Update account1 balance to reflect the debit
    await db.update(accountsTable)
      .set({ balance: '900.00' }) // 1000 - 100
      .where(eq(accountsTable.id, account1Id))
      .execute();

    const transactionId = transactionResult[0].id;

    // Move transaction to account2
    const updateInput: UpdateTransactionInput = {
      id: transactionId,
      account_id: account2Id
    };

    const result = await updateTransaction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.account_id).toBe(account2Id);

    // Verify both account balances
    const updatedAccounts = await db.select()
      .from(accountsTable)
      .execute();

    const account1 = updatedAccounts.find(acc => acc.id === account1Id);
    const account2 = updatedAccounts.find(acc => acc.id === account2Id);

    // Account1: reverted back to original balance (1000)
    expect(parseFloat(account1!.balance)).toBe(1000.00);
    
    // Account2: original balance (500) minus the debit (100) = 400
    expect(parseFloat(account2!.balance)).toBe(400.00);
  });

  it('should handle complex update with multiple changes', async () => {
    // Create two accounts
    const account1Result = await db.insert(accountsTable)
      .values({
        name: testAccount.name,
        account_number: testAccount.account_number,
        account_type: testAccount.account_type,
        balance: testAccount.balance.toString(),
        description: testAccount.description
      })
      .returning()
      .execute();

    const account2Result = await db.insert(accountsTable)
      .values({
        name: testAccount2.name,
        account_number: testAccount2.account_number,
        account_type: testAccount2.account_type,
        balance: testAccount2.balance.toString(),
        description: testAccount2.description
      })
      .returning()
      .execute();

    const account1Id = account1Result[0].id;
    const account2Id = account2Result[0].id;

    // Create transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        account_id: account1Id,
        transaction_type: 'debit',
        amount: '100.00',
        description: testTransaction.description,
        transaction_date: testTransaction.transaction_date,
        reference_number: testTransaction.reference_number
      })
      .returning()
      .execute();

    // Update account1 balance
    await db.update(accountsTable)
      .set({ balance: '900.00' })
      .where(eq(accountsTable.id, account1Id))
      .execute();

    const transactionId = transactionResult[0].id;

    // Update multiple fields: account, type, amount
    const updateInput: UpdateTransactionInput = {
      id: transactionId,
      account_id: account2Id,
      transaction_type: 'credit',
      amount: 200.00,
      description: 'Completely updated transaction'
    };

    const result = await updateTransaction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.account_id).toBe(account2Id);
    expect(result!.transaction_type).toBe('credit');
    expect(result!.amount).toBe(200.00);
    expect(result!.description).toBe('Completely updated transaction');
    expect(typeof result!.amount).toBe('number');

    // Verify account balances
    const updatedAccounts = await db.select()
      .from(accountsTable)
      .execute();

    const account1 = updatedAccounts.find(acc => acc.id === account1Id);
    const account2 = updatedAccounts.find(acc => acc.id === account2Id);

    // Account1: reverted back to 1000 (removed the 100 debit)
    expect(parseFloat(account1!.balance)).toBe(1000.00);
    
    // Account2: 500 + 200 credit = 700
    expect(parseFloat(account2!.balance)).toBe(700.00);
  });

  it('should update transaction_date correctly', async () => {
    // Create account
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

    // Create transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        account_id: accountId,
        transaction_type: testTransaction.transaction_type,
        amount: testTransaction.amount.toString(),
        description: testTransaction.description,
        transaction_date: testTransaction.transaction_date,
        reference_number: testTransaction.reference_number
      })
      .returning()
      .execute();

    const transactionId = transactionResult[0].id;
    const newDate = new Date('2024-02-20');

    const updateInput: UpdateTransactionInput = {
      id: transactionId,
      transaction_date: newDate
    };

    const result = await updateTransaction(updateInput);

    expect(result).not.toBeNull();
    expect(result!.transaction_date).toEqual(newDate);
  });
});