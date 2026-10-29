export interface CatalogSkillRequirement {
  name: string;
  category: 'languages' | 'frameworks' | 'databases' | 'cloud' | 'soft_skills';
  minProficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  importance: 'critical' | 'recommended';
  weight: number; // 1 to 5
}

export interface CatalogRoleDefinition {
  title: string;
  slug: string;
  category: string;
  description: string;
  averageSalary: {
    entry: string;
    mid: string;
    currency: string;
  };
  marketDemand: 'Extremely High' | 'High' | 'Moderate';
  growthOutlook: string;
  requiredSkills: CatalogSkillRequirement[];
  eligibilityCriteria: {
    minDegreeLevel: string;
    relevantFields: string[];
  };
  recommendedCertifications: Array<{
    title: string;
    issuer: string;
    importance: 'high' | 'medium';
  }>;
  recommendedProjects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
}

export const CAREER_ROLES_CATALOG: CatalogRoleDefinition[] = [
  {
    title: 'Full-Stack Developer',
    slug: 'full-stack-developer',
    category: 'Software Engineering',
    description:
      'Architects and builds complete web applications from responsive frontend user interfaces to robust server-side APIs, database schemas, and deployment pipelines.',
    averageSalary: {
      entry: '$110,000 - $135,000',
      mid: '$150,000 - $190,000',
      currency: 'USD',
    },
    marketDemand: 'Extremely High',
    growthOutlook: '+25% YoY demand across campus and enterprise hiring',
    requiredSkills: [
      { name: 'TypeScript', category: 'languages', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'JavaScript (ES6+)', category: 'languages', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'React.js', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Node.js & Express', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'MongoDB & Mongoose', category: 'databases', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'RESTful API Design', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'SQL', category: 'databases', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
      { name: 'Tailwind CSS', category: 'frameworks', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
      { name: 'Docker', category: 'cloud', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
      { name: 'Git & GitHub', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Computer Science', 'Information Technology', 'Software Engineering', 'Computer Engineering'],
    },
    recommendedCertifications: [
      { title: 'Meta Front-End & Back-End Developer Professional Certificate', issuer: 'Meta', importance: 'high' },
      { title: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', importance: 'medium' },
    ],
    recommendedProjects: [
      {
        title: 'Full-Stack Collaborative Workspace or SaaS Platform',
        description: 'Multi-tenant web app with JWT authentication, role-based access control, MongoDB/PostgreSQL persistence, and live updates.',
        technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
      },
      {
        title: 'RESTful E-Commerce or Job Portal with Payment Gateway',
        description: 'Complete order/application pipeline with server-side validation, caching, and third-party API integration.',
        technologies: ['TypeScript', 'Express', 'Redis', 'PostgreSQL'],
      },
    ],
  },
  {
    title: 'Frontend Developer',
    slug: 'frontend-developer',
    category: 'Software Engineering',
    description:
      'Creates high-performance, accessible, and delightful web and mobile user interfaces using modern client frameworks, state management, and design systems.',
    averageSalary: {
      entry: '$100,000 - $125,000',
      mid: '$140,000 - $180,000',
      currency: 'USD',
    },
    marketDemand: 'High',
    growthOutlook: '+20% YoY demand in product-led tech companies',
    requiredSkills: [
      { name: 'JavaScript (ES6+)', category: 'languages', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'TypeScript', category: 'languages', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'React.js', category: 'frameworks', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Tailwind CSS', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'HTML5 & CSS3', category: 'frameworks', minProficiency: 'Advanced', importance: 'critical', weight: 4 },
      { name: 'RESTful API Design', category: 'frameworks', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
      { name: 'Git & GitHub', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Web Performance & Accessibility (a11y)', category: 'soft_skills', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Computer Science', 'Information Systems', 'Web Development', 'Design & Technology'],
    },
    recommendedCertifications: [
      { title: 'Meta Front-End Developer Professional Certificate', issuer: 'Meta', importance: 'high' },
      { title: 'OpenJS Node.js Application Developer (JSNAD)', issuer: 'OpenJS Foundation', importance: 'medium' },
    ],
    recommendedProjects: [
      {
        title: 'Interactive Design System & Component Library',
        description: 'Accessible UI library featuring modals, dropdowns, keyboard navigation, and theme customization published as an npm package.',
        technologies: ['TypeScript', 'React', 'Tailwind CSS', 'Storybook'],
      },
    ],
  },
  {
    title: 'Backend Developer',
    slug: 'backend-developer',
    category: 'Software Engineering',
    description:
      'Specializes in low-latency APIs, distributed architectures, database transactions, concurrency, and high-throughput streaming systems.',
    averageSalary: {
      entry: '$115,000 - $140,000',
      mid: '$160,000 - $205,000',
      currency: 'USD',
    },
    marketDemand: 'Extremely High',
    growthOutlook: '+23% YoY sustained growth across cloud services',
    requiredSkills: [
      { name: 'Node.js & Express', category: 'frameworks', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'TypeScript', category: 'languages', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'PostgreSQL', category: 'databases', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'MongoDB & Mongoose', category: 'databases', minProficiency: 'Intermediate', importance: 'recommended', weight: 4 },
      { name: 'RESTful API Design', category: 'frameworks', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Redis', category: 'databases', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
      { name: 'Docker', category: 'cloud', minProficiency: 'Intermediate', importance: 'recommended', weight: 4 },
      { name: 'Data Structures & Algorithms', category: 'soft_skills', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Git & GitHub', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Computer Science', 'Software Engineering', 'Computer Engineering'],
    },
    recommendedCertifications: [
      { title: 'AWS Certified Developer - Associate', issuer: 'Amazon Web Services', importance: 'high' },
      { title: 'MongoDB Certified Developer Associate', issuer: 'MongoDB Inc.', importance: 'medium' },
    ],
    recommendedProjects: [
      {
        title: 'High-Concurrency Event-Driven Notification Engine',
        description: 'Microservices architecture with Redis pub/sub queue, rate limiting, and PostgreSQL transactions.',
        technologies: ['Node.js', 'TypeScript', 'Redis', 'PostgreSQL', 'Docker'],
      },
    ],
  },
  {
    title: 'Java Developer',
    slug: 'java-developer',
    category: 'Software Engineering',
    description:
      'Engineers enterprise-scale backend services, microservices, and transaction management platforms using the Java and Spring Boot ecosystem.',
    averageSalary: {
      entry: '$105,000 - $130,000',
      mid: '$145,000 - $190,000',
      currency: 'USD',
    },
    marketDemand: 'High',
    growthOutlook: '+18% YoY driven by banking, fintech, and enterprise IT',
    requiredSkills: [
      { name: 'Java', category: 'languages', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Spring Boot', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'SQL', category: 'databases', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'RESTful API Design', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'PostgreSQL', category: 'databases', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
      { name: 'Data Structures & Algorithms', category: 'soft_skills', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Git & GitHub', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Docker', category: 'cloud', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Computer Science', 'Information Technology', 'Software Engineering'],
    },
    recommendedCertifications: [
      { title: 'Oracle Certified Professional: Java SE 17 Developer', issuer: 'Oracle', importance: 'high' },
      { title: 'Spring Certified Professional', issuer: 'VMware Tanzu', importance: 'high' },
    ],
    recommendedProjects: [
      {
        title: 'Enterprise Banking & Transaction Management Microservice',
        description: 'Spring Boot service featuring Spring Data JPA, JWT security, Liquibase migrations, and unit tests with Mockito.',
        technologies: ['Java', 'Spring Boot', 'PostgreSQL', 'Hibernate', 'JUnit'],
      },
    ],
  },
  {
    title: 'Python Developer',
    slug: 'python-developer',
    category: 'Software Engineering',
    description:
      'Develops scalable web backends, automation workflows, data integration tools, and scripting pipelines using Python and modern web frameworks.',
    averageSalary: {
      entry: '$105,000 - $130,000',
      mid: '$145,000 - $185,000',
      currency: 'USD',
    },
    marketDemand: 'High',
    growthOutlook: '+22% YoY in SaaS, data engineering, and automation',
    requiredSkills: [
      { name: 'Python', category: 'languages', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'FastAPI / Django', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'SQL', category: 'databases', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'PostgreSQL', category: 'databases', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
      { name: 'RESTful API Design', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Docker', category: 'cloud', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
      { name: 'Git & GitHub', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Computer Science', 'Information Systems', 'Applied Mathematics'],
    },
    recommendedCertifications: [
      { title: 'Certified Associate in Python Programming (PCAP)', issuer: 'Python Institute', importance: 'medium' },
      { title: 'AWS Certified Developer - Associate', issuer: 'Amazon Web Services', importance: 'high' },
    ],
    recommendedProjects: [
      {
        title: 'Asynchronous Web Scraper & Intelligence API',
        description: 'FastAPI service that schedules Celery scrapers, sanitizes data with Pydantic, and indexes records in PostgreSQL.',
        technologies: ['Python', 'FastAPI', 'Celery', 'PostgreSQL', 'Redis'],
      },
    ],
  },
  {
    title: 'Data Analyst',
    slug: 'data-analyst',
    category: 'Data & Analytics',
    description:
      'Extracts, cleans, models, and visualizes business data to identify actionable operational trends and empower strategic executive decisions.',
    averageSalary: {
      entry: '$85,000 - $105,000',
      mid: '$115,000 - $150,000',
      currency: 'USD',
    },
    marketDemand: 'High',
    growthOutlook: '+19% YoY cross-industry corporate adoption',
    requiredSkills: [
      { name: 'SQL', category: 'databases', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Python', category: 'languages', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Tableau / PowerBI', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Data Analysis & Pandas', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Excel / Spreadsheets', category: 'frameworks', minProficiency: 'Advanced', importance: 'recommended', weight: 3 },
      { name: 'Statistical Analysis', category: 'soft_skills', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Computer Science', 'Data Analytics', 'Statistics', 'Economics', 'Business Information Systems'],
    },
    recommendedCertifications: [
      { title: 'Google Data Analytics Professional Certificate', issuer: 'Google', importance: 'high' },
      { title: 'Microsoft Certified: Power BI Data Analyst Associate', issuer: 'Microsoft', importance: 'high' },
    ],
    recommendedProjects: [
      {
        title: 'Customer Churn & Cohort Retention Dashboard',
        description: 'End-to-end SQL transformation of 500k e-commerce events with interactive Power BI/Tableau cohort visualization.',
        technologies: ['SQL', 'Python', 'Pandas', 'PowerBI'],
      },
    ],
  },
  {
    title: 'Data Scientist',
    slug: 'data-scientist',
    category: 'Data & Analytics',
    description:
      'Applies advanced statistical inference, machine learning algorithms, and predictive modeling to complex datasets to uncover hidden patterns.',
    averageSalary: {
      entry: '$115,000 - $140,000',
      mid: '$160,000 - $210,000',
      currency: 'USD',
    },
    marketDemand: 'High',
    growthOutlook: '+28% YoY growth in enterprise and research sectors',
    requiredSkills: [
      { name: 'Python', category: 'languages', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'SQL', category: 'databases', minProficiency: 'Advanced', importance: 'critical', weight: 4 },
      { name: 'Machine Learning (Scikit-Learn)', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Statistical Modeling & Mathematics', category: 'soft_skills', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Data Analysis & Pandas', category: 'frameworks', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Data Visualization', category: 'frameworks', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
      { name: 'Git & GitHub', category: 'cloud', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Data Science', 'Computer Science', 'Statistics', 'Mathematics', 'Physics'],
    },
    recommendedCertifications: [
      { title: 'IBM Data Science Professional Certificate', issuer: 'IBM', importance: 'high' },
      { title: 'TensorFlow Developer Certificate', issuer: 'Google', importance: 'medium' },
    ],
    recommendedProjects: [
      {
        title: 'Predictive Medical Diagnostic or Financial Fraud Model',
        description: 'Feature engineering, imbalanced class handling (SMOTE), cross-validation, and ROC-AUC model evaluation comparison.',
        technologies: ['Python', 'Pandas', 'Scikit-Learn', 'Matplotlib'],
      },
    ],
  },
  {
    title: 'Machine Learning Engineer',
    slug: 'machine-learning-engineer',
    category: 'AI & Machine Learning',
    description:
      'Designs, trains, tests, and deploys production machine learning models and data pipelines at scale.',
    averageSalary: {
      entry: '$125,000 - $155,000',
      mid: '$175,000 - $235,000',
      currency: 'USD',
    },
    marketDemand: 'Extremely High',
    growthOutlook: '+35% YoY demand for specialized ML production talent',
    requiredSkills: [
      { name: 'Python', category: 'languages', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'PyTorch / TensorFlow', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Machine Learning (Scikit-Learn)', category: 'frameworks', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Docker', category: 'cloud', minProficiency: 'Intermediate', importance: 'recommended', weight: 4 },
      { name: 'MLOps & Model Serving', category: 'cloud', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
      { name: 'Data Structures & Algorithms', category: 'soft_skills', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Git & GitHub', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Computer Science', 'Artificial Intelligence', 'Data Science', 'Electrical Engineering'],
    },
    recommendedCertifications: [
      { title: 'DeepLearning.AI Deep Learning Specialization', issuer: 'DeepLearning.AI', importance: 'high' },
      { title: 'AWS Certified Machine Learning - Specialty', issuer: 'Amazon Web Services', importance: 'high' },
    ],
    recommendedProjects: [
      {
        title: 'Real-Time Computer Vision or NLP Model API',
        description: 'Trained model served via FastAPI and containerized with Docker for low-latency inference benchmarks.',
        technologies: ['PyTorch', 'Python', 'FastAPI', 'Docker', 'HuggingFace'],
      },
    ],
  },
  {
    title: 'AI Engineer',
    slug: 'ai-engineer',
    category: 'AI & Machine Learning',
    description:
      'Integrates large language models (LLMs), agentic workflows, embeddings, and vector databases into real-world software products.',
    averageSalary: {
      entry: '$130,000 - $160,000',
      mid: '$180,000 - $240,000',
      currency: 'USD',
    },
    marketDemand: 'Extremely High',
    growthOutlook: '+42% YoY surge across AI-native technology startups and enterprises',
    requiredSkills: [
      { name: 'Python', category: 'languages', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'TypeScript', category: 'languages', minProficiency: 'Intermediate', importance: 'recommended', weight: 4 },
      { name: 'LLM APIs & Prompt Engineering', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Vector Databases (Pinecone/Milvus/Chroma)', category: 'databases', minProficiency: 'Beginner', importance: 'critical', weight: 4 },
      { name: 'LangChain / LlamaIndex', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'RESTful API Design', category: 'frameworks', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Git & GitHub', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Computer Science', 'Software Engineering', 'Artificial Intelligence', 'Data Science'],
    },
    recommendedCertifications: [
      { title: 'DeepLearning.AI LangChain for LLM Application Development', issuer: 'DeepLearning.AI', importance: 'high' },
      { title: 'Google Cloud Professional Machine Learning Engineer', issuer: 'Google Cloud', importance: 'medium' },
    ],
    recommendedProjects: [
      {
        title: 'Retrieval-Augmented Generation (RAG) Document Agent',
        description: 'Multi-document QA agent featuring chunking strategies, vector embeddings in ChromaDB, and semantic re-ranking.',
        technologies: ['Python', 'LangChain', 'OpenAI/Gemini API', 'ChromaDB', 'FastAPI'],
      },
    ],
  },
  {
    title: 'Cloud Engineer',
    slug: 'cloud-engineer',
    category: 'Cloud & Infrastructure',
    description:
      'Designs, provisions, secures, and maintains cloud compute, storage, networking, and serverless architectures.',
    averageSalary: {
      entry: '$110,000 - $135,000',
      mid: '$150,000 - $195,000',
      currency: 'USD',
    },
    marketDemand: 'High',
    growthOutlook: '+26% YoY cloud migration acceleration',
    requiredSkills: [
      { name: 'AWS Cloud', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Linux / Bash Scripting', category: 'languages', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Docker', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Terraform / IaC', category: 'cloud', minProficiency: 'Beginner', importance: 'recommended', weight: 4 },
      { name: 'Networking & Security (VPC, DNS, TLS)', category: 'soft_skills', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Python', category: 'languages', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
      { name: 'Git & GitHub', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Computer Science', 'Information Systems', 'Network Engineering', 'Computer Engineering'],
    },
    recommendedCertifications: [
      { title: 'AWS Certified Solutions Architect - Associate', issuer: 'Amazon Web Services', importance: 'high' },
      { title: 'HashiCorp Certified: Terraform Associate', issuer: 'HashiCorp', importance: 'medium' },
    ],
    recommendedProjects: [
      {
        title: 'Multi-Region High-Availability VPC Infrastructure',
        description: 'Automated infrastructure provisioning with Terraform deploying auto-scaled EC2 clusters behind an ALB.',
        technologies: ['AWS', 'Terraform', 'Linux', 'Docker'],
      },
    ],
  },
  {
    title: 'DevOps Engineer',
    slug: 'devops-engineer',
    category: 'Cloud & Infrastructure',
    description:
      'Bridges software development and IT operations through automated CI/CD pipelines, container orchestration, and continuous observability.',
    averageSalary: {
      entry: '$115,000 - $140,000',
      mid: '$160,000 - $205,000',
      currency: 'USD',
    },
    marketDemand: 'Extremely High',
    growthOutlook: '+29% YoY demand for automated release reliability',
    requiredSkills: [
      { name: 'Docker', category: 'cloud', minProficiency: 'Advanced', importance: 'critical', weight: 5 },
      { name: 'Kubernetes', category: 'cloud', minProficiency: 'Beginner', importance: 'critical', weight: 4 },
      { name: 'CI/CD Pipelines (GitHub Actions / GitLab)', category: 'cloud', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Linux / Bash Scripting', category: 'languages', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'AWS Cloud', category: 'cloud', minProficiency: 'Intermediate', importance: 'recommended', weight: 4 },
      { name: 'Git & GitHub', category: 'cloud', minProficiency: 'Advanced', importance: 'critical', weight: 4 },
      { name: 'Monitoring (Prometheus / Grafana)', category: 'cloud', minProficiency: 'Beginner', importance: 'recommended', weight: 3 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Computer Science', 'Software Engineering', 'Information Technology'],
    },
    recommendedCertifications: [
      { title: 'Certified Kubernetes Administrator (CKA)', issuer: 'Linux Foundation', importance: 'high' },
      { title: 'AWS Certified DevOps Engineer - Professional', issuer: 'Amazon Web Services', importance: 'high' },
    ],
    recommendedProjects: [
      {
        title: 'Automated GitOps CI/CD Deployment Pipeline',
        description: 'Zero-downtime deployment pipeline with automated unit testing, Docker image scanning, and Kubernetes rollout.',
        technologies: ['GitHub Actions', 'Docker', 'Kubernetes', 'Helm'],
      },
    ],
  },
  {
    title: 'Cybersecurity Analyst',
    slug: 'cybersecurity-analyst',
    category: 'Security',
    description:
      'Protects enterprise infrastructure, cloud networks, and web applications by detecting vulnerabilities, monitoring threats, and enforcing defensive postures.',
    averageSalary: {
      entry: '$95,000 - $120,000',
      mid: '$140,000 - $185,000',
      currency: 'USD',
    },
    marketDemand: 'Extremely High',
    growthOutlook: '+32% YoY growth due to expanding cybersecurity compliance mandates',
    requiredSkills: [
      { name: 'Networking Fundamentals (TCP/IP, DNS, OSI)', category: 'soft_skills', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'Linux / Bash Scripting', category: 'languages', minProficiency: 'Intermediate', importance: 'critical', weight: 4 },
      { name: 'Python', category: 'languages', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
      { name: 'Web Application Security (OWASP Top 10)', category: 'soft_skills', minProficiency: 'Intermediate', importance: 'critical', weight: 5 },
      { name: 'SIEM & Threat Monitoring (Splunk/Wireshark)', category: 'cloud', minProficiency: 'Beginner', importance: 'critical', weight: 4 },
      { name: 'Identity & Access Management (IAM / OAuth)', category: 'soft_skills', minProficiency: 'Intermediate', importance: 'recommended', weight: 3 },
    ],
    eligibilityCriteria: {
      minDegreeLevel: "Bachelor's",
      relevantFields: ['Cybersecurity', 'Computer Science', 'Information Assurance', 'Computer Engineering'],
    },
    recommendedCertifications: [
      { title: 'CompTIA Security+', issuer: 'CompTIA', importance: 'high' },
      { title: 'Certified Information Systems Security Professional (CISSP)', issuer: 'ISC2', importance: 'medium' },
    ],
    recommendedProjects: [
      {
        title: 'Vulnerability Assessment & Penetration Testing Lab',
        description: 'Simulated network penetration test identifying SQL injection, CSRF, and broken access controls with structured mitigation reports.',
        technologies: ['Wireshark', 'Burp Suite', 'Python', 'Linux'],
      },
    ],
  },
];

