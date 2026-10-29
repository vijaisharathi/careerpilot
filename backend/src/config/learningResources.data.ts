export interface VerifiedResource {
  title: string;
  type: 'Official Documentation' | 'Tutorial' | 'Interactive Course' | 'Guide' | 'Practice Platform' | 'Cheat Sheet';
  url: string;
  isFree: boolean;
  provider: string;
}

/**
 * Curated, verified learning resources catalog.
 * Every URL points to legitimate, maintained, canonical documentation and educational resources.
 * No fabricated or unverified course links.
 */
export const VERIFIED_RESOURCE_CATALOG: Record<string, VerifiedResource[]> = {
  react: [
    {
      title: 'React Official Documentation & Interactive Quick Start',
      type: 'Official Documentation',
      url: 'https://react.dev/learn',
      isFree: true,
      provider: 'React Core Team',
    },
    {
      title: 'Deep Dive: Thinking in React & State Management',
      type: 'Tutorial',
      url: 'https://react.dev/learn/thinking-in-react',
      isFree: true,
      provider: 'React Core Team',
    },
  ],
  typescript: [
    {
      title: 'TypeScript Handbook & Handbook for Programmers',
      type: 'Official Documentation',
      url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
      isFree: true,
      provider: 'Microsoft TypeScript',
    },
    {
      title: 'TypeScript Everyday Types and Generics Guide',
      type: 'Guide',
      url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
      isFree: true,
      provider: 'Microsoft TypeScript',
    },
  ],
  javascript: [
    {
      title: 'MDN Web Docs: JavaScript Language Overview & Reference',
      type: 'Official Documentation',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      isFree: true,
      provider: 'Mozilla Developer Network',
    },
    {
      title: 'JavaScript Event Loop & Asynchronous Programming Guide',
      type: 'Guide',
      url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS',
      isFree: true,
      provider: 'Mozilla Developer Network',
    },
  ],
  'node.js': [
    {
      title: 'Node.js Official Documentation & Getting Started',
      type: 'Official Documentation',
      url: 'https://nodejs.org/en/docs/guides',
      isFree: true,
      provider: 'Node.js Foundation',
    },
    {
      title: 'Node.js Event Loop, Timers, and process.nextTick()',
      type: 'Guide',
      url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
      isFree: true,
      provider: 'Node.js Foundation',
    },
  ],
  express: [
    {
      title: 'Express.js Starter Guide & Routing Architecture',
      type: 'Official Documentation',
      url: 'https://expressjs.com/en/starter/installing.html',
      isFree: true,
      provider: 'Express.js',
    },
    {
      title: 'Writing Express Middleware & Centralized Error Handling',
      type: 'Guide',
      url: 'https://expressjs.com/en/guide/using-middleware.html',
      isFree: true,
      provider: 'Express.js',
    },
  ],
  mongodb: [
    {
      title: 'MongoDB Getting Started & Aggregation Pipeline Tutorial',
      type: 'Official Documentation',
      url: 'https://www.mongodb.com/docs/manual/tutorial/getting-started/',
      isFree: true,
      provider: 'MongoDB Inc.',
    },
    {
      title: 'Mongoose ODM: Schema Design & Indexing Best Practices',
      type: 'Official Documentation',
      url: 'https://mongoosejs.com/docs/guide.html',
      isFree: true,
      provider: 'Automattic / Mongoose',
    },
  ],
  postgresql: [
    {
      title: 'PostgreSQL Official Tutorial: SQL Queries & Transactions',
      type: 'Official Documentation',
      url: 'https://www.postgresql.org/docs/current/tutorial.html',
      isFree: true,
      provider: 'PostgreSQL Global Development Group',
    },
    {
      title: 'Relational Database Indexing & Query Plan Optimization',
      type: 'Guide',
      url: 'https://www.postgresql.org/docs/current/indexes.html',
      isFree: true,
      provider: 'PostgreSQL Docs',
    },
  ],
  redis: [
    {
      title: 'Redis Developer Guide: Caching, Invalidation & TTL',
      type: 'Official Documentation',
      url: 'https://redis.io/docs/latest/develop/',
      isFree: true,
      provider: 'Redis Ltd.',
    },
    {
      title: 'Redis Data Structures & Memory Optimization',
      type: 'Guide',
      url: 'https://redis.io/docs/latest/develop/data-types/',
      isFree: true,
      provider: 'Redis Ltd.',
    },
  ],
  docker: [
    {
      title: 'Docker Getting Started Guide & Multi-Stage Builds',
      type: 'Official Documentation',
      url: 'https://docs.docker.com/get-started/',
      isFree: true,
      provider: 'Docker Inc.',
    },
    {
      title: 'Docker Compose for Microservices & Local Development',
      type: 'Tutorial',
      url: 'https://docs.docker.com/compose/',
      isFree: true,
      provider: 'Docker Inc.',
    },
  ],
  kubernetes: [
    {
      title: 'Kubernetes Basics: Pods, Services & Deployments',
      type: 'Official Documentation',
      url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
      isFree: true,
      provider: 'Cloud Native Computing Foundation',
    },
  ],
  aws: [
    {
      title: 'AWS Getting Started Resource Center & Architecture Center',
      type: 'Official Documentation',
      url: 'https://aws.amazon.com/getting-started/',
      isFree: true,
      provider: 'Amazon Web Services',
    },
    {
      title: 'AWS Well-Architected Framework: Reliability & Security',
      type: 'Guide',
      url: 'https://aws.amazon.com/architecture/well-architected/',
      isFree: true,
      provider: 'Amazon Web Services',
    },
  ],
  python: [
    {
      title: 'Python Official Tutorial & Standard Library Reference',
      type: 'Official Documentation',
      url: 'https://docs.python.org/3/tutorial/',
      isFree: true,
      provider: 'Python Software Foundation',
    },
    {
      title: 'FastAPI Tutorial: User Guide & High Performance APIs',
      type: 'Tutorial',
      url: 'https://fastapi.tiangolo.com/tutorial/',
      isFree: true,
      provider: 'FastAPI Tiangolo',
    },
  ],
  java: [
    {
      title: 'Spring Boot Quickstart Guide & RESTful Web Services',
      type: 'Tutorial',
      url: 'https://spring.io/quickstart',
      isFree: true,
      provider: 'VMware Tanzu / Spring',
    },
    {
      title: 'Building Java Applications with Spring Data JPA & Hibernate',
      type: 'Guide',
      url: 'https://spring.io/guides/gs/accessing-data-jpa',
      isFree: true,
      provider: 'Spring Guides',
    },
  ],
  'system design': [
    {
      title: 'System Design Primer: Scalable Systems & Architecture Patterns',
      type: 'Practice Platform',
      url: 'https://github.com/donnemartin/system-design-primer',
      isFree: true,
      provider: 'GitHub Open Source Community',
    },
    {
      title: 'RESTful API Architectural Constraints & HTTP Best Practices',
      type: 'Guide',
      url: 'https://restfulapi.net/',
      isFree: true,
      provider: 'RESTful API Standards',
    },
  ],
  dsa: [
    {
      title: 'LeetCode Explore: Essential Data Structures & Algorithms',
      type: 'Practice Platform',
      url: 'https://leetcode.com/explore/',
      isFree: true,
      provider: 'LeetCode',
    },
    {
      title: 'NeetCode Roadmap: Sequenced Algorithm Problem Patterns',
      type: 'Practice Platform',
      url: 'https://neetcode.io/roadmap',
      isFree: true,
      provider: 'NeetCode Community',
    },
  ],
  'machine learning': [
    {
      title: 'Scikit-Learn Machine Learning in Python Tutorial',
      type: 'Official Documentation',
      url: 'https://scikit-learn.org/stable/tutorial/index.html',
      isFree: true,
      provider: 'Scikit-Learn Developers',
    },
    {
      title: 'PyTorch Deep Learning Fundamentals & Tensor Basics',
      type: 'Tutorial',
      url: 'https://pytorch.org/tutorials/beginner/basics/intro.html',
      isFree: true,
      provider: 'Linux Foundation / PyTorch',
    },
  ],
  git: [
    {
      title: 'GitHub Git Handbook & Trunk-Based Team Workflows',
      type: 'Guide',
      url: 'https://docs.github.com/en/get-started',
      isFree: true,
      provider: 'GitHub Docs',
    },
  ],
  security: [
    {
      title: 'OWASP Top 10 Web Application Security Risks & Defenses',
      type: 'Guide',
      url: 'https://owasp.org/www-project-top-ten/',
      isFree: true,
      provider: 'OWASP Foundation',
    },
  ],
  'tailwind css': [
    {
      title: 'Tailwind CSS Documentation & Responsive Utility Design',
      type: 'Official Documentation',
      url: 'https://tailwindcss.com/docs',
      isFree: true,
      provider: 'Tailwind Labs',
    },
  ],
};

