'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from './client'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { User, Organization, Employee, UserRole } from '@/types/database'

interface AuthUser extends SupabaseUser {
  dbUser?: User
  organization?: Organization
  employee?: Employee
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  refreshUser: () => Promise<void>
  hasRole: (roles: UserRole | UserRole[]) => boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchUserData = useCallback(async (authUser: SupabaseUser) => {
    try {
      // Fetch the user's database record
      const { data: dbUserRaw, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single()

      const dbUser = dbUserRaw as unknown as User | null

      if (userError || !dbUser) {
        console.error('Error fetching user data:', userError)
        return authUser as AuthUser
      }

      // Fetch the organization
      let organization: Organization | undefined
      if (dbUser.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', dbUser.organization_id)
          .single()
        organization = (orgData as unknown as Organization) ?? undefined
      }

      // Fetch the employee record if linked
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', dbUser.id)
        .single()
      const employee: Employee | undefined = (empData as unknown as Employee) ?? undefined

      return {
        ...authUser,
        dbUser,
        organization,
        employee,
      } as AuthUser
    } catch (error) {
      console.error('Error fetching user data:', error)
      return authUser as AuthUser
    }
  }, [supabase])

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const fullUser = await fetchUserData(authUser)
      setUser(fullUser)
    }
  }, [supabase, fetchUserData])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)
        
        if (initialSession?.user) {
          const fullUser = await fetchUserData(initialSession.user)
          setUser(fullUser)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession)
        
        if (currentSession?.user) {
          const fullUser = await fetchUserData(currentSession.user)
          setUser(fullUser)
        } else {
          setUser(null)
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserData])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata?.firstName,
            last_name: metadata?.lastName,
          },
        },
      })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      return { error: error as Error | null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user?.dbUser?.role) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.dbUser.role)
  }

  const hasPermission = (permission: string) => {
    if (!user?.dbUser) return false
    
    // Owner has all permissions
    if (user.dbUser.role === 'owner') return true
    
    // Check specific permission
    const permissions = user.dbUser.permissions as Record<string, boolean> | null
    if (permissions && permissions[permission]) return true
    
    // Check role-based permissions
    const rolePermissions: Record<UserRole, string[]> = {
      owner: ['*'],
      admin: [
        'employees:*',
        'documents:*',
        'attendance:*',
        'pto:manage',
        'reviews:manage',
        'discipline:*',
        'training:*',
        'reports:view',
        'settings:view',
      ],
      manager: [
        'employees:view',
        'employees:edit_direct_reports',
        'attendance:log',
        'attendance:view_direct_reports',
        'pto:approve_direct_reports',
        'reviews:conduct_direct_reports',
        'discipline:log',
        'training:view',
      ],
      employee: [
        'profile:view_own',
        'profile:edit_own',
        'documents:view_own',
        'documents:sign_own',
        'attendance:view_own',
        'pto:request',
        'pto:view_own',
        'training:view_own',
        'training:complete_own',
      ],
    }

    const userRolePermissions = rolePermissions[user.dbUser.role] || []
    
    // Check exact match or wildcard
    return userRolePermissions.some(p => {
      if (p === '*') return true
      if (p === permission) return true
      // Check wildcard patterns like 'employees:*'
      const [resource] = permission.split(':')
      return p === `${resource}:*`
    })
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshUser,
    hasRole,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
