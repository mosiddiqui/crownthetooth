'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Calendar,
  Star,
  AlertTriangle,
  GraduationCap,
  ClipboardList,
  Award,
  Settings,
  ChevronDown,
  Building2,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: { title: string; href: string }[]
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Employees',
    href: '/employees',
    icon: Users,
    children: [
      { title: 'Directory', href: '/employees' },
      { title: 'Org Chart', href: '/employees/org-chart' },
      { title: 'Add Employee', href: '/employees/new' },
    ],
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
    children: [
      { title: 'All Documents', href: '/documents' },
      { title: 'Templates', href: '/documents/templates' },
      { title: 'Pending Signatures', href: '/documents/pending' },
    ],
  },
  {
    title: 'Attendance',
    href: '/attendance',
    icon: Clock,
    children: [
      { title: 'Daily Log', href: '/attendance' },
      { title: 'Points Tracker', href: '/attendance/points' },
      { title: 'Reports', href: '/attendance/reports' },
    ],
  },
  {
    title: 'Time Off',
    href: '/pto',
    icon: Calendar,
    children: [
      { title: 'Requests', href: '/pto' },
      { title: 'Calendar', href: '/pto/calendar' },
      { title: 'Balances', href: '/pto/balances' },
    ],
  },
  {
    title: 'Performance',
    href: '/performance',
    icon: Star,
    children: [
      { title: 'Reviews', href: '/performance' },
      { title: 'Metrics', href: '/performance/metrics' },
      { title: 'Schedule Review', href: '/performance/schedule' },
    ],
  },
  {
    title: 'Discipline',
    href: '/discipline',
    icon: AlertTriangle,
    children: [
      { title: 'Incidents', href: '/discipline' },
      { title: 'Point Thresholds', href: '/discipline/thresholds' },
    ],
  },
  {
    title: 'Training',
    href: '/training',
    icon: GraduationCap,
    children: [
      { title: 'Courses', href: '/training' },
      { title: 'Assignments', href: '/training/assignments' },
      { title: 'Compliance', href: '/training/compliance' },
    ],
  },
  {
    title: 'Onboarding',
    href: '/onboarding',
    icon: ClipboardList,
    children: [
      { title: 'Active', href: '/onboarding' },
      { title: 'Templates', href: '/onboarding/templates' },
      { title: 'Checklists', href: '/onboarding/checklists' },
    ],
  },
  {
    title: 'Licenses',
    href: '/licenses',
    icon: Award,
    children: [
      { title: 'All Licenses', href: '/licenses' },
      { title: 'Expiring Soon', href: '/licenses/expiring' },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { title: 'Organization', href: '/settings' },
      { title: 'Users & Roles', href: '/settings/users' },
      { title: 'Integrations', href: '/settings/integrations' },
      { title: 'Billing', href: '/settings/billing' },
    ],
  },
]

interface SidebarProps {
  className?: string
  organizationName?: string
}

export function Sidebar({ className, organizationName }: SidebarProps) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={cn('flex h-full flex-col border-r bg-background', className)}>
      {/* Logo and Organization */}
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">DentalOS HR</span>
            {organizationName && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {organizationName}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const hasChildren = item.children && item.children.length > 0
            const isOpen = openItems.includes(item.title)

            if (hasChildren) {
              return (
                <Collapsible
                  key={item.title}
                  open={isOpen || active}
                  onOpenChange={() => toggleItem(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </div>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          (isOpen || active) && 'rotate-180'
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1 pl-7">
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm transition-colors',
                          pathname === child.href
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
