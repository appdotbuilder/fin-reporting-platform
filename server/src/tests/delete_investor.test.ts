import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investorsTable, portfoliosTable, fundsTable } from '../db/schema';
import { type CreateInvestorInput, type CreatePortfolioInput, type CreateFundInput } from '../schema';
import { deleteInvestor } from '../handlers/delete_investor';
import { eq } from 'drizzle-orm';

// Test data
const testInvestor: CreateInvestorInput = {
  name: 'Test Investor',
  email: 'test@example.com',
  investor_type: 'individual',
  total_invested: 10000.00,
  phone: '+1234567890',
  address: '123 Test St, Test City, TC 12345'
};

const testFund: CreateFundInput = {
  name: 'Test Fund',
  fund_type: 'equity',
  inception_date: new Date('2023-01-01'),
  nav: 100.00,
  total_assets: 1000000.00,
  management_fee: 0.02,
  description: 'Test fund for testing'
};

describe('deleteInvestor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing investor successfully', async () => {
    // Create test investor
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const investorId = investorResult[0].id;

    // Delete the investor
    const result = await deleteInvestor(investorId);

    expect(result).toBe(true);

    // Verify investor was deleted
    const deletedInvestor = await db.select()
      .from(investorsTable)
      .where(eq(investorsTable.id, investorId))
      .execute();

    expect(deletedInvestor).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent investor', async () => {
    const nonExistentId = 999;

    const result = await deleteInvestor(nonExistentId);

    expect(result).toBe(false);
  });

  it('should throw error when investor has associated portfolios', async () => {
    // Create test fund first
    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const fundId = fundResult[0].id;

    // Create test investor
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const investorId = investorResult[0].id;

    // Create test portfolio for the investor
    const testPortfolio: CreatePortfolioInput = {
      name: 'Test Portfolio',
      investor_id: investorId,
      fund_id: fundId,
      total_value: 5000.00,
      cash_balance: 1000.00,
      performance: 5.25
    };

    await db.insert(portfoliosTable)
      .values({
        ...testPortfolio,
        total_value: testPortfolio.total_value.toString(),
        cash_balance: testPortfolio.cash_balance.toString(),
        performance: testPortfolio.performance.toString()
      })
      .execute();

    // Try to delete the investor - should throw error
    await expect(deleteInvestor(investorId)).rejects.toThrow(/Cannot delete investor with ID.*has.*associated portfolio/i);

    // Verify investor still exists
    const existingInvestor = await db.select()
      .from(investorsTable)
      .where(eq(investorsTable.id, investorId))
      .execute();

    expect(existingInvestor).toHaveLength(1);
  });

  it('should handle multiple portfolios constraint error', async () => {
    // Create test fund first
    const fundResult = await db.insert(fundsTable)
      .values({
        ...testFund,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString()
      })
      .returning()
      .execute();

    const fundId = fundResult[0].id;

    // Create test investor
    const investorResult = await db.insert(investorsTable)
      .values({
        ...testInvestor,
        total_invested: testInvestor.total_invested.toString()
      })
      .returning()
      .execute();

    const investorId = investorResult[0].id;

    // Create multiple test portfolios for the investor
    const portfolio1: CreatePortfolioInput = {
      name: 'Test Portfolio 1',
      investor_id: investorId,
      fund_id: fundId,
      total_value: 5000.00,
      cash_balance: 1000.00,
      performance: 5.25
    };

    const portfolio2: CreatePortfolioInput = {
      name: 'Test Portfolio 2',
      investor_id: investorId,
      fund_id: fundId,
      total_value: 3000.00,
      cash_balance: 500.00,
      performance: 3.75
    };

    await db.insert(portfoliosTable)
      .values([
        {
          ...portfolio1,
          total_value: portfolio1.total_value.toString(),
          cash_balance: portfolio1.cash_balance.toString(),
          performance: portfolio1.performance.toString()
        },
        {
          ...portfolio2,
          total_value: portfolio2.total_value.toString(),
          cash_balance: portfolio2.cash_balance.toString(),
          performance: portfolio2.performance.toString()
        }
      ])
      .execute();

    // Try to delete the investor - should mention multiple portfolios
    await expect(deleteInvestor(investorId)).rejects.toThrow(/Cannot delete investor with ID.*has 2 associated portfolio/i);
  });

  it('should handle edge case with zero ID', async () => {
    // Test with zero ID which should return false (doesn't exist)
    const result = await deleteInvestor(0);
    expect(result).toBe(false);
  });

  it('should validate that investor exists before checking constraints', async () => {
    // First verify the database is clean
    const allInvestors = await db.select().from(investorsTable).execute();
    const allPortfolios = await db.select().from(portfoliosTable).execute();
    
    expect(allInvestors).toHaveLength(0);
    expect(allPortfolios).toHaveLength(0);
    
    // This test ensures we return false for non-existent investors
    // rather than throwing an error about portfolios
    const nonExistentId = 999999;

    const result = await deleteInvestor(nonExistentId);

    expect(result).toBe(false);
  });
});