import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { db, role, tenantId, session, userId } = await requireTenantContext();

    let data: any = {};

    if (role === 'SUPER_ADMIN') {
      const activeInstitutions = await db.institution.count({ where: { status: 'ACTIVE' } });
      const totalUsers = await db.user.count();
      const recentAudits = await db.auditLog.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
      });
      data = {
        activeInstitutions,
        totalUsers,
        recentAudits,
      };
    } else if (role === 'INSTITUTION_ADMIN') {
      const students = await db.user.count({ where: { role: 'STUDENT', tenantId } });
      const faculty = await db.user.count({ where: { role: 'FACULTY', tenantId } });
      const courses = await db.course.count({ where: { department: { institution: { id: tenantId } } } });
      
      const payments = await db.payment.aggregate({
        _sum: { amount: true },
        where: { tenantId, status: 'PAID' }
      });
      const termFeeCollection = payments._sum.amount || 0;

      data = { students, faculty, courses, termFeeCollection };
    } else if (role === 'HOD') {
      // Find the user's department
      const user = await db.user.findUnique({
        where: { id: session.userId },
        include: { staffProfile: true }
      });
      const deptId = user?.staffProfile.departmentId;
      
      const coursesOffered = deptId ? await db.course.count({ where: { departmentId: deptId } }) : 0;
      
      let facultyWorkloadAvg = '0 hrs/wk';
      if (deptId) {
        const staffInDept = await db.staff.count({ where: { departmentId: deptId } });
        const courses = await db.courseOffering.count({ where: { course: { departmentId: deptId } } });
        const workload = staffInDept > 0 ? (courses * 3 / staffInDept).toFixed(1) : 0;
        facultyWorkloadAvg = `${workload} hrs/wk`;
      }
      
      const defaulterAttendance = 0;
      data = { coursesOffered, facultyWorkloadAvg, defaulterAttendance };
    } else if (role === 'FACULTY') {
      const facultyStaff = await db.staff.findUnique({ where: { userId: session.userId } });
      const todayClasses = facultyStaff ? await db.attendanceSession.count({
        where: { tenantId, courseOffering: { facultyId: facultyStaff.id } }
      }) : 0;
      const attendanceMarked = todayClasses > 0 ? 100 : 0;
      const assignmentsToGrade = facultyStaff ? await db.submission.count({
        where: { tenantId, assignment: { courseOffering: { facultyId: facultyStaff.id } }, marksObtained: null }
      }) : 0;
      const openStudentDoubts = await db.ticket.count({ where: { tenantId, status: 'OPEN' } });
      data = { todayClasses, attendanceMarked, assignmentsToGrade, openStudentDoubts };
    } else if (role === 'STUDENT') {
      const studentData = await db.student.findUnique({ where: { userId: session.userId } });
      const cgpa = studentData?.cgpa || 0;
      const enrolledCredits = studentData?.creditsEarned || 0;
      
      const attendanceRecords = await db.attendanceRecord.findMany({
        where: { tenantId, studentId: studentData?.id || '' }
      });
      const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
      const attendanceHealth = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 100;
      
      const pendingInvoices = await db.invoice.aggregate({
        _sum: { amount: true },
        where: { tenantId, student: { userId: session.userId }, status: 'PENDING' }
      });
      const feeDuesPending = pendingInvoices._sum.amount || 0;
      data = { cgpa, attendanceHealth, enrolledCredits, feeDuesPending };
    } else if (role === 'PARENT') {
      const parentUser = await db.user.findUnique({ 
        where: { id: session.userId }, 
        include: { guardianProfile: { include: { students: true } } } 
      });
      const child = parentUser?.guardianProfile.students[0];
      
      let childAttendance = 100;
      let latestTermGrade = 0;
      let upcomingFeeDue = 0;
      
      if (child) {
        latestTermGrade = child.cgpa;
        const records = await db.attendanceRecord.findMany({ where: { studentId: child.id } });
        const present = records.filter(r => r.status === 'PRESENT').length;
        childAttendance = records.length > 0 ? Math.round((present / records.length) * 100) : 100;
        
        const invoices = await db.invoice.aggregate({
           _sum: { amount: true },
           where: { studentId: child.id, status: 'PENDING' }
        });
        upcomingFeeDue = invoices._sum.amount || 0;
      }
      data = { childAttendance, latestTermGrade, upcomingFeeDue };
    } else if (role === 'WARDEN') {
      const totalHostelRooms = await db.roomHostel.count({ where: { hostel: { tenantId } } });
      
      const totalCapacityAgg = await db.roomHostel.aggregate({
        _sum: { capacity: true },
        where: { hostel: { tenantId } }
      });
      const totalCapacity = totalCapacityAgg._sum.capacity || 1;
      
      const totalAllocations = await db.allocation.count({
        where: { roomHostel: { hostel: { tenantId } } }
      });
      
      const occupancyRate = Math.round((totalAllocations / totalCapacity) * 100);
      const studentsOutOfCampus = 0;
      
      const openComplaints = await db.ticket.count({
        where: { tenantId, status: 'OPEN' }
      });
      
      data = { totalHostelRooms, occupancyRate, studentsOutOfCampus, openComplaints };
    } else if (role === 'ACCOUNTANT') {
      const todaysCollections = await db.payment.aggregate({
        _sum: { amount: true },
        where: { tenantId, status: 'PAID' } // assuming PaymentStatus has PAID
      });
      
      const pendingInvoices = await db.invoice.aggregate({
        _sum: { amount: true },
        where: { tenantId, status: 'PENDING' }
      });
      
      const scholarships = await db.scholarship.aggregate({
        _sum: { discountPct: true },
        where: { tenantId }
      });

      data = { 
        todaysCollections: todaysCollections._sum.amount || 0, 
        totalDuesPending: pendingInvoices._sum.amount || 0, 
        reconciledWebhooks: 100, 
        scholarshipDisbursed: scholarships._sum.discountPct || 0 
      };
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Dashboard API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
