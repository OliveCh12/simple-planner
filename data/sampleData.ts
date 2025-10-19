import type { Roadmap, Objective } from '@/types';

export const sampleRoadmapData: {
  title: string;
  description: string;
  objectives: Array<{
    month: string;
    objectives: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>[];
  }>;
} = {
  title: 'Dev Career Roadmap',
  description: 'A comprehensive sample roadmap to help you get started with planning your career goals and objectives',
  objectives: [
    {
      month: '2025-01',
      objectives: [
        {
          title: 'Complete React Advanced Course',
          description: 'Finish the advanced React course on Udemy to strengthen frontend skills',
          status: 'pending',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          duration: 30,
          energyLevel: 'medium',
          priority: 'high',
          tags: ['learning', 'frontend', 'react'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build Personal Portfolio Website',
          description: 'Create a professional portfolio website showcasing projects and skills',
          status: 'pending',
          startDate: '2025-01-01',
          endDate: '2025-02-28',
          duration: 60,
          energyLevel: 'high',
          priority: 'high',
          tags: ['project', 'portfolio', 'web-development'],
          progress: 0,
          isPinned: true
        },
        {
          title: 'Set Up Development Environment',
          description: 'Configure local development setup with VS Code, Node.js, and essential tools',
          status: 'completed',
          startDate: '2025-01-01',
          endDate: '2025-01-07',
          duration: 7,
          energyLevel: 'low',
          priority: 'medium',
          tags: ['setup', 'tools', 'productivity'],
          progress: 100,
          isPinned: false
        },
        {
          title: 'Learn JavaScript ES6+ Features',
          description: 'Master modern JavaScript features like arrow functions, promises, and modules',
          status: 'pending',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          duration: 30,
          energyLevel: 'medium',
          priority: 'high',
          tags: ['javascript', 'es6', 'learning'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Set up GitHub Profile',
          description: 'Create and optimize a professional GitHub profile with pinned repositories and bio',
          status: 'pending',
          startDate: '2025-01-01',
          endDate: '2025-01-15',
          duration: 15,
          energyLevel: 'low',
          priority: 'medium',
          tags: ['github', 'profile', 'professional'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Read "Clean Code" Book',
          description: 'Read Robert C. Martin\'s Clean Code and apply principles to personal projects',
          status: 'pending',
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          duration: 30,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['book', 'clean-code', 'best-practices'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-02',
      objectives: [
        {
          title: 'Learn Git Advanced Techniques',
          description: 'Master branching strategies, rebasing, and collaborative workflows',
          status: 'pending',
          startDate: '2025-02-01',
          endDate: '2025-02-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['version-control', 'collaboration', 'git'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build Responsive Design Skills',
          description: 'Practice CSS Grid, Flexbox, and mobile-first responsive design',
          status: 'in-progress',
          startDate: '2025-02-01',
          endDate: '2025-02-28',
          duration: 28,
          energyLevel: 'medium',
          priority: 'high',
          tags: ['css', 'responsive-design', 'frontend'],
          progress: 30,
          isPinned: false
        },
        {
          title: 'Learn Node.js Basics',
          description: 'Master Node.js fundamentals including modules, npm, and basic server setup',
          status: 'pending',
          startDate: '2025-02-01',
          endDate: '2025-02-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'high',
          tags: ['nodejs', 'backend', 'javascript'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a Simple REST API',
          description: 'Create a basic REST API using Node.js and Express',
          status: 'pending',
          startDate: '2025-02-16',
          endDate: '2025-02-28',
          duration: 13,
          energyLevel: 'high',
          priority: 'high',
          tags: ['api', 'rest', 'express'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Database Fundamentals',
          description: 'Study SQL basics and relational database concepts',
          status: 'pending',
          startDate: '2025-02-01',
          endDate: '2025-02-28',
          duration: 28,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['database', 'sql', 'fundamentals'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-03',
      objectives: [
        {
          title: 'Contribute to Open Source Project',
          description: 'Find and contribute to an open source project on GitHub',
          status: 'pending',
          startDate: '2025-03-01',
          endDate: '2025-03-31',
          duration: 30,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['open-source', 'contribution', 'github'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Attend Tech Meetup',
          description: 'Network at local tech meetup and connect with industry professionals',
          status: 'pending',
          startDate: '2025-03-15',
          endDate: '2025-03-15',
          duration: 1,
          energyLevel: 'low',
          priority: 'low',
          tags: ['networking', 'meetup', 'community'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Docker Basics',
          description: 'Understand containerization with Docker, images, containers, and basic commands',
          status: 'pending',
          startDate: '2025-03-01',
          endDate: '2025-03-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['docker', 'containers', 'devops'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a CLI Tool',
          description: 'Create a command-line interface tool using Node.js',
          status: 'pending',
          startDate: '2025-03-16',
          endDate: '2025-03-31',
          duration: 16,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['cli', 'nodejs', 'tool'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Practice Code Reviews',
          description: 'Review open source code and learn best practices through pull requests',
          status: 'pending',
          startDate: '2025-03-01',
          endDate: '2025-03-31',
          duration: 30,
          energyLevel: 'medium',
          priority: 'low',
          tags: ['code-review', 'open-source', 'learning'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-04',
      objectives: [
        {
          title: 'Master TypeScript Fundamentals',
          description: 'Complete TypeScript course and implement in personal projects',
          status: 'pending',
          startDate: '2025-04-01',
          endDate: '2025-04-30',
          duration: 30,
          energyLevel: 'high',
          priority: 'high',
          tags: ['typescript', 'learning', 'programming'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build Full-Stack Application',
          description: 'Create a complete web application with frontend and backend',
          status: 'pending',
          startDate: '2025-04-01',
          endDate: '2025-05-15',
          duration: 45,
          energyLevel: 'high',
          priority: 'high',
          tags: ['full-stack', 'project', 'application'],
          progress: 0,
          isPinned: true
        },
        {
          title: 'Learn GraphQL',
          description: 'Study GraphQL query language and API design',
          status: 'pending',
          startDate: '2025-04-01',
          endDate: '2025-04-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['graphql', 'api', 'query-language'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a Mobile App',
          description: 'Develop a simple mobile application using React Native',
          status: 'pending',
          startDate: '2025-04-16',
          endDate: '2025-04-30',
          duration: 15,
          energyLevel: 'high',
          priority: 'high',
          tags: ['mobile', 'react-native', 'app'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn CI/CD Basics',
          description: 'Understand continuous integration and deployment pipelines',
          status: 'pending',
          startDate: '2025-04-01',
          endDate: '2025-04-30',
          duration: 30,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['ci-cd', 'devops', 'automation'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-05',
      objectives: [
        {
          title: 'Learn Testing Frameworks',
          description: 'Master Jest, React Testing Library, and unit testing best practices',
          status: 'pending',
          startDate: '2025-05-01',
          endDate: '2025-05-31',
          duration: 30,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['testing', 'quality-assurance', 'jest'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Python Basics',
          description: 'Master Python fundamentals including syntax, data structures, and libraries',
          status: 'pending',
          startDate: '2025-05-01',
          endDate: '2025-05-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['python', 'programming', 'basics'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a Data Analysis Script',
          description: 'Create a Python script for data analysis using pandas and matplotlib',
          status: 'pending',
          startDate: '2025-05-16',
          endDate: '2025-05-31',
          duration: 16,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['data-analysis', 'python', 'pandas'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Machine Learning Fundamentals',
          description: 'Study basic machine learning concepts and algorithms',
          status: 'pending',
          startDate: '2025-05-01',
          endDate: '2025-05-31',
          duration: 30,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['machine-learning', 'ai', 'algorithms'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-06',
      objectives: [
        {
          title: 'Optimize Portfolio for SEO',
          description: 'Implement SEO best practices and performance optimizations',
          status: 'pending',
          startDate: '2025-06-01',
          endDate: '2025-06-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['seo', 'performance', 'portfolio'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Prepare Technical Interview Questions',
          description: 'Study common coding interview questions and algorithms',
          status: 'pending',
          startDate: '2025-06-01',
          endDate: '2025-06-30',
          duration: 30,
          energyLevel: 'high',
          priority: 'high',
          tags: ['interview-prep', 'algorithms', 'career'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Cybersecurity Basics',
          description: 'Understand fundamental security concepts and best practices',
          status: 'pending',
          startDate: '2025-06-01',
          endDate: '2025-06-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['cybersecurity', 'security', 'best-practices'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a Secure Web App',
          description: 'Develop a web application with security considerations and best practices',
          status: 'pending',
          startDate: '2025-06-16',
          endDate: '2025-06-30',
          duration: 15,
          energyLevel: 'high',
          priority: 'high',
          tags: ['security', 'web-app', 'development'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn DevOps Practices',
          description: 'Study DevOps culture, tools, and methodologies',
          status: 'pending',
          startDate: '2025-06-01',
          endDate: '2025-06-30',
          duration: 30,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['devops', 'culture', 'tools'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-07',
      objectives: [
        {
          title: 'Start Job Applications',
          description: 'Begin applying to junior developer positions (target: 5 applications/week)',
          status: 'pending',
          startDate: '2025-07-01',
          endDate: '2025-08-31',
          duration: 60,
          energyLevel: 'high',
          priority: 'high',
          tags: ['job-search', 'applications', 'career'],
          progress: 0,
          isPinned: true
        },
        {
          title: 'Network on LinkedIn',
          description: 'Connect with 50+ professionals and engage in industry discussions',
          status: 'pending',
          startDate: '2025-07-01',
          endDate: '2025-07-31',
          duration: 30,
          energyLevel: 'low',
          priority: 'medium',
          tags: ['networking', 'linkedin', 'professional'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Agile Methodologies',
          description: 'Study Scrum, Kanban, and agile development practices',
          status: 'pending',
          startDate: '2025-07-01',
          endDate: '2025-07-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['agile', 'scrum', 'methodologies'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a Team Project',
          description: 'Collaborate on a project with other developers using Git and project management tools',
          status: 'pending',
          startDate: '2025-07-16',
          endDate: '2025-07-31',
          duration: 16,
          energyLevel: 'high',
          priority: 'high',
          tags: ['teamwork', 'collaboration', 'project'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Practice Public Speaking',
          description: 'Improve communication skills through tech talks and presentations',
          status: 'pending',
          startDate: '2025-07-01',
          endDate: '2025-07-31',
          duration: 30,
          energyLevel: 'medium',
          priority: 'low',
          tags: ['public-speaking', 'communication', 'skills'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-08',
      objectives: [
        {
          title: 'Complete Coding Challenges',
          description: 'Solve 100+ coding problems on LeetCode/HackerRank',
          status: 'pending',
          startDate: '2025-08-01',
          endDate: '2025-08-31',
          duration: 30,
          energyLevel: 'high',
          priority: 'high',
          tags: ['coding-challenges', 'algorithms', 'interview-prep'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Blockchain Basics',
          description: 'Understand blockchain technology, distributed ledgers, and cryptocurrency fundamentals',
          status: 'pending',
          startDate: '2025-08-01',
          endDate: '2025-08-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'low',
          tags: ['blockchain', 'cryptocurrency', 'technology'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a Smart Contract',
          description: 'Create a simple smart contract using Solidity',
          status: 'pending',
          startDate: '2025-08-16',
          endDate: '2025-08-31',
          duration: 16,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['smart-contract', 'solidity', 'blockchain'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Cryptography',
          description: 'Study encryption, hashing, and cryptographic protocols',
          status: 'pending',
          startDate: '2025-08-01',
          endDate: '2025-08-31',
          duration: 30,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['cryptography', 'security', 'encryption'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-09',
      objectives: [
        {
          title: 'Attend Tech Conference',
          description: 'Participate in a major tech conference or virtual event',
          status: 'pending',
          startDate: '2025-09-15',
          endDate: '2025-09-15',
          duration: 1,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['conference', 'learning', 'networking'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build Side Project',
          description: 'Create a useful side project and deploy it live',
          status: 'pending',
          startDate: '2025-09-01',
          endDate: '2025-09-30',
          duration: 30,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['project', 'side-project', 'deployment'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn AI/ML Frameworks',
          description: 'Study TensorFlow, PyTorch, and scikit-learn for machine learning',
          status: 'pending',
          startDate: '2025-09-01',
          endDate: '2025-09-15',
          duration: 15,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['ai', 'ml', 'frameworks'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build an AI Project',
          description: 'Create a machine learning project using Python and relevant libraries',
          status: 'pending',
          startDate: '2025-09-16',
          endDate: '2025-09-30',
          duration: 15,
          energyLevel: 'high',
          priority: 'high',
          tags: ['ai', 'project', 'machine-learning'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Data Science',
          description: 'Master data science concepts including statistics, visualization, and analysis',
          status: 'pending',
          startDate: '2025-09-01',
          endDate: '2025-09-30',
          duration: 30,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['data-science', 'statistics', 'visualization'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-10',
      objectives: [
        {
          title: 'Secure Internship',
          description: 'Apply for and secure a software development internship',
          status: 'pending',
          startDate: '2025-10-01',
          endDate: '2025-11-30',
          duration: 60,
          energyLevel: 'high',
          priority: 'high',
          tags: ['internship', 'experience', 'career'],
          progress: 0,
          isPinned: true
        },
        {
          title: 'Learn Microservices',
          description: 'Study microservices architecture, design patterns, and communication',
          status: 'pending',
          startDate: '2025-10-01',
          endDate: '2025-10-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['microservices', 'architecture', 'design'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a Microservice',
          description: 'Develop a microservice using containerization and API communication',
          status: 'pending',
          startDate: '2025-10-16',
          endDate: '2025-10-31',
          duration: 16,
          energyLevel: 'high',
          priority: 'high',
          tags: ['microservice', 'containers', 'api'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Kubernetes',
          description: 'Master Kubernetes for container orchestration and deployment',
          status: 'pending',
          startDate: '2025-10-01',
          endDate: '2025-10-31',
          duration: 30,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['kubernetes', 'orchestration', 'containers'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-11',
      objectives: [
        {
          title: 'Learn Cloud Technologies',
          description: 'Get started with AWS/Azure basics and deployment',
          status: 'pending',
          startDate: '2025-11-01',
          endDate: '2025-11-30',
          duration: 30,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['cloud', 'aws', 'deployment'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Serverless',
          description: 'Study serverless computing with AWS Lambda, API Gateway, and DynamoDB',
          status: 'pending',
          startDate: '2025-11-01',
          endDate: '2025-11-15',
          duration: 15,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['serverless', 'aws', 'lambda'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a Serverless App',
          description: 'Create a serverless application using cloud functions and managed services',
          status: 'pending',
          startDate: '2025-11-16',
          endDate: '2025-11-30',
          duration: 15,
          energyLevel: 'high',
          priority: 'high',
          tags: ['serverless', 'app', 'cloud'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Cloud Security',
          description: 'Understand cloud security best practices, IAM, and compliance',
          status: 'pending',
          startDate: '2025-11-01',
          endDate: '2025-11-30',
          duration: 30,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['cloud-security', 'iam', 'compliance'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2025-12',
      objectives: [
        {
          title: 'Complete Internship Successfully',
          description: 'Finish internship with positive feedback and learning outcomes',
          status: 'pending',
          startDate: '2025-12-01',
          endDate: '2025-12-31',
          duration: 30,
          energyLevel: 'high',
          priority: 'high',
          tags: ['internship', 'completion', 'experience'],
          progress: 0,
          isPinned: true
        },
        {
          title: 'Reflect and Plan 2026',
          description: 'Review achievements and set goals for the next year',
          status: 'pending',
          startDate: '2025-12-20',
          endDate: '2025-12-31',
          duration: 10,
          energyLevel: 'low',
          priority: 'low',
          tags: ['reflection', 'planning', 'goals'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Advanced Algorithms',
          description: 'Study complex algorithms and data structures for optimization',
          status: 'pending',
          startDate: '2025-12-01',
          endDate: '2025-12-15',
          duration: 15,
          energyLevel: 'high',
          priority: 'high',
          tags: ['algorithms', 'optimization', 'data-structures'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a Compiler',
          description: 'Create a simple programming language compiler or interpreter',
          status: 'pending',
          startDate: '2025-12-16',
          endDate: '2025-12-31',
          duration: 16,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['compiler', 'programming-language', 'systems'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Functional Programming',
          description: 'Master functional programming concepts with Haskell or Scala',
          status: 'pending',
          startDate: '2025-12-01',
          endDate: '2025-12-31',
          duration: 30,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['functional-programming', 'haskell', 'paradigm'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2026-01',
      objectives: [
        {
          title: 'Apply for Full-Time Positions',
          description: 'Submit applications to entry-level developer positions',
          status: 'pending',
          startDate: '2026-01-01',
          endDate: '2026-03-31',
          duration: 90,
          energyLevel: 'high',
          priority: 'high',
          tags: ['job-search', 'full-time', 'career'],
          progress: 0,
          isPinned: true
        },
        {
          title: 'Continue Learning Advanced Topics',
          description: 'Study system design, microservices, and advanced patterns',
          status: 'pending',
          startDate: '2026-01-01',
          endDate: '2026-06-30',
          duration: 180,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['advanced-learning', 'system-design', 'architecture'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Rust',
          description: 'Master Rust programming language for systems programming',
          status: 'pending',
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          duration: 30,
          energyLevel: 'high',
          priority: 'high',
          tags: ['rust', 'systems-programming', 'language'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Build a System Tool',
          description: 'Create a system utility or tool using Rust or C',
          status: 'pending',
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          duration: 30,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['system-tool', 'utility', 'programming'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Learn Embedded Programming',
          description: 'Study embedded systems, IoT, and microcontroller programming',
          status: 'pending',
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          duration: 30,
          energyLevel: 'high',
          priority: 'medium',
          tags: ['embedded', 'iot', 'microcontrollers'],
          progress: 0,
          isPinned: false
        }
      ]
    },
    {
      month: '2026-06',
      objectives: [
        {
          title: 'Secure First Developer Role',
          description: 'Get hired as a junior software developer',
          status: 'pending',
          startDate: '2026-06-01',
          endDate: '2026-12-31',
          duration: 210,
          energyLevel: 'high',
          priority: 'high',
          tags: ['job-offer', 'career-milestone', 'achievement'],
          progress: 0,
          isPinned: true
        },
        {
          title: 'Achieve Senior Developer Status',
          description: 'Advance to senior developer level through experience and expertise',
          status: 'pending',
          startDate: '2026-06-01',
          endDate: '2028-12-31',
          duration: 910,
          energyLevel: 'high',
          priority: 'high',
          tags: ['senior-developer', 'career-growth', 'expertise'],
          progress: 0,
          isPinned: true
        },
        {
          title: 'Mentor Junior Developers',
          description: 'Guide and mentor new developers in the team',
          status: 'pending',
          startDate: '2026-06-01',
          endDate: '2027-12-31',
          duration: 545,
          energyLevel: 'medium',
          priority: 'medium',
          tags: ['mentoring', 'leadership', 'team-development'],
          progress: 0,
          isPinned: false
        },
        {
          title: 'Start a Tech Blog',
          description: 'Create and maintain a technical blog sharing knowledge and insights',
          status: 'pending',
          startDate: '2026-06-01',
          endDate: '2026-12-31',
          duration: 210,
          energyLevel: 'medium',
          priority: 'low',
          tags: ['blogging', 'content-creation', 'knowledge-sharing'],
          progress: 0,
          isPinned: false
        }
      ]
    }
  ]
};