# PharmaCare - SQL Documentation

## Connect to Database

```bash
# Local MySQL
mysql -u root -pKalyan@234 pharma_db

# Docker container
docker exec -it pharma_db_container mysql -u root -pKalyan@234 pharma_db
```

```sql
USE pharma_db;
```

---

## Inspect Tables

```sql
SHOW TABLES;

-- Core tables
DESCRIBE users;
DESCRIBE roles;
DESCRIBE user_roles;
DESCRIBE medicines;
DESCRIBE categories;
DESCRIBE orders;
DESCRIBE order_items;
DESCRIBE prescriptions;
DESCRIBE coupons;

-- New tables (Payment & Delivery)
DESCRIBE payments;
DESCRIBE delivery_assignments;
```

---

## Users

```sql
-- View all users with roles
SELECT u.id, u.username, u.email, r.name AS role, u.loyalty_points, u.login_streak
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.id;

-- View only delivery agents
SELECT u.id, u.username, u.email
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'ROLE_DELIVERY_AGENT';

-- View only admin users
SELECT u.username, u.email
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'ROLE_ADMIN';

-- Check loyalty points and streak
SELECT username, loyalty_points, login_streak, last_login_date FROM users;

-- Check OTP reset token (for debugging forgot password)
SELECT username, email, reset_token, reset_token_expiry FROM users;

-- Grant delivery agent role to a user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'delivery1' AND r.name = 'ROLE_DELIVERY_AGENT';

-- Grant admin role to a user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'kalyan' AND r.name = 'ROLE_ADMIN';

-- Remove a role from a user
DELETE ur FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'kalyan' AND r.name = 'ROLE_ADMIN';

-- Manually add loyalty points
UPDATE users SET loyalty_points = loyalty_points + 100 WHERE username = 'kalyan';

-- Reset loyalty points
UPDATE users SET loyalty_points = 0 WHERE username = 'kalyan';

-- Clear OTP token (if stuck)
UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE username = 'kalyan';

-- Delete a user (cascade)
DELETE FROM order_items WHERE order_id IN
  (SELECT id FROM orders WHERE user_id = (SELECT id FROM users WHERE username = 'kalyan'));
DELETE FROM prescriptions WHERE order_id IN
  (SELECT id FROM orders WHERE user_id = (SELECT id FROM users WHERE username = 'kalyan'));
DELETE FROM orders WHERE user_id = (SELECT id FROM users WHERE username = 'kalyan');
DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE username = 'kalyan');
DELETE FROM users WHERE username = 'kalyan';
```

---

## Roles

```sql
-- View all roles
SELECT * FROM roles;

-- Fix roles column if ROLE_DELIVERY_AGENT doesn't fit (run once on existing DBs)
ALTER TABLE roles MODIFY COLUMN name VARCHAR(30);

-- Check if ROLE_DELIVERY_AGENT exists
SELECT * FROM roles WHERE name = 'ROLE_DELIVERY_AGENT';

-- Manually insert ROLE_DELIVERY_AGENT if missing
INSERT INTO roles (name) VALUES ('ROLE_DELIVERY_AGENT');
```

---

## Medicines

```sql
-- View all medicines with category
SELECT m.id, m.name, m.price, m.stock, m.dosage, m.packaging,
       m.requires_prescription, m.image_url, c.name AS category
FROM medicines m
LEFT JOIN categories c ON m.category_id = c.id
ORDER BY c.name, m.name;

-- Search by name
SELECT * FROM medicines WHERE name LIKE '%dolo%';

-- Low stock alert (below 10)
SELECT id, name, stock FROM medicines WHERE stock < 10 ORDER BY stock ASC;

-- Out of stock
SELECT id, name FROM medicines WHERE stock = 0;

-- Prescription-required medicines
SELECT id, name, price FROM medicines WHERE requires_prescription = 1;

-- Count medicines per category
SELECT c.name AS category, COUNT(m.id) AS total
FROM categories c
LEFT JOIN medicines m ON m.category_id = c.id
GROUP BY c.name ORDER BY total DESC;

-- Update stock manually
UPDATE medicines SET stock = 200 WHERE id = 1;

-- Update price
UPDATE medicines SET price = 35.00 WHERE id = 1;

-- Delete a medicine
DELETE FROM medicines WHERE id = 1;
```

---

## Categories

```sql
-- View all categories with medicine count
SELECT c.id, c.name, COUNT(m.id) AS medicine_count
FROM categories c
LEFT JOIN medicines m ON m.category_id = c.id
GROUP BY c.id, c.name ORDER BY medicine_count DESC;

-- Add a new category
INSERT INTO categories (name, description) VALUES ('Eye Care', 'Eye drops and ointments');

-- Delete a category (unlink medicines first)
UPDATE medicines SET category_id = NULL WHERE category_id = 5;
DELETE FROM categories WHERE id = 5;
```

---

## Orders

