'use client';

import { useState, useEffect } from 'react';
import styles from './ServicePlansManager.module.scss';
import ProductModal, { Product } from './ProductModal';

interface ProductsManagerProps {
  companyId: string;
}

export default function ProductsManager({ companyId }: ProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (companyId) loadProducts();
  }, [companyId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch(`/api/admin/products/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts(data.data || []);
        } else {
          setErrorMessage(data.error || 'Failed to load products');
        }
      } else {
        setErrorMessage('Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setErrorMessage('Error loading products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product?: Product) => {
    setEditingProduct(product || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingProduct(null);
    setShowModal(false);
  };

  const handleSave = async (productData: Partial<Product>) => {
    try {
      setErrorMessage(null);
      const isUpdate = !!(productData as any).id;

      const response = await fetch(`/api/admin/products/${companyId}`, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productData, company_id: companyId }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(isUpdate ? 'Product updated successfully' : 'Product created successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        closeModal();
        loadProducts();
      } else {
        setErrorMessage(data.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setErrorMessage('Error saving product');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/admin/products/${companyId}?id=${productId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Product deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        loadProducts();
      } else {
        setErrorMessage(data.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorMessage('Error deleting product');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading products...</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
        </div>
        <button type="button" onClick={() => openModal()} className={styles.createButton}>
          Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No products configured yet.</p>
          <button type="button" onClick={() => openModal()} className={styles.createButton}>
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Unit Type</th>
                <th>Default Qty</th>
                <th>SKU</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{product.product_name}</div>
                    {product.product_description && (
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        {product.product_description.length > 60
                          ? product.product_description.slice(0, 60) + '…'
                          : product.product_description}
                      </div>
                    )}
                  </td>
                  <td>
                    {product.product_category
                      ? product.product_category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                      : '—'}
                  </td>
                  <td>${Number(product.unit_price).toFixed(2)}</td>
                  <td>{product.unit_type}</td>
                  <td>{product.default_quantity}</td>
                  <td>{product.sku || '—'}</td>
                  <td>
                    <span className={product.is_active ? styles.activeStatus : styles.inactiveStatus}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => openModal(product)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editingProduct}
          isOpen={showModal}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
