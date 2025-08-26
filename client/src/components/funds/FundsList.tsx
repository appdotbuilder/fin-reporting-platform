import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Search, Edit, Trash2, AlertCircle, TrendingUp, Filter, Calendar, DollarSign } from 'lucide-react';
import type { Fund } from '../../../../server/src/schema';

function FundsList() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [filteredFunds, setFilteredFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadFunds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getFunds.query();
      setFunds(result || []);
      setFilteredFunds(result || []);
    } catch (error) {
      console.error('Failed to load funds:', error);
      // For development: provide mock data when backend is not fully implemented
      const mockFunds: Fund[] = [
        {
          id: 1,
          name: 'Growth Equity Fund',
          fund_type: 'equity',
          inception_date: new Date('2023-01-15'),
          nav: 125.45,
          total_assets: 850000000,
          management_fee: 1.5,
          description: 'A diversified equity fund focused on growth opportunities in technology and healthcare sectors.',
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
          description: 'A stable income fund investing in high-grade corporate and government bonds.',
          created_at: new Date('2023-02-15'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: 3,
          name: 'Balanced Portfolio Fund',
          fund_type: 'mixed',
          inception_date: new Date('2022-09-01'),
          nav: 118.90,
          total_assets: 1200000000,
          management_fee: 1.2,
          description: 'A balanced approach combining equities and fixed income for moderate risk tolerance.',
          created_at: new Date('2022-08-15'),
          updated_at: new Date('2024-01-10'),
        },
      ];
      setFunds(mockFunds);
      setFilteredFunds(mockFunds);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFunds();
  }, [loadFunds]);

  // Filter funds based on search and type
  useEffect(() => {
    let filtered = funds;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((fund: Fund) =>
        fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fund.description && fund.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((fund: Fund) => fund.fund_type === typeFilter);
    }

    setFilteredFunds(filtered);
  }, [funds, searchQuery, typeFilter]);

  const handleDeleteFund = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fund?')) return;

    try {
      await trpc.deleteFund.mutate({ id });
      setFunds((prev: Fund[]) => prev.filter((fund: Fund) => fund.id !== id));
    } catch (error) {
      console.error('Failed to delete fund:', error);
    }
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

  const getFundTypeColor = (type: string): string => {
    switch (type) {
      case 'equity':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fixed_income':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'mixed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'alternative':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Funds</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadFunds} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search funds by name or description..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="fixed_income">Fixed Income</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="alternative">Alternative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing {filteredFunds.length} of {funds.length} funds
        </p>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-slate-600">
            {funds.length} Total Funds
          </Badge>
          {funds.length > 0 && (
            <Badge variant="outline" className="text-blue-600">
              {formatCurrency(
                funds.reduce((sum: number, fund: Fund) => sum + fund.total_assets, 0)
              )} Total AUM
            </Badge>
          )}
        </div>
      </div>

      {/* Funds List */}
      {filteredFunds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {funds.length === 0 ? 'No funds found' : 'No funds match your search'}
            </h3>
            <p className="text-slate-500 text-center">
              {funds.length === 0 
                ? 'Get started by creating your first fund' 
                : 'Try adjusting your search criteria'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFunds.map((fund: Fund) => (
            <Card key={fund.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-slate-900">
                        {fund.name}
                      </h3>
                      <Badge className={getFundTypeColor(fund.fund_type)}>
                        {fund.fund_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs text-slate-500">NAV</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(fund.nav)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-500">Total Assets</p>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(fund.total_assets)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500">Management Fee</p>
                        <p className="font-semibold text-slate-900">
                          {formatPercentage(fund.management_fee)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-slate-500">Inception</p>
                          <p className="font-semibold text-slate-900">
                            {fund.inception_date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {fund.description && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-600">
                          {fund.description}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-400">
                      Created: {fund.created_at.toLocaleDateString()}
                      {fund.updated_at.getTime() !== fund.created_at.getTime() && (
                        <span className="ml-4">
                          Updated: {fund.updated_at.toLocaleDateString()}
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
                      onClick={() => handleDeleteFund(fund.id)}
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

export default FundsList;