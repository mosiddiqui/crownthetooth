import { createClient } from '@/lib/supabase/server'
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  Clock, 
  Calendar,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
  href?: string
}

function StatCard({ title, value, description, icon: Icon, trend, href }: StatCardProps) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
            {trend.value}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

interface ActionItemProps {
  title: string
  description: string
  type: 'urgent' | 'warning' | 'info'
  href: string
  actionLabel?: string
}

function ActionItem({ title, description, type, href, actionLabel = 'View' }: ActionItemProps) {
  const icons = {
    urgent: XCircle,
    warning: AlertCircle,
    info: CheckCircle,
  }
  const colors = {
    urgent: 'text-red-600 bg-red-50',
    warning: 'text-yellow-600 bg-yellow-50',
    info: 'text-blue-600 bg-blue-50',
  }

  const Icon = icons[type]

  return (
    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-lg ${colors[type]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Link href={href}>
        <Button variant="ghost" size="sm">
          {actionLabel}
        </Button>
      </Link>
    </div>
  )
}

// Type definitions for query results
interface AtRiskEmployee {
  id: string
  first_name: string
  last_name: string
  attendance_points: number
}

interface ExpiringLicense {
  id: string
  license_type: string
  expiration_date: string | null
  employees: {
    first_name: string
    last_name: string
  } | null
}

interface PendingPTO {
  id: string
  start_date: string
  end_date: string
  pto_type: string | null
  total_days: number | null
  employees: {
    first_name: string
    last_name: string
  } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user's organization
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    return null
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('organization_id')
    .eq('auth_user_id', authUser.id)
    .single()

  const orgId = (dbUser as { organization_id: string | null } | null)?.organization_id ?? ''
  
  if (!orgId) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Please complete your organization setup.
          </p>
        </div>
      </div>
    )
  }

  // Fetch employee stats
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')

  const { count: fullTimeCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .eq('employment_type', 'full-time')

  const { count: partTimeCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .eq('employment_type', 'part-time')

  // Fetch pending documents
  const { count: pendingDocs } = await supabase
    .from('employee_documents')
    .select('*, employees!inner(organization_id)', { count: 'exact', head: true })
    .eq('employees.organization_id', orgId)
    .eq('status', 'pending')

  // Fetch expiring licenses (next 90 days)
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
  
  const { data: expiringLicensesRaw, count: expiringLicenseCount } = await supabase
    .from('licenses')
    .select('*, employees!inner(first_name, last_name, organization_id)', { count: 'exact' })
    .eq('employees.organization_id', orgId)
    .lte('expiration_date', ninetyDaysFromNow.toISOString().split('T')[0])
    .gte('expiration_date', new Date().toISOString().split('T')[0])
    .order('expiration_date')
    .limit(5)

  const expiringLicenses = expiringLicensesRaw as unknown as ExpiringLicense[] | null

  // Fetch pending PTO requests
  const { data: pendingPTORaw, count: pendingPTOCount } = await supabase
    .from('pto_requests')
    .select('*, employees!inner(first_name, last_name, organization_id)', { count: 'exact' })
    .eq('employees.organization_id', orgId)
    .eq('status', 'pending')
    .order('request_date', { ascending: false })
    .limit(5)

  const pendingPTO = pendingPTORaw as unknown as PendingPTO[] | null

  // Fetch overdue reviews
  const { count: overdueReviews } = await supabase
    .from('performance_reviews')
    .select('*, employees!inner(organization_id)', { count: 'exact', head: true })
    .eq('employees.organization_id', orgId)
    .eq('status', 'overdue')

  // Fetch employees at attendance risk (high points)
  const { data: atRiskEmployeesRaw } = await supabase
    .from('employees')
    .select('id, first_name, last_name, attendance_points')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .gte('attendance_points', 5)
    .order('attendance_points', { ascending: false })
    .limit(5)

  const atRiskEmployees = atRiskEmployeesRaw as unknown as AtRiskEmployee[] | null

  // Fetch recent hires (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { count: recentHires } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .gte('hire_date', thirtyDaysAgo.toISOString().split('T')[0])

  // Build action items
  const actionItems: ActionItemProps[] = []

  if (pendingDocs && pendingDocs > 0) {
    actionItems.push({
      title: `${pendingDocs} documents pending signature`,
      description: 'Review and send documents awaiting signatures',
      type: 'warning',
      href: '/documents/pending',
    })
  }

  if (pendingPTOCount && pendingPTOCount > 0) {
    actionItems.push({
      title: `${pendingPTOCount} PTO requests pending`,
      description: 'Review and approve time off requests',
      type: 'info',
      href: '/pto',
    })
  }

  if (overdueReviews && overdueReviews > 0) {
    actionItems.push({
      title: `${overdueReviews} overdue performance reviews`,
      description: 'Complete reviews that are past their scheduled date',
      type: 'urgent',
      href: '/performance',
    })
  }

  if (expiringLicenseCount && expiringLicenseCount > 0) {
    actionItems.push({
      title: `${expiringLicenseCount} licenses expiring soon`,
      description: 'Remind employees to renew their certifications',
      type: 'warning',
      href: '/licenses/expiring',
    })
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your team.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees || 0}
          description={`${fullTimeCount || 0} full-time, ${partTimeCount || 0} part-time`}
          icon={Users}
          href="/employees"
        />
        <StatCard
          title="Pending Documents"
          value={pendingDocs || 0}
          description="Awaiting signatures"
          icon={FileText}
          href="/documents/pending"
        />
        <StatCard
          title="Compliance Alerts"
          value={(expiringLicenseCount || 0) + (overdueReviews || 0)}
          description="Licenses & reviews needing attention"
          icon={AlertTriangle}
          href="/licenses/expiring"
        />
        <StatCard
          title="Recent Hires"
          value={recentHires || 0}
          description="In the last 30 days"
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
          href="/employees"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>
              Tasks requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {actionItems.length > 0 ? (
              <div className="space-y-1">
                {actionItems.map((item, index) => (
                  <ActionItem key={index} {...item} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No pending actions at this time.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Risk */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Attendance Risk</CardTitle>
                <CardDescription>
                  Employees approaching point thresholds
                </CardDescription>
              </div>
              <Link href="/attendance/points">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {atRiskEmployees && atRiskEmployees.length > 0 ? (
              <div className="space-y-4">
                {atRiskEmployees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {employee.first_name[0]}{employee.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {employee.attendance_points >= 10
                            ? 'Termination threshold'
                            : employee.attendance_points >= 7
                            ? 'Final warning'
                            : 'Written warning'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          employee.attendance_points >= 10
                            ? 'destructive'
                            : employee.attendance_points >= 7
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {employee.attendance_points} pts
                      </Badge>
                      <Progress
                        value={(employee.attendance_points / 10) * 100}
                        className="w-16 h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">No attendance concerns</p>
                <p className="text-sm">All employees are below warning thresholds.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Licenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Expiring Licenses</CardTitle>
                <CardDescription>
                  Licenses expiring in the next 90 days
                </CardDescription>
              </div>
              <Link href="/licenses/expiring">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {expiringLicenses && expiringLicenses.length > 0 ? (
              <div className="space-y-4">
                {expiringLicenses.map((license) => {
                  const daysUntilExpiry = license.expiration_date 
                    ? Math.ceil(
                        (new Date(license.expiration_date).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null
                  return (
                    <div key={license.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {license.employees?.first_name} {license.employees?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {license.license_type}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={daysUntilExpiry && daysUntilExpiry <= 30 ? 'destructive' : 'secondary'}
                      >
                        {daysUntilExpiry} days
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">All licenses current</p>
                <p className="text-sm">No licenses expiring in the next 90 days.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending PTO */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Time Off</CardTitle>
                <CardDescription>
                  Requests awaiting approval
                </CardDescription>
              </div>
              <Link href="/pto">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingPTO && pendingPTO.length > 0 ? (
              <div className="space-y-4">
                {pendingPTO.map((request) => (
                  <div key={request.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {request.employees?.first_name} {request.employees?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.start_date).toLocaleDateString()} -{' '}
                          {new Date(request.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {request.pto_type}
                      </Badge>
                      <span className="text-sm font-medium">
                        {request.total_days} days
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">No pending requests</p>
                <p className="text-sm">All time off requests have been processed.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/employees/new">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Add Employee</span>
              </Button>
            </Link>
            <Link href="/attendance">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>Log Attendance</span>
              </Button>
            </Link>
            <Link href="/documents/templates">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>Send Document</span>
              </Button>
            </Link>
            <Link href="/performance/schedule">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Schedule Review</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
