// Task Management Types and Dummy Data

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
export type ProjectType = 'new-client-onboarding' | 'monthly-marketing' | 'website-redesign' | 'seasonal-campaign';
export type ProjectPhase = 'coming-up' | 'design' | 'development' | 'out-to-client' | 'waiting-on-client' | 'bill-client';
export type RecurringFrequency = 'none' | 'weekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project_id?: string;
  client_id?: string;
  assigned_to?: string;
  estimated_hours: number;
  due_date: string;
  completed_date?: string;
  tags: string[];
  recurring_frequency?: RecurringFrequency;
  recurring_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  client_id: string;
  requested_by: string; // user_id
  assigned_to?: string; // user_id
  status: ProjectStatus;
  phase: ProjectPhase;
  priority: TaskPriority;
  progress: number;
  start_date: string;
  deadline: string;
  completion_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  budget_amount?: number;
  description?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectTemplate {
  type: ProjectType;
  name: string;
  description: string;
  defaultTasks: Omit<Task, 'id' | 'project_id' | 'client_id' | 'assigned_to' | 'created_at' | 'updated_at'>[];
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  project_id?: string; // For project comments
  task_id?: string; // For task comments
  parent_comment_id?: string; // For threaded replies
  created_at: string;
  updated_at: string;
}

// Predefined Project Tags - Pest Control Marketing Agency Specific
export const PROJECT_TAGS = [
  // Design & Branding
  'logo-design',
  'branding',
  'print-collateral',
  'billboard',
  'vehicle-wraps',

  // Digital Marketing
  'website-design',
  'website-dev',
  'seo',
  'gmb-optimization',
  'blog-content',
  'social-media',
  'email-campaign',
  'ad-campaigns',
  'landing-page',

  // Pest Control Focus
  'termite-focus',
  'mosquito-focus',
  'ant-focus',
  'rodent-focus',
  'general-pest',
  'seasonal',

  // Priority & Status
  'rush-job',
  'vip-client',
  'seasonal-deadline',

  // Technical
  'responsive-design',
  'cms-migration',
] as const;

