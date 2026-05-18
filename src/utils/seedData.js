import { KEYS, getItem, setItem } from './storage';

export function seedDatabase() {
  if (getItem(KEYS.seeded)) return;

  const users = [
    {
      id: 'u-student',
      email: 'student@gmail.com',
      password: '1234',
      role: 'student',
      name: 'John Student',
      phone: '+1 555-0101',
      university: 'State University',
      major: 'Computer Science',
      gpa: '3.8',
      accountStatus: 'active',
      profileComplete: true,
    },
    {
      id: 'u-admin',
      email: 'admin@gmail.com',
      password: '1234',
      role: 'admin',
      name: 'Sarah Admin',
      phone: '+1 555-0202',
      department: 'Scholarship Office',
      accountStatus: 'active',
      profileComplete: true,
    },
    {
      id: 'u-institution',
      email: 'institution@gmail.com',
      password: '1234',
      role: 'institution',
      name: 'Metro College',
      phone: '+1 555-0303',
      address: '123 Education Ave, Boston, MA',
      contactPerson: 'Dr. Emily Reed',
      accountStatus: 'active',
      profileComplete: true,
    },
  ];

  const scholarships = [
    {
      id: 'sch-1',
      title: 'Merit Excellence Scholarship',
      description: 'Awarded to students with outstanding academic performance and leadership qualities.',
      amount: 10000,
      deadline: '2026-08-15',
      eligibility: 'GPA 3.5+, full-time enrollment',
      category: 'Merit',
      institutionId: 'u-institution',
      institutionName: 'Metro College',
      status: 'active',
      approvalStatus: 'approved',
      createdBy: 'u-admin',
    },
    {
      id: 'sch-2',
      title: 'STEM Future Leaders Grant',
      description: 'Supporting students pursuing degrees in Science, Technology, Engineering, or Mathematics.',
      amount: 7500,
      deadline: '2026-07-01',
      eligibility: 'STEM major, GPA 3.0+',
      category: 'STEM',
      institutionId: 'u-institution',
      institutionName: 'Metro College',
      status: 'active',
      approvalStatus: 'approved',
      createdBy: 'u-institution',
    },
    {
      id: 'sch-3',
      title: 'Community Service Award',
      description: 'For students who have demonstrated exceptional commitment to community service.',
      amount: 5000,
      deadline: '2026-09-30',
      eligibility: '100+ volunteer hours',
      category: 'Service',
      institutionId: null,
      institutionName: 'ScholarshipHub',
      status: 'active',
      approvalStatus: 'approved',
      createdBy: 'u-admin',
    },
    {
      id: 'sch-4',
      title: 'First Generation Student Fund',
      description: 'Financial support for first-generation college students facing economic hardship.',
      amount: 8000,
      deadline: '2026-06-20',
      eligibility: 'First-gen, demonstrated need',
      category: 'Need-based',
      institutionId: null,
      institutionName: 'ScholarshipHub',
      status: 'active',
      approvalStatus: 'approved',
      createdBy: 'u-admin',
    },
  ];

  const applications = [
    {
      id: 'app-1',
      scholarshipId: 'sch-1',
      scholarshipTitle: 'Merit Excellence Scholarship',
      studentId: 'u-student',
      studentName: 'John Student',
      studentEmail: 'student@gmail.com',
      status: 'pending',
      institutionStatus: 'verified',
      forwardedToAdmin: true,
      appliedAt: '2026-04-10',
      essay: 'I am passionate about technology and community leadership...',
      notes: '',
    },
  ];

  const documents = [
    {
      id: 'doc-1',
      studentId: 'u-student',
      studentName: 'John Student',
      name: 'Transcript.pdf',
      type: 'transcript',
      uploadedAt: '2026-04-08',
      verified: true,
      verifiedBy: 'u-institution',
    },
    {
      id: 'doc-2',
      studentId: 'u-student',
      studentName: 'John Student',
      name: 'Recommendation_Letter.pdf',
      type: 'recommendation',
      uploadedAt: '2026-04-09',
      verified: false,
      verifiedBy: null,
    },
  ];

  const announcements = [
    {
      id: 'ann-1',
      title: '2026 Scholarship Season Open',
      content: 'Applications for the 2026 academic year are now open. Submit before deadlines!',
      createdAt: '2026-05-01',
      createdBy: 'u-admin',
    },
    {
      id: 'ann-2',
      title: 'Document Verification Reminder',
      content: 'Please upload all required documents before applying for scholarships.',
      createdAt: '2026-05-05',
      createdBy: 'u-admin',
    },
  ];

  setItem(KEYS.users, users);
  setItem(KEYS.scholarships, scholarships);
  setItem(KEYS.applications, applications);
  setItem(KEYS.documents, documents);
  setItem(KEYS.announcements, announcements);
  setItem(KEYS.seeded, true);
}
