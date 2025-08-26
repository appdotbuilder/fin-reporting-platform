import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { accountsTable } from '../db/schema';
import { type CreateAccountInput } from '../schema';
import { createAccount } from '../handlers/create_account';
import { eq } from 'drizzle-orm';

// Test input data
const testAccountInput: CreateAccountInput = {
  name: 'Test Cash Account',
  account_number: 'ACC-001',
  account_type: 'asset',
  balance: 10000.50,
  description: 'A test cash account for unit testing'
};

const minimalAccountInput: CreateAccountInput = {
  name: 'Minimal Account',
  account_number: 'ACC-002',
  account_type: 'liability',
  balance: 0,
  description: null
};

describe('createAccount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an account with all fields', async () => {
    const result = await createAccount(testAccountInput);

    // Verify all fields are correctly set
    expect(result.name).toEqual('Test Cash Account');
    expect(result.account_number).toEqual('ACC-001');
    expect(result.account_type).toEqual('asset');
    expect(result.balance).toEqual(10000.50);
    expect(typeof result.balance).toBe('number'); // Verify numeric conversion
    expect(result.description).toEqual('A test cash account for unit testing');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an account with minimal required fields', async () => {
    const result = await createAccount(minimalAccountInput);

    expect(result.name).toEqual('Minimal Account');
    expect(result.account_number).toEqual('ACC-002');
    expect(result.account_type).toEqual('liability');
    expect(result.balance).toEqual(0);
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save account to database correctly', async () => {
    const result = await createAccount(testAccountInput);

    // Query the database to verify the account was saved
    const accounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, result.id))
      .execute();

    expect(accounts).toHaveLength(1);
    const savedAccount = accounts[0];

    expect(savedAccount.name).toEqual('Test Cash Account');
    expect(savedAccount.account_number).toEqual('ACC-001');
    expect(savedAccount.account_type).toEqual('asset');
    expect(parseFloat(savedAccount.balance)).toEqual(10000.50); // Database stores as string
    expect(savedAccount.description).toEqual('A test cash account for unit testing');
    expect(savedAccount.created_at).toBeInstanceOf(Date);
    expect(savedAccount.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different account types correctly', async () => {
    const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
    
    for (let i = 0; i < accountTypes.length; i++) {
      const accountType = accountTypes[i];
      const input: CreateAccountInput = {
        name: `Test ${accountType} Account`,
        account_number: `ACC-${i + 100}`,
        account_type: accountType,
        balance: (i + 1) * 1000,
        description: `Test ${accountType} account`
      };

      const result = await createAccount(input);
      expect(result.account_type).toEqual(accountType);
      expect(result.balance).toEqual((i + 1) * 1000);
    }
  });

  it('should handle precision in balance amounts', async () => {
    const precisionInput: CreateAccountInput = {
      name: 'Precision Test Account',
      account_number: 'ACC-PRECISION',
      account_type: 'asset',
      balance: 12345.67,
      description: 'Testing decimal precision'
    };

    const result = await createAccount(precisionInput);
    
    expect(result.balance).toEqual(12345.67);
    expect(typeof result.balance).toBe('number');

    // Verify precision is maintained in database
    const savedAccounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, result.id))
      .execute();

    expect(parseFloat(savedAccounts[0].balance)).toEqual(12345.67);
  });

  it('should enforce unique account numbers', async () => {
    // Create first account
    await createAccount(testAccountInput);

    // Try to create second account with same account number
    const duplicateInput: CreateAccountInput = {
      name: 'Duplicate Account',
      account_number: 'ACC-001', // Same as testAccountInput
      account_type: 'liability',
      balance: 5000,
      description: 'This should fail due to duplicate account number'
    };

    await expect(createAccount(duplicateInput)).rejects.toThrow();
  });
});