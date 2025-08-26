import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { accountsTable } from '../db/schema';
import { type CreateAccountInput, type UpdateAccountInput } from '../schema';
import { updateAccount } from '../handlers/update_account';
import { eq } from 'drizzle-orm';

// Helper function to create a test account
const createTestAccount = async (accountData: Partial<CreateAccountInput> = {}): Promise<number> => {
  const testAccount: CreateAccountInput = {
    name: 'Test Account',
    account_number: 'ACC-001',
    account_type: 'asset',
    balance: 1000.50,
    description: 'A test account',
    ...accountData
  };

  const result = await db.insert(accountsTable)
    .values({
      name: testAccount.name,
      account_number: testAccount.account_number,
      account_type: testAccount.account_type,
      balance: testAccount.balance.toString(),
      description: testAccount.description,
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateAccount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an account with all fields', async () => {
    // Create test account
    const accountId = await createTestAccount();

    const updateInput: UpdateAccountInput = {
      id: accountId,
      name: 'Updated Account',
      account_number: 'ACC-002',
      account_type: 'liability',
      balance: 2500.75,
      description: 'Updated description'
    };

    const result = await updateAccount(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(accountId);
    expect(result!.name).toEqual('Updated Account');
    expect(result!.account_number).toEqual('ACC-002');
    expect(result!.account_type).toEqual('liability');
    expect(result!.balance).toEqual(2500.75);
    expect(typeof result!.balance).toBe('number');
    expect(result!.description).toEqual('Updated description');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update an account with partial fields', async () => {
    // Create test account
    const accountId = await createTestAccount();

    const updateInput: UpdateAccountInput = {
      id: accountId,
      name: 'Partially Updated Account',
      balance: 3000.25
    };

    const result = await updateAccount(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(accountId);
    expect(result!.name).toEqual('Partially Updated Account');
    expect(result!.account_number).toEqual('ACC-001'); // Should remain unchanged
    expect(result!.account_type).toEqual('asset'); // Should remain unchanged
    expect(result!.balance).toEqual(3000.25);
    expect(typeof result!.balance).toBe('number');
    expect(result!.description).toEqual('A test account'); // Should remain unchanged
  });

  it('should update balance to zero', async () => {
    // Create test account
    const accountId = await createTestAccount();

    const updateInput: UpdateAccountInput = {
      id: accountId,
      balance: 0
    };

    const result = await updateAccount(updateInput);

    expect(result).not.toBeNull();
    expect(result!.balance).toEqual(0);
    expect(typeof result!.balance).toBe('number');
  });

  it('should update description to null', async () => {
    // Create test account
    const accountId = await createTestAccount();

    const updateInput: UpdateAccountInput = {
      id: accountId,
      description: null
    };

    const result = await updateAccount(updateInput);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
  });

  it('should return null for non-existent account', async () => {
    const updateInput: UpdateAccountInput = {
      id: 9999, // Non-existent ID
      name: 'Non-existent Account'
    };

    const result = await updateAccount(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes in database', async () => {
    // Create test account
    const accountId = await createTestAccount();

    const updateInput: UpdateAccountInput = {
      id: accountId,
      name: 'Database Persistence Test',
      balance: 4500.00
    };

    await updateAccount(updateInput);

    // Verify changes were persisted in database
    const accounts = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .execute();

    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toEqual('Database Persistence Test');
    expect(parseFloat(accounts[0].balance)).toEqual(4500.00);
  });

  it('should update account type from asset to revenue', async () => {
    // Create test account
    const accountId = await createTestAccount({ account_type: 'asset' });

    const updateInput: UpdateAccountInput = {
      id: accountId,
      account_type: 'revenue'
    };

    const result = await updateAccount(updateInput);

    expect(result).not.toBeNull();
    expect(result!.account_type).toEqual('revenue');
  });

  it('should handle negative balance correctly', async () => {
    // Create test account
    const accountId = await createTestAccount();

    const updateInput: UpdateAccountInput = {
      id: accountId,
      balance: -500.25
    };

    const result = await updateAccount(updateInput);

    expect(result).not.toBeNull();
    expect(result!.balance).toEqual(-500.25);
    expect(typeof result!.balance).toBe('number');
  });

  it('should handle large balance values correctly', async () => {
    // Create test account
    const accountId = await createTestAccount();

    const updateInput: UpdateAccountInput = {
      id: accountId,
      balance: 999999999.99
    };

    const result = await updateAccount(updateInput);

    expect(result).not.toBeNull();
    expect(result!.balance).toEqual(999999999.99);
    expect(typeof result!.balance).toBe('number');
  });

  it('should update updated_at timestamp', async () => {
    // Create test account and get its initial timestamp
    const accountId = await createTestAccount();
    const originalAccount = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .execute();
    
    const originalUpdatedAt = originalAccount[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateAccountInput = {
      id: accountId,
      name: 'Updated Name'
    };

    const result = await updateAccount(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});