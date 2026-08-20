import { AppSidebar } from '@/components/layout/AppSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full">
      <AppSidebar>{children}</AppSidebar>
    </div>
  )
}
