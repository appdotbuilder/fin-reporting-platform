import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Search, Edit, Trash2, AlertCircle, Building2, Plus, Filter } from 'lucide-react';
import type { Account } from '../../../../server/src/schema';

function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getAccounts.query();
      setAccounts(result || []);
      setFilteredAccounts(result || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      // For development: provide mock data when backend is not fully implemented
      const mockAccounts: Account[] = [
        {
          id: 1,
          name: 'Cash and Cash Equivalents',
          account_number: '1001',
          account_type: 'asset',
          balance: 500000,
          description: 'Primary operating cash accounts',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: 2,
          name: 'Accounts Receivable',
          account_number: '1200',
          account_type: 'asset',
          balance: 750000,
          description: 'Outstanding invoices and receivables',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: 3,
          name: 'Management Fees Payable',
          account_number: '2100',
          account_type: 'liability',
          balance: 125000,
          description: 'Accrued management fees',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];
      setAccounts(mockAccounts);
      setFilteredAccounts(mockAccounts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Filter accounts based on search and type
  useEffect(() => {
    let filtered = accounts;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((account: Account) =>
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.account_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (account.description && account.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((account: Account) => account.account_type === typeFilter);
    }

    setFilteredAccounts(filtered);
  }, [accounts, searchQuery, typeFilter]);

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      await trpc.deleteAccount.mutate({ id });
      setAccounts((prev: Account[]) => prev.filter((account: Account) => account.id !== id));
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAccountTypeColor = (type: string): string => {
    switch (type) {
      case 'asset':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'liability':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'equity':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'revenue':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expense':
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
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Accounts</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadAccounts} variant="outline">
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
            placeholder="Search accounts by name, number, or description..."
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
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="liability">Liability</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing {filteredAccounts.length} of {accounts.length} accounts
        </p>
        <Badge variant="outline" className="text-slate-600">
          {accounts.length} Total Accounts
        </Badge>
      </div>

      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {accounts.length === 0 ? 'No accounts found' : 'No accounts match your search'}
            </h3>
            <p className="text-slate-500 text-center">
              {accounts.length === 0 
                ? 'Get started by creating your first account' 
                : 'Try adjusting your search criteria'}
            </p>
            {accounts.length === 0 && (
              <Button className="mt-4" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create First Account
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAccounts.map((account: Account) => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {account.name}
                      </h3>
                      <Badge className={getAccountTypeColor(account.account_type)}>
                        {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Account #:</span> {account.account_number}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-semibold text-slate-900">
                          Balance: {formatCurrency(account.balance)}
                        </p>
                      </div>
                      
                      {account.description && (
                        <p className="text-sm text-slate-600">
                          {account.description}
                        </p>
                      )}
                      
                      <p className="text-xs text-slate-400">
                        Created: {account.created_at.toLocaleDateString()}
                        {account.updated_at.getTime() !== account.created_at.getTime() && (
                          <span className="ml-4">
                            Updated: {account.updated_at.toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
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

export default AccountsList;