import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investorsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateInvestorInput } from '../schema';
import { getInvestorById } from '../handlers/get_investor_by_id';

const testInvestorData: CreateInvestorInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  investor_type: 'individual',
  total_invested: 50000.75,
  phone: '555-123-4567',
  address: '123 Main St, New York, NY 10001'
};

describe('getInvestorById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return investor when found by ID', async () => {
    // Create test investor
    const insertResult = await db.insert(investorsTable)
      .values({
        ...testInvestorData,
        total_invested: testInvestorData.total_invested.toString()
      })
      .returning()
      .execute();

    const investorId = insertResult[0].id;

    // Test the handler
    const result = await getInvestorById(investorId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(investorId);
    expect(result!.name).toEqual('John Doe');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.investor_type).toEqual('individual');
    expect(result!.total_invested).toEqual(50000.75);
    expect(typeof result!.total_invested).toBe('number');
    expect(result!.phone).toEqual('555-123-4567');
    expect(result!.address).toEqual('123 Main St, New York, NY 10001');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when investor not found', async () => {
    const nonExistentId = 99999;
    
    const result = await getInvestorById(nonExistentId);
    
    expect(result).toBeNull();
  });

  it('should handle institutional investor type correctly', async () => {
    const institutionalInvestorData: CreateInvestorInput = {
      name: 'ABC Investment Fund',
      email: 'contact@abcfund.com',
      investor_type: 'institutional',
      total_invested: 1000000.00,
      phone: '555-999-8888',
      address: '456 Wall Street, New York, NY 10005'
    };

    // Create institutional investor
    const insertResult = await db.insert(investorsTable)
      .values({
        ...institutionalInvestorData,
        total_invested: institutionalInvestorData.total_invested.toString()
      })
      .returning()
      .execute();

    const investorId = insertResult[0].id;

    // Test retrieval
    const result = await getInvestorById(investorId);

    expect(result).not.toBeNull();
    expect(result!.investor_type).toEqual('institutional');
    expect(result!.name).toEqual('ABC Investment Fund');
    expect(result!.total_invested).toEqual(1000000.00);
    expect(typeof result!.total_invested).toBe('number');
  });

  it('should handle investor with null optional fields', async () => {
    const minimalInvestorData: CreateInvestorInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      investor_type: 'individual',
      total_invested: 25000.50,
      phone: null,
      address: null
    };

    // Create investor with null optional fields
    const insertResult = await db.insert(investorsTable)
      .values({
        ...minimalInvestorData,
        total_invested: minimalInvestorData.total_invested.toString()
      })
      .returning()
      .execute();

    const investorId = insertResult[0].id;

    // Test retrieval
    const result = await getInvestorById(investorId);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.email).toEqual('jane.smith@example.com');
    expect(result!.total_invested).toEqual(25000.50);
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
  });

  it('should handle zero total_invested correctly', async () => {
    const newInvestorData: CreateInvestorInput = {
      name: 'New Investor',
      email: 'new@example.com',
      investor_type: 'individual',
      total_invested: 0.00,
      phone: '555-000-0000',
      address: '789 Empty St'
    };

    // Create investor with zero investment
    const insertResult = await db.insert(investorsTable)
      .values({
        ...newInvestorData,
        total_invested: newInvestorData.total_invested.toString()
      })
      .returning()
      .execute();

    const investorId = insertResult[0].id;

    // Test retrieval
    const result = await getInvestorById(investorId);

    expect(result).not.toBeNull();
    expect(result!.total_invested).toEqual(0.00);
    expect(typeof result!.total_invested).toBe('number');
  });

  it('should verify data consistency with database', async () => {
    // Create test investor
    const insertResult = await db.insert(investorsTable)
      .values({
        ...testInvestorData,
        total_invested: testInvestorData.total_invested.toString()
      })
      .returning()
      .execute();

    const investorId = insertResult[0].id;

    // Get investor using handler
    const handlerResult = await getInvestorById(investorId);

    // Get investor directly from database for comparison
    const dbResults = await db.select()
      .from(investorsTable)
      .where(eq(investorsTable.id, investorId))
      .execute();

    expect(handlerResult).not.toBeNull();
    expect(dbResults).toHaveLength(1);
    
    const dbInvestor = dbResults[0];
    
    // Verify all fields match
    expect(handlerResult!.id).toEqual(dbInvestor.id);
    expect(handlerResult!.name).toEqual(dbInvestor.name);
    expect(handlerResult!.email).toEqual(dbInvestor.email);
    expect(handlerResult!.investor_type).toEqual(dbInvestor.investor_type);
    expect(handlerResult!.total_invested).toEqual(parseFloat(dbInvestor.total_invested));
    expect(handlerResult!.phone).toEqual(dbInvestor.phone);
    expect(handlerResult!.address).toEqual(dbInvestor.address);
    expect(handlerResult!.created_at.getTime()).toEqual(dbInvestor.created_at.getTime());
    expect(handlerResult!.updated_at.getTime()).toEqual(dbInvestor.updated_at.getTime());
  });
});