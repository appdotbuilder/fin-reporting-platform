import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investorsTable, fundsTable, portfoliosTable, assetsTable } from '../db/schema';
import { getAssetsByPortfolio } from '../handlers/get_assets_by_portfolio';

describe('getAssetsByPortfolio', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return assets for a specific portfolio', async () => {
    // Create prerequisite data
    const [investor] = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor@test.com',
        investor_type: 'individual',
        total_invested: '10000.00'
      })
      .returning()
      .execute();

    const [fund] = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date(),
        nav: '100.0000',
        total_assets: '1000000.00',
        management_fee: '0.0150'
      })
      .returning()
      .execute();

    const [portfolio] = await db.insert(portfoliosTable)
      .values({
        name: 'Test Portfolio',
        investor_id: investor.id,
        fund_id: fund.id,
        total_value: '5000.00',
        cash_balance: '1000.00',
        performance: '8.5000'
      })
      .returning()
      .execute();

    // Create assets for the portfolio
    await db.insert(assetsTable)
      .values([
        {
          portfolio_id: portfolio.id,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          asset_type: 'stock',
          quantity: '10.500000',
          unit_price: '150.2500',
          market_value: '1577.63',
          cost_basis: '1500.00',
          purchase_date: new Date('2024-01-01')
        },
        {
          portfolio_id: portfolio.id,
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          asset_type: 'stock',
          quantity: '5.000000',
          unit_price: '2800.7500',
          market_value: '14003.75',
          cost_basis: '13500.00',
          purchase_date: new Date('2024-01-15')
        }
      ])
      .execute();

    const result = await getAssetsByPortfolio(portfolio.id);

    // Should return both assets
    expect(result).toHaveLength(2);
    
    // Verify first asset
    const appleAsset = result.find(asset => asset.symbol === 'AAPL');
    expect(appleAsset).toBeDefined();
    expect(appleAsset!.name).toEqual('Apple Inc.');
    expect(appleAsset!.asset_type).toEqual('stock');
    expect(appleAsset!.quantity).toEqual(10.5);
    expect(typeof appleAsset!.quantity).toBe('number');
    expect(appleAsset!.unit_price).toEqual(150.25);
    expect(typeof appleAsset!.unit_price).toBe('number');
    expect(appleAsset!.market_value).toEqual(1577.63);
    expect(typeof appleAsset!.market_value).toBe('number');
    expect(appleAsset!.cost_basis).toEqual(1500);
    expect(typeof appleAsset!.cost_basis).toBe('number');

    // Verify second asset
    const googleAsset = result.find(asset => asset.symbol === 'GOOGL');
    expect(googleAsset).toBeDefined();
    expect(googleAsset!.name).toEqual('Alphabet Inc.');
    expect(googleAsset!.quantity).toEqual(5);
    expect(googleAsset!.unit_price).toEqual(2800.75);
    expect(googleAsset!.market_value).toEqual(14003.75);
    expect(googleAsset!.cost_basis).toEqual(13500);
  });

  it('should return empty array for portfolio with no assets', async () => {
    // Create prerequisite data
    const [investor] = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor@test.com',
        investor_type: 'individual',
        total_invested: '10000.00'
      })
      .returning()
      .execute();

    const [fund] = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date(),
        nav: '100.0000',
        total_assets: '1000000.00',
        management_fee: '0.0150'
      })
      .returning()
      .execute();

    const [portfolio] = await db.insert(portfoliosTable)
      .values({
        name: 'Empty Portfolio',
        investor_id: investor.id,
        fund_id: fund.id,
        total_value: '0.00',
        cash_balance: '1000.00',
        performance: '0.0000'
      })
      .returning()
      .execute();

    const result = await getAssetsByPortfolio(portfolio.id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent portfolio', async () => {
    const result = await getAssetsByPortfolio(99999);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return only assets for the specified portfolio', async () => {
    // Create prerequisite data
    const [investor] = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor@test.com',
        investor_type: 'individual',
        total_invested: '20000.00'
      })
      .returning()
      .execute();

    const [fund] = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date(),
        nav: '100.0000',
        total_assets: '1000000.00',
        management_fee: '0.0150'
      })
      .returning()
      .execute();

    // Create two portfolios
    const portfolios = await db.insert(portfoliosTable)
      .values([
        {
          name: 'Portfolio 1',
          investor_id: investor.id,
          fund_id: fund.id,
          total_value: '5000.00',
          cash_balance: '1000.00',
          performance: '8.5000'
        },
        {
          name: 'Portfolio 2',
          investor_id: investor.id,
          fund_id: fund.id,
          total_value: '7000.00',
          cash_balance: '1500.00',
          performance: '12.3000'
        }
      ])
      .returning()
      .execute();

    const [portfolio1, portfolio2] = portfolios;

    // Create assets for both portfolios
    await db.insert(assetsTable)
      .values([
        {
          portfolio_id: portfolio1.id,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          asset_type: 'stock',
          quantity: '10.000000',
          unit_price: '150.0000',
          market_value: '1500.00',
          cost_basis: '1400.00',
          purchase_date: new Date('2024-01-01')
        },
        {
          portfolio_id: portfolio2.id,
          symbol: 'MSFT',
          name: 'Microsoft Corp.',
          asset_type: 'stock',
          quantity: '20.000000',
          unit_price: '300.0000',
          market_value: '6000.00',
          cost_basis: '5800.00',
          purchase_date: new Date('2024-01-02')
        },
        {
          portfolio_id: portfolio2.id,
          symbol: 'TSLA',
          name: 'Tesla Inc.',
          asset_type: 'stock',
          quantity: '5.000000',
          unit_price: '200.0000',
          market_value: '1000.00',
          cost_basis: '950.00',
          purchase_date: new Date('2024-01-03')
        }
      ])
      .execute();

    // Get assets for portfolio1
    const result1 = await getAssetsByPortfolio(portfolio1.id);
    expect(result1).toHaveLength(1);
    expect(result1[0].symbol).toEqual('AAPL');
    expect(result1[0].portfolio_id).toEqual(portfolio1.id);

    // Get assets for portfolio2
    const result2 = await getAssetsByPortfolio(portfolio2.id);
    expect(result2).toHaveLength(2);
    const symbols = result2.map(asset => asset.symbol).sort();
    expect(symbols).toEqual(['MSFT', 'TSLA']);
    result2.forEach(asset => {
      expect(asset.portfolio_id).toEqual(portfolio2.id);
    });
  });

  it('should handle different asset types correctly', async () => {
    // Create prerequisite data
    const [investor] = await db.insert(investorsTable)
      .values({
        name: 'Diversified Investor',
        email: 'diversified@test.com',
        investor_type: 'institutional',
        total_invested: '50000.00'
      })
      .returning()
      .execute();

    const [fund] = await db.insert(fundsTable)
      .values({
        name: 'Mixed Fund',
        fund_type: 'mixed',
        inception_date: new Date(),
        nav: '105.5000',
        total_assets: '5000000.00',
        management_fee: '0.0125'
      })
      .returning()
      .execute();

    const [portfolio] = await db.insert(portfoliosTable)
      .values({
        name: 'Diversified Portfolio',
        investor_id: investor.id,
        fund_id: fund.id,
        total_value: '45000.00',
        cash_balance: '5000.00',
        performance: '15.2500'
      })
      .returning()
      .execute();

    // Create assets of different types
    await db.insert(assetsTable)
      .values([
        {
          portfolio_id: portfolio.id,
          symbol: 'SPY',
          name: 'SPDR S&P 500 ETF',
          asset_type: 'etf',
          quantity: '50.000000',
          unit_price: '400.0000',
          market_value: '20000.00',
          cost_basis: '19500.00',
          purchase_date: new Date('2024-01-01')
        },
        {
          portfolio_id: portfolio.id,
          symbol: 'GOVT',
          name: 'iShares U.S. Treasury Bond ETF',
          asset_type: 'bond',
          quantity: '100.000000',
          unit_price: '25.5000',
          market_value: '2550.00',
          cost_basis: '2500.00',
          purchase_date: new Date('2024-01-15')
        },
        {
          portfolio_id: portfolio.id,
          symbol: 'VTSAX',
          name: 'Vanguard Total Stock Market',
          asset_type: 'mutual_fund',
          quantity: '200.000000',
          unit_price: '110.0000',
          market_value: '22000.00',
          cost_basis: '21000.00',
          purchase_date: new Date('2024-02-01')
        }
      ])
      .execute();

    const result = await getAssetsByPortfolio(portfolio.id);

    expect(result).toHaveLength(3);

    // Verify asset types are preserved
    const etf = result.find(asset => asset.asset_type === 'etf');
    expect(etf).toBeDefined();
    expect(etf!.symbol).toEqual('SPY');

    const bond = result.find(asset => asset.asset_type === 'bond');
    expect(bond).toBeDefined();
    expect(bond!.symbol).toEqual('GOVT');

    const mutualFund = result.find(asset => asset.asset_type === 'mutual_fund');
    expect(mutualFund).toBeDefined();
    expect(mutualFund!.symbol).toEqual('VTSAX');

    // Verify all numeric conversions
    result.forEach(asset => {
      expect(typeof asset.quantity).toBe('number');
      expect(typeof asset.unit_price).toBe('number');
      expect(typeof asset.market_value).toBe('number');
      expect(typeof asset.cost_basis).toBe('number');
    });
  });
});