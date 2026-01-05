import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Download, MoreHorizontal, Mail, Phone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface EmployeeListProps {
  searchParams: Promise<{
    search?: string
    status?: string
    department?: string
    type?: string
  }>
}

interface EmployeeData {
  id: string
  first_name: string
  last_name: string
  employee_id: string | null
  personal_email: string | null
  phone: string | null
  department: string | null
  employment_type: string | null
  status: string
  hire_date: string
  positions: {
    title: string
    department: string | null
  } | null
}

async function EmployeeList({ searchParams }: EmployeeListProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Get current user's organization
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    return <div className="text-muted-foreground">Please sign in</div>
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('organization_id')
    .eq('auth_user_id', authUser.id)
    .single() as { data: { organization_id: string | null } | null }

  const orgId = dbUser?.organization_id ?? ''
  
  if (!orgId) {
    return <div className="text-muted-foreground">No organization found</div>
  }

  // Build query
  let query = supabase
    .from('employees')
    .select(`
      *,
      positions(title, department)
    `)
    .eq('organization_id', orgId)
    .order('last_name')

  // Apply filters
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  } else {
    query = query.neq('status', 'terminated')
  }

  if (params.department && params.department !== 'all') {
    query = query.eq('department', params.department)
  }

  if (params.type && params.type !== 'all') {
    query = query.eq('employment_type', params.type)
  }

  if (params.search) {
    query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,employee_id.ilike.%${params.search}%`)
  }

  const { data: employeesRaw, error } = await query

  if (error) {
    console.error('Error fetching employees:', error)
    return <div className="text-red-500">Error loading employees</div>
  }

  const employees = employeesRaw as unknown as EmployeeData[] | null

  // Get unique departments for filter
  const { data: departmentsRaw } = await supabase
    .from('employees')
    .select('department')
    .eq('organization_id', orgId)
    .not('department', 'is', null)

  const departments = departmentsRaw as unknown as { department: string | null }[] | null
  const uniqueDepartments = Array.from(new Set(departments?.map(d => d.department).filter(Boolean) || []))

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      terminated: 'destructive',
      loa: 'outline',
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status === 'loa' ? 'Leave of Absence' : status}
      </Badge>
    )
  }

  const getEmploymentTypeBadge = (type: string | null) => {
    if (!type) return null
    const colors: Record<string, string> = {
      'full-time': 'bg-blue-100 text-blue-800',
      'part-time': 'bg-purple-100 text-purple-800',
      'prn': 'bg-orange-100 text-orange-800',
      'contractor': 'bg-gray-100 text-gray-800',
    }
    return (
      <Badge variant="outline" className={`capitalize ${colors[type] || ''}`}>
        {type}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4 flex-wrap">
          <form className="flex-1 min-w-[200px] max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search employees..."
                defaultValue={params.search}
                className="pl-9"
              />
            </div>
          </form>
          
          <Select defaultValue={params.status || 'all'}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="loa">Leave of Absence</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue={params.department || 'all'}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map((dept) => (
                <SelectItem key={dept} value={dept!}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue={params.type || 'all'}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full-time">Full-Time</SelectItem>
              <SelectItem value="part-time">Part-Time</SelectItem>
              <SelectItem value="prn">PRN</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/employees/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees && employees.length > 0 ? (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Link href={`/employees/${employee.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {employee.first_name[0]}{employee.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.employee_id || employee.personal_email}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {employee.positions?.title || '—'}
                    </TableCell>
                    <TableCell>
                      {employee.department || employee.positions?.department || '—'}
                    </TableCell>
                    <TableCell>
                      {getEmploymentTypeBadge(employee.employment_type)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(employee.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(employee.hire_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/employees/${employee.id}`}>
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/employees/${employee.id}/edit`}>
                              Edit Employee
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {employee.personal_email && (
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${employee.personal_email}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </a>
                            </DropdownMenuItem>
                          )}
                          {employee.phone && (
                            <DropdownMenuItem asChild>
                              <a href={`tel:${employee.phone}`}>
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <p className="font-medium">No employees found</p>
                      <p className="text-sm">Try adjusting your filters or add a new employee.</p>
                      <Link href="/employees/new" className="mt-4">
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Employee
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function EmployeeListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[140px]" />
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function EmployeesPage(props: EmployeeListProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage your team members and their information
          </p>
        </div>
      </div>

      <Suspense fallback={<EmployeeListSkeleton />}>
        <EmployeeList searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
