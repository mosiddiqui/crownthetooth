'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'

const employeeSchema = z.object({
  // Personal Info
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional(),
  personalEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  dateOfBirth: z.string().optional(),

  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),

  // Employment Info
  employeeId: z.string().optional(),
  department: z.string().optional(),
  employmentType: z.enum(['full-time', 'part-time', 'prn', 'contractor']),
  classification: z.enum(['exempt', 'non-exempt']).optional(),
  hireDate: z.string().min(1, 'Hire date is required'),

  // Compensation
  payRate: z.string().optional(),
  payType: z.enum(['hourly', 'salary', 'production']).optional(),

  // Notes
  notes: z.string().optional(),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

export default function NewEmployeePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('personal')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employmentType: 'full-time',
      hireDate: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user's organization
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        setError('You must be logged in to create an employee.')
        return
      }

      const { data: dbUser } = await supabase
        .from('users')
        .select('organization_id')
        .eq('auth_user_id', authUser.id)
        .single() as { data: { organization_id: string | null } | null }

      if (!dbUser?.organization_id) {
        setError('Could not determine organization. Please try again.')
        return
      }

      // Create the employee
      // @ts-expect-error - Supabase types not configured
      const { error: insertError } = await supabase.from('employees').insert({
        organization_id: dbUser.organization_id,
        first_name: data.firstName,
        last_name: data.lastName,
        preferred_name: data.preferredName || null,
        personal_email: data.personalEmail || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        date_of_birth: data.dateOfBirth || null,
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_relationship: data.emergencyContactRelationship || null,
        emergency_contact_phone: data.emergencyContactPhone || null,
        employee_id: data.employeeId || null,
        department: data.department || null,
        employment_type: data.employmentType,
        classification: data.classification || null,
        hire_date: data.hireDate,
        pay_rate: data.payRate ? parseFloat(data.payRate) : null,
        pay_type: data.payType || null,
        notes: data.notes || null,
        status: 'active',
      })

      if (insertError) {
        setError(insertError.message)
        return
      }

      router.push('/employees')
      router.refresh()
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'emergency', label: 'Emergency Contact' },
    { id: 'employment', label: 'Employment' },
    { id: 'compensation', label: 'Compensation' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Employee</h1>
          <p className="text-muted-foreground">
            Create a new employee profile
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Personal Info Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Basic employee personal details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          {...register('firstName')}
                          disabled={isLoading}
                        />
                        {errors.firstName && (
                          <p className="text-sm text-red-500">{errors.firstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          {...register('lastName')}
                          disabled={isLoading}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-red-500">{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredName">Preferred Name</Label>
                      <Input
                        id="preferredName"
                        {...register('preferredName')}
                        disabled={isLoading}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="personalEmail">Personal Email</Label>
                        <Input
                          id="personalEmail"
                          type="email"
                          {...register('personalEmail')}
                          disabled={isLoading}
                        />
                        {errors.personalEmail && (
                          <p className="text-sm text-red-500">{errors.personalEmail.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          {...register('phone')}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...register('dateOfBirth')}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        {...register('address')}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          {...register('city')}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          {...register('state')}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          {...register('zip')}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Emergency Contact Tab */}
              <TabsContent value="emergency" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Emergency Contact</CardTitle>
                    <CardDescription>
                      Who to contact in case of emergency
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Contact Name</Label>
                      <Input
                        id="emergencyContactName"
                        {...register('emergencyContactName')}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                        <Input
                          id="emergencyContactRelationship"
                          {...register('emergencyContactRelationship')}
                          disabled={isLoading}
                          placeholder="e.g., Spouse, Parent, Sibling"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactPhone">Phone</Label>
                        <Input
                          id="emergencyContactPhone"
                          type="tel"
                          {...register('emergencyContactPhone')}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Employment Tab */}
              <TabsContent value="employment" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Employment Details</CardTitle>
                    <CardDescription>
                      Job and employment information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="employeeId">Employee ID</Label>
                        <Input
                          id="employeeId"
                          {...register('employeeId')}
                          disabled={isLoading}
                          placeholder="e.g., SMT-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          {...register('department')}
                          disabled={isLoading}
                          placeholder="e.g., Clinical, Front Office"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="employmentType">Employment Type *</Label>
                        <Select
                          defaultValue={watch('employmentType')}
                          onValueChange={(value) => setValue('employmentType', value as EmployeeFormData['employmentType'])}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">Full-Time</SelectItem>
                            <SelectItem value="part-time">Part-Time</SelectItem>
                            <SelectItem value="prn">PRN</SelectItem>
                            <SelectItem value="contractor">Contractor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="classification">Classification</Label>
                        <Select
                          defaultValue={watch('classification')}
                          onValueChange={(value) => setValue('classification', value as EmployeeFormData['classification'])}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exempt">Exempt</SelectItem>
                            <SelectItem value="non-exempt">Non-Exempt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hireDate">Hire Date *</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        {...register('hireDate')}
                        disabled={isLoading}
                      />
                      {errors.hireDate && (
                        <p className="text-sm text-red-500">{errors.hireDate.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Compensation Tab */}
              <TabsContent value="compensation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Compensation</CardTitle>
                    <CardDescription>
                      Pay rate and type information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="payType">Pay Type</Label>
                        <Select
                          defaultValue={watch('payType')}
                          onValueChange={(value) => setValue('payType', value as EmployeeFormData['payType'])}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="salary">Salary</SelectItem>
                            <SelectItem value="production">Production</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payRate">Pay Rate</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="payRate"
                            type="number"
                            step="0.01"
                            {...register('payRate')}
                            disabled={isLoading}
                            className="pl-7"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        {...register('notes')}
                        disabled={isLoading}
                        placeholder="Any additional notes about this employee..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {tabs.map((tab, index) => {
                    const isComplete = 
                      (tab.id === 'personal' && watch('firstName') && watch('lastName')) ||
                      (tab.id === 'employment' && watch('hireDate'));
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                        }`}
                      >
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          isComplete ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isComplete ? <CheckCircle className="h-4 w-4" /> : index + 1}
                        </div>
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Employee
                  </Button>
                  <Link href="/employees" className="block">
                    <Button variant="outline" className="w-full" type="button">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Required fields are marked with *</li>
                  <li>• You can add more details after creating the employee</li>
                  <li>• The employee will receive a login invite via email</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
