import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  AlertTriangle,
  FileText,
  Clock,
  Award,
  GraduationCap,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface EmployeeProfileProps {
  params: Promise<{ id: string }>
}

// Type definitions
interface EmployeeProfile {
  id: string
  first_name: string
  last_name: string
  preferred_name: string | null
  personal_email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  date_of_birth: string | null
  employee_id: string | null
  department: string | null
  employment_type: string | null
  classification: string | null
  hire_date: string
  status: string
  discipline_status: string
  pto_balance_hours: number
  attendance_points: number
  pay_rate: number | null
  pay_type: string | null
  last_raise_date: string | null
  emergency_contact_name: string | null
  emergency_contact_relationship: string | null
  emergency_contact_phone: string | null
  notes: string | null
  positions: { id: string; title: string; department: string | null } | null
  manager: { id: string; first_name: string; last_name: string } | null
}

interface EmployeeDocument {
  id: string
  document_name: string
  document_type: string
  status: string
  created_at: string
}

interface License {
  id: string
  license_type: string
  license_number: string | null
  expiration_date: string | null
}

interface EmployeeTrainingRecord {
  id: string
  status: string
  due_date: string | null
  training_courses: { name: string; category: string | null } | null
}

interface PerformanceReviewRecord {
  id: string
  review_type: string | null
  status: string
  scheduled_date: string | null
  overall_rating: number | null
}

interface AttendanceRecordData {
  id: string
  date: string
  status: string
  actual_start: string | null
  actual_end: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  points_assessed: number
}

interface PTORequestRecord {
  id: string
  start_date: string
  status: string
}

interface DisciplineIncidentRecord {
  id: string
  incident_date: string
  category: string | null
  discipline_level: string | null
  description: string
  points_assessed: number
}

