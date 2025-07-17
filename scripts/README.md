# Database Seeding with Production Users

This script pulls users from your production Supabase database and creates a complete local development environment with all tables populated and user assignments.

## Prerequisites

1. **Node.js** installed on your system
2. **Supabase CLI** installed and configured
3. **Local Supabase instance** running (`supabase start`)
4. **Production database credentials** with appropriate permissions

## Setup

### 1. Environment Variables

Create a `.env.local` file in the project root with your production credentials:

```bash
# Production Supabase Configuration
PROD_SUPABASE_URL=your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Local Supabase Configuration (usually defaults work)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
```

### 2. Required Permissions

Your production service key needs these permissions:
- `auth.users.read` - to pull user data
- `auth.admin` - to list users via admin API

## Usage

### Quick Start

```bash
# Run the seeding script
npm run seed
```

### Manual Execution

```bash
# Run the script directly
node scripts/seed-with-users.js
```

### Reset Local Database (without users)

```bash
# Reset to base seed.sql only
npm run seed-local
```

## What the Script Does

### 1. **Pulls Production Users**
- Fetches up to 50 users from production (configurable)
- Includes user metadata (name, email, avatar)
- Preserves user IDs for consistency

### 2. **Creates User Profiles**
- Inserts users into local `profiles` table
- Sets default role as 'user'
- Preserves original timestamps

### 3. **Runs Base Seed**
- Executes your existing `seed.sql` file
- Creates companies, brands, and projects
- Maintains all existing seed data

### 4. **Assigns Users to Companies**
- Randomly assigns each user to 1-3 companies
- Assigns random roles: admin, member, viewer
- Creates entries in `user_companies` table

### 5. **Assigns Users to Projects**
- Assigns users to projects based on company access
- Ensures users can only access projects for their companies
- Creates 1-4 users per project with roles: manager, contributor, viewer

## Configuration Options

Edit the `CONFIG` object in `seed-with-users.js`:

```javascript
const CONFIG = {
  MAX_USERS: 50,                    // Limit production users to pull
  ASSIGN_RANDOM_USERS: true,        // Enable random user assignments
  // ... other options
};
```

## Database Schema Requirements

The script expects these tables to exist:

- `profiles` - User profile information
- `companies` - Company data (from seed.sql)
- `brands` - Brand data (from seed.sql)  
- `projects` - Project data (from seed.sql)
- `user_companies` - User-company junction table
- `user_projects` - User-project junction table (optional)

## Troubleshooting

### Common Issues

1. **"Production credentials not found"**
   - Check your `.env.local` file has correct variables
   - Ensure service key has admin permissions

2. **"Failed to fetch users from production"**
   - Verify your production URL and service key
   - Check network connectivity to production

3. **"Failed to create user profiles"**
   - Ensure `profiles` table exists in local database
   - Check your local Supabase is running (`supabase status`)

4. **"user_projects table not found"**
   - This is expected if you haven't created the table yet
   - Script will fall back to updating `projects.assigned_users` array

### Debug Mode

Set `DEBUG=true` environment variable for verbose logging:

```bash
DEBUG=true npm run seed
```

## Security Notes

- **Never commit production credentials** to version control
- Use environment variables for all sensitive data
- Consider using a dedicated read-only service key for production
- Review pulled data before using in development

## Example Output

```
[2025-01-17T10:30:00.000Z] Starting database seeding with production users...
[2025-01-17T10:30:01.000Z] Running base seed.sql...
[2025-01-17T10:30:02.000Z] Base seed completed successfully
[2025-01-17T10:30:03.000Z] Pulling users from production database...
[2025-01-17T10:30:04.000Z] Successfully pulled 23 users from production
[2025-01-17T10:30:05.000Z] Creating user profiles in local database...
[2025-01-17T10:30:06.000Z] Successfully created 23 user profiles
[2025-01-17T10:30:07.000Z] Assigning users to companies...
[2025-01-17T10:30:08.000Z] Successfully created 67 user-company assignments
[2025-01-17T10:30:09.000Z] Assigning users to projects...
[2025-01-17T10:30:10.000Z] Successfully created 45 user-project assignments
[2025-01-17T10:30:11.000Z] Database seeding completed successfully!
[2025-01-17T10:30:11.000Z] Summary:
[2025-01-17T10:30:11.000Z] - 23 users imported from production
[2025-01-17T10:30:11.000Z] - Companies and projects populated with user assignments
[2025-01-17T10:30:11.000Z] - All seed data ready for development
```

## Next Steps

After running the script:

1. **Verify the data** in your local Supabase Studio (`http://localhost:54323`)
2. **Test authentication** with imported users
3. **Check user assignments** in companies and projects
4. **Start development** with realistic data

## Contributing

To improve this script:

1. Test with your specific database schema
2. Add error handling for edge cases
3. Consider adding support for additional tables
4. Update documentation with your findings