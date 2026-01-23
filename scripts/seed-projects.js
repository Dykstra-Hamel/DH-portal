#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const CONFIG = {
  LOCAL_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  LOCAL_SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Initialize Supabase client
const localClient = createClient(
  CONFIG.LOCAL_SUPABASE_URL,
  CONFIG.LOCAL_SUPABASE_SERVICE_KEY
);

// Utility functions
const log = message => console.log(`[${new Date().toISOString()}] ${message}`);
const error = message =>
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Generate random UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Project data
const projectNames = [
  'Website Redesign',
  'Mobile App Development',
  'Brand Identity Refresh',
  'Marketing Campaign Q1',
  'Customer Portal',
  'API Integration',
  'SEO Optimization',
  'Social Media Strategy',
  'E-commerce Platform',
  'Internal Dashboard',
  'Data Analytics Pipeline',
];

const projectDescriptions = [
  'Complete overhaul of the company website with modern design and improved UX',
  'Native mobile application for iOS and Android platforms',
  'Refreshing brand colors, typography, and visual identity',
  'Multi-channel marketing campaign for Q1 product launch',
  'Self-service portal for customers to manage their accounts',
  'Integration with third-party services and APIs',
  'Search engine optimization and content strategy',
  'Comprehensive social media presence and engagement strategy',
  'Full-featured online store with payment processing',
  'Real-time dashboard for monitoring business metrics',
  'Building data pipelines for business intelligence',
];

