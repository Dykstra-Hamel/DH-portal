import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyData = await request.json()
    const companyId = params.id

    const { error } = await supabaseAdmin
      .from('companies')
      .update(companyData)
      .eq('id', companyId)

    if (error) {
      console.error('Error updating company:', error)
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/admin/companies/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id

    const { error } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', companyId)

    if (error) {
      console.error('Error deleting company:', error)
      return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/companies/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}