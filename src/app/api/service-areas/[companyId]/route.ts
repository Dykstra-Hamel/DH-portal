import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

// TypeScript interfaces for service area data
interface ServiceAreaFromDB {
  id: string;
  name: string;
  type: 'polygon' | 'radius' | 'zip_code';
  priority: number;
  is_active: boolean;
  polygon_geojson?: string;
  center_lat?: string;
  center_lng?: string;
  radius_miles?: number;
  zip_codes?: string[];
}

interface ServiceAreaInput {
  name: string;
  type: 'polygon' | 'radius' | 'zip_code';
  polygon?: { lat: number; lng: number }[];
  center?: { lat: number; lng: number };
  radius?: number;
  zipCodes?: string[];
  priority?: number;
  isActive?: boolean;
}

// Get all service areas for a company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Use the database function that properly formats PostGIS geometry
    const { data: serviceAreas, error } = await supabase
      .rpc('get_company_service_areas', { p_company_id: companyId });

    if (error) {
      console.error('Error fetching service areas:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        { error: 'Failed to fetch service areas', details: error.message },
        { status: 500 }
      );
    }

    // Transform the data from the database function to the expected format
    const formattedAreas = (serviceAreas || []).map((area: ServiceAreaFromDB) => {
      const formatted: any = {
        id: area.id,
        name: area.name,
        type: area.type,
        priority: area.priority,
        isActive: area.is_active,
      };

      if (area.type === 'polygon' && area.polygon_geojson) {
        // Parse GeoJSON polygon to coordinate array
        try {
          const geojson = JSON.parse(area.polygon_geojson);
          // GeoJSON polygon coordinates are nested: [[[lng, lat], [lng, lat], ...]]
          // We need to convert to [{lat, lng}, {lat, lng}, ...] format
          if (geojson.coordinates && geojson.coordinates[0]) {
            formatted.polygon = geojson.coordinates[0].map(([lng, lat]: [number, number]) => ({
              lat,
              lng,
            }));
          }
        } catch (e) {
          console.warn('Failed to parse polygon GeoJSON:', e);
          formatted.polygon = [];
        }
      } else if (area.type === 'radius' && area.center_lat !== null && area.center_lng !== null && area.center_lat !== undefined && area.center_lng !== undefined) {
        // Use the parsed center coordinates from the database function
        formatted.center = {
          lat: parseFloat(area.center_lat),
          lng: parseFloat(area.center_lng),
        };
        formatted.radius = area.radius_miles;
      } else if (area.type === 'zip_code' && area.zip_codes) {
        formatted.zipCodes = area.zip_codes;
      }

      return formatted;
    });

    return NextResponse.json({
      success: true,
      serviceAreas: formattedAreas,
    });
  } catch (error) {
    console.error('Error in service areas GET:', error);
    console.error('Full error object:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Create a new service area
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const body = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const { name, type, polygon, center, radius, zipCodes, priority = 0 } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Validate type-specific data
    const insertData: any = {
      company_id: companyId,
      name,
      type,
      priority,
      is_active: true,
    };

    if (type === 'polygon') {
      if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
        return NextResponse.json(
          { error: 'Polygon type requires at least 3 coordinate points' },
          { status: 400 }
        );
      }
      
      // Convert coordinates to PostGIS polygon format
      const polygonWKT = `POLYGON((${polygon.map((point: { lat: number; lng: number }) => 
        `${point.lng} ${point.lat}`
      ).join(', ')}, ${polygon[0].lng} ${polygon[0].lat}))`;
      
      insertData.polygon = `SRID=4326;${polygonWKT}`;
    } else if (type === 'radius') {
      if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number' || !radius) {
        return NextResponse.json(
          { error: 'Radius type requires center point and radius' },
          { status: 400 }
        );
      }
      
      insertData.center_point = `SRID=4326;POINT(${center.lng} ${center.lat})`;
      insertData.radius_miles = radius;
    } else if (type === 'zip_code') {
      if (!zipCodes || !Array.isArray(zipCodes) || zipCodes.length === 0) {
        return NextResponse.json(
          { error: 'Zip code type requires at least one zip code' },
          { status: 400 }
        );
      }
      
      insertData.zip_codes = zipCodes;
    }

    const { data: newArea, error } = await supabase
      .from('service_areas')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating service area:', error);
      return NextResponse.json(
        { error: 'Failed to create service area' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      serviceArea: newArea,
    });
  } catch (error) {
    console.error('Error in service areas POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update all service areas for a company (bulk update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const body = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const { serviceAreas } = body;


    if (!Array.isArray(serviceAreas)) {
      console.error('❌ Service areas is not an array:', serviceAreas);
      return NextResponse.json(
        { error: 'Service areas must be an array' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Start a transaction-like operation
    // First, delete all existing service areas for the company
    const { error: deleteError } = await supabase
      .from('service_areas')
      .delete()
      .eq('company_id', companyId);

    if (deleteError) {
      console.error('❌ Error deleting existing service areas:', deleteError);
      console.error('❌ Delete error details:', {
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      });
      return NextResponse.json(
        { 
          error: 'Failed to delete existing service areas', 
          details: deleteError.message,
          code: deleteError.code 
        },
        { status: 500 }
      );
    }

    // Then insert all new service areas
    if (serviceAreas.length > 0) {
      const insertData = serviceAreas.map((area: ServiceAreaInput) => {
        const data: any = {
          company_id: companyId,
          name: area.name,
          type: area.type,
          priority: area.priority || 0,
          is_active: area.isActive !== undefined ? area.isActive : true,
        };

        if (area.type === 'polygon' && area.polygon) {
          const polygonWKT = `POLYGON((${area.polygon.map((point: { lat: number; lng: number }) => 
            `${point.lng} ${point.lat}`
          ).join(', ')}, ${area.polygon[0].lng} ${area.polygon[0].lat}))`;
          data.polygon = `SRID=4326;${polygonWKT}`;
        } else if (area.type === 'radius' && area.center && area.radius) {
          data.center_point = `SRID=4326;POINT(${area.center.lng} ${area.center.lat})`;
          data.radius_miles = area.radius;
        } else if (area.type === 'zip_code' && area.zipCodes) {
          data.zip_codes = area.zipCodes;
        }

        return data;
      });

      const { error: insertError } = await supabase
        .from('service_areas')
        .insert(insertData);

      if (insertError) {
        console.error('❌ Error inserting service areas:', insertError);
        console.error('❌ Insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        console.error('❌ Insert data that failed:', insertData);
        return NextResponse.json(
          { 
            error: 'Failed to insert service areas', 
            details: insertError.message,
            code: insertError.code,
            insertData 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Service areas updated successfully',
    });
  } catch (error) {
    console.error('❌ Unexpected error in service areas PUT:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}