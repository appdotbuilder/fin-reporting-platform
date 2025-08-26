import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Receipt, Plus } from 'lucide-react';

// Import sub-components
import AccountsList from './accounting/AccountsList';
import AccountForm from './accounting/AccountForm';
import TransactionsList from './accounting/TransactionsList';
import TransactionForm from './accounting/TransactionForm';

function AccountingModule() {
  const [activeTab, setActiveTab] = useState<string>('accounts-list');

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              Accounting Management
            </h2>
            <p className="text-green-100 text-lg">
              Manage chart of accounts and financial transactions
            </p>
          </div>
        </div>
      </div>

      {/* Accounting Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
          <TabsTrigger 
            value="accounts-list" 
            className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
          >
            <Building2 className="w-4 h-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger 
            value="account-form" 
            className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </TabsTrigger>
          <TabsTrigger 
            value="transactions-list" 
            className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
          >
            <Receipt className="w-4 h-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger 
            value="transaction-form" 
            className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </TabsTrigger>
        </TabsList>

        {/* Accounts List */}
        <TabsContent value="accounts-list">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                Chart of Accounts
              </CardTitle>
              <CardDescription>
                View and manage all accounting accounts in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountsList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Form */}
        <TabsContent value="account-form">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Create New Account
              </CardTitle>
              <CardDescription>
                Add a new account to the chart of accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountForm onSuccess={() => setActiveTab('accounts-list')} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions List */}
        <TabsContent value="transactions-list">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-600" />
                Financial Transactions
              </CardTitle>
              <CardDescription>
                View and manage all financial transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Form */}
        <TabsContent value="transaction-form">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Record New Transaction
              </CardTitle>
              <CardDescription>
                Record a new financial transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionForm onSuccess={() => setActiveTab('transactions-list')} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AccountingModule;