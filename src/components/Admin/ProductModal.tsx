'use client';

import { useState, useEffect } from 'react';
import styles from './ProductModal.module.scss';

export interface Product {
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

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Product>) => void;
}

const UNIT_TYPES = ['each', 'box', 'pack', 'bag', 'bottle', 'tube', 'pair', 'set'];
const CATEGORIES = ['general', 'rodent', 'bed_bug', 'termite', 'mosquito', 'wildlife', 'other'];

export default function ProductModal({ product, isOpen, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    product_name: '',
    product_description: '',
    product_category: '',
    unit_price: 0,
    recurring_price: 0,
    unit_type: 'each',
    default_quantity: 1,
    min_quantity: 1,
    max_quantity: '' as number | '',
    sku: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name,
        product_description: product.product_description ?? '',
        product_category: product.product_category ?? '',
        unit_price: product.unit_price,
        recurring_price: product.recurring_price ?? 0,
        unit_type: product.unit_type,
        default_quantity: product.default_quantity,
        min_quantity: product.min_quantity,
        max_quantity: product.max_quantity ?? '',
        sku: product.sku ?? '',
        is_active: product.is_active,
        display_order: product.display_order,
      });
    } else {
      setFormData({
        product_name: '',
        product_description: '',
        product_category: '',
        unit_price: 0,
        recurring_price: 0,
        unit_type: 'each',
        default_quantity: 1,
        min_quantity: 1,
        max_quantity: '',
        sku: '',
        is_active: true,
        display_order: 0,
      });
    }
  }, [product]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_name.trim()) {
      alert('Product name is required');
      return;
    }

    if (formData.unit_price < 0) {
      alert('Unit price cannot be negative');
      return;
    }

    if (formData.min_quantity > formData.default_quantity) {
      alert('Default quantity cannot be less than minimum quantity');
      return;
    }

    const maxQty = formData.max_quantity === '' ? null : Number(formData.max_quantity);
    if (maxQty !== null && maxQty < formData.min_quantity) {
      alert('Max quantity cannot be less than minimum quantity');
      return;
    }

    onSave({
      ...(product?.id ? { id: product.id } : {}),
      product_name: formData.product_name.trim(),
      product_description: formData.product_description.trim() || null,
      product_category: formData.product_category || null,
      unit_price: formData.unit_price,
      recurring_price: formData.recurring_price,
      unit_type: formData.unit_type,
      default_quantity: formData.default_quantity,
      min_quantity: formData.min_quantity,
      max_quantity: maxQty,
      sku: formData.sku.trim() || null,
      is_active: formData.is_active,
      display_order: formData.display_order,
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>{product ? 'Edit Product' : 'Add Product'}</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Product Name *</label>
            <input
              type="text"
              value={formData.product_name}
              onChange={e => handleChange('product_name', e.target.value)}
              placeholder="e.g. Rodent Bait Station"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={formData.product_description}
              onChange={e => handleChange('product_description', e.target.value)}
              placeholder="Optional product description"
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Unit Price ($) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={e => handleChange('unit_price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Recurring Price ($/per service)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.recurring_price}
                onChange={e => handleChange('recurring_price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <span className={styles.fieldHint}>
                Added to recurring totals each service visit. Leave 0 for one-time products.
              </span>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={e => handleChange('sku', e.target.value)}
                placeholder="Optional SKU code"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Default Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.default_quantity}
                onChange={e => handleChange('default_quantity', parseInt(e.target.value) || 1)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Min Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.min_quantity}
                onChange={e => handleChange('min_quantity', parseInt(e.target.value) || 1)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Max Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.max_quantity}
                onChange={e => handleChange('max_quantity', e.target.value === '' ? '' : parseInt(e.target.value))}
                placeholder="No limit"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Display Order</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.display_order}
                onChange={e => handleChange('display_order', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e => handleChange('is_active', e.target.checked)}
              />
              Product is active
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              {product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
