import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { portfoliosTable, investorsTable, fundsTable } from '../db/schema';
import { type CreatePortfolioInput } from '../schema';
import { createPortfolio } from '../handlers/create_portfolio';
import { eq } from 'drizzle-orm';

// Test data for prerequisites
const testInvestor = {
  name: 'Test Investor',
  email: 'test@investor.com',
  investor_type: 'individual' as const,
  total_invested: 50000,
  phone: '+1234567890',
  address: '123 Test Street'
};

const testFund = {
  name: 'Test Fund',
  fund_type: 'equity' as const,
  inception_date: new Date('2023-01-01'),
  nav: 100.50,
  total_assets: 1000000,
  management_fee: 0.0150,
  description: 'A test equity fund'
};

// Simple test input
const testInput: CreatePortfolioInput = {
  name: 'Test Portfolio',
  investor_id: 1, // Will be set in tests after creating investor
  fund_id: 1, // Will be set in tests after creating fund
  total_value: 25000.75,
  cash_balance: 5000.25,
  performance: 8.5
};

describe('createPortfolio', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a portfolio', async () => {
    // Create prerequisite investor
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    // Create prerequisite fund
    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const portfolioInput = {
      ...testInput,
      investor_id: investorResult[0].id,
      fund_id: fundResult[0].id
    };

    const result = await createPortfolio(portfolioInput);

    // Basic field validation
    expect(result.name).toEqual('Test Portfolio');
    expect(result.investor_id).toEqual(investorResult[0].id);
    expect(result.fund_id).toEqual(fundResult[0].id);
    expect(result.total_value).toEqual(25000.75);
    expect(result.cash_balance).toEqual(5000.25);
    expect(result.performance).toEqual(8.5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.total_value).toBe('number');
    expect(typeof result.cash_balance).toBe('number');
    expect(typeof result.performance).toBe('number');
  });

  it('should save portfolio to database', async () => {
    // Create prerequisite investor
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    // Create prerequisite fund
    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const portfolioInput = {
      ...testInput,
      investor_id: investorResult[0].id,
      fund_id: fundResult[0].id
    };

    const result = await createPortfolio(portfolioInput);

    // Query using proper drizzle syntax
    const portfolios = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, result.id))
      .execute();

    expect(portfolios).toHaveLength(1);
    expect(portfolios[0].name).toEqual('Test Portfolio');
    expect(portfolios[0].investor_id).toEqual(investorResult[0].id);
    expect(portfolios[0].fund_id).toEqual(fundResult[0].id);
    expect(parseFloat(portfolios[0].total_value)).toEqual(25000.75);
    expect(parseFloat(portfolios[0].cash_balance)).toEqual(5000.25);
    expect(parseFloat(portfolios[0].performance)).toEqual(8.5);
    expect(portfolios[0].created_at).toBeInstanceOf(Date);
    expect(portfolios[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when investor does not exist', async () => {
    // Create prerequisite fund only
    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const portfolioInput = {
      ...testInput,
      investor_id: 999, // Non-existent investor ID
      fund_id: fundResult[0].id
    };

    expect(createPortfolio(portfolioInput)).rejects.toThrow(/investor with id 999 does not exist/i);
  });

  it('should throw error when fund does not exist', async () => {
    // Create prerequisite investor only
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const portfolioInput = {
      ...testInput,
      investor_id: investorResult[0].id,
      fund_id: 999 // Non-existent fund ID
    };

    expect(createPortfolio(portfolioInput)).rejects.toThrow(/fund with id 999 does not exist/i);
  });

  it('should handle zero performance correctly', async () => {
    // Create prerequisite investor
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    // Create prerequisite fund
    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const portfolioInput = {
      ...testInput,
      investor_id: investorResult[0].id,
      fund_id: fundResult[0].id,
      performance: 0
    };

    const result = await createPortfolio(portfolioInput);

    expect(result.performance).toEqual(0);
    expect(typeof result.performance).toBe('number');
  });

  it('should handle negative performance correctly', async () => {
    // Create prerequisite investor
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    // Create prerequisite fund
    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const portfolioInput = {
      ...testInput,
      investor_id: investorResult[0].id,
      fund_id: fundResult[0].id,
      performance: -2.5
    };

    const result = await createPortfolio(portfolioInput);

    expect(result.performance).toEqual(-2.5);
    expect(typeof result.performance).toBe('number');
  });
});