export default async function EmployeeProfilePage({ params }: EmployeeProfileProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch employee with relations
  const { data: employeeRaw, error } = await supabase
    .from('employees')
    .select(`
      *,
      positions(id, title, department),
      manager:employees!employees_reports_to_fkey(id, first_name, last_name)
    `)
    .eq('id', id)
    .single()

  if (error || !employeeRaw) {
    notFound()
  }

  const employee = employeeRaw as unknown as EmployeeProfile

  // Fetch related data
  const [
    { data: documentsRaw },
    { data: licensesRaw },
    { data: trainingRaw },
    { data: reviewsRaw },
    { data: attendanceRaw },
    { data: ptoRequestsRaw },
    { data: disciplineIncidentsRaw },
  ] = await Promise.all([
    supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('licenses')
      .select('*')
      .eq('employee_id', id)
      .order('expiration_date'),
    supabase
      .from('employee_training')
      .select('*, training_courses(*)')
      .eq('employee_id', id)
      .order('due_date'),
    supabase
      .from('performance_reviews')
      .select('*')
      .eq('employee_id', id)
      .order('scheduled_date', { ascending: false })
      .limit(5),
    supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', id)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('pto_requests')
      .select('*')
      .eq('employee_id', id)
      .order('start_date', { ascending: false })
      .limit(5),
    supabase
      .from('discipline_incidents')
      .select('*')
      .eq('employee_id', id)
      .order('incident_date', { ascending: false })
      .limit(5),
  ])

  const documents = documentsRaw as unknown as EmployeeDocument[] | null
  const licenses = licensesRaw as unknown as License[] | null
  const training = trainingRaw as unknown as EmployeeTrainingRecord[] | null
  const reviews = reviewsRaw as unknown as PerformanceReviewRecord[] | null
  const attendance = attendanceRaw as unknown as AttendanceRecordData[] | null
  const ptoRequests = ptoRequestsRaw as unknown as PTORequestRecord[] | null
  const disciplineIncidents = disciplineIncidentsRaw as unknown as DisciplineIncidentRecord[] | null

  const initials = `${employee.first_name[0]}${employee.last_name[0]}`

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

  const tenure = () => {
    const hireDate = new Date(employee.hire_date)
    const now = new Date()
    const years = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
    const months = Math.floor(((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) % 12)
    
    if (years > 0) {
      return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`
    }
    return `${months} month${months !== 1 ? 's' : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {employee.preferred_name || employee.first_name} {employee.last_name}
                </h1>
                {getStatusBadge(employee.status)}
              </div>
              <p className="text-muted-foreground">
                {employee.positions?.title || 'No Position'} • {employee.department || employee.positions?.department || 'No Department'}
              </p>
              {employee.employee_id && (
                <p className="text-sm text-muted-foreground">ID: {employee.employee_id}</p>
              )}
            </div>
          </div>
        </div>
        <Link href={`/employees/${id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="discipline">Discipline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.personal_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${employee.personal_email}`} className="text-sm hover:underline">
                      {employee.personal_email}
                    </a>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${employee.phone}`} className="text-sm hover:underline">
                      {employee.phone}
                    </a>
                  </div>
                )}
                {(employee.address || employee.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      {employee.address && <p>{employee.address}</p>}
                      {employee.city && (
                        <p>
                          {employee.city}, {employee.state} {employee.zip}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {employee.date_of_birth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(employee.date_of_birth).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{employee.positions?.title || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{employee.department || employee.positions?.department || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employment Type</p>
                  <p className="font-medium capitalize">{employee.employment_type || 'Not Specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="font-medium">
                    {new Date(employee.hire_date).toLocaleDateString()} ({tenure()})
                  </p>
                </div>
                {employee.manager && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reports To</p>
                    <Link href={`/employees/${employee.manager.id}`} className="font-medium hover:underline">
                      {employee.manager.first_name} {employee.manager.last_name}
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Compensation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pay Type</p>
                  <p className="font-medium capitalize">{employee.pay_type || 'Not Specified'}</p>
                </div>
                {employee.pay_rate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Pay Rate</p>
                    <p className="font-medium">
                      ${employee.pay_rate.toLocaleString()}
                      {employee.pay_type === 'hourly' ? '/hr' : employee.pay_type === 'salary' ? '/yr' : ''}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Classification</p>
                  <p className="font-medium capitalize">{employee.classification || 'Not Specified'}</p>
                </div>
                {employee.last_raise_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Raise</p>
                    <p className="font-medium">
                      {new Date(employee.last_raise_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employee.emergency_contact_name ? (
                  <div className="space-y-2">
                    <p className="font-medium">{employee.emergency_contact_name}</p>
                    {employee.emergency_contact_relationship && (
                      <p className="text-sm text-muted-foreground">{employee.emergency_contact_relationship}</p>
                    )}
                    {employee.emergency_contact_phone && (
                      <a href={`tel:${employee.emergency_contact_phone}`} className="text-sm hover:underline">
                        {employee.emergency_contact_phone}
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No emergency contact on file</p>
                )}
              </CardContent>
            </Card>

            {/* PTO Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Time Off
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">PTO Balance</p>
                    <p className="font-medium">{employee.pto_balance_hours || 0} hours</p>
                  </div>
                  <Progress value={(employee.pto_balance_hours || 0) / 40 * 100} className="h-2" />
                </div>
                {ptoRequests && ptoRequests.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Recent Requests</p>
                    {ptoRequests.slice(0, 3).map((pto) => (
                      <div key={pto.id} className="flex items-center justify-between text-sm py-1">
                        <span>{new Date(pto.start_date).toLocaleDateString()}</span>
                        <Badge variant="outline" className="capitalize">
                          {pto.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Points */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Attendance Points
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Current Points</p>
                    <p className={`font-bold text-lg ${
                      employee.attendance_points >= 7 ? 'text-red-600' :
                      employee.attendance_points >= 5 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {employee.attendance_points || 0}
                    </p>
                  </div>
                  <Progress 
                    value={(employee.attendance_points || 0) / 10 * 100} 
                    className={`h-2 ${
                      employee.attendance_points >= 7 ? '[&>div]:bg-red-600' :
                      employee.attendance_points >= 5 ? '[&>div]:bg-yellow-600' : ''
                    }`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0</span>
                    <span>Termination: 10</span>
                  </div>
                </div>
                <div>
                  <Badge 
                    variant={
                      employee.attendance_points >= 7 ? 'destructive' :
                      employee.attendance_points >= 5 ? 'secondary' : 'outline'
                    }
                    className="capitalize"
                  >
                    {employee.discipline_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Licenses */}
          {licenses && licenses.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Licenses & Certifications
                  </CardTitle>
                  <Link href="/licenses">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {licenses.map((license) => {
                    const daysUntilExpiry = license.expiration_date 
                      ? Math.ceil((new Date(license.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null
                    
                    return (
                      <div key={license.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{license.license_type}</p>
                          <Badge 
                            variant={
                              !daysUntilExpiry ? 'secondary' :
                              daysUntilExpiry <= 0 ? 'destructive' :
                              daysUntilExpiry <= 30 ? 'destructive' :
                              daysUntilExpiry <= 90 ? 'secondary' : 'outline'
                            }
                          >
                            {!daysUntilExpiry ? 'No Expiry' :
                             daysUntilExpiry <= 0 ? 'Expired' :
                             `${daysUntilExpiry} days`}
                          </Badge>
                        </div>
                        {license.license_number && (
                          <p className="text-sm text-muted-foreground">#{license.license_number}</p>
                        )}
                        {license.expiration_date && (
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(license.expiration_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {employee.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{employee.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Employee documents and agreements</CardDescription>
                </div>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Send Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.document_name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{doc.document_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">{doc.status}</Badge>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3" />
                  <p>No documents yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>Recent attendance records</CardDescription>
                </div>
                <Link href="/attendance">
                  <Button variant="outline">View Full History</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {attendance && attendance.length > 0 ? (
                <div className="space-y-2">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.actual_start || record.scheduled_start} - {record.actual_end || record.scheduled_end}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={
                            record.status === 'present' ? 'default' :
                            record.status === 'absent' ? 'destructive' : 'secondary'
                          }
                          className="capitalize"
                        >
                          {record.status}
                        </Badge>
                        {record.points_assessed > 0 && (
                          <Badge variant="outline">+{record.points_assessed} pts</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3" />
                  <p>No attendance records yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Reviews</CardTitle>
                  <CardDescription>Review history and ratings</CardDescription>
                </div>
                <Link href="/performance">
                  <Button>Schedule Review</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium capitalize">{review.review_type?.replace('_', ' ')} Review</p>
                        <Badge variant="outline" className="capitalize">{review.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.scheduled_date && `Scheduled: ${new Date(review.scheduled_date).toLocaleDateString()}`}
                      </p>
                      {review.overall_rating && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Overall Rating</p>
                          <p className="text-lg font-bold">{review.overall_rating}/5.0</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-3" />
                  <p>No reviews yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Training & Development</CardTitle>
                  <CardDescription>Assigned courses and certifications</CardDescription>
                </div>
                <Link href="/training">
                  <Button>Assign Training</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {training && training.length > 0 ? (
                <div className="space-y-4">
                  {training.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.training_courses?.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {item.training_courses?.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.due_date && (
                          <span className="text-sm text-muted-foreground">
                            Due: {new Date(item.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <Badge 
                          variant={
                            item.status === 'complete' ? 'default' :
                            item.status === 'overdue' ? 'destructive' : 'secondary'
                          }
                          className="capitalize"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3" />
                  <p>No training assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discipline Tab */}
        <TabsContent value="discipline">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Discipline History</CardTitle>
                  <CardDescription>Incident records and warnings</CardDescription>
                </div>
                <Link href="/discipline">
                  <Button variant="outline">Log Incident</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {disciplineIncidents && disciplineIncidents.length > 0 ? (
                <div className="space-y-4">
                  {disciplineIncidents.map((incident) => (
                    <div key={incident.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium capitalize">{incident.category}</p>
                        <Badge 
                          variant={
                            incident.discipline_level === 'termination' ? 'destructive' :
                            incident.discipline_level === 'final' ? 'destructive' :
                            incident.discipline_level === 'written' ? 'secondary' : 'outline'
                          }
                          className="capitalize"
                        >
                          {incident.discipline_level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(incident.incident_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-2 line-clamp-2">{incident.description}</p>
                      {incident.points_assessed > 0 && (
                        <Badge variant="outline" className="mt-2">
                          +{incident.points_assessed} points
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No discipline incidents</p>
                  <p className="text-sm">This employee has a clean record</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Star(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
