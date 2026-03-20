import { useAppStore } from '@/store'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { FamilyChartCanvas } from '@/components/FamilyChartCanvas'
import { Toolbar } from '@/components/Toolbar'

function App() {
  const isSetup = useAppStore(s => s.isSetup)

  if (!isSetup) {
    return <WelcomeScreen />
  }

  return (
    <>
      <FamilyChartCanvas />
      <Toolbar />
    </>
  )
}

export default App
