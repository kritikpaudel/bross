import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { MyWorkPage } from './pages/MyWorkPage'

function App() {
  return (
    <div className="app">
      <Sidebar />

      <main className="workspace">
        <Topbar />
        <MyWorkPage />
      </main>
    </div>
  )
}

export default App