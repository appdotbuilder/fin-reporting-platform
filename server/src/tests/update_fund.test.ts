import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { fundsTable } from '../db/schema';
import { type UpdateFundInput, type CreateFundInput } from '../schema';
import { updateFund } from '../handlers/update_fund';
import { eq } from 'drizzle-orm';

// Test data
const testFundInput: CreateFundInput = {
  name: 'Test Equity Fund',
  fund_type: 'equity',
  inception_date: new Date('2023-01-01'),
  nav: 100.5000,
  total_assets: 1000000.00,
  management_fee: 0.0075,
  description: 'A test equity fund'
};

describe('updateFund', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a fund with all fields', async () => {
    // Create a fund first
    const createResult = await db.insert(fundsTable)
      .values({
        ...testFundInput,
        nav: testFundInput.nav.toString(),
        total_assets: testFundInput.total_assets.toString(),
        management_fee: testFundInput.management_fee.toString()
      })
      .returning()
      .execute();
    
    const fundId = createResult[0].id;

    // Update the fund
    const updateInput: UpdateFundInput = {
      id: fundId,
      name: 'Updated Equity Fund',
      fund_type: 'mixed',
      inception_date: new Date('2023-06-01'),
      nav: 105.2500,
      total_assets: 1500000.00,
      management_fee: 0.0100,
      description: 'An updated test fund'
    };

    const result = await updateFund(updateInput);

    // Verify the result
    expect(result).toBeDefined();
    expect(result!.id).toEqual(fundId);
    expect(result!.name).toEqual('Updated Equity Fund');
    expect(result!.fund_type).toEqual('mixed');
    expect(result!.inception_date).toEqual(new Date('2023-06-01'));
    expect(result!.nav).toEqual(105.25);
    expect(typeof result!.nav).toEqual('number');
    expect(result!.total_assets).toEqual(1500000.00);
    expect(typeof result!.total_assets).toEqual('number');
    expect(result!.management_fee).toEqual(0.01);
    expect(typeof result!.management_fee).toEqual('number');
    expect(result!.description).toEqual('An updated test fund');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create a fund first
    const createResult = await db.insert(fundsTable)
      .values({
        ...testFundInput,
        nav: testFundInput.nav.toString(),
        total_assets: testFundInput.total_assets.toString(),
        management_fee: testFundInput.management_fee.toString()
      })
      .returning()
      .execute();
    
    const fundId = createResult[0].id;

    // Update only name and nav
    const updateInput: UpdateFundInput = {
      id: fundId,
      name: 'Partially Updated Fund',
      nav: 110.0000
    };

    const result = await updateFund(updateInput);

    // Verify updated fields
    expect(result).toBeDefined();
    expect(result!.name).toEqual('Partially Updated Fund');
    expect(result!.nav).toEqual(110.0000);
    expect(typeof result!.nav).toEqual('number');

    // Verify unchanged fields
    expect(result!.fund_type).toEqual('equity');
    expect(result!.total_assets).toEqual(1000000.00);
    expect(result!.management_fee).toEqual(0.0075);
    expect(result!.description).toEqual('A test equity fund');
  });

  it('should persist changes in database', async () => {
    // Create a fund first
    const createResult = await db.insert(fundsTable)
      .values({
        ...testFundInput,
        nav: testFundInput.nav.toString(),
        total_assets: testFundInput.total_assets.toString(),
        management_fee: testFundInput.management_fee.toString()
      })
      .returning()
      .execute();
    
    const fundId = createResult[0].id;

    // Update the fund
    const updateInput: UpdateFundInput = {
      id: fundId,
      name: 'Database Persisted Fund',
      total_assets: 2000000.00
    };

    await updateFund(updateInput);

    // Verify changes are persisted
    const funds = await db.select()
      .from(fundsTable)
      .where(eq(fundsTable.id, fundId))
      .execute();

    expect(funds).toHaveLength(1);
    expect(funds[0].name).toEqual('Database Persisted Fund');
    expect(parseFloat(funds[0].total_assets)).toEqual(2000000.00);
    expect(funds[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent fund', async () => {
    const updateInput: UpdateFundInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Fund'
    };

    const result = await updateFund(updateInput);
    expect(result).toBeNull();
  });

  it('should handle nullable description field', async () => {
    // Create a fund first
    const createResult = await db.insert(fundsTable)
      .values({
        ...testFundInput,
        nav: testFundInput.nav.toString(),
        total_assets: testFundInput.total_assets.toString(),
        management_fee: testFundInput.management_fee.toString()
      })
      .returning()
      .execute();
    
    const fundId = createResult[0].id;

    // Update description to null
    const updateInput: UpdateFundInput = {
      id: fundId,
      description: null
    };

    const result = await updateFund(updateInput);

    expect(result).toBeDefined();
    expect(result!.description).toBeNull();
  });

  it('should update updated_at timestamp', async () => {
    // Create a fund first
    const createResult = await db.insert(fundsTable)
      .values({
        ...testFundInput,
        nav: testFundInput.nav.toString(),
        total_assets: testFundInput.total_assets.toString(),
        management_fee: testFundInput.management_fee.toString()
      })
      .returning()
      .execute();
    
    const fundId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the fund
    const updateInput: UpdateFundInput = {
      id: fundId,
      name: 'Timestamp Test Fund'
    };

    const result = await updateFund(updateInput);

    expect(result).toBeDefined();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle precision of numeric fields correctly', async () => {
    // Create a fund first
    const createResult = await db.insert(fundsTable)
      .values({
        ...testFundInput,
        nav: testFundInput.nav.toString(),
        total_assets: testFundInput.total_assets.toString(),
        management_fee: testFundInput.management_fee.toString()
      })
      .returning()
      .execute();
    
    const fundId = createResult[0].id;

    // Update with high precision values
    const updateInput: UpdateFundInput = {
      id: fundId,
      nav: 123.4567,
      management_fee: 0.0123
    };

    const result = await updateFund(updateInput);

    expect(result).toBeDefined();
    expect(result!.nav).toEqual(123.4567);
    expect(result!.management_fee).toEqual(0.0123);
    expect(typeof result!.nav).toEqual('number');
    expect(typeof result!.management_fee).toEqual('number');
  });
});