import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { UpdateAgentData } from '@/types/agent';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching agent:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agent' },
        { status: 500 }
      );
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Get agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updateData: UpdateAgentData = await request.json();
    const supabase = createAdminClient();

    // First, verify the agent exists
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching existing agent:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch agent' },
        { status: 500 }
      );
    }

    // Build update object with validation
    const updates: any = {};

    if (updateData.agent_name !== undefined) {
      if (!updateData.agent_name?.trim()) {
        return NextResponse.json(
          { error: 'Agent name cannot be empty' },
          { status: 400 }
        );
      }
      updates.agent_name = updateData.agent_name.trim();
    }

    if (updateData.agent_id !== undefined) {
      if (!updateData.agent_id?.trim()) {
        return NextResponse.json(
          { error: 'Agent ID cannot be empty' },
          { status: 400 }
        );
      }

      // Check if the new agent_id conflicts with existing agents (excluding this one)
      if (updateData.agent_id.trim() !== existingAgent.agent_id) {
        const { data: conflictingAgent, error: checkError } = await supabase
          .from('agents')
          .select('id')
          .eq('agent_id', updateData.agent_id.trim())
          .neq('id', id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking agent ID conflict:', checkError);
          return NextResponse.json(
            { error: 'Failed to validate agent ID' },
            { status: 500 }
          );
        }

        if (conflictingAgent) {
          return NextResponse.json(
            { error: 'Agent ID already exists. Each agent must have a unique Retell agent ID.' },
            { status: 409 }
          );
        }
      }

      updates.agent_id = updateData.agent_id.trim();
    }

    if (updateData.phone_number !== undefined) {
      if (updateData.phone_number && updateData.phone_number.trim()) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(updateData.phone_number.trim())) {
          return NextResponse.json(
            { error: 'Invalid phone number format. Use E.164 format (e.g., +12074197718)' },
            { status: 400 }
          );
        }
        updates.phone_number = updateData.phone_number.trim();
      } else {
        updates.phone_number = null;
      }
    }

    if (updateData.agent_direction !== undefined) {
      if (!['inbound', 'outbound'].includes(updateData.agent_direction)) {
        return NextResponse.json(
          { error: 'Invalid agent direction. Must be inbound or outbound' },
          { status: 400 }
        );
      }
      updates.agent_direction = updateData.agent_direction;
    }

    if (updateData.agent_type !== undefined) {
      if (!['calling', 'sms', 'web_agent'].includes(updateData.agent_type)) {
        return NextResponse.json(
          { error: 'Invalid agent type. Must be calling, sms, or web_agent' },
          { status: 400 }
        );
      }
      updates.agent_type = updateData.agent_type;
    }

    if (updateData.is_active !== undefined) {
      updates.is_active = updateData.is_active;
    }

    // Only proceed if there are updates to make
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingAgent);
    }

    // Perform the update
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating agent:', updateError);
      return NextResponse.json(
        { error: 'Failed to update agent' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error('Update agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // First, verify the agent exists
    const { data: existingAgent, error: fetchError } = await supabase
      .from('agents')
      .select('id, agent_name')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching agent for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch agent' },
        { status: 500 }
      );
    }

    // Delete the agent
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting agent:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Agent deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}