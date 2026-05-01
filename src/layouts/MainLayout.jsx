import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-dark-400 pb-20 md:pb-0">
      <Header />
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-7xl">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
