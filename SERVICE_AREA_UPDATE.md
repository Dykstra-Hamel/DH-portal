# Enhanced Service Area Management System

## Overview

The service area management system has been enhanced from a simple zip code-based approach to support geographic polygons, radius-based areas, and zip code validation. This provides much more accurate and flexible service area definition.

## New Features

### 1. Database Schema Enhancements
- **New `service_areas` table**: Stores geographic service areas with PostGIS support
- **Support for three area types**:
  - **Polygon areas**: Custom drawn boundaries using Google Maps
  - **Radius areas**: Center point with mile radius coverage
  - **Zip code areas**: Traditional zip code lists (backward compatible)

### 2. Interactive Map Interface
- **Geographic area drawing**: Draw custom polygon boundaries on Google Maps
- **Radius area creation**: Click to place center point with configurable radius
- **Visual service area display**: See all service areas on the map with different colors
- **Area management**: Activate/deactivate, prioritize, and delete service areas
- **Real-time validation**: Immediate feedback on coverage areas

### 3. API Enhancements
- **Service area validation endpoint**: `/api/service-areas/validate`
- **Service area management**: `/api/service-areas/[companyId]`
- **Geographic queries**: Uses PostGIS for accurate location-based queries
- **Priority system**: Multiple overlapping areas with priority ordering

### 4. Widget Integration
- **Automatic service validation**: Validates customer location during form submission
- **Enhanced lead tracking**: Service area information included in lead notes
- **Graceful handling**: Submissions outside service areas are flagged but not rejected
- **Coordinate support**: Stores latitude/longitude when available

## Implementation Details

### Database Functions
- `check_service_area_coverage()`: Validates if a point falls within service areas
- `get_company_service_areas()`: Retrieves formatted service area data for admin
- PostGIS integration for accurate geographic calculations

### Admin Interface Updates
- **Tabbed service area management**: Switch between zip codes and geographic areas
- **Visual map editor**: Interactive Google Maps integration
- **Area type indicators**: Clear visual distinction between polygon, radius, and zip areas
- **Priority management**: Set priority levels for overlapping coverage areas

### Widget Form Enhancements
- **Service area validation**: Real-time checking during address entry
- **Enhanced lead data**: Service area coverage information included in submissions
- **Backward compatibility**: Existing zip code system continues to work

## Configuration

### Environment Variables
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Required for map functionality
- `GOOGLE_PLACES_API_KEY`: Used as fallback for Maps API key

### Database Migration
Run the migration to add the new service areas table:
```bash
npx supabase db push --linked
```

### Google Maps API Setup
1. Enable Google Maps JavaScript API
2. Enable Google Places API (for address autocomplete)
3. Configure API key restrictions for security

## Usage

### For Administrators
1. Navigate to Widget Configuration in admin panel
2. Go to Service Areas section
3. Choose between "Zip Codes" and "Geographic Areas" tabs
4. For geographic areas:
   - Click "Draw Polygon Area" to create custom boundaries
   - Click "Draw Radius Area" to create circular coverage zones
   - Set area names and priorities
   - Activate/deactivate areas as needed

### For Developers
The system automatically validates service areas during widget submissions and provides detailed coverage information in the API response.

## Benefits

1. **More Accurate Coverage**: Geographic boundaries vs. zip code approximations
2. **Visual Management**: Interactive map interface for easy area definition
3. **Flexible Areas**: Support for complex service boundaries
4. **Better Lead Qualification**: Automatic validation and flagging
5. **Priority System**: Handle overlapping service areas intelligently
6. **Backward Compatibility**: Existing zip code system still works

## API Reference

### Validate Service Area
```javascript
POST /api/service-areas/validate
{
  "companyId": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "zipCode": "10001"
}
```

### Get Service Areas
```javascript
GET /api/service-areas/[companyId]
```

### Update Service Areas
```javascript
PUT /api/service-areas/[companyId]
{
  "serviceAreas": [
    {
      "name": "Manhattan Coverage",
      "type": "polygon",
      "polygon": [{"lat": 40.7128, "lng": -74.0060}, ...],
      "priority": 1,
      "isActive": true
    }
  ]
}
```

## Migration Notes

- Existing zip code service areas are preserved and continue to work
- New geographic areas can be used alongside zip codes
- No breaking changes to existing widget integrations
- Progressive enhancement - map features only available with API key configured

## Future Enhancements

- Drive-time based service areas
- Seasonal/temporary service area adjustments
- Multi-tier service areas (primary vs secondary coverage)
- Service area analytics and reporting
- Integration with routing APIs for travel time calculations