/**
 * Normalizes a topic or skill query to find verified matching resources.
 */
export function getVerifiedResourcesForSkill(skillOrTopic: string): VerifiedResource[] {
  const normalized = skillOrTopic.toLowerCase().trim();

  // Exact key match
  if (VERIFIED_RESOURCE_CATALOG[normalized]) {
    return VERIFIED_RESOURCE_CATALOG[normalized];
  }

  // Substring match
  for (const [key, resources] of Object.entries(VERIFIED_RESOURCE_CATALOG)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return resources;
    }
  }

  // Domain fallback mappings
  if (normalized.includes('sql') || normalized.includes('database') || normalized.includes('prisma')) {
    return VERIFIED_RESOURCE_CATALOG.postgresql;
  }
  if (normalized.includes('api') || normalized.includes('backend') || normalized.includes('microservice')) {
    return VERIFIED_RESOURCE_CATALOG.express;
  }
  if (normalized.includes('ui') || normalized.includes('frontend') || normalized.includes('component')) {
    return VERIFIED_RESOURCE_CATALOG.react;
  }
  if (normalized.includes('cloud') || normalized.includes('deploy') || normalized.includes('devops')) {
    return VERIFIED_RESOURCE_CATALOG.docker;
  }
  if (normalized.includes('algorithm') || normalized.includes('leetcode') || normalized.includes('data structure')) {
    return VERIFIED_RESOURCE_CATALOG.dsa;
  }
  if (normalized.includes('ai') || normalized.includes('model') || normalized.includes('nlp')) {
    return VERIFIED_RESOURCE_CATALOG['machine learning'];
  }

  // Default authoritative fallback
  return [
    {
      title: 'MDN Web Docs: Web Technologies for Developers',
      type: 'Official Documentation',
      url: 'https://developer.mozilla.org/en-US/',
      isFree: true,
      provider: 'Mozilla Developer Network',
    },
  ];
}

