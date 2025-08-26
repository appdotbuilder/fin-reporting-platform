import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, TrendingUp, Wallet, PieChart, BarChart3, Activity } from 'lucide-react';

// Import feature components
import Dashboard from './components/Dashboard';
import AccountingModule from './components/AccountingModule';
import FundAdministrationModule from './components/FundAdministrationModule';
import PortfolioManagementModule from './components/PortfolioManagementModule';

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Financial Analytics Platform
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Comprehensive reporting and analytics for Accounting, Fund Administration, and Portfolio Management
          </p>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white shadow-sm">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
            >
              <PieChart className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="accounting" 
              className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
            >
              <Building2 className="w-4 h-4" />
              Accounting
            </TabsTrigger>
            <TabsTrigger 
              value="funds" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
            >
              <TrendingUp className="w-4 h-4" />
              Fund Admin
            </TabsTrigger>
            <TabsTrigger 
              value="portfolio" 
              className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
            >
              <Wallet className="w-4 h-4" />
              Portfolio Mgmt
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          {/* Accounting Module */}
          <TabsContent value="accounting">
            <AccountingModule />
          </TabsContent>

          {/* Fund Administration Module */}
          <TabsContent value="funds">
            <FundAdministrationModule />
          </TabsContent>

          {/* Portfolio Management Module */}
          <TabsContent value="portfolio">
            <PortfolioManagementModule />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="text-center text-slate-500 text-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="w-4 h-4" />
              <span>Financial Analytics Platform</span>
            </div>
            <p>Real-time financial reporting and portfolio analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;