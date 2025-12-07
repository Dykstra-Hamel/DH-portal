/**
 * Customer Info Display Component
 *
 * Displays customer information in read-only format.
 * Shows name, email, phone, and service address.
 */

interface CustomerInfoDisplayProps {
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    service_address: {
      id: string;
      street_address: string;
      city: string;
      state: string;
      zip_code: string;
    } | null;
  };
}

export default function CustomerInfoDisplay({ customer }: CustomerInfoDisplayProps) {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
      <h2>Your Information</h2>

      <div style={{ marginBottom: '15px' }}>
        <strong>Name:</strong>
        <div>{customer.first_name} {customer.last_name}</div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Email:</strong>
        <div>{customer.email}</div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Phone:</strong>
        <div>{customer.phone_number}</div>
      </div>

      {customer.service_address && (
        <div>
          <strong>Service Address:</strong>
          <div>
            {customer.service_address.street_address}
            <br />
            {customer.service_address.city}, {customer.service_address.state}{' '}
            {customer.service_address.zip_code}
          </div>
        </div>
      )}
    </div>
  );
}
