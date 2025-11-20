# Order Management & Delivery Tracking System

## Overview
Complete order management and delivery tracking system for FreshCuts marketplace with support for both vendor and third-party delivery services.

## Features Implemented

### 1. Order Status Management
- **Order Lifecycle**: pending → confirmed → preparing → ready_for_pickup → assigned_for_delivery → out_for_delivery → delivered
- **Status Updates**: Real-time status updates with tracking history
- **Role-based Access**: Different interfaces for admin, vendor, customer, and delivery partners

### 2. Delivery Partner Assignment
- **Vendor Delivery**: Vendors can handle their own deliveries
- **Third-party Delivery**: External delivery partners can be assigned
- **Flexible Assignment**: Orders can be reassigned between delivery types

### 3. Order Tracking System
- **Tracking ID Generation**: Unique tracking IDs for delivery orders
- **Timeline View**: Visual progress tracking for customers
- **Real-time Updates**: Live status updates with timestamps
- **Tracking History**: Complete audit trail of order status changes

## System Architecture

### Database Collections

#### Orders Collection
```javascript
{
  id: "order_id",
  customerId: "customer_id",
  vendorId: "vendor_id",
  vendorName: "Vendor Name",
  items: [
    {
      name: "Product Name",
      quantity: 2,
      price: 150
    }
  ],
  total: 300,
  status: "confirmed",
  deliveryOption: "delivery", // pickup, delivery, express
  deliveryAddress: {
    address: "Full Address",
    city: "City",
    pincode: "123456"
  },
  deliveryPartnerId: "partner_id",
  deliveryPartnerType: "vendor", // vendor, third_party
  deliveryPartnerName: "Partner Name",
  trackingId: "FC12345678",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Order Tracking Collection
```javascript
{
  id: "tracking_id",
  orderId: "order_id",
  status: "out_for_delivery",
  message: "Order is out for delivery",
  timestamp: timestamp,
  deliveryPartnerId: "partner_id"
}
```

### Order Service Functions

#### Update Order Status
```javascript
orderService.updateOrderStatus(orderId, newStatus, message, deliveryPartnerId)
```

#### Assign Delivery Partner
```javascript
orderService.assignDeliveryPartner(orderId, partnerId, partnerType, partnerName)
```

#### Get Order Tracking
```javascript
orderService.getOrderTracking(orderId)
```

## User Interfaces

### 1. Admin Order Management (`/admin/orders`)
- **Order Overview**: All orders with filtering by status
- **Status Updates**: Quick status change buttons
- **Delivery Assignment**: Assign to vendor or third-party delivery
- **Order Details**: Complete order information and tracking

### 2. Customer Order Tracking (`/customer/orders`)
- **Order History**: List of all customer orders
- **Order Status**: Current status with visual indicators
- **Tracking Page**: Detailed tracking timeline (`/customer/orders/[orderId]`)
- **Real-time Updates**: Live status updates

### 3. Vendor Order Management (`/vendor/orders`)
- **Vendor Orders**: Orders specific to the vendor
- **Status Control**: Update order preparation status
- **Self Delivery**: Option to handle own deliveries
- **Customer Contact**: Direct customer communication

### 4. Delivery Partner Interface (`/delivery/orders`)
- **Assigned Orders**: Orders assigned for delivery
- **Navigation**: Google Maps integration for delivery address
- **Status Updates**: Mark orders as delivered or failed
- **Customer Contact**: Call customer functionality

## Order Status Flow

### Pickup Orders
```
pending → confirmed → preparing → ready_for_pickup → delivered
```

### Delivery Orders (Vendor)
```
pending → confirmed → preparing → ready_for_pickup → assigned_for_delivery → out_for_delivery → delivered
```

### Delivery Orders (Third-party)
```
pending → confirmed → preparing → ready_for_pickup → assigned_for_delivery → out_for_delivery → delivered
```

## Key Features

### 1. Multi-Role Support
- **Admin**: Complete order oversight and management
- **Vendor**: Order preparation and optional delivery
- **Customer**: Order tracking and history
- **Delivery Partner**: Delivery management and updates

### 2. Flexible Delivery Options
- **Store Pickup**: Customer collects from vendor
- **Vendor Delivery**: Vendor handles delivery
- **Third-party Delivery**: External delivery service

### 3. Real-time Tracking
- **Status Timeline**: Visual progress indicator
- **Live Updates**: Real-time status changes
- **Tracking History**: Complete audit trail
- **Notifications**: Status change notifications

### 4. Communication Features
- **Customer Contact**: Direct phone calling
- **Navigation**: Google Maps integration
- **Tracking ID**: Unique identifier for orders
- **Status Messages**: Detailed status descriptions

## Implementation Benefits

### For Customers
- **Transparency**: Complete visibility of order progress
- **Convenience**: Real-time tracking and updates
- **Communication**: Direct contact with delivery partners

### For Vendors
- **Control**: Manage order preparation and delivery
- **Flexibility**: Choose delivery method per order
- **Efficiency**: Streamlined order management interface

### For Delivery Partners
- **Organization**: Clear list of assigned deliveries
- **Navigation**: Integrated maps for efficient routing
- **Communication**: Direct customer contact capability

### For Admins
- **Oversight**: Complete system visibility
- **Management**: Flexible order and delivery assignment
- **Analytics**: Order status and delivery performance tracking

## Technical Implementation

### Order Service (`lib/orderService.js`)
- Centralized order management functions
- Status update with tracking history
- Delivery partner assignment
- Order retrieval by role

### Status Management
- Consistent status flow across all interfaces
- Automatic tracking ID generation
- Timestamp tracking for all status changes

### Role-based Access
- Different interfaces for each user type
- Appropriate functionality for each role
- Secure order access based on user permissions

This comprehensive order management and delivery tracking system provides complete visibility and control over the order lifecycle while supporting flexible delivery options through both vendor and third-party services.