import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investorsTable } from '../db/schema';
import { type CreateInvestorInput } from '../schema';
import { createInvestor } from '../handlers/create_investor';
import { eq } from 'drizzle-orm';

// Test inputs
const individualInvestorInput: CreateInvestorInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  investor_type: 'individual',
  total_invested: 50000.75,
  phone: '+1-555-123-4567',
  address: '123 Main St, Anytown, USA'
};

const institutionalInvestorInput: CreateInvestorInput = {
  name: 'ABC Pension Fund',
  email: 'contact@abcpension.com',
  investor_type: 'institutional',
  total_invested: 1000000.00,
  phone: '+1-555-987-6543',
  address: '456 Corporate Blvd, Business City, USA'
};

const minimalInvestorInput: CreateInvestorInput = {
  name: 'Jane Smith',
  email: 'jane.smith@email.com',
  investor_type: 'individual',
  total_invested: 0,
  phone: null,
  address: null
};

describe('createInvestor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an individual investor with all fields', async () => {
    const result = await createInvestor(individualInvestorInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.investor_type).toEqual('individual');
    expect(result.total_invested).toEqual(50000.75);
    expect(typeof result.total_invested).toBe('number');
    expect(result.phone).toEqual('+1-555-123-4567');
    expect(result.address).toEqual('123 Main St, Anytown, USA');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an institutional investor', async () => {
    const result = await createInvestor(institutionalInvestorInput);

    expect(result.name).toEqual('ABC Pension Fund');
    expect(result.email).toEqual('contact@abcpension.com');
    expect(result.investor_type).toEqual('institutional');
    expect(result.total_invested).toEqual(1000000.00);
    expect(typeof result.total_invested).toBe('number');
    expect(result.phone).toEqual('+1-555-987-6543');
    expect(result.address).toEqual('456 Corporate Blvd, Business City, USA');
  });

  it('should create investor with minimal fields', async () => {
    const result = await createInvestor(minimalInvestorInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@email.com');
    expect(result.investor_type).toEqual('individual');
    expect(result.total_invested).toEqual(0);
    expect(typeof result.total_invested).toBe('number');
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save investor to database correctly', async () => {
    const result = await createInvestor(individualInvestorInput);

    // Query database to verify the investor was saved
    const investors = await db.select()
      .from(investorsTable)
      .where(eq(investorsTable.id, result.id))
      .execute();

    expect(investors).toHaveLength(1);
    const dbInvestor = investors[0];
    expect(dbInvestor.name).toEqual('John Doe');
    expect(dbInvestor.email).toEqual('john.doe@example.com');
    expect(dbInvestor.investor_type).toEqual('individual');
    expect(parseFloat(dbInvestor.total_invested)).toEqual(50000.75);
    expect(dbInvestor.phone).toEqual('+1-555-123-4567');
    expect(dbInvestor.address).toEqual('123 Main St, Anytown, USA');
    expect(dbInvestor.created_at).toBeInstanceOf(Date);
    expect(dbInvestor.updated_at).toBeInstanceOf(Date);
  });

  it('should handle numeric precision correctly', async () => {
    const precisionInput: CreateInvestorInput = {
      name: 'Precision Investor',
      email: 'precision@test.com',
      investor_type: 'individual',
      total_invested: 12345.99,
      phone: null,
      address: null
    };

    const result = await createInvestor(precisionInput);

    expect(result.total_invested).toEqual(12345.99);
    expect(typeof result.total_invested).toBe('number');

    // Verify in database
    const dbInvestors = await db.select()
      .from(investorsTable)
      .where(eq(investorsTable.id, result.id))
      .execute();

    expect(parseFloat(dbInvestors[0].total_invested)).toEqual(12345.99);
  });

  it('should throw error for duplicate email', async () => {
    // Create first investor
    await createInvestor(individualInvestorInput);

    // Attempt to create second investor with same email
    const duplicateEmailInput: CreateInvestorInput = {
      name: 'Different Name',
      email: 'john.doe@example.com', // Same email
      investor_type: 'institutional',
      total_invested: 25000.00,
      phone: null,
      address: null
    };

    await expect(createInvestor(duplicateEmailInput))
      .rejects
      .toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should handle large investment amounts', async () => {
    const largeAmountInput: CreateInvestorInput = {
      name: 'High Net Worth Investor',
      email: 'hnw@example.com',
      investor_type: 'individual',
      total_invested: 999999999999.99, // Large amount
      phone: null,
      address: null
    };

    const result = await createInvestor(largeAmountInput);

    expect(result.total_invested).toEqual(999999999999.99);
    expect(typeof result.total_invested).toBe('number');
  });

  it('should handle zero investment amount', async () => {
    const zeroInvestmentInput: CreateInvestorInput = {
      name: 'New Investor',
      email: 'new@example.com',
      investor_type: 'individual',
      total_invested: 0,
      phone: null,
      address: null
    };

    const result = await createInvestor(zeroInvestmentInput);

    expect(result.total_invested).toEqual(0);
    expect(typeof result.total_invested).toBe('number');
  });
});