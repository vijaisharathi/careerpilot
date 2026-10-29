export interface SeedJobOpportunity {
  title: string;
  slug: string;
  company: string;
  companyLogo: string;
  description: string;
  roleCategory: string;
  employmentType: 'Full-time' | 'Internship' | 'Co-op' | 'Contract';
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  location: string;
  compensation: {
    amount: string;
    currency: string;
    period: 'yearly' | 'monthly' | 'hourly';
  };
  experienceRequirements: {
    minYears: number;
    level: 'Entry-Level' | 'Internship' | 'Associate' | 'Mid-Level';
  };
  requiredSkills: Array<{
    name: string;
    minProficiency: 'Beginner' | 'Intermediate' | 'Advanced';
    importance: 'critical' | 'recommended';
    weight: number;
  }>;
  preferredSkills: string[];
  minimumQualifications: {
    minDegreeLevel?: string;
    allowedMajors?: string[];
    minGpa?: number;
    minGraduationYear?: number;
    maxGraduationYear?: number;
    additionalRequirements?: string[];
  };
  responsibilities: string[];
  applicationUrl: string;
  source: string;
  dataSourceType: 'seed_demonstration';
  isVerifiedVacancy: boolean;
  demoDisclaimer: string;
  publicationDate: Date;
  applicationDeadline?: Date;
  status: 'active' | 'expired' | 'archived';
}

