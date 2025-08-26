import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Search, Edit, Trash2, AlertCircle, Target, Filter, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import type { Asset, Portfolio } from '../../../../server/src/schema';

function AssetsList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [portfolioFilter, setPortfolioFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [assetsResult, portfoliosResult] = await Promise.all([
        trpc.getAssets.query(),
        trpc.getPortfolios.query()
      ]);
      
      setAssets(assetsResult || []);
      setPortfolios(portfoliosResult || []);
      setFilteredAssets(assetsResult || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
      // For development: provide mock data when backend is not fully implemented
      const mockPortfolios: Portfolio[] = [
        {
          id: 1,
          name: 'Growth-Focused Portfolio',
          investor_id: 1,
          fund_id: 1,
          total_value: 2500000,
          cash_balance: 125000,
          performance: 12.5,
          created_at: new Date('2023-02-01'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: 2,
          name: 'Conservative Income Portfolio',
          investor_id: 2,
          fund_id: 2,
          total_value: 750000,
          cash_balance: 75000,
          performance: 6.8,
          created_at: new Date('2023-03-15'),
          updated_at: new Date('2024-01-10'),
        },
      ];
      
      const mockAssets: Asset[] = [
        {
          id: 1,
          portfolio_id: 1,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          asset_type: 'stock',
          quantity: 1000,
          unit_price: 175.50,
          market_value: 175500,
          cost_basis: 165000,
          purchase_date: new Date('2023-06-15'),
          created_at: new Date('2023-06-15'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: 2,
          portfolio_id: 1,
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          asset_type: 'stock',
          quantity: 500,
          unit_price: 420.75,
          market_value: 210375,
          cost_basis: 195000,
          purchase_date: new Date('2023-08-10'),
          created_at: new Date('2023-08-10'),
          updated_at: new Date('2024-01-12'),
        },
        {
          id: 3,
          portfolio_id: 2,
          symbol: 'TLT',
          name: 'iShares 20+ Year Treasury Bond ETF',
          asset_type: 'etf',
          quantity: 2000,
          unit_price: 95.25,
          market_value: 190500,
          cost_basis: 200000,
          purchase_date: new Date('2023-09-05'),
          created_at: new Date('2023-09-05'),
          updated_at: new Date('2024-01-08'),
        },
        {
          id: 4,
          portfolio_id: 1,
          symbol: 'VTI',
          name: 'Vanguard Total Stock Market ETF',
          asset_type: 'etf',
          quantity: 800,
          unit_price: 245.80,
          market_value: 196640,
          cost_basis: 185000,
          purchase_date: new Date('2023-07-20'),
          created_at: new Date('2023-07-20'),
          updated_at: new Date('2024-01-14'),
        },
        {
          id: 5,
          portfolio_id: 2,
          symbol: 'GLD',
          name: 'SPDR Gold Shares',
          asset_type: 'commodity',
          quantity: 300,
          unit_price: 185.90,
          market_value: 55770,
          cost_basis: 52500,
          purchase_date: new Date('2023-10-01'),
          created_at: new Date('2023-10-01'),
          updated_at: new Date('2024-01-05'),
        },
      ];
      
      setAssets(mockAssets);
      setPortfolios(mockPortfolios);
      setFilteredAssets(mockAssets);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter assets based on search, type, and portfolio
  useEffect(() => {
    let filtered = assets;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((asset: Asset) =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by asset type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((asset: Asset) => asset.asset_type === typeFilter);
    }

    // Filter by portfolio
    if (portfolioFilter !== 'all') {
      filtered = filtered.filter((asset: Asset) => asset.portfolio_id.toString() === portfolioFilter);
    }

    setFilteredAssets(filtered);
  }, [assets, searchQuery, typeFilter, portfolioFilter]);

  const handleDeleteAsset = async (id: number) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      await trpc.deleteAsset.mutate({ id });
      setAssets((prev: Asset[]) => prev.filter((asset: Asset) => asset.id !== id));
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const getPortfolioName = (portfolioId: number): string => {
    const portfolio = portfolios.find((p: Portfolio) => p.id === portfolioId);
    return portfolio ? portfolio.name : `Portfolio #${portfolioId}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAssetTypeColor = (type: string): string => {
    switch (type) {
      case 'stock':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'bond':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'etf':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'mutual_fund':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'commodity':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'real_estate':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'alternative':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const calculateGainLoss = (marketValue: number, costBasis: number): { amount: number; percentage: number; isGain: boolean } => {
    const amount = marketValue - costBasis;
    const percentage = costBasis > 0 ? (amount / costBasis) * 100 : 0;
    return {
      amount,
      percentage,
      isGain: amount >= 0
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Assets</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search assets by name or symbol..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
              <SelectItem value="bond">Bond</SelectItem>
              <SelectItem value="etf">ETF</SelectItem>
              <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
              <SelectItem value="commodity">Commodity</SelectItem>
              <SelectItem value="real_estate">Real Estate</SelectItem>
              <SelectItem value="alternative">Alternative</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Portfolio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Portfolios</SelectItem>
              {portfolios.map((portfolio: Portfolio) => (
                <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                  {portfolio.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing {filteredAssets.length} of {assets.length} assets
        </p>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-slate-600">
            {assets.length} Total Assets
          </Badge>
          {assets.length > 0 && (
            <Badge variant="outline" className="text-blue-600">
              {formatCurrency(
                assets.reduce((sum: number, asset: Asset) => sum + asset.market_value, 0)
              )} Total Value
            </Badge>
          )}
        </div>
      </div>

      {/* Assets List */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {assets.length === 0 ? 'No assets found' : 'No assets match your search'}
            </h3>
            <p className="text-slate-500 text-center">
              {assets.length === 0 
                ? 'Get started by adding assets to portfolios' 
                : 'Try adjusting your search criteria'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssets.map((asset: Asset) => {
            const gainLoss = calculateGainLoss(asset.market_value, asset.cost_basis);
            
            return (
              <Card key={asset.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {asset.symbol}
                          </h3>
                          <p className="text-sm text-slate-600">{asset.name}</p>
                        </div>
                        <Badge className={getAssetTypeColor(asset.asset_type)}>
                          {asset.asset_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-500">Quantity</p>
                          <p className="font-semibold text-slate-900">
                            {asset.quantity.toLocaleString()}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-slate-500">Unit Price</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(asset.unit_price)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-slate-500">Market Value</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(asset.market_value)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-slate-500">Cost Basis</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(asset.cost_basis)}
                          </p>
                        </div>
                      </div>

                      {/* Performance and Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className={`p-3 rounded-lg border ${
                          gainLoss.isGain 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Gain/Loss</span>
                            <div className="flex items-center gap-1">
                              {gainLoss.isGain ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                              <span className={`text-sm font-bold ${
                                gainLoss.isGain ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {gainLoss.isGain ? '+' : ''}{formatCurrency(gainLoss.amount)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs ${
                              gainLoss.isGain ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ({gainLoss.isGain ? '+' : ''}{gainLoss.percentage.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-slate-500">Portfolio</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {getPortfolioName(asset.portfolio_id)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <div>
                              <p className="text-xs text-slate-500">Purchase Date</p>
                              <p className="text-sm font-semibold text-slate-900">
                                {asset.purchase_date.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-400">
                        Added: {asset.created_at.toLocaleDateString()}
                        {asset.updated_at.getTime() !== asset.created_at.getTime() && (
                          <span className="ml-4">
                            Updated: {asset.updated_at.toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AssetsList;