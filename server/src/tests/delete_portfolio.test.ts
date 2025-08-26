import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { portfoliosTable, assetsTable, investorsTable, fundsTable } from '../db/schema';
import { deletePortfolio } from '../handlers/delete_portfolio';
import { eq } from 'drizzle-orm';

describe('deletePortfolio', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a portfolio successfully', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        investor_type: 'individual',
        total_invested: '50000.00',
        phone: '123-456-7890',
        address: '123 Main St',
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date('2020-01-01'),
        nav: '100.0000',
        total_assets: '1000000.00',
        management_fee: '0.0150',
        description: 'A test fund',
      })
      .returning()
      .execute();

    const portfolio = await db.insert(portfoliosTable)
      .values({
        name: 'Test Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '25000.00',
        cash_balance: '5000.00',
        performance: '8.5000',
      })
      .returning()
      .execute();

    const result = await deletePortfolio(portfolio[0].id);

    expect(result).toBe(true);

    // Verify portfolio was deleted from database
    const portfolios = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio[0].id))
      .execute();

    expect(portfolios).toHaveLength(0);
  });

  it('should delete portfolio and associated assets', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Jane Smith',
        email: 'jane@example.com',
        investor_type: 'institutional',
        total_invested: '100000.00',
        phone: '987-654-3210',
        address: '456 Oak Ave',
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Growth Fund',
        fund_type: 'equity',
        inception_date: new Date('2019-06-15'),
        nav: '125.5000',
        total_assets: '5000000.00',
        management_fee: '0.0200',
        description: 'Growth-focused fund',
      })
      .returning()
      .execute();

    const portfolio = await db.insert(portfoliosTable)
      .values({
        name: 'Growth Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '75000.00',
        cash_balance: '10000.00',
        performance: '12.3000',
      })
      .returning()
      .execute();

    // Create assets associated with the portfolio
    await db.insert(assetsTable)
      .values([
        {
          portfolio_id: portfolio[0].id,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          asset_type: 'stock',
          quantity: '100.000000',
          unit_price: '150.0000',
          market_value: '15000.00',
          cost_basis: '14000.00',
          purchase_date: new Date('2023-01-15'),
        },
        {
          portfolio_id: portfolio[0].id,
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          asset_type: 'stock',
          quantity: '50.000000',
          unit_price: '2500.0000',
          market_value: '125000.00',
          cost_basis: '120000.00',
          purchase_date: new Date('2023-02-01'),
        }
      ])
      .execute();

    const result = await deletePortfolio(portfolio[0].id);

    expect(result).toBe(true);

    // Verify portfolio was deleted
    const portfolios = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio[0].id))
      .execute();

    expect(portfolios).toHaveLength(0);

    // Verify associated assets were deleted
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.portfolio_id, portfolio[0].id))
      .execute();

    expect(assets).toHaveLength(0);
  });

  it('should return false when portfolio does not exist', async () => {
    const nonExistentId = 99999;

    const result = await deletePortfolio(nonExistentId);

    expect(result).toBe(false);
  });

  it('should not affect other portfolios when deleting one', async () => {
    // Create prerequisite data
    const investor1 = await db.insert(investorsTable)
      .values({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        investor_type: 'individual',
        total_invested: '30000.00',
      })
      .returning()
      .execute();

    const investor2 = await db.insert(investorsTable)
      .values({
        name: 'Bob Wilson',
        email: 'bob@example.com',
        investor_type: 'individual',
        total_invested: '40000.00',
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Balanced Fund',
        fund_type: 'mixed',
        inception_date: new Date('2021-03-01'),
        nav: '110.0000',
        total_assets: '2000000.00',
        management_fee: '0.0100',
      })
      .returning()
      .execute();

    const portfolio1 = await db.insert(portfoliosTable)
      .values({
        name: 'Portfolio 1',
        investor_id: investor1[0].id,
        fund_id: fund[0].id,
        total_value: '15000.00',
        cash_balance: '2000.00',
        performance: '6.5000',
      })
      .returning()
      .execute();

    const portfolio2 = await db.insert(portfoliosTable)
      .values({
        name: 'Portfolio 2',
        investor_id: investor2[0].id,
        fund_id: fund[0].id,
        total_value: '20000.00',
        cash_balance: '3000.00',
        performance: '7.2000',
      })
      .returning()
      .execute();

    // Delete first portfolio
    const result = await deletePortfolio(portfolio1[0].id);

    expect(result).toBe(true);

    // Verify first portfolio was deleted
    const deletedPortfolios = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio1[0].id))
      .execute();

    expect(deletedPortfolios).toHaveLength(0);

    // Verify second portfolio still exists
    const remainingPortfolios = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio2[0].id))
      .execute();

    expect(remainingPortfolios).toHaveLength(1);
    expect(remainingPortfolios[0].name).toBe('Portfolio 2');
  });

  it('should handle deletion of portfolio with no assets', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        investor_type: 'individual',
        total_invested: '10000.00',
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Conservative Fund',
        fund_type: 'fixed_income',
        inception_date: new Date('2022-01-01'),
        nav: '105.0000',
        total_assets: '500000.00',
        management_fee: '0.0075',
      })
      .returning()
      .execute();

    const portfolio = await db.insert(portfoliosTable)
      .values({
        name: 'Empty Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '0.00',
        cash_balance: '10000.00',
        performance: '0.0000',
      })
      .returning()
      .execute();

    const result = await deletePortfolio(portfolio[0].id);

    expect(result).toBe(true);

    // Verify portfolio was deleted
    const portfolios = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio[0].id))
      .execute();

    expect(portfolios).toHaveLength(0);
  });
});