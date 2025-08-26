import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { accountsTable } from '../db/schema';
import { type CreateAccountInput } from '../schema';
import { getAccountById } from '../handlers/get_account_by_id';

// Test input for creating an account
const testAccountInput: CreateAccountInput = {
  name: 'Test Checking Account',
  account_number: 'ACC-001',
  account_type: 'asset',
  balance: 1500.75,
  description: 'A test checking account for unit testing'
};

describe('getAccountById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return account when ID exists', async () => {
    // Create a test account first
    const insertResult = await db.insert(accountsTable)
      .values({
        name: testAccountInput.name,
        account_number: testAccountInput.account_number,
        account_type: testAccountInput.account_type,
        balance: testAccountInput.balance.toString(), // Convert to string for numeric column
        description: testAccountInput.description
      })
      .returning()
      .execute();

    const createdAccount = insertResult[0];

    // Test the handler
    const result = await getAccountById(createdAccount.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdAccount.id);
    expect(result!.name).toBe('Test Checking Account');
    expect(result!.account_number).toBe('ACC-001');
    expect(result!.account_type).toBe('asset');
    expect(result!.balance).toBe(1500.75);
    expect(typeof result!.balance).toBe('number'); // Verify numeric conversion
    expect(result!.description).toBe('A test checking account for unit testing');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when ID does not exist', async () => {
    // Test with non-existent ID
    const result = await getAccountById(999999);
    
    expect(result).toBeNull();
  });

  it('should handle account with null description', async () => {
    // Create account with null description
    const accountWithNullDesc = {
      name: 'Account Without Description',
      account_number: 'ACC-002',
      account_type: 'liability' as const,
      balance: 2500.00,
      description: null
    };

    const insertResult = await db.insert(accountsTable)
      .values({
        ...accountWithNullDesc,
        balance: accountWithNullDesc.balance.toString()
      })
      .returning()
      .execute();

    const createdAccount = insertResult[0];

    // Test the handler
    const result = await getAccountById(createdAccount.id);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.balance).toBe(2500.00);
    expect(typeof result!.balance).toBe('number');
  });

  it('should handle different account types correctly', async () => {
    // Create accounts of different types
    const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
    const createdAccountIds: number[] = [];

    for (const accountType of accountTypes) {
      const insertResult = await db.insert(accountsTable)
        .values({
          name: `Test ${accountType} Account`,
          account_number: `ACC-${accountType.toUpperCase()}`,
          account_type: accountType,
          balance: '1000.00',
          description: `Test ${accountType} account`
        })
        .returning()
        .execute();

      createdAccountIds.push(insertResult[0].id);
    }

    // Test each account type
    for (let i = 0; i < accountTypes.length; i++) {
      const result = await getAccountById(createdAccountIds[i]);
      
      expect(result).not.toBeNull();
      expect(result!.account_type).toBe(accountTypes[i]);
      expect(result!.name).toBe(`Test ${accountTypes[i]} Account`);
      expect(result!.balance).toBe(1000.00);
      expect(typeof result!.balance).toBe('number');
    }
  });

  it('should handle zero and negative balances correctly', async () => {
    // Test zero balance
    const zeroBalanceResult = await db.insert(accountsTable)
      .values({
        name: 'Zero Balance Account',
        account_number: 'ACC-ZERO',
        account_type: 'asset',
        balance: '0.00',
        description: 'Account with zero balance'
      })
      .returning()
      .execute();

    const zeroResult = await getAccountById(zeroBalanceResult[0].id);
    expect(zeroResult!.balance).toBe(0);
    expect(typeof zeroResult!.balance).toBe('number');

    // Test negative balance
    const negativeBalanceResult = await db.insert(accountsTable)
      .values({
        name: 'Negative Balance Account', 
        account_number: 'ACC-NEG',
        account_type: 'liability',
        balance: '-500.25',
        description: 'Account with negative balance'
      })
      .returning()
      .execute();

    const negativeResult = await getAccountById(negativeBalanceResult[0].id);
    expect(negativeResult!.balance).toBe(-500.25);
    expect(typeof negativeResult!.balance).toBe('number');
  });
});