// Project Templates with Pre-defined Tasks
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    type: 'new-client-onboarding',
    name: 'New Client Onboarding',
    description: 'Complete setup for new pest control client including digital presence and marketing foundation',
    defaultTasks: [
      {
        title: 'Website Audit & Analysis',
        description: 'Conduct comprehensive audit of existing website, identify SEO issues, and document improvement opportunities',
        status: 'todo',
        priority: 'high',
        estimated_hours: 4,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['seo', 'audit', 'website'],
      },
      {
        title: 'Google Business Profile Setup & Optimization',
        description: 'Create or claim GMB listing, optimize with pest control keywords, add service areas, and upload photos',
        status: 'todo',
        priority: 'high',
        estimated_hours: 3,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['gmb', 'local-seo', 'setup'],
      },
      {
        title: 'Brand Guidelines Document',
        description: 'Compile brand colors, fonts, logo usage, voice/tone guidelines for consistent marketing materials',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 5,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['branding', 'documentation'],
      },
      {
        title: 'Initial Content Calendar Creation',
        description: 'Plan first month of social media posts, blog topics, and email campaigns focused on seasonal pest issues',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 6,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['content', 'planning', 'social-media'],
      },
      {
        title: 'Social Media Account Setup',
        description: 'Set up business profiles on Facebook, Instagram, and LinkedIn with optimized bios and branding',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 2,
        due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['social-media', 'setup'],
      },
      {
        title: 'Competitor Analysis Report',
        description: 'Research top 5 local pest control competitors, analyze their marketing strategies and identify opportunities',
        status: 'todo',
        priority: 'low',
        estimated_hours: 4,
        due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['research', 'analysis'],
      },
    ],
  },
  {
    type: 'monthly-marketing',
    name: 'Monthly Marketing Campaign',
    description: 'Recurring monthly marketing activities including content creation, email campaigns, and ad management',
    defaultTasks: [
      {
        title: 'Week 1 Social Media Posts',
        description: 'Create and schedule 5 posts: termite prevention tips, customer testimonial, DIY pest facts, service promotion, seasonal alert',
        status: 'todo',
        priority: 'high',
        estimated_hours: 3,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['social-media', 'content', 'week-1'],
      },
      {
        title: 'Week 2 Social Media Posts',
        description: 'Create and schedule 5 posts: before/after photos, pest identification guide, company culture, service area highlight, FAQ',
        status: 'todo',
        priority: 'high',
        estimated_hours: 3,
        due_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['social-media', 'content', 'week-2'],
      },
      {
        title: 'Week 3 Social Media Posts',
        description: 'Create and schedule 5 posts: educational video, customer review, industry news, special offer, team spotlight',
        status: 'todo',
        priority: 'high',
        estimated_hours: 3,
        due_date: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['social-media', 'content', 'week-3'],
      },
      {
        title: 'Week 4 Social Media Posts',
        description: 'Create and schedule 5 posts: monthly recap, pest prevention checklist, community involvement, next month preview, engagement post',
        status: 'todo',
        priority: 'high',
        estimated_hours: 3,
        due_date: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['social-media', 'content', 'week-4'],
      },
      {
        title: 'Monthly Blog Article',
        description: 'Write 1500-word SEO-optimized blog post on seasonal pest topic with internal links and CTAs',
        status: 'todo',
        priority: 'high',
        estimated_hours: 5,
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['blog', 'seo', 'content'],
      },
      {
        title: 'Email Campaign Design & Send',
        description: 'Design monthly newsletter featuring blog content, seasonal tips, special offers, and customer stories',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 4,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['email', 'newsletter', 'design'],
      },
      {
        title: 'Google Ads Optimization',
        description: 'Review ad performance, adjust bids, update ad copy for seasonal keywords, add negative keywords',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 3,
        due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['ppc', 'google-ads', 'optimization'],
      },
      {
        title: 'Monthly Performance Report',
        description: 'Compile analytics, create visualizations, analyze trends, and prepare client-facing performance summary',
        status: 'todo',
        priority: 'high',
        estimated_hours: 4,
        due_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['reporting', 'analytics'],
      },
    ],
  },
  {
    type: 'website-redesign',
    name: 'Website Redesign',
    description: 'Complete website redesign project from discovery to launch with SEO optimization',
    defaultTasks: [
      {
        title: 'Discovery Call & Requirements Gathering',
        description: 'Meet with client to understand goals, target audience, desired features, and brand preferences',
        status: 'todo',
        priority: 'high',
        estimated_hours: 2,
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['discovery', 'planning', 'meeting'],
      },
      {
        title: 'Sitemap & Wireframe Creation',
        description: 'Create site architecture, user flow diagrams, and low-fidelity wireframes for all major pages',
        status: 'todo',
        priority: 'high',
        estimated_hours: 8,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['wireframes', 'planning', 'ux'],
      },
      {
        title: 'High-Fidelity Design Mockups',
        description: 'Design homepage, service pages, about page, and contact page with pest control industry best practices',
        status: 'todo',
        priority: 'high',
        estimated_hours: 20,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['design', 'ui', 'mockups'],
      },
      {
        title: 'Front-End Development',
        description: 'Build responsive website with HTML/CSS/JS, implement animations, ensure mobile optimization',
        status: 'todo',
        priority: 'high',
        estimated_hours: 30,
        due_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['development', 'frontend', 'responsive'],
      },
      {
        title: 'Content Migration & Creation',
        description: 'Migrate existing content, write new service descriptions, optimize for pest control keywords',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 12,
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['content', 'seo', 'migration'],
      },
      {
        title: 'SEO Optimization & Technical Setup',
        description: 'Implement schema markup for pest control services, optimize meta tags, set up analytics and Search Console',
        status: 'todo',
        priority: 'high',
        estimated_hours: 6,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['seo', 'technical', 'analytics'],
      },
      {
        title: 'QA Testing & Bug Fixes',
        description: 'Cross-browser testing, mobile device testing, form testing, page speed optimization, accessibility audit',
        status: 'todo',
        priority: 'high',
        estimated_hours: 8,
        due_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['qa', 'testing', 'bugs'],
      },
      {
        title: 'Website Launch & Monitoring',
        description: 'Deploy to production, set up monitoring, verify all tracking codes, submit sitemap, monitor for issues',
        status: 'todo',
        priority: 'urgent',
        estimated_hours: 4,
        due_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['launch', 'deployment', 'monitoring'],
      },
    ],
  },
  {
    type: 'seasonal-campaign',
    name: 'Seasonal Campaign',
    description: 'Targeted marketing campaign for seasonal pest issues (termites, mosquitos, holiday promotions)',
    defaultTasks: [
      {
        title: 'Campaign Strategy & Planning',
        description: 'Define campaign goals, target audience, key messages, budget allocation, and success metrics for seasonal pest promotion',
        status: 'todo',
        priority: 'high',
        estimated_hours: 4,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['strategy', 'planning'],
      },
      {
        title: 'Creative Asset Design',
        description: 'Design campaign graphics, social media images, ad banners, and email headers with seasonal pest themes',
        status: 'todo',
        priority: 'high',
        estimated_hours: 10,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['design', 'creative', 'assets'],
      },
      {
        title: 'Landing Page Creation',
        description: 'Build dedicated landing page for seasonal offer with pest information, service benefits, and conversion-optimized form',
        status: 'todo',
        priority: 'high',
        estimated_hours: 8,
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['landing-page', 'development', 'conversion'],
      },
      {
        title: 'Ad Campaign Setup',
        description: 'Create Google Ads and Facebook Ads campaigns targeting seasonal pest keywords with location targeting',
        status: 'todo',
        priority: 'high',
        estimated_hours: 5,
        due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['ppc', 'facebook-ads', 'google-ads'],
      },
      {
        title: 'Email Sequence Setup',
        description: 'Create 3-email drip campaign: awareness of seasonal pest threat, service benefits, limited-time offer reminder',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 6,
        due_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['email', 'automation', 'sequence'],
      },
      {
        title: 'Analytics & Tracking Setup',
        description: 'Set up conversion tracking, UTM parameters, call tracking numbers, and campaign-specific analytics dashboard',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 3,
        due_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['analytics', 'tracking', 'reporting'],
      },
      {
        title: 'Campaign Launch & Monitoring',
        description: 'Launch all campaign elements, monitor performance daily, adjust bids and budgets, respond to leads promptly',
        status: 'todo',
        priority: 'urgent',
        estimated_hours: 2,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['launch', 'monitoring', 'optimization'],
      },
      {
        title: 'Mid-Campaign Optimization',
        description: 'Analyze first week performance, pause underperforming ads, scale winning campaigns, test new ad variations',
        status: 'todo',
        priority: 'high',
        estimated_hours: 4,
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['optimization', 'testing', 'analysis'],
      },
    ],
  },
];

