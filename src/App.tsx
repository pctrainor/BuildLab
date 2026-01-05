import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './lib/auth'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { HomePage } from './pages/HomePage'
import { AuthPage } from './pages/AuthPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { CheckEmailPage } from './pages/CheckEmailPage'
import { EmailConfirmedPage } from './pages/EmailConfirmedPage'
import { ExplorePage } from './pages/ExplorePage'
import { SubmitPage } from './pages/SubmitPage'
import { RequestDetailPage } from './pages/RequestDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { CompetePage } from './pages/CompetePage'
import { CampaignsPage } from './pages/CampaignsPage'
import { CreateCampaignPage } from './pages/CreateCampaignPage'
import { ProfilePage } from './pages/ProfilePage'
import { GeneratedProjectPage } from './pages/GeneratedProjectPage'
import { DemoPage } from './pages/DemoPage'

function App() {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/check-email" element={<CheckEmailPage />} />
        <Route path="/email-confirmed" element={<EmailConfirmedPage />} />
        <Route path="/demo/:projectSlug" element={<DemoPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="submit" element={<SubmitPage />} />
          <Route path="request/:id" element={<RequestDetailPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="campaigns/create" element={<CreateCampaignPage />} />
          <Route path="u/:username" element={<ProfilePage />} />
          <Route path="project/:projectSlug" element={<GeneratedProjectPage />} />
          <Route path="competitions" element={<CompetePage />} />
          <Route path="how-it-works" element={<HomePage />} />
          <Route path="profile" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
