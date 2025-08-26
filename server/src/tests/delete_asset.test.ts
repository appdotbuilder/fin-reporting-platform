import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investorsTable, fundsTable, portfoliosTable, assetsTable } from '../db/schema';
import { deleteAsset } from '../handlers/delete_asset';
import { eq, sum } from 'drizzle-orm';

describe('deleteAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an asset and update portfolio total value', async () => {
    // Create test investor
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor@test.com',
        investor_type: 'individual',
        total_invested: '10000.00'
      })
      .returning()
      .execute();

    // Create test fund
    const fund = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date('2023-01-01'),
        nav: '100.0000',
        total_assets: '1000000.00',
        management_fee: '0.0150'
      })
      .returning()
      .execute();

    // Create test portfolio
    const portfolio = await db.insert(portfoliosTable)
      .values({
        name: 'Test Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '15000.00', // Will be updated after asset deletion
        cash_balance: '1000.00',
        performance: '5.5000'
      })
      .returning()
      .execute();

    // Create test assets
    const asset1 = await db.insert(assetsTable)
      .values({
        portfolio_id: portfolio[0].id,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        asset_type: 'stock',
        quantity: '10.000000',
        unit_price: '150.0000',
        market_value: '1500.00',
        cost_basis: '1400.00',
        purchase_date: new Date('2023-01-01')
      })
      .returning()
      .execute();

    const asset2 = await db.insert(assetsTable)
      .values({
        portfolio_id: portfolio[0].id,
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        asset_type: 'stock',
        quantity: '5.000000',
        unit_price: '2700.0000',
        market_value: '13500.00',
        cost_basis: '13000.00',
        purchase_date: new Date('2023-02-01')
      })
      .returning()
      .execute();

    // Delete the first asset
    const result = await deleteAsset(asset1[0].id);

    expect(result).toBe(true);

    // Verify asset was deleted
    const deletedAsset = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, asset1[0].id))
      .execute();

    expect(deletedAsset).toHaveLength(0);

    // Verify second asset still exists
    const remainingAssets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.portfolio_id, portfolio[0].id))
      .execute();

    expect(remainingAssets).toHaveLength(1);
    expect(remainingAssets[0].symbol).toBe('GOOGL');

    // Verify portfolio total_value was updated
    const updatedPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio[0].id))
      .execute();

    expect(parseFloat(updatedPortfolio[0].total_value)).toBe(13500.00);
    expect(updatedPortfolio[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return false for non-existent asset', async () => {
    const result = await deleteAsset(99999);

    expect(result).toBe(false);
  });

  it('should handle portfolio with no remaining assets', async () => {
    // Create test investor
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor2@test.com',
        investor_type: 'individual',
        total_invested: '5000.00'
      })
      .returning()
      .execute();

    // Create test fund
    const fund = await db.insert(fundsTable)
      .values({
        name: 'Test Fund 2',
        fund_type: 'fixed_income',
        inception_date: new Date('2023-01-01'),
        nav: '95.5000',
        total_assets: '500000.00',
        management_fee: '0.0075'
      })
      .returning()
      .execute();

    // Create test portfolio
    const portfolio = await db.insert(portfoliosTable)
      .values({
        name: 'Single Asset Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '5000.00',
        cash_balance: '0.00',
        performance: '2.5000'
      })
      .returning()
      .execute();

    // Create single test asset
    const asset = await db.insert(assetsTable)
      .values({
        portfolio_id: portfolio[0].id,
        symbol: 'BOND',
        name: 'Government Bond',
        asset_type: 'bond',
        quantity: '50.000000',
        unit_price: '100.0000',
        market_value: '5000.00',
        cost_basis: '5000.00',
        purchase_date: new Date('2023-03-01')
      })
      .returning()
      .execute();

    // Delete the only asset
    const result = await deleteAsset(asset[0].id);

    expect(result).toBe(true);

    // Verify asset was deleted
    const remainingAssets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.portfolio_id, portfolio[0].id))
      .execute();

    expect(remainingAssets).toHaveLength(0);

    // Verify portfolio total_value was set to 0
    const updatedPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio[0].id))
      .execute();

    expect(parseFloat(updatedPortfolio[0].total_value)).toBe(0);
  });

  it('should handle multiple assets and calculate correct total value', async () => {
    // Create test investor
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Multi Asset Investor',
        email: 'multi@test.com',
        investor_type: 'institutional',
        total_invested: '100000.00'
      })
      .returning()
      .execute();

    // Create test fund
    const fund = await db.insert(fundsTable)
      .values({
        name: 'Diversified Fund',
        fund_type: 'mixed',
        inception_date: new Date('2023-01-01'),
        nav: '110.2500',
        total_assets: '10000000.00',
        management_fee: '0.0100'
      })
      .returning()
      .execute();

    // Create test portfolio
    const portfolio = await db.insert(portfoliosTable)
      .values({
        name: 'Diversified Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '50000.00',
        cash_balance: '5000.00',
        performance: '8.2500'
      })
      .returning()
      .execute();

    // Create multiple test assets
    const assets = await db.insert(assetsTable)
      .values([
        {
          portfolio_id: portfolio[0].id,
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          asset_type: 'stock',
          quantity: '25.000000',
          unit_price: '300.0000',
          market_value: '7500.00',
          cost_basis: '7000.00',
          purchase_date: new Date('2023-01-15')
        },
        {
          portfolio_id: portfolio[0].id,
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          asset_type: 'stock',
          quantity: '50.000000',
          unit_price: '200.0000',
          market_value: '10000.00',
          cost_basis: '9500.00',
          purchase_date: new Date('2023-02-15')
        },
        {
          portfolio_id: portfolio[0].id,
          symbol: 'SPY',
          name: 'SPDR S&P 500 ETF',
          asset_type: 'etf',
          quantity: '80.000000',
          unit_price: '400.0000',
          market_value: '32000.00',
          cost_basis: '31000.00',
          purchase_date: new Date('2023-03-15')
        }
      ])
      .returning()
      .execute();

    // Delete the middle asset (TSLA)
    const result = await deleteAsset(assets[1].id);

    expect(result).toBe(true);

    // Verify correct asset was deleted
    const remainingAssets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.portfolio_id, portfolio[0].id))
      .execute();

    expect(remainingAssets).toHaveLength(2);
    const symbols = remainingAssets.map(a => a.symbol).sort();
    expect(symbols).toEqual(['MSFT', 'SPY']);

    // Verify portfolio total_value is correct (7500 + 32000 = 39500)
    const updatedPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio[0].id))
      .execute();

    expect(parseFloat(updatedPortfolio[0].total_value)).toBe(39500.00);
  });

  it('should verify numeric field conversions', async () => {
    // Create test data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Numeric Test Investor',
        email: 'numeric@test.com',
        investor_type: 'individual',
        total_invested: '25000.00'
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Numeric Test Fund',
        fund_type: 'equity',
        inception_date: new Date('2023-01-01'),
        nav: '125.7500',
        total_assets: '2500000.00',
        management_fee: '0.0125'
      })
      .returning()
      .execute();

    const portfolio = await db.insert(portfoliosTable)
      .values({
        name: 'Numeric Test Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '25000.00',
        cash_balance: '2500.00',
        performance: '7.2500'
      })
      .returning()
      .execute();

    const asset = await db.insert(assetsTable)
      .values({
        portfolio_id: portfolio[0].id,
        symbol: 'TEST',
        name: 'Test Asset',
        asset_type: 'stock',
        quantity: '15.500000',
        unit_price: '125.7500',
        market_value: '1949.13',
        cost_basis: '1900.00',
        purchase_date: new Date('2023-04-01')
      })
      .returning()
      .execute();

    // Delete the asset
    const result = await deleteAsset(asset[0].id);

    expect(result).toBe(true);

    // Verify numeric conversions in the result
    const updatedPortfolio = await db.select()
      .from(portfoliosTable)
      .where(eq(portfoliosTable.id, portfolio[0].id))
      .execute();

    expect(typeof updatedPortfolio[0].total_value).toBe('string'); // Database stores as string
    expect(parseFloat(updatedPortfolio[0].total_value)).toBe(0); // But converts to correct number
  });
});