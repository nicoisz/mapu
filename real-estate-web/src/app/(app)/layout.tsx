import { AppSidebar } from '@/components/layout/AppSidebar'
import { NavigationGlow } from '@/components/layout/NavigationGlow'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full">
      <NavigationGlow />
      <AppSidebar>{children}</AppSidebar>
    </div>
  )
}
