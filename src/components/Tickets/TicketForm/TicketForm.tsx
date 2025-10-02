'use client';

import React, { useState, useEffect } from 'react';
import { TicketFormData, ticketSourceOptions, ticketTypeOptions, ticketStatusOptions, ticketPriorityOptions } from '@/types/ticket';
import { SearchableDropdown, SearchableDropdownItem } from '@/components/Common/SearchableDropdown';
import styles from './TicketForm.module.scss';

interface TicketFormProps {
  companyId: string;
  assignableUsers?: Array<{ id: string; first_name: string; last_name: string; email: string }>;
  onFormDataChange?: (data: TicketFormData | null) => void;
  loading?: boolean;
}

export default function TicketForm({
  companyId,
  assignableUsers = [],
  onFormDataChange,
  loading = false,
}: TicketFormProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    source: 'other',
    type: 'other',
    status: 'new',
    priority: 'medium',
    description: '',
    service_type: '',
    pest_type: '',
    assigned_to: undefined,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TicketFormData, string>>>({});
  const [customers, setCustomers] = useState<SearchableDropdownItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SearchableDropdownItem | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const searchCustomers = async (query: string) => {
    if (!companyId) return;

    // Clear results if query is empty
    if (!query.trim()) {
      setCustomers([]);
      return;
    }

    setLoadingCustomers(true);
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}&companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        const customerList = (data.customers || []).map((customer: any) => ({
          id: customer.id,
          displayName: `${customer.first_name} ${customer.last_name} - ${customer.email || customer.phone}`,
          ...customer
        }));
        setCustomers(customerList);
      } else {
        console.error('Failed to search customers');
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerSelect = (customer: SearchableDropdownItem | null) => {
    setSelectedCustomer(customer);
    
    // Extract primary service address ID if available
    let serviceAddressId = undefined;
    if (customer?.primary_service_address && Array.isArray(customer.primary_service_address) && customer.primary_service_address.length > 0) {
      const primaryAddress = customer.primary_service_address[0];
      if (primaryAddress?.service_address?.id) {
        serviceAddressId = primaryAddress.service_address.id;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      customer_id: customer?.id || undefined,
      service_address_id: serviceAddressId,
    }));

    // Clear customer_id error when selection is made
    if (customer && errors.customer_id) {
      setErrors(prev => ({
        ...prev,
        customer_id: undefined,
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof TicketFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleNewCustomerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (updateErrors: boolean = true): boolean => {
    const newErrors: Partial<Record<keyof TicketFormData, string>> = {};

    if (!formData.source) {
      newErrors.source = 'Source is required';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    if (showNewCustomer) {
      if (!newCustomerData.first_name.trim()) {
        newErrors.customer_id = 'Customer first name is required';
      }
      if (!newCustomerData.last_name.trim()) {
        newErrors.customer_id = 'Customer last name is required';
      }
    }

    if (updateErrors) {
      setErrors(newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (onFormDataChange) {
      const isValid = validateForm(false);
      const dataToSend = { 
        ...formData,
        // Include customer data if creating new customer
        ...(showNewCustomer && { 
          newCustomerData: {
            first_name: newCustomerData.first_name,
            last_name: newCustomerData.last_name,
            email: newCustomerData.email || undefined,
            phone: newCustomerData.phone || undefined,
            address: newCustomerData.address || undefined,
            city: newCustomerData.city || undefined,
            state: newCustomerData.state || undefined,
            zip_code: newCustomerData.zip_code || undefined,
          }
        })
      };
      onFormDataChange(isValid ? dataToSend : null);
    }
  }, [formData, newCustomerData, showNewCustomer, onFormDataChange]);

  return (
    <div className={styles.ticketForm}>
      {/* Customer Selection */}
      <div className={styles.formGroup}>
        <label htmlFor="customer_selection" className={styles.label}>
          Customer
        </label>
        <div className={styles.customerSection}>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="customerType"
                checked={!showNewCustomer}
                onChange={() => {
                  setShowNewCustomer(false);
                  // Reset customer selection when switching back to existing
                  if (showNewCustomer) {
                    setSelectedCustomer(null);
                    setFormData(prev => ({ ...prev, customer_id: undefined, service_address_id: undefined }));
                  }
                }}
              />
              Select Existing Customer
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="customerType"
                checked={showNewCustomer}
                onChange={() => {
                  setShowNewCustomer(true);
                  // Clear any selected customer when switching to new customer
                  setSelectedCustomer(null);
                  setFormData(prev => ({ ...prev, customer_id: undefined, service_address_id: undefined }));
                }}
              />
              Create New Customer
            </label>
          </div>

          {!showNewCustomer ? (
            <SearchableDropdown
              items={customers}
              onSearch={searchCustomers}
              onSelect={handleCustomerSelect}
              placeholder="Search customers by name, email, or phone..."
              displayKey="displayName"
              loading={loadingCustomers}
              selectedItem={selectedCustomer}
              className={styles.select}
              noResultsText="No customers found"
              minSearchLength={2}
            />
          ) : (
            <div className={styles.newCustomerFields}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="first_name" className={styles.label}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={newCustomerData.first_name}
                    onChange={handleNewCustomerChange}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="last_name" className={styles.label}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={newCustomerData.last_name}
                    onChange={handleNewCustomerChange}
                    className={styles.input}
                    required
                  />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newCustomerData.email}
                    onChange={handleNewCustomerChange}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newCustomerData.phone}
                    onChange={handleNewCustomerChange}
                    className={styles.input}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="address" className={styles.label}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={newCustomerData.address}
                  onChange={handleNewCustomerChange}
                  className={styles.input}
                />
              </div>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={newCustomerData.city}
                    onChange={handleNewCustomerChange}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="state" className={styles.label}>
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={newCustomerData.state}
                    onChange={handleNewCustomerChange}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="zip_code" className={styles.label}>
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={newCustomerData.zip_code}
                    onChange={handleNewCustomerChange}
                    className={styles.input}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        {errors.customer_id && <div className={styles.error}>{errors.customer_id}</div>}
      </div>

      {/* Source and Type */}
      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="source" className={styles.label}>
            Source *
          </label>
          <select
            name="source"
            value={formData.source}
            onChange={handleInputChange}
            className={styles.select}
            required
          >
            {ticketSourceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.source && <div className={styles.error}>{errors.source}</div>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="type" className={styles.label}>
            Type *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className={styles.select}
            required
          >
            {ticketTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.type && <div className={styles.error}>{errors.type}</div>}
        </div>
      </div>

      {/* Status and Priority */}
      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="status" className={styles.label}>
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className={styles.select}
            required
          >
            {ticketStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.status && <div className={styles.error}>{errors.status}</div>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="priority" className={styles.label}>
            Priority *
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className={styles.select}
            required
          >
            {ticketPriorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.priority && <div className={styles.error}>{errors.priority}</div>}
        </div>
      </div>

      {/* Assignment */}
      <div className={styles.formGroup}>
        <label htmlFor="assigned_to" className={styles.label}>
          Assign To
        </label>
        <select
          name="assigned_to"
          value={formData.assigned_to || ''}
          onChange={handleInputChange}
          className={styles.select}
        >
          <option value="">Unassigned</option>
          {assignableUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.first_name} {user.last_name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {/* Service and Pest Type */}
      <div className={styles.row}>
        <div className={styles.formGroup}>
          <label htmlFor="service_type" className={styles.label}>
            Service Type
          </label>
          <input
            type="text"
            name="service_type"
            value={formData.service_type || ''}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="e.g., Pest Control, Lawn Care"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="pest_type" className={styles.label}>
            Pest Type
          </label>
          <input
            type="text"
            name="pest_type"
            value={formData.pest_type || ''}
            onChange={handleInputChange}
            className={styles.input}
            placeholder="e.g., Ants, Rodents, Spiders"
          />
        </div>
      </div>

      {/* Description */}
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleInputChange}
          className={styles.textarea}
          rows={4}
          placeholder="Describe the ticket details..."
        />
      </div>
    </div>
  );
}