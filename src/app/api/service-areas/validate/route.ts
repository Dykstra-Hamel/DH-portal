import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface ValidationRequest {
  companyId: string;
  latitude: number;
  longitude: number;
  zipCode?: string;
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Validate if a location is within service areas
export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    const { companyId, latitude, longitude, zipCode } = body;

    if (!companyId || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { 
          error: 'Company ID, latitude, and longitude are required',
          served: false,
          areas: []
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Validate UUID format for companyId (more flexible pattern)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      return NextResponse.json(
        { 
          error: 'Company ID must be a valid UUID format',
          served: false,
          areas: []
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          error: 'Invalid coordinates',
          served: false,
          areas: []
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    const supabase = createAdminClient();

    // Use the database function to check service area coverage
    const { data: coverageAreas, error } = await supabase
      .rpc('check_service_area_coverage', {
        p_company_id: companyId,
        p_latitude: latitude,
        p_longitude: longitude,
        p_zip_code: zipCode || null
      });

    if (error) {
      console.error('Error checking service area coverage:', error);
      return NextResponse.json(
        {
          error: 'Failed to validate service coverage',
          served: false,
          areas: []
        },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    const isServed = coverageAreas && coverageAreas.length > 0;
    const areas = coverageAreas || [];

    // Get the highest priority area if multiple areas cover the location
    const primaryArea = areas.length > 0 ? areas[0] : null;

    return NextResponse.json(
      {
        success: true,
        served: isServed,
        areas: areas,
        primaryArea: primaryArea,
        location: {
          latitude,
          longitude,
          zipCode
        }
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Error in service area validation:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        served: false,
        areas: []
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}