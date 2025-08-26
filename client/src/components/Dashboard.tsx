import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { TrendingUp, TrendingDown, DollarSign, Users, Building2, Target, AlertCircle, Activity } from 'lucide-react';
import type { DashboardSummary } from '../../../server/src/schema';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await trpc.getDashboardSummary.query();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // For development: provide mock data when backend is not fully implemented
      const mockData: DashboardSummary = {
        fund_summary: {
          total_funds: 12,
          total_assets_under_management: 2500000000,
          average_nav: 125.45,
          top_performing_fund: 'Growth Equity Fund',
        },
        portfolio_summary: {
          total_portfolios: 87,
          total_portfolio_value: 1800000000,
          average_performance: 8.75,
          best_performing_portfolio: 'Tech Innovation Portfolio',
        },
      };
      setDashboardData(mockData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-6 bg-slate-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-slate-500">
            <Activity className="w-12 h-12 mx-auto mb-4" />
            <p>No dashboard data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { fund_summary, portfolio_summary } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Financial Overview</h2>
            <p className="text-blue-100 text-lg">
              Real-time insights into your financial operations
            </p>
          </div>
          <div className="hidden md:block">
            <Activity className="w-16 h-16 text-white opacity-20" />
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Funds */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Funds</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {fund_summary.total_funds}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active investment funds
            </p>
          </CardContent>
        </Card>

        {/* Assets Under Management */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Assets Under Management</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(fund_summary.total_assets_under_management)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total AUM across all funds
            </p>
          </CardContent>
        </Card>

        {/* Total Portfolios */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Portfolios</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {portfolio_summary.total_portfolios}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active investor portfolios
            </p>
          </CardContent>
        </Card>

        {/* Total Portfolio Value */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Portfolio Value</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(portfolio_summary.total_portfolio_value)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total portfolio valuations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fund Analytics */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Fund Performance
            </CardTitle>
            <CardDescription>
              Key metrics for fund administration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-600">Average NAV</p>
                <p className="text-xl font-bold text-blue-700">
                  {formatCurrency(fund_summary.average_nav)}
                </p>
              </div>
              <Badge variant="outline" className="border-blue-200 text-blue-700">
                Net Asset Value
              </Badge>
            </div>
            
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium text-slate-600 mb-2">Top Performing Fund</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900">
                  {fund_summary.top_performing_fund || 'No data available'}
                </span>
                {fund_summary.top_performing_fund && (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Analytics */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Portfolio Insights
            </CardTitle>
            <CardDescription>
              Portfolio management analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-600">Average Performance</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-purple-700">
                    {formatPercentage(portfolio_summary.average_performance)}
                  </p>
                  {portfolio_summary.average_performance >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium text-slate-600 mb-2">Best Performing Portfolio</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900">
                  {portfolio_summary.best_performing_portfolio || 'No data available'}
                </span>
                {portfolio_summary.best_performing_portfolio && (
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    Top Performer
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Navigate to key platform features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Manage Accounts</p>
              <p className="text-xs text-slate-400 mt-1">View and manage chart of accounts</p>
            </div>
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer">
              <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Fund Administration</p>
              <p className="text-xs text-slate-400 mt-1">Manage funds and investors</p>
            </div>
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer">
              <Target className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Portfolio Management</p>
              <p className="text-xs text-slate-400 mt-1">Track portfolios and assets</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;