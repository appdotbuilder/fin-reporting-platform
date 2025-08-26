import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { fundsTable } from '../db/schema';
import { type CreateFundInput } from '../schema';
import { getFundById } from '../handlers/get_fund_by_id';

// Test input data
const testFundInput: CreateFundInput = {
  name: 'Test Growth Fund',
  fund_type: 'equity',
  inception_date: new Date('2020-01-01'),
  nav: 125.75,
  total_assets: 1000000.50,
  management_fee: 0.0075,
  description: 'A test equity fund for growth-oriented investors'
};

const testFundInput2: CreateFundInput = {
  name: 'Test Bond Fund',
  fund_type: 'fixed_income',
  inception_date: new Date('2019-06-15'),
  nav: 98.25,
  total_assets: 500000.25,
  management_fee: 0.005,
  description: 'A conservative fixed income fund'
};

describe('getFundById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a fund when found', async () => {
    // Create test fund
    const insertResult = await db.insert(fundsTable)
      .values({
        name: testFundInput.name,
        fund_type: testFundInput.fund_type,
        inception_date: testFundInput.inception_date,
        nav: testFundInput.nav.toString(),
        total_assets: testFundInput.total_assets.toString(),
        management_fee: testFundInput.management_fee.toString(),
        description: testFundInput.description
      })
      .returning()
      .execute();

    const createdFund = insertResult[0];
    const result = await getFundById(createdFund.id);

    // Verify fund is returned with correct data
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdFund.id);
    expect(result!.name).toBe('Test Growth Fund');
    expect(result!.fund_type).toBe('equity');
    expect(result!.inception_date).toEqual(new Date('2020-01-01'));
    expect(result!.nav).toBe(125.75);
    expect(typeof result!.nav).toBe('number');
    expect(result!.total_assets).toBe(1000000.50);
    expect(typeof result!.total_assets).toBe('number');
    expect(result!.management_fee).toBe(0.0075);
    expect(typeof result!.management_fee).toBe('number');
    expect(result!.description).toBe('A test equity fund for growth-oriented investors');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when fund is not found', async () => {
    const result = await getFundById(999);
    expect(result).toBeNull();
  });

  it('should handle funds with null description', async () => {
    // Create fund without description
    const insertResult = await db.insert(fundsTable)
      .values({
        name: 'No Description Fund',
        fund_type: 'mixed',
        inception_date: new Date('2021-03-01'),
        nav: '100.00',
        total_assets: '750000.00',
        management_fee: '0.006',
        description: null
      })
      .returning()
      .execute();

    const createdFund = insertResult[0];
    const result = await getFundById(createdFund.id);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.name).toBe('No Description Fund');
    expect(result!.nav).toBe(100.00);
    expect(typeof result!.nav).toBe('number');
  });

  it('should handle high precision numeric values correctly', async () => {
    // Create fund with high precision values
    const insertResult = await db.insert(fundsTable)
      .values({
        name: 'Precision Fund',
        fund_type: 'alternative',
        inception_date: new Date('2022-01-01'),
        nav: '1234.5678', // High precision NAV
        total_assets: '9876543.21',
        management_fee: '0.1234', // High precision fee
        description: 'High precision test fund'
      })
      .returning()
      .execute();

    const createdFund = insertResult[0];
    const result = await getFundById(createdFund.id);

    expect(result).not.toBeNull();
    expect(result!.nav).toBe(1234.5678);
    expect(result!.total_assets).toBe(9876543.21);
    expect(result!.management_fee).toBe(0.1234);
    expect(typeof result!.nav).toBe('number');
    expect(typeof result!.total_assets).toBe('number');
    expect(typeof result!.management_fee).toBe('number');
  });

  it('should handle different fund types correctly', async () => {
    // Create multiple funds with different types
    const funds = [
      {
        name: 'Equity Fund',
        fund_type: 'equity' as const,
        nav: '150.00'
      },
      {
        name: 'Fixed Income Fund',
        fund_type: 'fixed_income' as const,
        nav: '95.50'
      },
      {
        name: 'Mixed Fund',
        fund_type: 'mixed' as const,
        nav: '110.25'
      },
      {
        name: 'Alternative Fund',
        fund_type: 'alternative' as const,
        nav: '200.75'
      }
    ];

    const createdFunds = [];
    for (const fundData of funds) {
      const insertResult = await db.insert(fundsTable)
        .values({
          name: fundData.name,
          fund_type: fundData.fund_type,
          inception_date: new Date('2023-01-01'),
          nav: fundData.nav,
          total_assets: '1000000.00',
          management_fee: '0.01',
          description: `Test ${fundData.fund_type} fund`
        })
        .returning()
        .execute();
      createdFunds.push(insertResult[0]);
    }

    // Verify each fund type
    for (let i = 0; i < createdFunds.length; i++) {
      const result = await getFundById(createdFunds[i].id);
      expect(result).not.toBeNull();
      expect(result!.fund_type).toBe(funds[i].fund_type);
      expect(result!.name).toBe(funds[i].name);
      expect(result!.nav).toBe(parseFloat(funds[i].nav));
    }
  });

  it('should return the correct fund when multiple funds exist', async () => {
    // Create multiple funds
    const fund1Result = await db.insert(fundsTable)
      .values({
        name: testFundInput.name,
        fund_type: testFundInput.fund_type,
        inception_date: testFundInput.inception_date,
        nav: testFundInput.nav.toString(),
        total_assets: testFundInput.total_assets.toString(),
        management_fee: testFundInput.management_fee.toString(),
        description: testFundInput.description
      })
      .returning()
      .execute();

    const fund2Result = await db.insert(fundsTable)
      .values({
        name: testFundInput2.name,
        fund_type: testFundInput2.fund_type,
        inception_date: testFundInput2.inception_date,
        nav: testFundInput2.nav.toString(),
        total_assets: testFundInput2.total_assets.toString(),
        management_fee: testFundInput2.management_fee.toString(),
        description: testFundInput2.description
      })
      .returning()
      .execute();

    const fund1 = fund1Result[0];
    const fund2 = fund2Result[0];

    // Verify we get the correct fund for each ID
    const result1 = await getFundById(fund1.id);
    const result2 = await getFundById(fund2.id);

    expect(result1).not.toBeNull();
    expect(result1!.id).toBe(fund1.id);
    expect(result1!.name).toBe('Test Growth Fund');
    expect(result1!.fund_type).toBe('equity');

    expect(result2).not.toBeNull();
    expect(result2!.id).toBe(fund2.id);
    expect(result2!.name).toBe('Test Bond Fund');
    expect(result2!.fund_type).toBe('fixed_income');
  });
});