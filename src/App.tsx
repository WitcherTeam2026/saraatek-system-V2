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
    default: return <Dashboard />
  }
}

function App() {
  return (
    <Layout>
      <ScreenRouter />
    </Layout>
  )
}

export default App
