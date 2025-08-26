import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable, portfoliosTable, investorsTable, fundsTable } from '../db/schema';
import { type CreateAssetInput } from '../schema';
import { getAssets } from '../handlers/get_assets';

describe('getAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no assets exist', async () => {
    const result = await getAssets();
    expect(result).toEqual([]);
  });

  it('should fetch all assets and convert numeric fields', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor@test.com',
        investor_type: 'individual',
        total_invested: '100000.00'
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Test Fund',
        fund_type: 'equity',
        inception_date: new Date('2023-01-01'),
        nav: '150.5000',
        total_assets: '50000000.00',
        management_fee: '0.0150'
      })
      .returning()
      .execute();

    const portfolio = await db.insert(portfoliosTable)
      .values({
        name: 'Test Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '75000.00',
        cash_balance: '5000.00',
        performance: '12.5000'
      })
      .returning()
      .execute();

    // Create test assets
    const testAssets = [
      {
        portfolio_id: portfolio[0].id,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        asset_type: 'stock' as const,
        quantity: '100.500000',
        unit_price: '150.2500',
        market_value: '15100.13',
        cost_basis: '14500.00',
        purchase_date: new Date('2023-06-01')
      },
      {
        portfolio_id: portfolio[0].id,
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        asset_type: 'stock' as const,
        quantity: '25.000000',
        unit_price: '2750.7500',
        market_value: '68768.75',
        cost_basis: '65000.00',
        purchase_date: new Date('2023-07-15')
      }
    ];

    await db.insert(assetsTable)
      .values(testAssets)
      .execute();

    // Fetch assets using handler
    const result = await getAssets();

    // Verify results
    expect(result).toHaveLength(2);

    // Check first asset
    const apple = result.find(asset => asset.symbol === 'AAPL');
    expect(apple).toBeDefined();
    expect(apple!.name).toEqual('Apple Inc.');
    expect(apple!.asset_type).toEqual('stock');
    expect(apple!.portfolio_id).toEqual(portfolio[0].id);
    expect(typeof apple!.quantity).toBe('number');
    expect(apple!.quantity).toEqual(100.5);
    expect(typeof apple!.unit_price).toBe('number');
    expect(apple!.unit_price).toEqual(150.25);
    expect(typeof apple!.market_value).toBe('number');
    expect(apple!.market_value).toEqual(15100.13);
    expect(typeof apple!.cost_basis).toBe('number');
    expect(apple!.cost_basis).toEqual(14500.00);
    expect(apple!.purchase_date).toBeInstanceOf(Date);
    expect(apple!.created_at).toBeInstanceOf(Date);
    expect(apple!.updated_at).toBeInstanceOf(Date);

    // Check second asset
    const google = result.find(asset => asset.symbol === 'GOOGL');
    expect(google).toBeDefined();
    expect(google!.name).toEqual('Alphabet Inc.');
    expect(google!.asset_type).toEqual('stock');
    expect(typeof google!.quantity).toBe('number');
    expect(google!.quantity).toEqual(25);
    expect(typeof google!.unit_price).toBe('number');
    expect(google!.unit_price).toEqual(2750.75);
    expect(typeof google!.market_value).toBe('number');
    expect(google!.market_value).toEqual(68768.75);
    expect(typeof google!.cost_basis).toBe('number');
    expect(google!.cost_basis).toEqual(65000.00);
  });

  it('should handle various asset types', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Test Investor',
        email: 'investor2@test.com',
        investor_type: 'institutional',
        total_invested: '1000000.00'
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Mixed Fund',
        fund_type: 'mixed',
        inception_date: new Date('2022-01-01'),
        nav: '200.0000',
        total_assets: '100000000.00',
        management_fee: '0.0200'
      })
      .returning()
      .execute();

    const portfolio = await db.insert(portfoliosTable)
      .values({
        name: 'Diversified Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '150000.00',
        cash_balance: '10000.00',
        performance: '8.7500'
      })
      .returning()
      .execute();

    // Create assets with different types
    const diversifiedAssets = [
      {
        portfolio_id: portfolio[0].id,
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF',
        asset_type: 'etf' as const,
        quantity: '50.000000',
        unit_price: '450.0000',
        market_value: '22500.00',
        cost_basis: '22000.00',
        purchase_date: new Date('2023-01-15')
      },
      {
        portfolio_id: portfolio[0].id,
        symbol: 'TLT',
        name: 'Treasury Bond ETF',
        asset_type: 'bond' as const,
        quantity: '100.000000',
        unit_price: '95.5000',
        market_value: '9550.00',
        cost_basis: '10000.00',
        purchase_date: new Date('2023-02-01')
      },
      {
        portfolio_id: portfolio[0].id,
        symbol: 'GLD',
        name: 'Gold ETF',
        asset_type: 'commodity' as const,
        quantity: '25.000000',
        unit_price: '180.2500',
        market_value: '4506.25',
        cost_basis: '4500.00',
        purchase_date: new Date('2023-03-10')
      }
    ];

    await db.insert(assetsTable)
      .values(diversifiedAssets)
      .execute();

    // Fetch and verify assets
    const result = await getAssets();

    expect(result).toHaveLength(3);

    // Verify different asset types are handled correctly
    const etf = result.find(asset => asset.asset_type === 'etf');
    const bond = result.find(asset => asset.asset_type === 'bond');
    const commodity = result.find(asset => asset.asset_type === 'commodity');

    expect(etf).toBeDefined();
    expect(etf!.symbol).toEqual('SPY');
    expect(typeof etf!.unit_price).toBe('number');
    expect(etf!.unit_price).toEqual(450);

    expect(bond).toBeDefined();
    expect(bond!.symbol).toEqual('TLT');
    expect(typeof bond!.unit_price).toBe('number');
    expect(bond!.unit_price).toEqual(95.5);

    expect(commodity).toBeDefined();
    expect(commodity!.symbol).toEqual('GLD');
    expect(typeof commodity!.market_value).toBe('number');
    expect(commodity!.market_value).toEqual(4506.25);
  });

  it('should handle precision in numeric fields correctly', async () => {
    // Create prerequisite data
    const investor = await db.insert(investorsTable)
      .values({
        name: 'Precision Investor',
        email: 'precision@test.com',
        investor_type: 'individual',
        total_invested: '50000.00'
      })
      .returning()
      .execute();

    const fund = await db.insert(fundsTable)
      .values({
        name: 'Precision Fund',
        fund_type: 'equity',
        inception_date: new Date('2023-01-01'),
        nav: '100.0000',
        total_assets: '25000000.00',
        management_fee: '0.0100'
      })
      .returning()
      .execute();

    const portfolio = await db.insert(portfoliosTable)
      .values({
        name: 'Precision Portfolio',
        investor_id: investor[0].id,
        fund_id: fund[0].id,
        total_value: '30000.00',
        cash_balance: '2000.00',
        performance: '15.2345'
      })
      .returning()
      .execute();

    // Create asset with high precision values
    await db.insert(assetsTable)
      .values({
        portfolio_id: portfolio[0].id,
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        asset_type: 'stock',
        quantity: '12.123456',  // 6 decimal places
        unit_price: '234.5678',  // 4 decimal places
        market_value: '2842.98',  // 2 decimal places
        cost_basis: '2800.00',
        purchase_date: new Date('2023-05-15')
      })
      .execute();

    const result = await getAssets();

    expect(result).toHaveLength(1);
    const tesla = result[0];

    // Verify precision is maintained after conversion
    expect(typeof tesla.quantity).toBe('number');
    expect(tesla.quantity).toEqual(12.123456);
    expect(typeof tesla.unit_price).toBe('number');
    expect(tesla.unit_price).toEqual(234.5678);
    expect(typeof tesla.market_value).toBe('number');
    expect(tesla.market_value).toEqual(2842.98);
    expect(typeof tesla.cost_basis).toBe('number');
    expect(tesla.cost_basis).toEqual(2800);
  });
});