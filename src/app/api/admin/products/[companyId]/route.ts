import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface Product {
  id: string;
  company_id: string;
  product_name: string;
  product_description: string | null;
  product_category: string | null;
  unit_price: number;
  recurring_price: number;
  unit_type: string;
  default_quantity: number;
  min_quantity: number;
  max_quantity: number | null;
  sku: string | null;
  product_image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface ProductRequest {
  product_name: string;
  product_description?: string | null;
  product_category?: string | null;
  unit_price: number;
  recurring_price?: number;
  unit_type?: string;
  default_quantity?: number;
  min_quantity?: number;
  max_quantity?: number | null;
  sku?: string | null;
  product_image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
}

interface UpdateProductRequest extends ProductRequest {
  id: string;
}

// GET: Fetch all products for a company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .order('display_order', { ascending: true })
      .order('product_name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error in products GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const body: ProductRequest = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    if (!body.product_name?.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    if (body.unit_price == null || body.unit_price < 0) {
      return NextResponse.json({ error: 'Unit price must be 0 or greater' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('products')
      .insert({
        company_id: companyId,
        product_name: body.product_name.trim(),
        product_description: body.product_description ?? null,
        product_category: body.product_category ?? null,
        unit_price: body.unit_price,
        recurring_price: body.recurring_price ?? 0,
        unit_type: body.unit_type ?? 'each',
        default_quantity: body.default_quantity ?? 1,
        min_quantity: body.min_quantity ?? 1,
        max_quantity: body.max_quantity ?? null,
        sku: body.sku ?? null,
        product_image_url: body.product_image_url ?? null,
        is_active: body.is_active ?? true,
        display_order: body.display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error in products POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an existing product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const body: UpdateProductRequest = await request.json();

    if (!companyId || !body.id) {
      return NextResponse.json({ error: 'Company ID and product ID are required' }, { status: 400 });
    }

    if (!body.product_name?.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    if (body.unit_price == null || body.unit_price < 0) {
      return NextResponse.json({ error: 'Unit price must be 0 or greater' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { id, ...fields } = body;

    const { data, error } = await supabase
      .from('products')
      .update({
        product_name: fields.product_name.trim(),
        product_description: fields.product_description ?? null,
        product_category: fields.product_category ?? null,
        unit_price: fields.unit_price,
        recurring_price: fields.recurring_price ?? 0,
        unit_type: fields.unit_type ?? 'each',
        default_quantity: fields.default_quantity ?? 1,
        min_quantity: fields.min_quantity ?? 1,
        max_quantity: fields.max_quantity ?? null,
        sku: fields.sku ?? null,
        product_image_url: fields.product_image_url ?? null,
        is_active: fields.is_active ?? true,
        display_order: fields.display_order ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error in products PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!companyId || !productId) {
      return NextResponse.json({ error: 'Company ID and product ID are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in products DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
