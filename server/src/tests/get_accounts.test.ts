import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { accountsTable } from '../db/schema';
import { type CreateAccountInput } from '../schema';
import { getAccounts } from '../handlers/get_accounts';

// Test account data
const testAccount1: CreateAccountInput = {
  name: 'Cash Account',
  account_number: 'ACC001',
  account_type: 'asset',
  balance: 50000.00,
  description: 'Primary cash account'
};

const testAccount2: CreateAccountInput = {
  name: 'Equipment',
  account_number: 'ACC002',
  account_type: 'asset',
  balance: 25000.50,
  description: 'Office equipment and furniture'
};

const testAccount3: CreateAccountInput = {
  name: 'Accounts Payable',
  account_number: 'ACC003',
  account_type: 'liability',
  balance: 15000.75,
  description: null
};

describe('getAccounts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no accounts exist', async () => {
    const result = await getAccounts();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all accounts from database', async () => {
    // Create test accounts
    await db.insert(accountsTable).values([
      {
        ...testAccount1,
        balance: testAccount1.balance.toString()
      },
      {
        ...testAccount2,
        balance: testAccount2.balance.toString()
      }
    ]).execute();

    const result = await getAccounts();

    expect(result).toHaveLength(2);
    
    // Verify first account
    const account1 = result.find(acc => acc.account_number === 'ACC001');
    expect(account1).toBeDefined();
    expect(account1!.name).toEqual('Cash Account');
    expect(account1!.account_type).toEqual('asset');
    expect(account1!.balance).toEqual(50000.00);
    expect(typeof account1!.balance).toBe('number');
    expect(account1!.description).toEqual('Primary cash account');
    expect(account1!.id).toBeDefined();
    expect(account1!.created_at).toBeInstanceOf(Date);
    expect(account1!.updated_at).toBeInstanceOf(Date);

    // Verify second account
    const account2 = result.find(acc => acc.account_number === 'ACC002');
    expect(account2).toBeDefined();
    expect(account2!.name).toEqual('Equipment');
    expect(account2!.account_type).toEqual('asset');
    expect(account2!.balance).toEqual(25000.50);
    expect(typeof account2!.balance).toBe('number');
    expect(account2!.description).toEqual('Office equipment and furniture');
  });

  it('should handle accounts with null descriptions', async () => {
    // Create account with null description
    await db.insert(accountsTable).values({
      ...testAccount3,
      balance: testAccount3.balance.toString()
    }).execute();

    const result = await getAccounts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Accounts Payable');
    expect(result[0].account_type).toEqual('liability');
    expect(result[0].balance).toEqual(15000.75);
    expect(typeof result[0].balance).toBe('number');
    expect(result[0].description).toBeNull();
  });

  it('should return accounts with all account types', async () => {
    // Create accounts of different types
    const accounts = [
      { ...testAccount1, account_type: 'asset' as const },
      { ...testAccount2, account_type: 'liability' as const, account_number: 'LIB001' },
      { ...testAccount3, account_type: 'equity' as const, account_number: 'EQU001' },
      { 
        name: 'Service Revenue',
        account_number: 'REV001',
        account_type: 'revenue' as const,
        balance: 100000.00,
        description: 'Revenue from services'
      },
      {
        name: 'Office Expenses',
        account_number: 'EXP001',
        account_type: 'expense' as const,
        balance: 5000.00,
        description: 'Monthly office expenses'
      }
    ];

    await db.insert(accountsTable).values(
      accounts.map(acc => ({
        ...acc,
        balance: acc.balance.toString()
      }))
    ).execute();

    const result = await getAccounts();

    expect(result).toHaveLength(5);

    // Verify all account types are present
    const accountTypes = result.map(acc => acc.account_type);
    expect(accountTypes).toContain('asset');
    expect(accountTypes).toContain('liability');
    expect(accountTypes).toContain('equity');
    expect(accountTypes).toContain('revenue');
    expect(accountTypes).toContain('expense');

    // Verify all balances are numbers
    result.forEach(account => {
      expect(typeof account.balance).toBe('number');
    });
  });

  it('should handle high precision decimal balances', async () => {
    // Create account with high precision balance
    const highPrecisionAccount = {
      name: 'High Precision Account',
      account_number: 'HP001',
      account_type: 'asset' as const,
      balance: 12345.6789,
      description: 'Account with high precision balance'
    };

    await db.insert(accountsTable).values({
      ...highPrecisionAccount,
      balance: highPrecisionAccount.balance.toString()
    }).execute();

    const result = await getAccounts();

    expect(result).toHaveLength(1);
    expect(result[0].balance).toEqual(12345.68); // PostgreSQL numeric(15,2) rounds to 2 decimal places
    expect(typeof result[0].balance).toBe('number');
  });

  it('should return accounts ordered by creation time', async () => {
    // Create accounts with slight delays to ensure different timestamps
    await db.insert(accountsTable).values({
      ...testAccount1,
      balance: testAccount1.balance.toString()
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    await db.insert(accountsTable).values({
      ...testAccount2,
      balance: testAccount2.balance.toString()
    }).execute();

    const result = await getAccounts();

    expect(result).toHaveLength(2);
    
    // Verify timestamps show proper creation order
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
    expect(result[0].account_number).toEqual('ACC001');
    expect(result[1].account_number).toEqual('ACC002');
  });
});