```sql
-- View all orders with username and payment/delivery status
SELECT o.id, u.username, o.status, o.payment_status, o.delivery_status,
       o.total_amount, o.discount_amount, o.coupon_code, o.points_used,
       o.address, o.contact_number, o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC;

-- Orders grouped by status
SELECT status, COUNT(*) AS count FROM orders GROUP BY status;

-- Orders grouped by payment status
SELECT payment_status, COUNT(*) AS count FROM orders GROUP BY payment_status;

-- All PAID orders (ready for admin approval)
SELECT o.id, u.username, o.total_amount, o.created_at
FROM orders o JOIN users u ON o.user_id = u.id
WHERE o.status = 'PAID' ORDER BY o.created_at ASC;

-- All INITIATED orders (approved, awaiting delivery)
SELECT o.id, u.username, o.total_amount, o.address, o.contact_number
FROM orders o JOIN users u ON o.user_id = u.id
WHERE o.status = 'INITIATED';

-- View order items with medicine names
SELECT o.id AS order_id, u.username, m.name AS medicine,
       oi.quantity, oi.price
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN users u ON o.user_id = u.id
JOIN medicines m ON oi.medicine_id = m.id
ORDER BY o.id DESC;

-- Revenue summary (excluding cancelled/failed)
SELECT COUNT(*) AS total_orders,
       SUM(total_amount) AS total_revenue,
       SUM(discount_amount) AS total_discounts
FROM orders WHERE status NOT IN ('CANCELLED', 'FAILED');

-- Manually update order status
UPDATE orders SET status = 'DELIVERED' WHERE id = 5;

-- Manually update payment status
UPDATE orders SET payment_status = 'PAID' WHERE id = 5;
```

---

## Payments

```sql
-- View all payments
SELECT p.id, p.order_id, p.razorpay_order_id, p.razorpay_payment_id,
       p.amount, p.status, p.created_at, p.updated_at
FROM payments p
ORDER BY p.created_at DESC;

-- Successful payments
SELECT p.id, o.id AS order_id, u.username, p.amount, p.razorpay_payment_id, p.created_at
FROM payments p
JOIN orders o ON p.order_id = o.id
JOIN users u ON o.user_id = u.id
WHERE p.status = 'SUCCESS'
ORDER BY p.created_at DESC;

-- Failed payments
SELECT p.id, o.id AS order_id, u.username, p.amount, p.created_at
FROM payments p
JOIN orders o ON p.order_id = o.id
JOIN users u ON o.user_id = u.id
WHERE p.status = 'FAILED';

-- Total revenue from successful payments
SELECT SUM(amount) AS total_revenue, COUNT(*) AS total_transactions
FROM payments WHERE status = 'SUCCESS';

-- Payment for a specific order
SELECT * FROM payments WHERE order_id = 5;

-- Manually mark a payment as SUCCESS (use only for debugging)
UPDATE payments SET status = 'SUCCESS', updated_at = NOW() WHERE order_id = 5;
UPDATE orders SET status = 'PAID', payment_status = 'PAID' WHERE id = 5;
```

---

## Delivery Assignments

```sql
-- View all delivery assignments with agent and order info
SELECT da.id, da.status AS delivery_status,
       o.id AS order_id, o.status AS order_status,
       o.address AS delivery_address, o.contact_number,
       u_customer.username AS customer,
       u_agent.username AS agent,
       da.assigned_at, da.updated_at
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
JOIN users u_customer ON o.user_id = u_customer.id
JOIN users u_agent ON da.agent_id = u_agent.id
ORDER BY da.assigned_at DESC;

-- Assignments for a specific agent
SELECT da.id, da.status, o.id AS order_id, o.address, o.contact_number,
       u.username AS customer, da.assigned_at
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
JOIN users u ON o.user_id = u.id
WHERE da.agent_id = (SELECT id FROM users WHERE username = 'delivery1');

-- Active deliveries (not yet delivered)
SELECT da.id, da.status, o.id AS order_id, o.address,
       u_agent.username AS agent
FROM delivery_assignments da
JOIN orders o ON da.order_id = o.id
JOIN users u_agent ON da.agent_id = u_agent.id
WHERE da.status != 'DELIVERED'
ORDER BY da.assigned_at ASC;

-- Delivery count per agent
SELECT u.username AS agent, COUNT(da.id) AS total_deliveries,
       SUM(CASE WHEN da.status = 'DELIVERED' THEN 1 ELSE 0 END) AS completed
FROM delivery_assignments da
JOIN users u ON da.agent_id = u.id
GROUP BY u.username;

-- Manually update delivery status
UPDATE delivery_assignments SET status = 'DELIVERED', updated_at = NOW() WHERE id = 1;
UPDATE orders SET status = 'DELIVERED', delivery_status = 'DELIVERED' WHERE id = 5;

-- Delete a delivery assignment
DELETE FROM delivery_assignments WHERE id = 1;
```

---

## Prescriptions

