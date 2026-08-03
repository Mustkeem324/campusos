export const SYNTHETIC_FIRST_NAMES = [
  'Aditi', 'Kabir', 'Meera', 'Rohan', 'Nisha', 'Arjun', 'Sana', 'Dev',
  'Aarav', 'Priya', 'Anita', 'Rahul', 'Ananya', 'Vikram', 'Neha', 'Karan',
  'Tara', 'Siddharth', 'Isha', 'Aditya', 'Riya', 'Kavya', 'Yash', 'Shruti',
  'Varun', 'Rhea', 'Manish', 'Pooja', 'Gautam', 'Divya', 'Suraj', 'Tanvi',
  'Harsh', 'Swati', 'Alok', 'Deepa', 'Sameer', 'Preeti', 'Rajesh', 'Shweta',
  'Amit', 'Meenakshi', 'Nikhil', 'Sonam', 'Akash', 'Kiran', 'Tarun', 'Anju',
  'Kunal', 'Simran', 'Aman', 'Vandana', 'Deepak', 'Suman', 'Rohit', 'Richa',
  'Suresh', 'Bhavna', 'Vijay', 'Archana', 'Manoj', 'Anushka', 'Sachin', 'Nalini',
  'Ganesh', 'Leela', 'Dinesh', 'Radha', 'Naresh', 'Savita', 'Mahesh', 'Usha',
  'Ramesh', 'Sarita', 'Sanjay', 'Sunita', 'Ashok', 'Kusum', 'Vinod', 'Sarla'
];

export const SYNTHETIC_LAST_NAMES = [
  'Rao', 'Nair', 'Joshi', 'Malhotra', 'Verma', 'Kapoor', 'Sheikh', 'Iyer',
  'Mehta', 'Sharma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Reddy', 'Deshmukh',
  'Chawla', 'Agarwal', 'Bhat', 'Menon', 'Pillai', 'Chopra', 'Sen', 'Banerjee',
  'Roy', 'Dutta', 'Kulkarni', 'Patil', 'Pawar', 'Nambiar', 'Sethi', 'Goyal',
  'Bhasin', 'Trivedi', 'Pandey', 'Mishra', 'Tripathi', 'Shukla', 'Saxena', 'Srivastava',
  'Venkatesh', 'Subramanian', 'Ranganathan', 'Krishnan', 'Murthy', 'Gowda', 'Hegde', 'Shetty'
];

export const DEPARTMENTS = [
  { name: 'Computer Science and Engineering', code: 'CSE' },
  { name: 'Business and Management', code: 'MGMT' },
  { name: 'Mechanical Engineering', code: 'MECH' },
  { name: 'Civil Engineering', code: 'CIVIL' },
  { name: 'Applied Sciences', code: 'SCI' },
  { name: 'Humanities and Communication', code: 'HUM' }
];

export const PROGRAMMES = [
  { name: 'B.Tech Computer Science', code: 'BTECH-CS', deptCode: 'CSE', durationYears: 4 },
  { name: 'B.Tech Artificial Intelligence', code: 'BTECH-AI', deptCode: 'CSE', durationYears: 4 },
  { name: 'B.Tech Mechanical Engineering', code: 'BTECH-ME', deptCode: 'MECH', durationYears: 4 },
  { name: 'B.Tech Civil Engineering', code: 'BTECH-CE', deptCode: 'CIVIL', durationYears: 4 },
  { name: 'BBA Business Administration', code: 'BBA', deptCode: 'MGMT', durationYears: 3 },
  { name: 'MBA Executive', code: 'MBA', deptCode: 'MGMT', durationYears: 2 },
  { name: 'B.Sc Data Science', code: 'BSC-DS', deptCode: 'SCI', durationYears: 3 },
  { name: 'B.Sc Applied Mathematics', code: 'BSC-MATH', deptCode: 'SCI', durationYears: 3 },
  { name: 'BA Communication', code: 'BA-COMM', deptCode: 'HUM', durationYears: 3 },
  { name: 'M.Tech Computer Science', code: 'MTECH-CS', deptCode: 'CSE', durationYears: 2 }
];

