import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/companies/[id]/sales-checklists/[checklistId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { id: companyId, checklistId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { name, isActive, displayOrder, questions = [], linkedPlanIds = [] } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existing, error: ownerError } = await supabase
      .from('sales_checklists')
      .select('id')
      .eq('id', checklistId)
      .eq('company_id', companyId)
      .single();

    if (ownerError || !existing) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    // Update checklist metadata
    const { error: updateError } = await supabase
      .from('sales_checklists')
      .update({
        name: name.trim(),
        is_active: isActive ?? true,
        display_order: displayOrder ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', checklistId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 });
    }

    // Replace questions: delete all then re-insert
    await supabase
      .from('sales_checklist_questions')
      .delete()
      .eq('checklist_id', checklistId);

    if (questions.length > 0) {
      const questionsToInsert = questions.map((q: any) => ({
        ...(q.id ? { id: q.id } : {}),
        checklist_id: checklistId,
        text: q.text,
        answer_type: q.answerType ?? q.answer_type ?? 'yes_no',
        display_order: q.displayOrder ?? q.display_order ?? 0,
        parent_question_id: q.parentQuestionId ?? q.parent_question_id ?? null,
        min_value: q.minValue ?? null,
        max_value: q.maxValue ?? null,
        step_value: q.stepValue ?? null,
        dropdown_options: q.dropdownOptions ?? null,
      }));
      const { error: qError } = await supabase
        .from('sales_checklist_questions')
        .insert(questionsToInsert);
      if (qError) {
        console.error('[PUT sales-checklists] qError:', qError);
        return NextResponse.json({ error: 'Failed to update questions' }, { status: 500 });
      }
    }

    // Replace plan links: delete all then re-insert
    await supabase
      .from('sales_checklist_plan_links')
      .delete()
      .eq('checklist_id', checklistId);

    if (linkedPlanIds.length > 0) {
      const linksToInsert = linkedPlanIds.map((planId: string) => ({
        checklist_id: checklistId,
        service_plan_id: planId,
      }));
      const { error: linkError } = await supabase
        .from('sales_checklist_plan_links')
        .insert(linksToInsert);
      if (linkError) {
        return NextResponse.json({ error: 'Failed to update plan links' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/companies/[id]/sales-checklists/[checklistId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
) {
  try {
    const { id: companyId, checklistId } = await params;
    const supabase = await createClient();

    // Verify ownership then delete (cascade handles questions and plan links)
    const { error } = await supabase
      .from('sales_checklists')
      .delete()
      .eq('id', checklistId)
      .eq('company_id', companyId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete checklist' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
