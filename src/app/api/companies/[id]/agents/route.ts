import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Agent, CreateAgentData, AgentFilters } from '@/types/agent';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters for filtering
    const filters: AgentFilters = {
      agent_direction: searchParams.get('agent_direction') as any,
      agent_type: searchParams.get('agent_type') as any,
      is_active: searchParams.get('is_active') === 'true' ? true : 
                 searchParams.get('is_active') === 'false' ? false : undefined,
    };

    // Build query
    let query = supabase
      .from('agents')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });

    // Apply filters
    if (filters.agent_direction) {
      query = query.eq('agent_direction', filters.agent_direction);
    }
    if (filters.agent_type) {
      query = query.eq('agent_type', filters.agent_type);
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data: agents, error } = await query;

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    return NextResponse.json(agents || []);
  } catch (error) {
    console.error('Agents API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const agentData: CreateAgentData = await request.json();
    const supabase = createAdminClient();

    // Validate required fields
    if (!agentData.agent_name?.trim()) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    if (!agentData.agent_id?.trim()) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    if (!agentData.agent_direction) {
      return NextResponse.json(
        { error: 'Agent direction is required' },
        { status: 400 }
      );
    }

    if (!agentData.agent_type) {
      return NextResponse.json(
        { error: 'Agent type is required' },
        { status: 400 }
      );
    }

    // Validate agent_direction
    if (!['inbound', 'outbound'].includes(agentData.agent_direction)) {
      return NextResponse.json(
        { error: 'Invalid agent direction. Must be inbound or outbound' },
        { status: 400 }
      );
    }

    // Validate agent_type
    if (!['calling', 'sms', 'web_agent'].includes(agentData.agent_type)) {
      return NextResponse.json(
        { error: 'Invalid agent type. Must be calling, sms, or web_agent' },
        { status: 400 }
      );
    }

    // Check if agent_id already exists (globally unique)
    const { data: existingAgent, error: checkError } = await supabase
      .from('agents')
      .select('id')
      .eq('agent_id', agentData.agent_id.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing agent:', checkError);
      return NextResponse.json(
        { error: 'Failed to validate agent ID' },
        { status: 500 }
      );
    }

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent ID already exists. Each agent must have a unique Retell agent ID.' },
        { status: 409 }
      );
    }

    // Validate phone number format if provided
    if (agentData.phone_number && agentData.phone_number.trim()) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(agentData.phone_number.trim())) {
        return NextResponse.json(
          { error: 'Invalid phone number format. Use E.164 format (e.g., +12074197718)' },
          { status: 400 }
        );
      }
    }

    // Create the agent
    const { data: newAgent, error: insertError } = await supabase
      .from('agents')
      .insert({
        company_id: companyId,
        agent_name: agentData.agent_name.trim(),
        agent_id: agentData.agent_id.trim(),
        phone_number: agentData.phone_number?.trim() || null,
        agent_direction: agentData.agent_direction,
        agent_type: agentData.agent_type,
        is_active: agentData.is_active !== undefined ? agentData.is_active : true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating agent:', insertError);
      return NextResponse.json(
        { error: 'Failed to create agent' },
        { status: 500 }
      );
    }

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}