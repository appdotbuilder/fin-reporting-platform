import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investorsTable } from '../db/schema';
import { type UpdateInvestorInput, type CreateInvestorInput } from '../schema';
import { updateInvestor } from '../handlers/update_investor';
import { eq } from 'drizzle-orm';

// Helper function to create test investor
const createTestInvestor = async (data?: Partial<CreateInvestorInput>) => {
  const testData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    investor_type: 'individual' as const,
    total_invested: 50000,
    phone: '+1234567890',
    address: '123 Test St, Test City, TC 12345',
    ...data
  };

  const result = await db.insert(investorsTable)
    .values({
      ...testData,
      total_invested: testData.total_invested.toString()
    })
    .returning()
    .execute();

  return {
    ...result[0],
    total_invested: parseFloat(result[0].total_invested)
  };
};

describe('updateInvestor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update investor basic fields', async () => {
    // Create test investor
    const investor = await createTestInvestor();

    const updateInput: UpdateInvestorInput = {
      id: investor.id,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      investor_type: 'institutional'
    };

    const result = await updateInvestor(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(investor.id);
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.email).toEqual('jane.smith@example.com');
    expect(result!.investor_type).toEqual('institutional');
    expect(result!.total_invested).toEqual(investor.total_invested);
    expect(result!.phone).toEqual(investor.phone);
    expect(result!.address).toEqual(investor.address);
    expect(result!.created_at).toEqual(investor.created_at);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(investor.updated_at.getTime());
  });

  it('should update investor financial information', async () => {
    // Create test investor
    const investor = await createTestInvestor();

    const updateInput: UpdateInvestorInput = {
      id: investor.id,
      total_invested: 75000.50
    };

    const result = await updateInvestor(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(investor.id);
    expect(result!.total_invested).toEqual(75000.50);
    expect(typeof result!.total_invested).toBe('number');
    expect(result!.name).toEqual(investor.name);
    expect(result!.email).toEqual(investor.email);
    expect(result!.investor_type).toEqual(investor.investor_type);
  });

  it('should update investor contact information', async () => {
    // Create test investor
    const investor = await createTestInvestor();

    const updateInput: UpdateInvestorInput = {
      id: investor.id,
      phone: '+9876543210',
      address: '456 New Ave, New City, NC 54321'
    };

    const result = await updateInvestor(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(investor.id);
    expect(result!.phone).toEqual('+9876543210');
    expect(result!.address).toEqual('456 New Ave, New City, NC 54321');
    expect(result!.name).toEqual(investor.name);
    expect(result!.email).toEqual(investor.email);
  });

  it('should update investor with nullable fields set to null', async () => {
    // Create test investor with contact info
    const investor = await createTestInvestor();

    const updateInput: UpdateInvestorInput = {
      id: investor.id,
      phone: null,
      address: null
    };

    const result = await updateInvestor(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(investor.id);
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.name).toEqual(investor.name);
    expect(result!.email).toEqual(investor.email);
  });

  it('should update all fields at once', async () => {
    // Create test investor
    const investor = await createTestInvestor();

    const updateInput: UpdateInvestorInput = {
      id: investor.id,
      name: 'Updated Name',
      email: 'updated@example.com',
      investor_type: 'institutional',
      total_invested: 100000,
      phone: '+5555555555',
      address: '789 Updated Blvd, Updated City, UC 98765'
    };

    const result = await updateInvestor(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(investor.id);
    expect(result!.name).toEqual('Updated Name');
    expect(result!.email).toEqual('updated@example.com');
    expect(result!.investor_type).toEqual('institutional');
    expect(result!.total_invested).toEqual(100000);
    expect(result!.phone).toEqual('+5555555555');
    expect(result!.address).toEqual('789 Updated Blvd, Updated City, UC 98765');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent investor', async () => {
    const updateInput: UpdateInvestorInput = {
      id: 999999, // Non-existent ID
      name: 'Non-existent Investor'
    };

    const result = await updateInvestor(updateInput);

    expect(result).toBeNull();
  });

  it('should save updated investor to database', async () => {
    // Create test investor
    const investor = await createTestInvestor();

    const updateInput: UpdateInvestorInput = {
      id: investor.id,
      name: 'Database Updated Name',
      total_invested: 60000
    };

    await updateInvestor(updateInput);

    // Query database directly to verify update
    const dbInvestors = await db.select()
      .from(investorsTable)
      .where(eq(investorsTable.id, investor.id))
      .execute();

    expect(dbInvestors).toHaveLength(1);
    expect(dbInvestors[0].name).toEqual('Database Updated Name');
    expect(parseFloat(dbInvestors[0].total_invested)).toEqual(60000);
    expect(dbInvestors[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle partial updates correctly', async () => {
    // Create test investor
    const investor = await createTestInvestor();

    // Only update email
    const updateInput: UpdateInvestorInput = {
      id: investor.id,
      email: 'partialy.updated@example.com'
    };

    const result = await updateInvestor(updateInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('partialy.updated@example.com');
    // Other fields should remain unchanged
    expect(result!.name).toEqual(investor.name);
    expect(result!.investor_type).toEqual(investor.investor_type);
    expect(result!.total_invested).toEqual(investor.total_invested);
    expect(result!.phone).toEqual(investor.phone);
    expect(result!.address).toEqual(investor.address);
  });

  it('should handle zero total_invested correctly', async () => {
    // Create test investor
    const investor = await createTestInvestor();

    const updateInput: UpdateInvestorInput = {
      id: investor.id,
      total_invested: 0
    };

    const result = await updateInvestor(updateInput);

    expect(result).not.toBeNull();
    expect(result!.total_invested).toEqual(0);
    expect(typeof result!.total_invested).toBe('number');
  });

  it('should handle large total_invested amounts', async () => {
    // Create test investor
    const investor = await createTestInvestor();

    const updateInput: UpdateInvestorInput = {
      id: investor.id,
      total_invested: 999999999.99
    };

    const result = await updateInvestor(updateInput);

    expect(result).not.toBeNull();
    expect(result!.total_invested).toEqual(999999999.99);
    expect(typeof result!.total_invested).toBe('number');
  });
});