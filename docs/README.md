# 📚 DH Portal Documentation

This folder contains all project documentation organized by topic for easy access and organization.

## 📋 Available Documentation

### 🔧 **Automation System**
- **[AUTOMATION_SYSTEM.md](./AUTOMATION_SYSTEM.md)** - Complete guide to the automated workflow system
  - System architecture and components
  - Database schema and relationships
  - Production workflow examples
  - Client usage scenarios for pest control companies
  - Development and testing instructions
  - Security and deployment guidelines

- **[AUTOMATION_PRODUCTION_CHECKLIST.md](./AUTOMATION_PRODUCTION_CHECKLIST.md)** - Production deployment checklist
  - Pre-deployment testing requirements
  - Security configuration steps
  - Monitoring and alerting setup
  - Post-deployment verification

### 📖 **General Documentation**
- **[PROJECT_README.md](./PROJECT_README.md)** - Main project overview and setup instructions
  - Project description and features
  - Installation and setup guide
  - Environment configuration
  - Basic usage instructions

- **[SERVICE_AREA_UPDATE.md](./SERVICE_AREA_UPDATE.md)** - Geographic service area updates and configuration
  - Service area management system
  - Geographic boundary configuration
  - Coverage validation and updates

- **[WIDGET-ENHANCEMENT-README.md](./WIDGET-ENHANCEMENT-README.md)** - Widget enhancements and features
  - Widget configuration and customization
  - Feature enhancements and improvements
  - Integration instructions

- **[SCRIPTS_README.md](./SCRIPTS_README.md)** - Development scripts and utilities documentation
  - Available development scripts
  - Database seeding utilities
  - Testing and maintenance tools

## 🏗️ **Project Structure**

### Core Documentation Location
```
docs/                                    # 📁 All project documentation
├── README.md                            # 📋 This index file
├── AUTOMATION_SYSTEM.md                 # 🔧 Complete automation guide
├── AUTOMATION_PRODUCTION_CHECKLIST.md  # ✅ Deployment checklist
├── PROJECT_README.md                    # 📖 Main project overview
├── SERVICE_AREA_UPDATE.md               # 🗺️ Service area configuration
├── WIDGET-ENHANCEMENT-README.md         # 🎯 Widget features guide
└── SCRIPTS_README.md                    # 🛠️ Scripts documentation

CLAUDE.md                                # 🤖 Development instructions (project root)
```

### Quick Access Guide

#### **For New Developers**
1. Start with **[PROJECT_README.md](./PROJECT_README.md)** for project overview
2. Review **[AUTOMATION_SYSTEM.md](./AUTOMATION_SYSTEM.md)** for system architecture
3. Check **[SCRIPTS_README.md](./SCRIPTS_README.md)** for available tools

#### **For Deployment**
1. Use **[AUTOMATION_PRODUCTION_CHECKLIST.md](./AUTOMATION_PRODUCTION_CHECKLIST.md)** for deployment
2. Verify automation system setup in **[AUTOMATION_SYSTEM.md](./AUTOMATION_SYSTEM.md)**

#### **For Client Demos**
1. Review business examples in **[AUTOMATION_SYSTEM.md](./AUTOMATION_SYSTEM.md)**
2. Show widget features from **[WIDGET-ENHANCEMENT-README.md](./WIDGET-ENHANCEMENT-README.md)**

#### **For Feature Development**
1. Check **[SERVICE_AREA_UPDATE.md](./SERVICE_AREA_UPDATE.md)** for geographic features
2. Review **[WIDGET-ENHANCEMENT-README.md](./WIDGET-ENHANCEMENT-README.md)** for widget features
3. Use **[AUTOMATION_SYSTEM.md](./AUTOMATION_SYSTEM.md)** for workflow development

## 🔗 Related Files

### Development Tools
- `/scripts/seed-automation-data.js` - Test data creation
- `/scripts/test-automations.js` - Testing utilities
- `/scripts/seed-with-users.js` - User and company seeding
- `/src/lib/inngest/` - Workflow function implementations

### Configuration
- `/.env.local` - Environment variables (not in repo)
- `/src/lib/inngest/config.ts` - Inngest configuration
- `/package.json` - Development scripts and dependencies
- `/supabase/config.toml` - Supabase configuration

### Key Directories
- `/src/app/api/` - API routes and endpoints
- `/src/components/` - React components
- `/src/lib/` - Core business logic and utilities
- `/supabase/migrations/` - Database schema changes

---

## 📝 Documentation Maintenance

### Adding New Documentation
1. Create new `.md` files in the `/docs/` folder
2. Update this README to include the new documentation
3. Use clear, descriptive filenames
4. Follow the existing documentation structure

### Documentation Standards
- Use clear headings and sections
- Include code examples where relevant
- Provide both technical and business context
- Keep table of contents updated
- Include links between related documentation

---

*Keep this documentation up to date as the system evolves.*  
*Last updated: August 12, 2025*