const statuses = ['in_progress', 'blocked', 'on_hold', 'pending_approval', 'out_to_client', 'complete'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const taskPriorities = ['low', 'medium', 'high', 'critical']; // Tasks use 'critical' instead of 'urgent'
const scopes = ['internal', 'external', 'both'];
const projectTypes = ['website', 'social', 'email', 'print', 'digital', 'ads'];

const taskTitles = [
  'Research and Discovery',
  'Requirements Gathering',
  'Wireframe Design',
  'UI/UX Design',
  'Frontend Development',
  'Backend Development',
  'Database Schema Design',
  'API Development',
  'Testing and QA',
  'Bug Fixes',
  'Documentation',
  'Deployment Setup',
  'Performance Optimization',
  'Security Audit',
  'User Training',
  'Content Creation',
  'Code Review',
  'Integration Testing',
  'Stakeholder Review',
  'Final Delivery',
];

async function main() {
  try {
    log('Starting project seeding...');

    // Get companies
    const { data: companies, error: companyError } = await localClient
      .from('companies')
      .select('id, name');

    if (companyError) {
      error(`Failed to fetch companies: ${companyError.message}`);
      process.exit(1);
    }

    if (companies.length === 0) {
      error('No companies found. Please run npm run seed first.');
      process.exit(1);
    }

    log(`Found ${companies.length} companies`);

    // Get users
    const { data: users, error: userError } = await localClient
      .from('profiles')
      .select('id, email');

    if (userError) {
      error(`Failed to fetch users: ${userError.message}`);
      process.exit(1);
    }

    if (users.length === 0) {
      error('No users found. Please run npm run seed first.');
      process.exit(1);
    }

    log(`Found ${users.length} users`);

    // Clear existing projects and tasks
    log('Clearing existing project_tasks...');
    await localClient.from('project_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    log('Clearing existing projects...');
    await localClient.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Create projects
    const projects = [];
    const now = new Date();

    for (let i = 0; i < projectNames.length; i++) {
      const company = companies[i % companies.length];
      const requester = users[Math.floor(Math.random() * users.length)];
      const assignee = users[Math.floor(Math.random() * users.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const scope = scopes[Math.floor(Math.random() * scopes.length)];

      // Generate dates - ensure due_date >= start_date
      let startDate = new Date(now);
      let dueDate = new Date(now);

      if (status === 'complete') {
        // Completed projects: start in the past, due shortly after start
        const startOffset = Math.floor(Math.random() * 60) + 1; // 1-60 days ago
        startDate.setDate(startDate.getDate() - startOffset);
        dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 1); // 1-30 days after start
      } else if (i === 0) {
        // Due today
        startDate.setDate(startDate.getDate() - 7); // Started a week ago
        // dueDate stays as now (today)
      } else if (i === 1 || i === 2) {
        // Due this week
        startDate.setDate(startDate.getDate() - 14); // Started 2 weeks ago
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 1);
      } else if (i === 3 || i === 4) {
        // Due this month
        startDate.setDate(startDate.getDate() - 7); // Started a week ago
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 23) + 8);
      } else {
        // Coming up (future projects)
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 14)); // Started 0-14 days ago
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60) + 31);
      }

      const projectType = projectTypes[i % projectTypes.length];

      projects.push({
        id: generateUUID(),
        name: projectNames[i],
        description: projectDescriptions[i],
        project_type: projectType,
        company_id: company.id,
        requested_by: requester.id,
        assigned_to: assignee.id,
        status: status,
        priority: priority,
        scope: scope,
        start_date: startDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        tags: i % 3 === 0 ? ['design', 'frontend'] : i % 3 === 1 ? ['backend', 'api'] : ['marketing'],
      });
    }

    // Insert projects
    const { error: projectInsertError } = await localClient
      .from('projects')
      .insert(projects);

    if (projectInsertError) {
      error(`Failed to insert projects: ${projectInsertError.message}`);
      process.exit(1);
    }

    log(`Created ${projects.length} projects`);

    // Create tasks for each project
    const allTasks = [];

    for (const project of projects) {
      const numTasks = Math.floor(Math.random() * 6) + 5; // 5-10 tasks per project
      const shuffledTitles = [...taskTitles].sort(() => Math.random() - 0.5);
      const projectStart = new Date(project.start_date);
      const projectDue = new Date(project.due_date);

      for (let j = 0; j < numTasks; j++) {
        const assignee = users[Math.floor(Math.random() * users.length)];

        // Task completion based on project status
        let isCompleted;
        if (project.status === 'complete') {
          isCompleted = true;
        } else if (project.status === 'pending_approval' || project.status === 'on_hold') {
          isCompleted = false;
        } else {
          // Mix of completed/incomplete for in_progress projects
          isCompleted = Math.random() < 0.3;
        }

        const taskPriority = taskPriorities[Math.floor(Math.random() * taskPriorities.length)];

        // Task due date between project start and due
        const taskDueOffset = Math.floor(Math.random() * ((projectDue - projectStart) / (1000 * 60 * 60 * 24)));
        const taskDueDate = new Date(projectStart);
        taskDueDate.setDate(taskDueDate.getDate() + taskDueOffset);

        allTasks.push({
          id: generateUUID(),
          project_id: project.id,
          title: shuffledTitles[j % shuffledTitles.length],
          description: `Task for ${project.name}: ${shuffledTitles[j % shuffledTitles.length]}`,
          is_completed: isCompleted,
          priority: taskPriority,
          assigned_to: assignee.id,
          due_date: taskDueDate.toISOString().split('T')[0],
          completed_at: isCompleted ? new Date().toISOString() : null,
          display_order: j,
        });
      }
    }

    // Insert tasks
    const { error: taskInsertError } = await localClient
      .from('project_tasks')
      .insert(allTasks);

    if (taskInsertError) {
      error(`Failed to insert tasks: ${taskInsertError.message}`);
      process.exit(1);
    }

    log(`Created ${allTasks.length} tasks across ${projects.length} projects`);

    log('Project seeding completed successfully!');
    log('Summary:');
    log(`- ${projects.length} projects created`);
    log(`- ${allTasks.length} tasks created`);
    log('- Projects distributed across all companies');
    log('- Various statuses, priorities, and due dates for testing');
  } catch (err) {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = { main };
