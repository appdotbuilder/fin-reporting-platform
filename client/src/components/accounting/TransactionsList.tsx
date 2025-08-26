import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Search, Edit, Trash2, AlertCircle, Receipt, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import type { Transaction, Account } from '../../../../server/src/schema';

function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [transactionsResult, accountsResult] = await Promise.all([
        trpc.getTransactions.query(),
        trpc.getAccounts.query()
      ]);
      
      setTransactions(transactionsResult || []);
      setAccounts(accountsResult || []);
      setFilteredTransactions(transactionsResult || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
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
          name: 'Management Fee Revenue',
          account_number: '4001',
          account_type: 'revenue',
          balance: 250000,
          description: 'Management fees collected',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];
      
      const mockTransactions: Transaction[] = [
        {
          id: 1,
          account_id: 1,
          transaction_type: 'credit',
          amount: 100000,
          description: 'Initial client deposit',
          transaction_date: new Date('2024-01-15'),
          reference_number: 'TXN-001',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: 2,
          account_id: 2,
          transaction_type: 'credit',
          amount: 25000,
          description: 'Q1 Management fees',
          transaction_date: new Date('2024-01-31'),
          reference_number: 'FEE-Q1-2024',
          created_at: new Date('2024-01-31'),
          updated_at: new Date('2024-01-31'),
        },
        {
          id: 3,
          account_id: 1,
          transaction_type: 'debit',
          amount: 15000,
          description: 'Office expenses payment',
          transaction_date: new Date('2024-02-01'),
          reference_number: 'EXP-001',
          created_at: new Date('2024-02-01'),
          updated_at: new Date('2024-02-01'),
        },
      ];
      
      setTransactions(mockTransactions);
      setAccounts(mockAccounts);
      setFilteredTransactions(mockTransactions);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter transactions based on search, type, and account
  useEffect(() => {
    let filtered = transactions;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((transaction: Transaction) =>
        (transaction.description && transaction.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (transaction.reference_number && transaction.reference_number.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by transaction type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((transaction: Transaction) => transaction.transaction_type === typeFilter);
    }

    // Filter by account
    if (accountFilter !== 'all') {
      filtered = filtered.filter((transaction: Transaction) => transaction.account_id.toString() === accountFilter);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, typeFilter, accountFilter]);

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await trpc.deleteTransaction.mutate({ id });
      setTransactions((prev: Transaction[]) => prev.filter((transaction: Transaction) => transaction.id !== id));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const getAccountName = (accountId: number): string => {
    const account = accounts.find((acc: Account) => acc.id === accountId);
    return account ? account.name : `Account #${accountId}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTransactionTypeColor = (type: string): string => {
    return type === 'debit' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-green-100 text-green-800 border-green-200';
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
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Transactions</h3>
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
            placeholder="Search transactions by description or reference..."
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
              <SelectItem value="debit">Debit</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account: Account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </p>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-slate-600">
            {transactions.length} Total
          </Badge>
          {transactions.length > 0 && (
            <Badge variant="outline" className="text-green-600">
              {formatCurrency(
                transactions
                  .filter((t: Transaction) => t.transaction_type === 'credit')
                  .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
              )} Credits
            </Badge>
          )}
          {transactions.length > 0 && (
            <Badge variant="outline" className="text-red-600">
              {formatCurrency(
                transactions
                  .filter((t: Transaction) => t.transaction_type === 'debit')
                  .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
              )} Debits
            </Badge>
          )}
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {transactions.length === 0 ? 'No transactions found' : 'No transactions match your search'}
            </h3>
            <p className="text-slate-500 text-center">
              {transactions.length === 0 
                ? 'Get started by recording your first transaction' 
                : 'Try adjusting your search criteria'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction: Transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {transaction.transaction_type === 'debit' ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                        <h3 className="text-lg font-semibold text-slate-900">
                          {formatCurrency(transaction.amount)}
                        </h3>
                      </div>
                      <Badge className={getTransactionTypeColor(transaction.transaction_type)}>
                        {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Account:</span> {getAccountName(transaction.account_id)}
                        </p>
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Date:</span> {transaction.transaction_date.toLocaleDateString()}
                        </p>
                      </div>
                      
                      {transaction.description && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Description:</span> {transaction.description}
                        </p>
                      )}
                      
                      {transaction.reference_number && (
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">Reference:</span> {transaction.reference_number}
                        </p>
                      )}
                      
                      <p className="text-xs text-slate-400">
                        Created: {transaction.created_at.toLocaleDateString()}
                        {transaction.updated_at.getTime() !== transaction.created_at.getTime() && (
                          <span className="ml-4">
                            Updated: {transaction.updated_at.toLocaleDateString()}
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
                      onClick={() => handleDeleteTransaction(transaction.id)}
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

export default TransactionsList;