```sql
-- View all prescriptions with order and user info
SELECT p.id, u.username, o.id AS order_id, p.status, p.file_path
FROM prescriptions p
JOIN orders o ON p.order_id = o.id
JOIN users u ON o.user_id = u.id;

-- Pending prescriptions (awaiting admin review)
SELECT p.id, u.username, o.id AS order_id, p.file_path
FROM prescriptions p
JOIN orders o ON p.order_id = o.id
JOIN users u ON o.user_id = u.id
WHERE p.status = 'PENDING';

-- Manually validate a prescription
UPDATE prescriptions SET status = 'VALIDATED' WHERE id = 1;

-- Delete a prescription
DELETE FROM prescriptions WHERE id = 1;
```

---

## Coupons

```sql
-- View all coupons
SELECT code, discount_type, discount_value, expiry_date,
       min_order_amount, usage_limit, used_count FROM coupons;

-- Active (non-expired) coupons
SELECT code, discount_type, discount_value, expiry_date
FROM coupons WHERE expiry_date >= CURDATE() OR expiry_date IS NULL;

-- Expired coupons
SELECT code, expiry_date FROM coupons WHERE expiry_date < CURDATE();

-- Most used coupons
SELECT code, used_count FROM coupons ORDER BY used_count DESC;

-- Add a new coupon
INSERT INTO coupons (code, discount_type, discount_value, expiry_date, min_order_amount, usage_limit, used_count)
VALUES ('SAVE15', 'PERCENTAGE', 15.0, '2026-12-31', 300.0, 100, 0);

-- Reset coupon usage count
UPDATE coupons SET used_count = 0 WHERE code = 'WELCOME10';

-- Extend coupon expiry
UPDATE coupons SET expiry_date = '2027-01-01' WHERE code = 'FLAT100';

-- Delete a coupon
DELETE FROM coupons WHERE code = 'SAVE15';
```

---

## Analytics

```sql
-- Top spending users
SELECT u.username, SUM(o.total_amount) AS total_spent
FROM orders o JOIN users u ON o.user_id = u.id
WHERE o.status NOT IN ('CANCELLED', 'FAILED')
GROUP BY u.username ORDER BY total_spent DESC LIMIT 10;

-- Most ordered medicines
SELECT m.name, SUM(oi.quantity) AS total_ordered
FROM order_items oi JOIN medicines m ON oi.medicine_id = m.id
GROUP BY m.name ORDER BY total_ordered DESC LIMIT 10;

-- Daily order count (last 7 days)
SELECT DATE(created_at) AS date, COUNT(*) AS orders
FROM orders
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at) ORDER BY date DESC;

-- Daily revenue (last 7 days)
SELECT DATE(created_at) AS date, SUM(total_amount) AS revenue
FROM orders
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  AND status NOT IN ('CANCELLED', 'FAILED')
GROUP BY DATE(created_at) ORDER BY date DESC;

-- Total users by role
SELECT r.name AS role, COUNT(ur.user_id) AS count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.name;

-- Orders placed today
SELECT COUNT(*) AS orders_today FROM orders
WHERE DATE(created_at) = CURDATE();

-- Revenue today
SELECT SUM(total_amount) AS revenue_today FROM orders
WHERE DATE(created_at) = CURDATE() AND status NOT IN ('CANCELLED', 'FAILED');

-- Payment success rate
SELECT
  COUNT(*) AS total_payments,
  SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS successful,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed,
  ROUND(SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS success_rate_pct
FROM payments;

-- Delivery performance per agent
SELECT u.username AS agent,
       COUNT(da.id) AS assigned,
       SUM(CASE WHEN da.status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered,
       SUM(CASE WHEN da.status = 'OUT_FOR_DELIVERY' THEN 1 ELSE 0 END) AS in_transit
FROM delivery_assignments da
JOIN users u ON da.agent_id = u.id
GROUP BY u.username;
```

---

## Manual Fixes

```sql
-- Fix roles column too small for ROLE_DELIVERY_AGENT (run once on existing DBs)
ALTER TABLE roles MODIFY COLUMN name VARCHAR(30);

-- Add new order columns if Hibernate didn't add them
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) DEFAULT 'PENDING_PAYMENT';
ALTER TABLE orders ADD COLUMN delivery_status VARCHAR(30) DEFAULT 'PENDING';

-- Add image_url column if missing
ALTER TABLE medicines ADD COLUMN image_url VARCHAR(255);

-- Add reset token columns if missing
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME;

-- Reset auto-increment (after deleting all orders)
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE delivery_assignments AUTO_INCREMENT = 1;

-- Full DB reset (keeps structure, clears all data)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE delivery_assignments;
TRUNCATE TABLE payments;
TRUNCATE TABLE order_items;
TRUNCATE TABLE prescriptions;
TRUNCATE TABLE orders;
TRUNCATE TABLE user_roles;
TRUNCATE TABLE users;
TRUNCATE TABLE medicines;
TRUNCATE TABLE categories;
TRUNCATE TABLE coupons;
TRUNCATE TABLE roles;
SET FOREIGN_KEY_CHECKS = 1;
```
