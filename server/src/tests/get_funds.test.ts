import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { fundsTable } from '../db/schema';
import { type CreateFundInput } from '../schema';
import { getFunds } from '../handlers/get_funds';

// Test fund data
const testFund1: CreateFundInput = {
  name: 'Growth Equity Fund',
  fund_type: 'equity',
  inception_date: new Date('2020-01-01'),
  nav: 125.75,
  total_assets: 50000000.00,
  management_fee: 0.0125,
  description: 'A fund focused on growth stocks'
};

const testFund2: CreateFundInput = {
  name: 'Bond Income Fund',
  fund_type: 'fixed_income',
  inception_date: new Date('2019-06-15'),
  nav: 98.50,
  total_assets: 25000000.00,
  management_fee: 0.0075,
  description: 'Conservative fixed income fund'
};

const testFund3: CreateFundInput = {
  name: 'Mixed Strategy Fund',
  fund_type: 'mixed',
  inception_date: new Date('2021-03-20'),
  nav: 110.25,
  total_assets: 75000000.00,
  management_fee: 0.0150,
  description: null
};

describe('getFunds', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no funds exist', async () => {
    const result = await getFunds();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should fetch all funds from database', async () => {
    // Insert test funds
    await db.insert(fundsTable).values([
      {
        ...testFund1,
        nav: testFund1.nav.toString(),
        total_assets: testFund1.total_assets.toString(),
        management_fee: testFund1.management_fee.toString()
      },
      {
        ...testFund2,
        nav: testFund2.nav.toString(),
        total_assets: testFund2.total_assets.toString(),
        management_fee: testFund2.management_fee.toString()
      },
      {
        ...testFund3,
        nav: testFund3.nav.toString(),
        total_assets: testFund3.total_assets.toString(),
        management_fee: testFund3.management_fee.toString()
      }
    ]).execute();

    const result = await getFunds();

    expect(result).toHaveLength(3);
    
    // Verify all funds are returned with proper field types
    const fund1 = result.find(f => f.name === 'Growth Equity Fund');
    expect(fund1).toBeDefined();
    expect(fund1!.fund_type).toEqual('equity');
    expect(fund1!.nav).toEqual(125.75);
    expect(typeof fund1!.nav).toBe('number');
    expect(fund1!.total_assets).toEqual(50000000.00);
    expect(typeof fund1!.total_assets).toBe('number');
    expect(fund1!.management_fee).toEqual(0.0125);
    expect(typeof fund1!.management_fee).toBe('number');
    expect(fund1!.description).toEqual('A fund focused on growth stocks');
    expect(fund1!.inception_date).toBeInstanceOf(Date);
    expect(fund1!.created_at).toBeInstanceOf(Date);
    expect(fund1!.updated_at).toBeInstanceOf(Date);
    expect(fund1!.id).toBeDefined();

    const fund2 = result.find(f => f.name === 'Bond Income Fund');
    expect(fund2).toBeDefined();
    expect(fund2!.fund_type).toEqual('fixed_income');
    expect(fund2!.nav).toEqual(98.50);
    expect(typeof fund2!.nav).toBe('number');
    expect(fund2!.total_assets).toEqual(25000000.00);
    expect(typeof fund2!.total_assets).toBe('number');
    expect(fund2!.management_fee).toEqual(0.0075);
    expect(typeof fund2!.management_fee).toBe('number');

    const fund3 = result.find(f => f.name === 'Mixed Strategy Fund');
    expect(fund3).toBeDefined();
    expect(fund3!.fund_type).toEqual('mixed');
    expect(fund3!.nav).toEqual(110.25);
    expect(typeof fund3!.nav).toBe('number');
    expect(fund3!.description).toBeNull();
  });

  it('should handle funds with different fund types', async () => {
    // Insert funds with all different types
    await db.insert(fundsTable).values([
      {
        name: 'Equity Fund',
        fund_type: 'equity',
        inception_date: new Date('2020-01-01'),
        nav: '100.00',
        total_assets: '1000000.00',
        management_fee: '0.0100',
        description: 'Equity fund'
      },
      {
        name: 'Fixed Income Fund',
        fund_type: 'fixed_income',
        inception_date: new Date('2020-01-01'),
        nav: '95.50',
        total_assets: '2000000.00',
        management_fee: '0.0075',
        description: 'Fixed income fund'
      },
      {
        name: 'Alternative Fund',
        fund_type: 'alternative',
        inception_date: new Date('2020-01-01'),
        nav: '150.25',
        total_assets: '500000.00',
        management_fee: '0.0200',
        description: 'Alternative investments'
      }
    ]).execute();

    const result = await getFunds();

    expect(result).toHaveLength(3);
    
    const fundTypes = result.map(f => f.fund_type);
    expect(fundTypes).toContain('equity');
    expect(fundTypes).toContain('fixed_income');
    expect(fundTypes).toContain('alternative');
  });

  it('should handle funds with high precision numeric values', async () => {
    // Test funds with precise decimal values
    await db.insert(fundsTable).values({
      name: 'Precision Fund',
      fund_type: 'mixed',
      inception_date: new Date('2020-01-01'),
      nav: '123.4567', // 4 decimal places
      total_assets: '12345678.99', // Large number with 2 decimals
      management_fee: '0.1234', // 4 decimal places
      description: 'High precision fund'
    }).execute();

    const result = await getFunds();

    expect(result).toHaveLength(1);
    expect(result[0].nav).toEqual(123.4567);
    expect(result[0].total_assets).toEqual(12345678.99);
    expect(result[0].management_fee).toEqual(0.1234);
    expect(typeof result[0].nav).toBe('number');
    expect(typeof result[0].total_assets).toBe('number');
    expect(typeof result[0].management_fee).toBe('number');
  });

  it('should return funds ordered by creation time', async () => {
    // Insert funds with slight delay to ensure different creation times
    await db.insert(fundsTable).values({
      name: 'First Fund',
      fund_type: 'equity',
      inception_date: new Date('2020-01-01'),
      nav: '100.00',
      total_assets: '1000000.00',
      management_fee: '0.0100',
      description: 'First fund'
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(fundsTable).values({
      name: 'Second Fund',
      fund_type: 'fixed_income',
      inception_date: new Date('2020-01-01'),
      nav: '95.00',
      total_assets: '2000000.00',
      management_fee: '0.0075',
      description: 'Second fund'
    }).execute();

    const result = await getFunds();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Fund');
    expect(result[1].name).toEqual('Second Fund');
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
  });
});