import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { fundsTable, portfoliosTable, investorsTable } from '../db/schema';
import { type CreateFundInput, type CreateInvestorInput, type CreatePortfolioInput } from '../schema';
import { deleteFund } from '../handlers/delete_fund';
import { eq } from 'drizzle-orm';

// Test data
const testFund: CreateFundInput = {
  name: 'Test Equity Fund',
  fund_type: 'equity',
  inception_date: new Date('2023-01-01'),
  nav: 100.5,
  total_assets: 1000000.00,
  management_fee: 0.0125,
  description: 'A test fund for deletion testing'
};

const testInvestor: CreateInvestorInput = {
  name: 'Test Investor',
  email: 'test@investor.com',
  investor_type: 'individual',
  total_invested: 50000.00,
  phone: '555-0123',
  address: '123 Test St'
};

describe('deleteFund', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing fund successfully', async () => {
    // Create a test fund
    const fundResult = await db.insert(fundsTable)
      .values({
        name: testFund.name,
        fund_type: testFund.fund_type,
        inception_date: testFund.inception_date,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString(),
        description: testFund.description
      })
      .returning()
      .execute();

    const fundId = fundResult[0].id;

    // Delete the fund
    const result = await deleteFund(fundId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the fund no longer exists in database
    const remainingFunds = await db.select()
      .from(fundsTable)
      .where(eq(fundsTable.id, fundId))
      .execute();

    expect(remainingFunds).toHaveLength(0);
  });

  it('should return false for non-existent fund', async () => {
    const nonExistentId = 99999;
    
    const result = await deleteFund(nonExistentId);
    
    expect(result).toBe(false);
  });

  it('should throw error when fund has associated portfolios', async () => {
    // Create a test fund
    const fundResult = await db.insert(fundsTable)
      .values({
        name: testFund.name,
        fund_type: testFund.fund_type,
        inception_date: testFund.inception_date,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString(),
        description: testFund.description
      })
      .returning()
      .execute();

    const fundId = fundResult[0].id;

    // Create a test investor
    const investorResult = await db.insert(investorsTable)
      .values({
        name: testInvestor.name,
        email: testInvestor.email,
        investor_type: testInvestor.investor_type,
        total_invested: testInvestor.total_invested.toString(),
        phone: testInvestor.phone,
        address: testInvestor.address
      })
      .returning()
      .execute();

    const investorId = investorResult[0].id;

    // Create a portfolio that references the fund
    const testPortfolio: CreatePortfolioInput = {
      name: 'Test Portfolio',
      investor_id: investorId,
      fund_id: fundId,
      total_value: 25000.00,
      cash_balance: 1000.00,
      performance: 5.75
    };

    await db.insert(portfoliosTable)
      .values({
        name: testPortfolio.name,
        investor_id: testPortfolio.investor_id,
        fund_id: testPortfolio.fund_id,
        total_value: testPortfolio.total_value.toString(),
        cash_balance: testPortfolio.cash_balance.toString(),
        performance: testPortfolio.performance.toString()
      })
      .execute();

    // Attempt to delete the fund should throw an error
    await expect(deleteFund(fundId)).rejects.toThrow(/cannot delete fund.*portfolio/i);

    // Verify the fund still exists in database
    const remainingFunds = await db.select()
      .from(fundsTable)
      .where(eq(fundsTable.id, fundId))
      .execute();

    expect(remainingFunds).toHaveLength(1);
    expect(remainingFunds[0].name).toEqual(testFund.name);
  });

  it('should handle multiple portfolios constraint error correctly', async () => {
    // Create a test fund
    const fundResult = await db.insert(fundsTable)
      .values({
        name: testFund.name,
        fund_type: testFund.fund_type,
        inception_date: testFund.inception_date,
        nav: testFund.nav.toString(),
        total_assets: testFund.total_assets.toString(),
        management_fee: testFund.management_fee.toString(),
        description: testFund.description
      })
      .returning()
      .execute();

    const fundId = fundResult[0].id;

    // Create a test investor
    const investorResult = await db.insert(investorsTable)
      .values({
        name: testInvestor.name,
        email: testInvestor.email,
        investor_type: testInvestor.investor_type,
        total_invested: testInvestor.total_invested.toString(),
        phone: testInvestor.phone,
        address: testInvestor.address
      })
      .returning()
      .execute();

    const investorId = investorResult[0].id;

    // Create multiple portfolios that reference the fund
    await db.insert(portfoliosTable)
      .values([
        {
          name: 'Test Portfolio 1',
          investor_id: investorId,
          fund_id: fundId,
          total_value: '25000.00',
          cash_balance: '1000.00',
          performance: '5.75'
        },
        {
          name: 'Test Portfolio 2',
          investor_id: investorId,
          fund_id: fundId,
          total_value: '30000.00',
          cash_balance: '2000.00',
          performance: '6.25'
        }
      ])
      .execute();

    // Attempt to delete the fund should throw an error mentioning multiple portfolios
    await expect(deleteFund(fundId)).rejects.toThrow(/2 portfolio\(s\) are still associated/i);
  });

  it('should handle database errors properly', async () => {
    // Test with invalid ID type that could cause database errors
    const invalidId = -1;
    
    const result = await deleteFund(invalidId);
    
    // Should return false for invalid ID (fund doesn't exist)
    expect(result).toBe(false);
  });
});