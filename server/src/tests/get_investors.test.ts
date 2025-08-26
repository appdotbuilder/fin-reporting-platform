import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investorsTable } from '../db/schema';
import { type CreateInvestorInput } from '../schema';
import { getInvestors } from '../handlers/get_investors';

// Test investor data
const testInvestors: CreateInvestorInput[] = [
  {
    name: 'John Smith',
    email: 'john.smith@email.com',
    investor_type: 'individual',
    total_invested: 50000.00,
    phone: '+1-555-0123',
    address: '123 Main St, New York, NY 10001'
  },
  {
    name: 'ABC Pension Fund',
    email: 'contact@abcpension.com',
    investor_type: 'institutional',
    total_invested: 2500000.75,
    phone: '+1-555-0456',
    address: '456 Corporate Blvd, Chicago, IL 60601'
  },
  {
    name: 'Jane Doe',
    email: 'jane.doe@email.com',
    investor_type: 'individual',
    total_invested: 0,
    phone: null,
    address: null
  }
];

describe('getInvestors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no investors exist', async () => {
    const result = await getInvestors();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all investors from database', async () => {
    // Create test investors
    await db.insert(investorsTable).values([
      {
        ...testInvestors[0],
        total_invested: testInvestors[0].total_invested.toString()
      },
      {
        ...testInvestors[1],
        total_invested: testInvestors[1].total_invested.toString()
      },
      {
        ...testInvestors[2],
        total_invested: testInvestors[2].total_invested.toString()
      }
    ]).execute();

    const result = await getInvestors();

    expect(result).toHaveLength(3);
    
    // Verify first investor
    const individual = result.find(inv => inv.email === 'john.smith@email.com');
    expect(individual).toBeDefined();
    expect(individual!.name).toEqual('John Smith');
    expect(individual!.investor_type).toEqual('individual');
    expect(individual!.total_invested).toEqual(50000.00);
    expect(typeof individual!.total_invested).toBe('number');
    expect(individual!.phone).toEqual('+1-555-0123');
    expect(individual!.address).toEqual('123 Main St, New York, NY 10001');

    // Verify institutional investor
    const institutional = result.find(inv => inv.email === 'contact@abcpension.com');
    expect(institutional).toBeDefined();
    expect(institutional!.name).toEqual('ABC Pension Fund');
    expect(institutional!.investor_type).toEqual('institutional');
    expect(institutional!.total_invested).toEqual(2500000.75);
    expect(typeof institutional!.total_invested).toBe('number');

    // Verify investor with null fields
    const nullFieldsInvestor = result.find(inv => inv.email === 'jane.doe@email.com');
    expect(nullFieldsInvestor).toBeDefined();
    expect(nullFieldsInvestor!.name).toEqual('Jane Doe');
    expect(nullFieldsInvestor!.total_invested).toEqual(0);
    expect(nullFieldsInvestor!.phone).toBeNull();
    expect(nullFieldsInvestor!.address).toBeNull();

    // Verify all investors have required fields
    result.forEach(investor => {
      expect(investor.id).toBeDefined();
      expect(typeof investor.id).toBe('number');
      expect(investor.created_at).toBeInstanceOf(Date);
      expect(investor.updated_at).toBeInstanceOf(Date);
      expect(investor.email).toContain('@');
      expect(['individual', 'institutional']).toContain(investor.investor_type);
    });
  });

  it('should handle large numbers correctly', async () => {
    // Create investor with large investment amount
    await db.insert(investorsTable).values({
      name: 'Big Investor Corp',
      email: 'big@investor.com',
      investor_type: 'institutional',
      total_invested: '999999999.99', // Large number as string
      phone: null,
      address: null
    }).execute();

    const result = await getInvestors();

    expect(result).toHaveLength(1);
    expect(result[0].total_invested).toEqual(999999999.99);
    expect(typeof result[0].total_invested).toBe('number');
  });

  it('should return investors in database insertion order', async () => {
    // Insert investors in specific order
    const orderedInvestors = [
      { ...testInvestors[0], total_invested: testInvestors[0].total_invested.toString() },
      { ...testInvestors[1], total_invested: testInvestors[1].total_invested.toString() },
      { ...testInvestors[2], total_invested: testInvestors[2].total_invested.toString() }
    ];

    for (const investor of orderedInvestors) {
      await db.insert(investorsTable).values(investor).execute();
    }

    const result = await getInvestors();

    expect(result).toHaveLength(3);
    // Verify order matches insertion order (by comparing emails)
    expect(result[0].email).toEqual('john.smith@email.com');
    expect(result[1].email).toEqual('contact@abcpension.com');
    expect(result[2].email).toEqual('jane.doe@email.com');
  });

  it('should handle decimal precision correctly', async () => {
    // Test various decimal amounts
    const precisionTests = [
      { email: 'test1@email.com', amount: '123.45' },
      { email: 'test2@email.com', amount: '0.01' },
      { email: 'test3@email.com', amount: '1000000.99' }
    ];

    for (const test of precisionTests) {
      await db.insert(investorsTable).values({
        name: 'Test Investor',
        email: test.email,
        investor_type: 'individual',
        total_invested: test.amount,
        phone: null,
        address: null
      }).execute();
    }

    const result = await getInvestors();

    expect(result).toHaveLength(3);
    
    const test1 = result.find(inv => inv.email === 'test1@email.com');
    expect(test1!.total_invested).toEqual(123.45);
    
    const test2 = result.find(inv => inv.email === 'test2@email.com');
    expect(test2!.total_invested).toEqual(0.01);
    
    const test3 = result.find(inv => inv.email === 'test3@email.com');
    expect(test3!.total_invested).toEqual(1000000.99);
  });
});