export const SEED_JOB_OPPORTUNITIES: SeedJobOpportunity[] = [
  {
    title: 'Full-Stack Software Engineer (New Grad 2026)',
    slug: 'stripe-fullstack-software-engineer-2026',
    company: 'Stripe',
    companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=150&q=80',
    description:
      'Join Stripe’s Core Payments Engineering team to design, build, and deploy resilient web applications and financial APIs that power millions of businesses worldwide.',
    roleCategory: 'Full-Stack Development',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    location: 'San Jose, CA',
    compensation: {
      amount: '$135,000 - $160,000',
      currency: 'USD',
      period: 'yearly',
    },
    experienceRequirements: {
      minYears: 0,
      level: 'Entry-Level',
    },
    requiredSkills: [
      { name: 'TypeScript', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'React.js', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Node.js & Express', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'RESTful API Design', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'MongoDB & Mongoose', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
      { name: 'Git & GitHub', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
    ],
    preferredSkills: ['Redis', 'Docker', 'PostgreSQL', 'Tailwind CSS'],
    minimumQualifications: {
      minDegreeLevel: "Bachelor's",
      allowedMajors: ['Computer Science', 'Software Engineering', 'Information Technology', 'Computer Engineering'],
      minGpa: 3.2,
      minGraduationYear: 2025,
      maxGraduationYear: 2027,
      additionalRequirements: ['Authorized to work in the United States', 'Strong foundation in data structures & algorithms'],
    },
    responsibilities: [
      'Build end-to-end user-facing dashboards and real-time transaction reporting interfaces.',
      'Design idempotent RESTful API endpoints handling high financial transaction volume.',
      'Participate in Agile sprint planning, asynchronous code reviews, and automated CI pipelines.',
    ],
    applicationUrl: 'https://stripe.com/jobs',
    source: 'Campus Placement Partner Drive',
    dataSourceType: 'seed_demonstration',
    isVerifiedVacancy: false,
    demoDisclaimer:
      'Demo / Seed Listing — Simulated vacancy for college placement preparation & skill-gap auditing. Not an active verified third-party hire.',
    publicationDate: new Date('2026-10-15T00:00:00Z'),
    applicationDeadline: new Date('2026-12-15T00:00:00Z'),
    status: 'active',
  },
  {
    title: 'Backend Systems Engineer Intern (Summer 2026)',
    slug: 'datadog-backend-systems-intern-2026',
    company: 'Datadog',
    companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=150&q=80',
    description:
      'Datadog is seeking engineering interns to join our Metrics and Observability Backend teams. You will work on high-throughput distributed ingestion pipelines and real-time query engines.',
    roleCategory: 'Backend Engineering',
    employmentType: 'Internship',
    workMode: 'Remote',
    location: 'Remote, US',
    compensation: {
      amount: '$52 - $60 / hr',
      currency: 'USD',
      period: 'hourly',
    },
    experienceRequirements: {
      minYears: 0,
      level: 'Internship',
    },
    requiredSkills: [
      { name: 'Python', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Node.js & Express', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'PostgreSQL', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Git & GitHub', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
      { name: 'Docker', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
    ],
    preferredSkills: ['Go', 'Redis', 'Kubernetes', 'Linux'],
    minimumQualifications: {
      minDegreeLevel: "Bachelor's",
      allowedMajors: ['Computer Science', 'Computer Engineering', 'Mathematics'],
      minGpa: 3.0,
      minGraduationYear: 2026,
      maxGraduationYear: 2028,
      additionalRequirements: ['Enrolled in an accredited undergraduate degree program'],
    },
    responsibilities: [
      'Optimize database queries and background worker queues processing millions of events per second.',
      'Write comprehensive unit and integration tests maintaining 90%+ code coverage.',
      'Containerize microservices using Docker for seamless developer preview environments.',
    ],
    applicationUrl: 'https://careers.datadoghq.com',
    source: 'Enterprise University Relations',
    dataSourceType: 'seed_demonstration',
    isVerifiedVacancy: false,
    demoDisclaimer:
      'Demo / Seed Listing — Simulated vacancy for college placement preparation & skill-gap auditing. Not an active verified third-party hire.',
    publicationDate: new Date('2026-10-18T00:00:00Z'),
    applicationDeadline: new Date('2026-12-31T00:00:00Z'),
    status: 'active',
  },
  {
    title: 'Frontend React Engineer',
    slug: 'linear-frontend-react-engineer',
    company: 'Linear',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=150&q=80',
    description:
      'Linear builds the issue-tracking tool modern software teams love. We are hiring a frontend engineer obsessed with 60fps animations, keyboard-first interactions, and state management.',
    roleCategory: 'Frontend Development',
    employmentType: 'Full-time',
    workMode: 'Remote',
    location: 'Remote (Worldwide)',
    compensation: {
      amount: '$140,000 - $170,000',
      currency: 'USD',
      period: 'yearly',
    },
    experienceRequirements: {
      minYears: 0,
      level: 'Entry-Level',
    },
    requiredSkills: [
      { name: 'TypeScript', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'React.js', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'JavaScript (ES6+)', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Tailwind CSS', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Git & GitHub', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
    ],
    preferredSkills: ['Next.js', 'WebSockets', 'IndexedDB', 'Vite'],
    minimumQualifications: {
      minDegreeLevel: "Bachelor's",
      allowedMajors: ['Computer Science', 'Software Engineering', 'Human-Computer Interaction'],
      minGpa: 3.0,
      minGraduationYear: 2024,
      maxGraduationYear: 2027,
    },
    responsibilities: [
      'Develop high-performance, accessible, and responsive components using React and Tailwind CSS.',
      'Implement optimistic client-side UI updates synchronized with local storage and WebSockets.',
      'Collaborate with product designers to refine interaction models and typography standards.',
    ],
    applicationUrl: 'https://linear.app/careers',
    source: 'Direct Career Site',
    dataSourceType: 'seed_demonstration',
    isVerifiedVacancy: false,
    demoDisclaimer:
      'Demo / Seed Listing — Simulated vacancy for college placement preparation & skill-gap auditing. Not an active verified third-party hire.',
    publicationDate: new Date('2026-10-20T00:00:00Z'),
    applicationDeadline: new Date('2027-01-30T00:00:00Z'),
    status: 'active',
  },
  {
    title: 'Machine Learning & AI Engineering Intern',
    slug: 'scale-ai-ml-intern-2026',
    company: 'Scale AI',
    companyLogo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=150&q=80',
    description:
      'Work alongside world-class machine learning researchers and applied AI engineers to train, fine-tune, and evaluate frontier foundation models and data labeling pipelines.',
    roleCategory: 'Artificial Intelligence',
    employmentType: 'Internship',
    workMode: 'On-site',
    location: 'San Francisco, CA',
    compensation: {
      amount: '$55 - $65 / hr',
      currency: 'USD',
      period: 'hourly',
    },
    experienceRequirements: {
      minYears: 0,
      level: 'Internship',
    },
    requiredSkills: [
      { name: 'Python', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Machine Learning', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'SQL', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Git & GitHub', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
    ],
    preferredSkills: ['PyTorch', 'TensorFlow', 'FastAPI', 'Docker', 'Transformers'],
    minimumQualifications: {
      minDegreeLevel: "Bachelor's",
      allowedMajors: ['Computer Science', 'Data Science', 'Artificial Intelligence', 'Mathematics', 'Statistics'],
      minGpa: 3.5,
      minGraduationYear: 2026,
      maxGraduationYear: 2028,
    },
    responsibilities: [
      'Benchmark LLM reasoning capabilities across synthetic code generation and evaluation datasets.',
      'Build automated evaluation harnesses and prompt validation workflows in Python.',
      'Deploy reproducible evaluation pipelines using Docker and cloud GPUs.',
    ],
    applicationUrl: 'https://scale.com/careers',
    source: 'Campus AI Consortium',
    dataSourceType: 'seed_demonstration',
    isVerifiedVacancy: false,
    demoDisclaimer:
      'Demo / Seed Listing — Simulated vacancy for college placement preparation & skill-gap auditing. Not an active verified third-party hire.',
    publicationDate: new Date('2026-10-22T00:00:00Z'),
    applicationDeadline: new Date('2026-12-20T00:00:00Z'),
    status: 'active',
  },
  {
    title: 'Cloud Infrastructure & DevOps Engineer (New Grad)',
    slug: 'hashicorp-cloud-devops-engineer-2026',
    company: 'HashiCorp (IBM)',
    companyLogo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&q=80',
    description:
      'Build reliable multi-cloud infrastructure automation, CI/CD deployment pipelines, and Kubernetes orchestration clusters powering cloud services worldwide.',
    roleCategory: 'Cloud & DevOps',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    location: 'Austin, TX',
    compensation: {
      amount: '$120,000 - $145,000',
      currency: 'USD',
      period: 'yearly',
    },
    experienceRequirements: {
      minYears: 0,
      level: 'Entry-Level',
    },
    requiredSkills: [
      { name: 'Docker', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'AWS', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Git & GitHub', minProficiency: 'Advanced', importance: 'critical', weight: 4 },
      { name: 'Linux', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Python', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
    ],
    preferredSkills: ['Kubernetes', 'Terraform', 'CI/CD Pipelines', 'Golang'],
    minimumQualifications: {
      minDegreeLevel: "Bachelor's",
      allowedMajors: ['Computer Science', 'Information Technology', 'Computer Engineering'],
      minGpa: 3.0,
      minGraduationYear: 2025,
      maxGraduationYear: 2027,
    },
    responsibilities: [
      'Write Infrastructure-as-Code modules for automated VPC, cluster, and DNS provisioning.',
      'Configure automated GitHub Actions workflows with zero-downtime deployment strategies.',
      'Monitor distributed services health metrics, alerting rules, and incident remediation.',
    ],
    applicationUrl: 'https://www.hashicorp.com/jobs',
    source: 'University Tech Fair',
    dataSourceType: 'seed_demonstration',
    isVerifiedVacancy: false,
    demoDisclaimer:
      'Demo / Seed Listing — Simulated vacancy for college placement preparation & skill-gap auditing. Not an active verified third-party hire.',
    publicationDate: new Date('2026-10-14T00:00:00Z'),
    applicationDeadline: new Date('2026-12-05T00:00:00Z'),
    status: 'active',
  },
  {
    title: 'Data Analyst Intern (Analytics & BI)',
    slug: 'snowflake-data-analyst-intern-2026',
    company: 'Snowflake',
    companyLogo: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=150&q=80',
    description:
      'Analyze enterprise data warehouses, build interactive business intelligence dashboards, and conduct statistical correlation analyses for product growth.',
    roleCategory: 'Data Analytics',
    employmentType: 'Internship',
    workMode: 'Hybrid',
    location: 'San Mateo, CA',
    compensation: {
      amount: '$45 - $52 / hr',
      currency: 'USD',
      period: 'hourly',
    },
    experienceRequirements: {
      minYears: 0,
      level: 'Internship',
    },
    requiredSkills: [
      { name: 'SQL', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Python', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Data Structures & Algorithms', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
    ],
    preferredSkills: ['Tableau', 'Power BI', 'Pandas', 'Data Warehousing'],
    minimumQualifications: {
      minDegreeLevel: "Bachelor's",
      allowedMajors: ['Data Science', 'Computer Science', 'Economics', 'Information Systems', 'Statistics'],
      minGpa: 3.2,
      minGraduationYear: 2026,
      maxGraduationYear: 2028,
    },
    responsibilities: [
      'Author optimized SQL queries aggregating billions of event logs for executive reporting.',
      'Design clear data visualizations translating complex metrics into actionable insights.',
      'Partner with product managers to validate hypotheses using A/B testing statistical frameworks.',
    ],
    applicationUrl: 'https://careers.snowflake.com',
    source: 'Campus Placement Partner Drive',
    dataSourceType: 'seed_demonstration',
    isVerifiedVacancy: false,
    demoDisclaimer:
      'Demo / Seed Listing — Simulated vacancy for college placement preparation & skill-gap auditing. Not an active verified third-party hire.',
    publicationDate: new Date('2026-10-12T00:00:00Z'),
    applicationDeadline: new Date('2026-11-30T00:00:00Z'),
    status: 'active',
  },
  {
    title: 'Java & Spring Boot Backend Engineer',
    slug: 'jpmorgan-java-backend-engineer',
    company: 'JPMorgan Chase & Co.',
    companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&q=80',
    description:
      'Architect robust enterprise banking microservices handling distributed transactions, secure authentication, and relational data persistence at scale.',
    roleCategory: 'Backend Engineering',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    location: 'Bengaluru, India',
    compensation: {
      amount: '₹18,00,000 - ₹24,00,000',
      currency: 'INR',
      period: 'yearly',
    },
    experienceRequirements: {
      minYears: 0,
      level: 'Entry-Level',
    },
    requiredSkills: [
      { name: 'Java', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Spring Boot', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'SQL', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'RESTful API Design', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Git & GitHub', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
    ],
    preferredSkills: ['Hibernate', 'PostgreSQL', 'Docker', 'Kafka'],
    minimumQualifications: {
      minDegreeLevel: "Bachelor's",
      allowedMajors: ['Computer Science', 'Information Technology', 'Computer Engineering', 'Electronics'],
      minGpa: 3.0,
      minGraduationYear: 2025,
      maxGraduationYear: 2027,
    },
    responsibilities: [
      'Design modular Spring Boot REST controllers adhering to clean architecture standards.',
      'Optimize relational database transactions with ACID compliance and proper indexing.',
      'Implement OAuth2/JWT security filters and write automated JUnit 5 test suites.',
    ],
    applicationUrl: 'https://careers.jpmorgan.com',
    source: 'National Campus Drive',
    dataSourceType: 'seed_demonstration',
    isVerifiedVacancy: false,
    demoDisclaimer:
      'Demo / Seed Listing — Simulated vacancy for college placement preparation & skill-gap auditing. Not an active verified third-party hire.',
    publicationDate: new Date('2026-10-10T00:00:00Z'),
    applicationDeadline: new Date('2026-12-10T00:00:00Z'),
    status: 'active',
  },
  {
    title: 'Cybersecurity Analyst (Threat Intelligence)',
    slug: 'crowdstrike-cybersecurity-analyst',
    company: 'CrowdStrike',
    companyLogo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=150&q=80',
    description:
      'Investigate modern adversary tactics, perform network traffic analysis, audit security configurations, and contribute to automated detection rules.',
    roleCategory: 'Cybersecurity',
    employmentType: 'Full-time',
    workMode: 'On-site',
    location: 'Sunnyvale, CA',
    compensation: {
      amount: '$115,000 - $140,000',
      currency: 'USD',
      period: 'yearly',
    },
    experienceRequirements: {
      minYears: 0,
      level: 'Entry-Level',
    },
    requiredSkills: [
      { name: 'Cybersecurity Fundamentals', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Linux', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Python', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Git & GitHub', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
    ],
    preferredSkills: ['Wireshark', 'SIEM', 'OWASP Top 10', 'Penetration Testing'],
    minimumQualifications: {
      minDegreeLevel: "Bachelor's",
      allowedMajors: ['Cybersecurity', 'Computer Science', 'Information Security', 'Computer Networks'],
      minGpa: 3.0,
      minGraduationYear: 2025,
      maxGraduationYear: 2027,
    },
    responsibilities: [
      'Monitor intrusion detection sensors and analyze malicious binary signatures.',
      'Automate threat intelligence correlation scripts in Python.',
      'Participate in purple team attack simulations and vulnerability remediations.',
    ],
    applicationUrl: 'https://crowdstrike.com/careers',
    source: 'Cybersecurity Collegiate Partnership',
    dataSourceType: 'seed_demonstration',
    isVerifiedVacancy: false,
    demoDisclaimer:
      'Demo / Seed Listing — Simulated vacancy for college placement preparation & skill-gap auditing. Not an active verified third-party hire.',
    publicationDate: new Date('2026-10-08T00:00:00Z'),
    applicationDeadline: new Date('2026-12-01T00:00:00Z'),
    status: 'active',
  },
  {
    title: 'Distributed Systems & Network Engineer',
    slug: 'cloudflare-distributed-systems-engineer',
    company: 'Cloudflare',
    companyLogo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=150&q=80',
    description:
      'Help build and protect the Internet. Cloudflare runs one of the world’s largest edge networks, caching and accelerating web traffic across 300+ global cities.',
    roleCategory: 'Systems Engineering',
    employmentType: 'Full-time',
    workMode: 'On-site',
    location: 'Austin, TX',
    compensation: {
      amount: '$145,000 - $180,000',
      currency: 'USD',
      period: 'yearly',
    },
    experienceRequirements: {
      minYears: 0,
      level: 'Entry-Level',
    },
    requiredSkills: [
      { name: 'C++', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Linux', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Computer Networks', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Git & GitHub', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
    ],
    preferredSkills: ['Rust', 'BGP', 'TCP/IP', 'eBPF', 'Docker'],
    minimumQualifications: {
      minDegreeLevel: "Bachelor's",
      allowedMajors: ['Computer Science', 'Computer Engineering', 'Electrical Engineering'],
      minGpa: 3.3,
      minGraduationYear: 2025,
      maxGraduationYear: 2027,
    },
    responsibilities: [
      'Write low-latency network proxy code operating directly on network packet streams.',
      'Profile memory allocations, cache misses, and kernel syscall latencies.',
      'Diagnose complex distributed network anomalies across global Points of Presence.',
    ],
    applicationUrl: 'https://cloudflare.com/careers',
    source: 'Direct Career Site',
    dataSourceType: 'seed_demonstration',
    isVerifiedVacancy: false,
    demoDisclaimer:
      'Demo / Seed Listing — Simulated vacancy for college placement preparation & skill-gap auditing. Not an active verified third-party hire.',
    publicationDate: new Date('2026-10-05T00:00:00Z'),
    applicationDeadline: new Date('2026-12-25T00:00:00Z'),
    status: 'active',
  },
  {
    title: 'Legacy Archived Software Trainee (Expired Example)',
    slug: 'legacy-archived-software-trainee-expired',
    company: 'Legacy Corp',
    companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&q=80',
    description: 'Historical archive of past campus hiring cycle. This posting is expired and closed for applications.',
    roleCategory: 'Software Engineering',
    employmentType: 'Full-time',
    workMode: 'On-site',
    location: 'Chicago, IL',
    compensation: {
      amount: '$70,000 - $80,000',
      currency: 'USD',
      period: 'yearly',
    },
    experienceRequirements: {
      minYears: 0,
      level: 'Entry-Level',
    },
    requiredSkills: [
      { name: 'Java', minProficiency: 'Beginner', importance: 'critical', weight: 3 },
    ],
    preferredSkills: [],
    minimumQualifications: {
      minDegreeLevel: "Bachelor's",
    },
    responsibilities: ['Legacy maintenance'],
    applicationUrl: 'https://example.com/careers',
    source: 'Archived Campus Feed',
    dataSourceType: 'seed_demonstration',
    isVerifiedVacancy: false,
    demoDisclaimer: 'Demo / Seed Listing — Simulated expired opportunity.',
    publicationDate: new Date('2025-01-01T00:00:00Z'),
    applicationDeadline: new Date('2025-03-01T00:00:00Z'),
    status: 'expired',
  },
];

