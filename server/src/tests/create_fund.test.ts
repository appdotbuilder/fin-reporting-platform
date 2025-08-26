import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { fundsTable } from '../db/schema';
import { type CreateFundInput } from '../schema';
import { createFund } from '../handlers/create_fund';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateFundInput = {
  name: 'Global Equity Fund',
  fund_type: 'equity',
  inception_date: new Date('2024-01-15'),
  nav: 125.50,
  total_assets: 1500000.00,
  management_fee: 0.0175,
  description: 'A diversified global equity fund focused on growth'
};

describe('createFund', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a fund with all required fields', async () => {
    const result = await createFund(testInput);

    // Basic field validation
    expect(result.name).toEqual('Global Equity Fund');
    expect(result.fund_type).toEqual('equity');
    expect(result.inception_date).toEqual(new Date('2024-01-15'));
    expect(result.nav).toEqual(125.50);
    expect(result.total_assets).toEqual(1500000.00);
    expect(result.management_fee).toEqual(0.0175);
    expect(result.description).toEqual('A diversified global equity fund focused on growth');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types are returned as numbers
    expect(typeof result.nav).toBe('number');
    expect(typeof result.total_assets).toBe('number');
    expect(typeof result.management_fee).toBe('number');
  });

  it('should save fund to database', async () => {
    const result = await createFund(testInput);

    // Query using proper drizzle syntax
    const funds = await db.select()
      .from(fundsTable)
      .where(eq(fundsTable.id, result.id))
      .execute();

    expect(funds).toHaveLength(1);
    expect(funds[0].name).toEqual('Global Equity Fund');
    expect(funds[0].fund_type).toEqual('equity');
    expect(funds[0].inception_date).toEqual(new Date('2024-01-15'));
    expect(parseFloat(funds[0].nav)).toEqual(125.50);
    expect(parseFloat(funds[0].total_assets)).toEqual(1500000.00);
    expect(parseFloat(funds[0].management_fee)).toEqual(0.0175);
    expect(funds[0].description).toEqual('A diversified global equity fund focused on growth');
    expect(funds[0].created_at).toBeInstanceOf(Date);
    expect(funds[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a fund with null description', async () => {
    const inputWithNullDescription: CreateFundInput = {
      ...testInput,
      description: null
    };

    const result = await createFund(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Global Equity Fund');
    expect(result.nav).toEqual(125.50);
  });

  it('should create different fund types correctly', async () => {
    const fundTypes: Array<CreateFundInput['fund_type']> = ['equity', 'fixed_income', 'mixed', 'alternative'];
    
    for (const fundType of fundTypes) {
      const input: CreateFundInput = {
        ...testInput,
        name: `Test ${fundType} Fund`,
        fund_type: fundType
      };

      const result = await createFund(input);
      expect(result.fund_type).toEqual(fundType);
      expect(result.name).toEqual(`Test ${fundType} Fund`);
    }
  });

  it('should handle high precision numeric values correctly', async () => {
    const highPrecisionInput: CreateFundInput = {
      name: 'Precision Fund',
      fund_type: 'mixed',
      inception_date: new Date('2024-01-01'),
      nav: 99.9999, // High precision NAV
      total_assets: 2500000.75, // Decimal assets
      management_fee: 0.0125, // Small percentage
      description: null
    };

    const result = await createFund(highPrecisionInput);

    expect(result.nav).toEqual(99.9999);
    expect(result.total_assets).toEqual(2500000.75);
    expect(result.management_fee).toEqual(0.0125);
    expect(typeof result.nav).toBe('number');
    expect(typeof result.total_assets).toBe('number');
    expect(typeof result.management_fee).toBe('number');
  });

  it('should create funds with zero values correctly', async () => {
    const zeroValueInput: CreateFundInput = {
      name: 'New Fund',
      fund_type: 'equity',
      inception_date: new Date('2024-01-01'),
      nav: 1.00, // Starting NAV
      total_assets: 0.00, // New fund with no assets yet
      management_fee: 0.0000, // No management fee
      description: 'Brand new fund'
    };

    const result = await createFund(zeroValueInput);

    expect(result.total_assets).toEqual(0.00);
    expect(result.management_fee).toEqual(0.0000);
    expect(result.nav).toEqual(1.00);
  });

  it('should maintain date precision for inception_date', async () => {
    const specificDate = new Date('2023-06-15T10:30:00.000Z');
    const dateInput: CreateFundInput = {
      ...testInput,
      inception_date: specificDate
    };

    const result = await createFund(dateInput);

    expect(result.inception_date.getTime()).toEqual(specificDate.getTime());
  });
});