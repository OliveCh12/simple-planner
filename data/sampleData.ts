import type { Roadmap, Objective } from '@/types';

export const sampleRoadmapData: {
  title: string;
  description: string;
  objectives: Array<{
    month: string;
    objectives: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>[];
  }>;
} = {
  title: 'Sample Career Roadmap',
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
        }
      ]
    }
  ]
};