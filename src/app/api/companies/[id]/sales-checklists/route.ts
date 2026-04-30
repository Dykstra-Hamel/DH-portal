import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/companies/[id]/sales-checklists
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();

    const { data: checklists, error } = await supabase
      .from('sales_checklists')
      .select(`
        id,
        name,
        display_order,
        is_active,
        questions:sales_checklist_questions(
          id,
          text,
          answer_type,
          display_order,
          parent_question_id,
          min_value,
          max_value,
          step_value,
          dropdown_options
        ),
        plan_links:sales_checklist_plan_links(
          service_plan_id
        )
      `)
      .eq('company_id', companyId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[GET sales-checklists] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch sales checklists' }, { status: 500 });
    }

    const result = (checklists ?? []).map(cl => ({
      id: cl.id,
      name: cl.name,
      displayOrder: cl.display_order,
      isActive: cl.is_active,
      questions: (cl.questions as any[])
        .sort((a, b) => a.display_order - b.display_order)
        .map(q => ({
          id: q.id,
          text: q.text,
          answerType: q.answer_type as 'yes_no' | 'text' | 'number' | 'dropdown',
          displayOrder: q.display_order,
          parentQuestionId: q.parent_question_id ?? null,
          minValue: q.min_value ?? null,
          maxValue: q.max_value ?? null,
          stepValue: q.step_value ?? null,
          dropdownOptions: q.dropdown_options ?? null,
        })),
      linkedPlanIds: (cl.plan_links as any[]).map(l => l.service_plan_id),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/companies/[id]/sales-checklists
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { name, isActive = true, displayOrder = 0, questions = [], linkedPlanIds = [] } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Insert checklist
    const { data: checklist, error: clError } = await supabase
      .from('sales_checklists')
      .insert({
        company_id: companyId,
        name: name.trim(),
        is_active: isActive,
        display_order: displayOrder,
      })
      .select('id')
      .single();

    if (clError || !checklist) {
      return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 });
    }

    // Insert questions
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q: any) => ({
        ...(q.id ? { id: q.id } : {}),
        checklist_id: checklist.id,
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
        return NextResponse.json({ error: 'Failed to create questions' }, { status: 500 });
      }
    }

    // Insert plan links
    if (linkedPlanIds.length > 0) {
      const linksToInsert = linkedPlanIds.map((planId: string) => ({
        checklist_id: checklist.id,
        service_plan_id: planId,
      }));
      const { error: linkError } = await supabase
        .from('sales_checklist_plan_links')
        .insert(linksToInsert);
      if (linkError) {
        return NextResponse.json({ error: 'Failed to create plan links' }, { status: 500 });
      }
    }

    return NextResponse.json({ id: checklist.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
