import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AuthProvider } from '@/lib/supabase/auth-context'
import { Toaster } from '@/components/ui/sonner'

interface DbUser {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  avatar_url: string | null
  role: string
  organizations: { name: string } | null
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/auth/login')
  }

  // Fetch user data from database
  const { data: dbUserRaw } = await supabase
    .from('users')
    .select('*, organizations(*)')
    .eq('auth_user_id', authUser.id)
    .single()

  const dbUser = dbUserRaw as unknown as DbUser | null

  // Fetch notification count
  const { count: notificationCount } = dbUser 
    ? await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', dbUser.id)
        .eq('is_read', false)
    : { count: 0 }

  const user = dbUser ? {
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    email: dbUser.email,
    avatarUrl: dbUser.avatar_url,
    role: dbUser.role,
  } : {
    email: authUser.email || '',
  }

  const organizationName = dbUser?.organizations?.name

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-shrink-0">
          <Sidebar organizationName={organizationName} />
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header 
            user={user} 
            organizationName={organizationName}
            notificationCount={notificationCount || 0}
          />
          
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="container mx-auto p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </AuthProvider>
  )
}
