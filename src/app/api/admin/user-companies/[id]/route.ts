import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { role, is_primary } = await request.json()
    const relationshipId = params.id

    const { error } = await supabaseAdmin
      .from('user_companies')
      .update({ role, is_primary })
      .eq('id', relationshipId)

    if (error) {
      console.error('Error updating relationship:', error)
      return NextResponse.json({ error: 'Failed to update relationship' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/admin/user-companies/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const relationshipId = params.id

    const { error } = await supabaseAdmin
      .from('user_companies')
      .delete()
      .eq('id', relationshipId)

    if (error) {
      console.error('Error deleting relationship:', error)
      return NextResponse.json({ error: 'Failed to delete relationship' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/user-companies/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}