// Dummy Users
export const DUMMY_USERS: User[] = [
  {
    id: 'user-1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    avatar_url: undefined,
  },
  {
    id: 'user-2',
    first_name: 'Mike',
    last_name: 'Chen',
    email: 'mike.chen@example.com',
    avatar_url: undefined,
  },
  {
    id: 'user-3',
    first_name: 'Emily',
    last_name: 'Rodriguez',
    email: 'emily.rodriguez@example.com',
    avatar_url: undefined,
  },
  {
    id: 'user-4',
    first_name: 'David',
    last_name: 'Thompson',
    email: 'david.thompson@example.com',
    avatar_url: undefined,
  },
];

// Dummy Clients
export const DUMMY_CLIENTS: Client[] = [
  {
    id: 'client-1',
    name: 'Tom Patterson',
    company: 'BugBusters Pest Control',
  },
  {
    id: 'client-2',
    name: 'Lisa Martinez',
    company: 'Guardian Pest Solutions',
  },
  {
    id: 'client-3',
    name: 'Robert Kim',
    company: 'EcoSafe Termite & Pest',
  },
  {
    id: 'client-4',
    name: 'Jennifer Walsh',
    company: 'Precision Pest Management',
  },
  {
    id: 'client-5',
    name: 'Carlos Rivera',
    company: 'All Season Pest Control',
  },
];

