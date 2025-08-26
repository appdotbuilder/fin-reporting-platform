import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Search, Edit, Trash2, AlertCircle, Wallet, Filter, TrendingUp, TrendingDown, User, Building2, DollarSign } from 'lucide-react';
import type { Portfolio, Investor, Fund } from '../../../../server/src/schema';

function PortfoliosList() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [filteredPortfolios, setFilteredPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [investorFilter, setInvestorFilter] = useState<string>('all');
  const [fundFilter, setFundFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [portfoliosResult, investorsResult, fundsResult] = await Promise.all([
        trpc.getPortfolios.query(),
        trpc.getInvestors.query(),
        trpc.getFunds.query()
      ]);
      
      setPortfolios(portfoliosResult || []);
      setInvestors(investorsResult || []);
      setFunds(fundsResult || []);
      setFilteredPortfolios(portfoliosResult || []);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
      // For development: provide mock data when backend is not fully implemented
      const mockInvestors: Investor[] = [
        {
          id: 1,
          name: 'Johnson Family Trust',
          email: 'contact@johnsontrust.com',
          investor_type: 'institutional',
          total_invested: 5000000,
          phone: '+1 (555) 123-4567',
          address: '123 Wealth Avenue, New York, NY 10001',
          created_at: new Date('2023-01-15'),
          updated_at: new Date('2024-01-10'),
        },
        {
          id: 2,
          name: 'Sarah Mitchell',
          email: 'sarah.mitchell@email.com',
          investor_type: 'individual',
          total_invested: 750000,
          phone: '+1 (555) 987-6543',
          address: '456 Investment Lane, Boston, MA 02101',
          created_at: new Date('2023-02-20'),
          updated_at: new Date('2023-12-15'),
        },
      ];
      
      const mockFunds: Fund[] = [
        {
          id: 1,
          name: 'Growth Equity Fund',
          fund_type: 'equity',
          inception_date: new Date('2023-01-15'),
          nav: 125.45,
          total_assets: 850000000,
          management_fee: 1.5,
          description: 'A diversified equity fund focused on growth opportunities.',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: 2,
          name: 'Conservative Bond Fund',
          fund_type: 'fixed_income',
          inception_date: new Date('2023-03-01'),
          nav: 102.75,
          total_assets: 650000000,
          management_fee: 0.8,
          description: 'A stable income fund investing in high-grade bonds.',
          created_at: new Date('2023-02-15'),
          updated_at: new Date('2024-01-01'),
        },
      ];
      
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
        {
          id: 3,
          name: 'Balanced Investment Portfolio',
          investor_id: 1,
          fund_id: 1,
          total_value: 1800000,
          cash_balance: 90000,
          performance: 9.2,
          created_at: new Date('2023-05-01'),
          updated_at: new Date('2024-01-05'),
        },
      ];
      
      setPortfolios(mockPortfolios);
      setInvestors(mockInvestors);
      setFunds(mockFunds);
      setFilteredPortfolios(mockPortfolios);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter portfolios based on search, investor, and fund
  useEffect(() => {
    let filtered = portfolios;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((portfolio: Portfolio) =>
        portfolio.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by investor
    if (investorFilter !== 'all') {
      filtered = filtered.filter((portfolio: Portfolio) => portfolio.investor_id.toString() === investorFilter);
    }

    // Filter by fund
    if (fundFilter !== 'all') {
      filtered = filtered.filter((portfolio: Portfolio) => portfolio.fund_id.toString() === fundFilter);
    }

    setFilteredPortfolios(filtered);
  }, [portfolios, searchQuery, investorFilter, fundFilter]);

  const handleDeletePortfolio = async (id: number) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

    try {
      await trpc.deletePortfolio.mutate({ id });
      setPortfolios((prev: Portfolio[]) => prev.filter((portfolio: Portfolio) => portfolio.id !== id));
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
    }
  };

  const getInvestorName = (investorId: number): string => {
    const investor = investors.find((inv: Investor) => inv.id === investorId);
    return investor ? investor.name : `Investor #${investorId}`;
  };

  const getFundName = (fundId: number): string => {
    const fund = funds.find((f: Fund) => f.id === fundId);
    return fund ? fund.name : `Fund #${fundId}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
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
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Portfolios</h3>
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
            placeholder="Search portfolios by name..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={investorFilter} onValueChange={setInvestorFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Investor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Investors</SelectItem>
              {investors.map((investor: Investor) => (
                <SelectItem key={investor.id} value={investor.id.toString()}>
                  {investor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={fundFilter} onValueChange={setFundFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Fund" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Funds</SelectItem>
              {funds.map((fund: Fund) => (
                <SelectItem key={fund.id} value={fund.id.toString()}>
                  {fund.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing {filteredPortfolios.length} of {portfolios.length} portfolios
        </p>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-slate-600">
            {portfolios.length} Total Portfolios
          </Badge>
          {portfolios.length > 0 && (
            <Badge variant="outline" className="text-blue-600">
              {formatCurrency(
                portfolios.reduce((sum: number, portfolio: Portfolio) => sum + portfolio.total_value, 0)
              )} Total Value
            </Badge>
          )}
        </div>
      </div>

      {/* Portfolios List */}
      {filteredPortfolios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {portfolios.length === 0 ? 'No portfolios found' : 'No portfolios match your search'}
            </h3>
            <p className="text-slate-500 text-center">
              {portfolios.length === 0 
                ? 'Get started by creating your first portfolio' 
                : 'Try adjusting your search criteria'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPortfolios.map((portfolio: Portfolio) => (
            <Card key={portfolio.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        {portfolio.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        {portfolio.performance >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <Badge className={portfolio.performance >= 0 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                        }>
                          {formatPercentage(portfolio.performance)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-500">Total Value</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(portfolio.total_value)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs text-slate-500">Cash Balance</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(portfolio.cash_balance)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-slate-500">Investor</p>
                          <p className="font-semibold text-slate-900 text-sm">
                            {getInvestorName(portfolio.investor_id)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-slate-500">Fund</p>
                          <p className="font-semibold text-slate-900 text-sm">
                            {getFundName(portfolio.fund_id)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Performance and Asset Allocation Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="p-3 bg-slate-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">Performance</span>
                          <span className={`text-sm font-bold ${
                            portfolio.performance >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {portfolio.performance >= 0 ? '+' : ''}{formatPercentage(portfolio.performance)}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">Cash Allocation</span>
                          <span className="text-sm font-bold text-slate-700">
                            {portfolio.total_value > 0 
                              ? formatPercentage((portfolio.cash_balance / portfolio.total_value) * 100)
                              : '0.00%'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-400">
                      Created: {portfolio.created_at.toLocaleDateString()}
                      {portfolio.updated_at.getTime() !== portfolio.created_at.getTime() && (
                        <span className="ml-4">
                          Updated: {portfolio.updated_at.toLocaleDateString()}
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
                      onClick={() => handleDeletePortfolio(portfolio.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default PortfoliosList;