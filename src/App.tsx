import { useState, useEffect } from 'react'
import { useAppStore } from './stores/app'
import { Layout } from './components/Layout'
import { Dashboard } from './screens/Dashboard'
import { NewRepairStep1 } from './screens/NewRepairStep1'
import { NewRepairStep2 } from './screens/NewRepairStep2'
import { RepairDetail } from './screens/RepairDetail'
import { RepairsList } from './screens/RepairsList'
import { Reports } from './screens/Reports'
import { Settings } from './screens/Settings'
import { QuotationBuilder } from './screens/QuotationBuilder'
import { InvoiceBuilder } from './screens/InvoiceBuilder'
import { WarrantySearch } from './screens/WarrantySearch'
import { CompanyList } from './screens/CompanyList'
import { CompanyProfile } from './screens/CompanyProfile'
import { Login } from './screens/Login'
import { UserManagement } from './screens/UserManagement'
import { Accounting } from './screens/Accounting'
import { Ledger } from './screens/Ledger'
import { ProfitLoss } from './screens/ProfitLoss'
import { BalanceSheet } from './screens/BalanceSheet'
import { JournalDetail } from './screens/JournalDetail'
import { OpeningBalances } from './screens/OpeningBalances'
import { Analytics } from './screens/Analytics'
import { RevenueAnalytics } from './screens/RevenueAnalytics'
import { RepairAnalytics } from './screens/RepairAnalytics'
import { CustomerAnalytics } from './screens/CustomerAnalytics'
import { WarrantyAnalytics } from './screens/WarrantyAnalytics'
import { AIMessageComposer } from './screens/AIMessageComposer'
import { Communications } from './screens/Communications'
import { NewCampaign } from './screens/NewCampaign'
import { Documents } from './screens/Documents'
import { DatabaseMonitor } from './screens/DatabaseMonitor'

function ScreenRouter() {
  const currentScreen = useAppStore((s) => s.currentScreen)

  switch (currentScreen) {
    case 'dashboard': return <Dashboard />
    case 'new-repair-step1': return <NewRepairStep1 />
    case 'new-repair-step2': return <NewRepairStep2 />
    case 'repair-detail': return <RepairDetail />
    case 'repairs-list': return <RepairsList />
    case 'settings': return <Settings />
    case 'quotation-builder': return <QuotationBuilder />
    case 'invoice-builder': return <InvoiceBuilder />
    case 'warranty-search': return <WarrantySearch />
    case 'reports': return <Reports />
    case 'company-list': return <CompanyList />
    case 'company-profile': return <CompanyProfile />
    case 'user-management': return <UserManagement />
    case 'accounting': return <Accounting />
    case 'ledger': return <Ledger />
    case 'profit-loss': return <ProfitLoss />
    case 'balance-sheet': return <BalanceSheet />
    case 'journal-detail': return <JournalDetail />
    case 'opening-balances': return <OpeningBalances />
    case 'analytics': return <Analytics />
    case 'revenue-analytics': return <RevenueAnalytics />
    case 'repair-analytics': return <RepairAnalytics />
    case 'customer-analytics': return <CustomerAnalytics />
    case 'warranty-analytics': return <WarrantyAnalytics />
    case 'ai-message': return <AIMessageComposer />
    case 'communications': return <Communications />
    case 'new-campaign': return <NewCampaign />
    case 'documents': return <Documents />
    case 'database-monitor': return <DatabaseMonitor />
    default: return <Dashboard />
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('auth_token') !== null
  })

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token')
      setIsLoggedIn(token !== null)
    }
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <Layout>
      <ScreenRouter />
    </Layout>
  )
}

export default App
