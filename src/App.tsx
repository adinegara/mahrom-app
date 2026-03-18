import { useAppStore } from '@/store'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { Canvas } from '@/components/Canvas'
import { AddRelationPanel } from '@/components/AddRelationPanel'
import { Toolbar } from '@/components/Toolbar'

function App() {
  const isSetup = useAppStore(s => s.isSetup)

  if (!isSetup) {
    return <WelcomeScreen />
  }

  return (
    <>
      <Canvas />
      <Toolbar />
      <AddRelationPanel />
    </>
  )
}

export default App