export const COURSES = [
  // CSE
  { title: 'Data Structures and Algorithms', code: 'CS-101', credits: 4, deptCode: 'CSE' },
  { title: 'Database Management Systems', code: 'CS-102', credits: 4, deptCode: 'CSE' },
  { title: 'Operating Systems', code: 'CS-201', credits: 4, deptCode: 'CSE' },
  { title: 'Computer Architecture', code: 'CS-202', credits: 3, deptCode: 'CSE' },
  { title: 'Artificial Intelligence & ML', code: 'AI-301', credits: 4, deptCode: 'CSE' },
  { title: 'Software Engineering & Agile', code: 'CS-302', credits: 3, deptCode: 'CSE' },
  // MGMT
  { title: 'Principles of Management', code: 'MG-101', credits: 3, deptCode: 'MGMT' },
  { title: 'Financial Accounting & Costing', code: 'MG-102', credits: 3, deptCode: 'MGMT' },
  { title: 'Marketing Strategy & Analytics', code: 'MG-201', credits: 3, deptCode: 'MGMT' },
  { title: 'Human Resource Management', code: 'MG-202', credits: 3, deptCode: 'MGMT' },
  { title: 'Corporate Finance', code: 'MG-301', credits: 4, deptCode: 'MGMT' },
  // MECH
  { title: 'Thermodynamics & Heat Transfer', code: 'ME-101', credits: 4, deptCode: 'MECH' },
  { title: 'Fluid Mechanics', code: 'ME-102', credits: 4, deptCode: 'MECH' },
  { title: 'Solid Mechanics & CAD', code: 'ME-201', credits: 4, deptCode: 'MECH' },
  { title: 'Manufacturing Operations', code: 'ME-202', credits: 3, deptCode: 'MECH' },
  { title: 'Robotics & Automation', code: 'ME-301', credits: 3, deptCode: 'MECH' },
  // CIVIL
  { title: 'Structural Analysis & Design', code: 'CE-101', credits: 4, deptCode: 'CIVIL' },
  { title: 'Geotechnical Engineering', code: 'CE-102', credits: 4, deptCode: 'CIVIL' },
  { title: 'Environmental Engineering', code: 'CE-201', credits: 3, deptCode: 'CIVIL' },
  { title: 'Transportation & Surveying', code: 'CE-202', credits: 3, deptCode: 'CIVIL' },
  { title: 'Concrete Technology', code: 'CE-301', credits: 3, deptCode: 'CIVIL' },
  // SCI
  { title: 'Calculus & Linear Algebra', code: 'SC-101', credits: 4, deptCode: 'SCI' },
  { title: 'Probability & Applied Statistics', code: 'SC-102', credits: 4, deptCode: 'SCI' },
  { title: 'Physics for Engineers', code: 'SC-201', credits: 4, deptCode: 'SCI' },
  { title: 'Discrete Mathematics', code: 'SC-202', credits: 3, deptCode: 'SCI' },
  // HUM
  { title: 'Technical Communication & Ethics', code: 'HM-101', credits: 2, deptCode: 'HUM' },
  { title: 'Organizational Psychology', code: 'HM-102', credits: 2, deptCode: 'HUM' },
  { title: 'Public Relations & Media', code: 'HM-201', credits: 3, deptCode: 'HUM' },
  { title: 'Academic Research Writing', code: 'HM-202', credits: 2, deptCode: 'HUM' }
];

export const HOSTELS = [
  { name: 'Kaveri Hostel Block A', code: 'KAV-A', capacity: 120 },
  { name: 'Ganga Hostel Block B', code: 'GAN-B', capacity: 120 }
];

export const TRANSPORT_ROUTES = [
  { name: 'Route 1 - City Center to Main Campus', code: 'RT-01', capacity: 50 },
  { name: 'Route 2 - Metro Station to Innovation Campus', code: 'RT-02', capacity: 50 }
];

export const EMPLOYERS = [
  'TCS Innovation Labs', 'Infosys Digital', 'Wipro Technologies',
  'Amazon Web Services', 'Microsoft India', 'Deloitte Consulting',
  'Tata Motors R&D', 'L&T Construction', 'HDFC Bank Corporate'
];