// Dummy Projects
export const DUMMY_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'BugBusters Spring Campaign',
    type: 'seasonal-campaign',
    client_id: 'client-1',
    requested_by: 'user-1',
    assigned_to: 'user-1',
    status: 'active',
    phase: 'out-to-client',
    priority: 'high',
    progress: 65,
    start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: undefined,
    estimated_hours: 40,
    actual_hours: 28,
    budget_amount: 5500,
    description: 'Comprehensive spring marketing campaign targeting termite and ant prevention services with digital ads, email sequences, and landing pages.',
    tags: ['ad-campaigns', 'landing-page', 'email-campaign', 'termite-focus', 'seasonal'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    name: 'Guardian Pest Onboarding',
    type: 'new-client-onboarding',
    client_id: 'client-2',
    requested_by: 'user-2',
    assigned_to: 'user-2',
    status: 'active',
    phase: 'development',
    priority: 'high',
    progress: 40,
    start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: undefined,
    estimated_hours: 35,
    actual_hours: 18,
    budget_amount: 4200,
    description: 'Complete digital onboarding for new pest control client including website audit, GMB setup, brand guidelines, and initial content calendar.',
    tags: ['branding', 'gmb-optimization', 'seo', 'social-media', 'general-pest'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'proj-3',
    name: 'EcoSafe Website Redesign',
    type: 'website-redesign',
    client_id: 'client-3',
    requested_by: 'user-1',
    assigned_to: 'user-3',
    status: 'active',
    phase: 'design',
    priority: 'medium',
    progress: 25,
    start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: undefined,
    estimated_hours: 95,
    actual_hours: 24,
    budget_amount: 12500,
    description: 'Full website redesign from discovery to launch including wireframes, design mockups, responsive development, SEO optimization, and QA testing.',
    tags: ['website-design', 'website-dev', 'responsive-design', 'seo', 'cms-migration'],
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'proj-4',
    name: 'Precision Pest June Marketing',
    type: 'monthly-marketing',
    client_id: 'client-4',
    requested_by: 'user-4',
    assigned_to: 'user-4',
    status: 'active',
    phase: 'bill-client',
    priority: 'medium',
    progress: 80,
    start_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: undefined,
    estimated_hours: 32,
    actual_hours: 29,
    budget_amount: 3800,
    description: 'Monthly marketing activities including social media content, blog article, email newsletter, Google Ads optimization, and performance reporting.',
    tags: ['social-media', 'blog-content', 'email-campaign', 'ad-campaigns'],
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'proj-5',
    name: 'All Season Summer Prep',
    type: 'seasonal-campaign',
    client_id: 'client-5',
    requested_by: 'user-2',
    assigned_to: undefined,
    status: 'planning',
    phase: 'coming-up',
    priority: 'low',
    progress: 0,
    start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: undefined,
    estimated_hours: 38,
    actual_hours: 0,
    budget_amount: 4800,
    description: 'Summer mosquito and tick prevention campaign with targeted ads, educational content, and promotional offers for seasonal services.',
    tags: ['mosquito-focus', 'seasonal', 'ad-campaigns', 'landing-page', 'seasonal-deadline'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'proj-6',
    name: 'Guardian Pest Website Updates',
    type: 'website-redesign',
    client_id: 'client-2',
    requested_by: 'user-2',
    assigned_to: 'user-3',
    status: 'on-hold',
    phase: 'waiting-on-client',
    priority: 'urgent',
    progress: 55,
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    completion_date: undefined,
    estimated_hours: 25,
    actual_hours: 16,
    budget_amount: 3200,
    description: 'Website content updates and minor design improvements. On hold pending client approval of revised mockups and content edits.',
    tags: ['website-design', 'seo', 'blog-content'],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Dummy Tasks
export const DUMMY_TASKS: Task[] = [
  // BugBusters Spring Campaign tasks (proj-1)
  {
    id: 'task-1',
    title: 'Campaign Strategy & Planning',
    description: 'Define campaign goals, target audience, key messages, budget allocation, and success metrics for seasonal pest promotion',
    status: 'completed',
    priority: 'high',
    project_id: 'proj-1',
    client_id: 'client-1',
    assigned_to: 'user-1',
    estimated_hours: 4,
    due_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['strategy', 'planning'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Creative Asset Design',
    description: 'Design campaign graphics, social media images, ad banners, and email headers with seasonal pest themes',
    status: 'completed',
    priority: 'high',
    project_id: 'proj-1',
    client_id: 'client-1',
    assigned_to: 'user-2',
    estimated_hours: 10,
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['design', 'creative', 'assets'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Landing Page Creation',
    description: 'Build dedicated landing page for seasonal offer with pest information, service benefits, and conversion-optimized form',
    status: 'review',
    priority: 'high',
    project_id: 'proj-1',
    client_id: 'client-1',
    assigned_to: 'user-3',
    estimated_hours: 8,
    due_date: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['landing-page', 'development', 'conversion'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Ad Campaign Setup',
    description: 'Create Google Ads and Facebook Ads campaigns targeting seasonal pest keywords with location targeting',
    status: 'in-progress',
    priority: 'high',
    project_id: 'proj-1',
    client_id: 'client-1',
    assigned_to: 'user-1',
    estimated_hours: 5,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['ppc', 'facebook-ads', 'google-ads'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-5',
    title: 'Email Sequence Setup',
    description: 'Create 3-email drip campaign: awareness of seasonal pest threat, service benefits, limited-time offer reminder',
    status: 'todo',
    priority: 'medium',
    project_id: 'proj-1',
    client_id: 'client-1',
    assigned_to: 'user-4',
    estimated_hours: 6,
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['email', 'automation', 'sequence'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Guardian Pest Onboarding tasks (proj-2)
  {
    id: 'task-6',
    title: 'Website Audit & Analysis',
    description: 'Conduct comprehensive audit of existing website, identify SEO issues, and document improvement opportunities',
    status: 'completed',
    priority: 'high',
    project_id: 'proj-2',
    client_id: 'client-2',
    assigned_to: 'user-2',
    estimated_hours: 4,
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['seo', 'audit', 'website'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-7',
    title: 'Google Business Profile Setup & Optimization',
    description: 'Create or claim GMB listing, optimize with pest control keywords, add service areas, and upload photos',
    status: 'in-progress',
    priority: 'high',
    project_id: 'proj-2',
    client_id: 'client-2',
    assigned_to: 'user-2',
    estimated_hours: 3,
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['gmb', 'local-seo', 'setup'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-8',
    title: 'Brand Guidelines Document',
    description: 'Compile brand colors, fonts, logo usage, voice/tone guidelines for consistent marketing materials',
    status: 'todo',
    priority: 'medium',
    project_id: 'proj-2',
    client_id: 'client-2',
    assigned_to: 'user-3',
    estimated_hours: 5,
    due_date: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['branding', 'documentation'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-9',
    title: 'Initial Content Calendar Creation',
    description: 'Plan first month of social media posts, blog topics, and email campaigns focused on seasonal pest issues',
    status: 'todo',
    priority: 'medium',
    project_id: 'proj-2',
    client_id: 'client-2',
    assigned_to: 'user-1',
    estimated_hours: 6,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['content', 'planning', 'social-media'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // EcoSafe Website Redesign tasks (proj-3)
  {
    id: 'task-10',
    title: 'Discovery Call & Requirements Gathering',
    description: 'Meet with client to understand goals, target audience, desired features, and brand preferences',
    status: 'completed',
    priority: 'high',
    project_id: 'proj-3',
    client_id: 'client-3',
    assigned_to: 'user-1',
    estimated_hours: 2,
    due_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['discovery', 'planning', 'meeting'],
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-11',
    title: 'Sitemap & Wireframe Creation',
    description: 'Create site architecture, user flow diagrams, and low-fidelity wireframes for all major pages',
    status: 'in-progress',
    priority: 'high',
    project_id: 'proj-3',
    client_id: 'client-3',
    assigned_to: 'user-3',
    estimated_hours: 8,
    due_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['wireframes', 'planning', 'ux'],
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-12',
    title: 'High-Fidelity Design Mockups',
    description: 'Design homepage, service pages, about page, and contact page with pest control industry best practices',
    status: 'todo',
    priority: 'high',
    project_id: 'proj-3',
    client_id: 'client-3',
    assigned_to: 'user-2',
    estimated_hours: 20,
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['design', 'ui', 'mockups'],
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Precision Pest June Marketing tasks (proj-4)
  {
    id: 'task-13',
    title: 'Week 1 Social Media Posts',
    description: 'Create and schedule 5 posts: termite prevention tips, customer testimonial, DIY pest facts, service promotion, seasonal alert',
    status: 'completed',
    priority: 'high',
    project_id: 'proj-4',
    client_id: 'client-4',
    assigned_to: 'user-4',
    estimated_hours: 3,
    due_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['social-media', 'content', 'week-1'],
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-14',
    title: 'Week 2 Social Media Posts',
    description: 'Create and schedule 5 posts: before/after photos, pest identification guide, company culture, service area highlight, FAQ',
    status: 'completed',
    priority: 'high',
    project_id: 'proj-4',
    client_id: 'client-4',
    assigned_to: 'user-4',
    estimated_hours: 3,
    due_date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['social-media', 'content', 'week-2'],
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-15',
    title: 'Week 3 Social Media Posts',
    description: 'Create and schedule 5 posts: educational video, customer review, industry news, special offer, team spotlight',
    status: 'completed',
    priority: 'high',
    project_id: 'proj-4',
    client_id: 'client-4',
    assigned_to: 'user-4',
    estimated_hours: 3,
    due_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['social-media', 'content', 'week-3'],
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'task-16',
    title: 'Monthly Blog Article',
    description: 'Write 1500-word SEO-optimized blog post on seasonal pest topic with internal links and CTAs',
    status: 'in-progress',
    priority: 'high',
    project_id: 'proj-4',
    client_id: 'client-4',
    assigned_to: 'user-1',
    estimated_hours: 5,
    due_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['blog', 'seo', 'content'],
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-17',
    title: 'Monthly Performance Report',
    description: 'Compile analytics, create visualizations, analyze trends, and prepare client-facing performance summary',
    status: 'todo',
    priority: 'high',
    project_id: 'proj-4',
    client_id: 'client-4',
    assigned_to: 'user-2',
    estimated_hours: 4,
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['reporting', 'analytics'],
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Standalone tasks (no project)
  {
    id: 'task-18',
    title: 'Quarterly SEO Audit - All Season Pest',
    description: 'Perform comprehensive SEO audit including technical SEO, on-page optimization, backlink analysis, and competitor research',
    status: 'todo',
    priority: 'medium',
    client_id: 'client-5',
    assigned_to: 'user-2',
    estimated_hours: 6,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['seo', 'audit', 'quarterly'],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-19',
    title: 'Update Team Training Materials',
    description: 'Revise internal documentation on latest pest control marketing best practices and industry regulations',
    status: 'todo',
    priority: 'low',
    assigned_to: 'user-3',
    estimated_hours: 8,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['training', 'documentation', 'internal'],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'task-20',
    title: 'Client Check-in Call - BugBusters',
    description: 'Monthly status update call to review campaign performance, discuss upcoming initiatives, and gather feedback',
    status: 'todo',
    priority: 'high',
    project_id: 'proj-1',
    client_id: 'client-1',
    assigned_to: 'user-1',
    estimated_hours: 1,
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['meeting', 'client-relations'],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper Functions
export function getTasksByStatus(status: TaskStatus): Task[] {
  return DUMMY_TASKS.filter(task => task.status === status);
}

export function getTasksByProject(projectId: string): Task[] {
  return DUMMY_TASKS.filter(task => task.project_id === projectId);
}

export function getProjectProgress(projectId: string): number {
  const projectTasks = getTasksByProject(projectId);
  if (projectTasks.length === 0) return 0;

  const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
  return Math.round((completedTasks / projectTasks.length) * 100);
}

export function getUserById(userId: string): User | undefined {
  return DUMMY_USERS.find(user => user.id === userId);
}

export function getClientById(clientId: string): Client | undefined {
  return DUMMY_CLIENTS.find(client => client.id === clientId);
}

export function getProjectById(projectId: string): Project | undefined {
  return DUMMY_PROJECTS.find(project => project.id === projectId);
}

export function getOverdueTasks(): Task[] {
  const now = new Date();
  return DUMMY_TASKS.filter(task =>
    task.status !== 'completed' &&
    new Date(task.due_date) < now
  );
}

export function getTasksDueThisWeek(): Task[] {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return DUMMY_TASKS.filter(task => {
    const dueDate = new Date(task.due_date);
    return task.status !== 'completed' && dueDate >= now && dueDate <= weekFromNow;
  });
}

export function getCompletedTasksThisWeek(): Task[] {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return DUMMY_TASKS.filter(task => {
    if (!task.completed_date) return false;
    const completedDate = new Date(task.completed_date);
    return completedDate >= weekAgo && completedDate <= now;
  });
}
