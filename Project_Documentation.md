# PharmaCare - Project Documentation

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router DOM, Axios |
| Backend | Spring Boot 3.2.3, Java 17, Spring Security, Spring AI |
| Database | MySQL 8.0 |
| Auth | JWT (jjwt 0.11.5) |
| Payment | Razorpay (Test Mode) |
| AI Chatbot | Groq API (llama-3.3-70b-versatile) |
| Notifications | Twilio SMS, Gmail SMTP |

---

## Project Structure

```
pharma/
├── backend/
│   ├── src/main/java/com/pharma/backend/
│   │   ├── BackendApplication.java
│   │   ├── config/          DataSeeder.java, WebMvcConfig.java
│   │   ├── controllers/     Auth, Medicine, Category, Order, Prescription,
│   │   │                    Coupon, Reward, Chatbot, Payment, Delivery
│   │   ├── entity/          User, Role, Medicine, Category, Order, OrderItem,
│   │   │                    Prescription, Coupon, Payment, DeliveryAssignment
│   │   ├── payload/         request/ + response/ DTOs
│   │   ├── repository/      JPA repositories for all entities
│   │   ├── security/        JWT, WebSecurityConfig, RateLimiting
│   │   ├── seeder/          DatabaseSeeder.java (CSV import)
│   │   └── service/         AiChatbotService, EmailService, SmsService
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── data/medicines.csv
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/Chatbot/
│   │   ├── context/         AuthContext, CartContext, RewardContext
│   │   ├── pages/           Home, Login, Register, ForgotPassword,
│   │   │                    Dashboard, AdminDashboard, Offers,
│   │   │                    PaymentPage, DeliveryLogin, DeliveryDashboard
│   │   └── services/        api.js, authService.js
│   └── package.json
├── docker-compose.yml
└── .env
```

---

## Running the Project

**Backend:**
```bash
cd pharma/pharma/backend
mvn spring-boot:run
```

**Frontend:**
```bash
cd pharma/pharma/frontend
npm install        # first time only
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8081 |
| Swagger UI | http://localhost:8081/swagger-ui.html |

---

## Default Credentials

| Role | Username | Password | Login URL |
|---|---|---|---|
| Admin | `admin` | `Ramireddy@2004` | http://localhost:5173/admin |
| Delivery Agent | `delivery1` | `Delivery@123` | http://localhost:5173/delivery/login |
| User | Register via UI | — | http://localhost:5173/login |

---

## Order Status Flow

```
ORDER_CREATED → PENDING_PAYMENT → PAID → INITIATED → DISPATCHED → DELIVERED
                                                ↓
                                         CANCELLED / FAILED
```

| Status | Triggered By |
|---|---|
| `ORDER_CREATED` | User places order |
| `PENDING_PAYMENT` | Razorpay order created |
| `PAID` | Payment verified successfully |
| `INITIATED` | Admin approves the order |
| `DISPATCHED` | Delivery agent marks Out for Delivery |
| `DELIVERED` | Delivery agent marks Delivered |
| `CANCELLED` | Admin or user cancels |
| `FAILED` | Payment failed |

---

## Delivery Assignment Status Flow

```
ASSIGNED → ACCEPTED → OUT_FOR_DELIVERY → DELIVERED
```

---

## Team Task Division (5 Members)

---

### 👤 Member 1 — Authentication & Security

**Pitch:** *"I handled authentication and security including JWT-based login and role management."*

**Responsibilities:**
- User Registration & Login
- JWT Authentication
- Role-based access (USER, ADMIN, DELIVERY_AGENT)
- Forgot Password (OTP via email)

**Backend files:**
- `controllers/AuthController.java` — signin, signup (supports user/admin/delivery_agent roles), forgot-password, verify-otp, reset-password
- `security/WebSecurityConfig.java` — public vs protected routes, JWT filter, BCrypt, CORS
- `security/jwt/JwtUtils.java` — JWT generation and validation
- `security/jwt/AuthTokenFilter.java` — per-request JWT extraction
- `security/jwt/AuthEntryPointJwt.java` — unauthorized handler
- `security/RateLimitingInterceptor.java` — rate limiting
- `security/services/UserDetailsImpl.java`, `UserDetailsServiceImpl.java`
- `entity/User.java` — includes `resetToken`, `resetTokenExpiry` fields
- `entity/Role.java`, `entity/ERole.java` — ROLE_USER, ROLE_ADMIN, ROLE_DELIVERY_AGENT
- `repository/UserRepository.java`, `repository/RoleRepository.java`
- `payload/request/LoginRequest.java`, `SignupRequest.java`, `ForgotPasswordRequest.java`
- `payload/request/VerifyOtpRequest.java`, `ResetPasswordRequest.java`
- `payload/response/JwtResponse.java`, `MessageResponse.java`
- `service/EmailService.java` — `sendOtpEmail()`
- `config/DataSeeder.java` — seeds roles, admin user, delivery agent account

**Frontend files:**
- `pages/Login.jsx` — login form with "Delivery Agent? Login here" link, role-based redirect
- `pages/Register.jsx` — user registration form
- `pages/ForgotPassword.jsx` — 3-step: email → OTP → new password
- `context/AuthContext.jsx` — global auth state (user, login, logout)
- `services/authService.js` — API calls, localStorage token management
- `services/api.js` — Axios instance with JWT interceptor
- `App.jsx` — `ProtectedRoute`, `DeliveryRoute` guards, Navbar with role-based links

**API Endpoints:**
```
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password
```

---

### 👤 Member 2 — Medicine Catalog & AI Chatbot

**Pitch:** *"I worked on medicine catalog and AI chatbot for user assistance."*

**Responsibilities:**
- Browse medicines with category filter
- Search medicines by name/description
- Category management
- Admin medicine CRUD with image upload
- AI chatbot integration

**Backend files:**
- `controllers/MedicineController.java` — CRUD + `POST /api/medicines/{id}/image`
- `controllers/CategoryController.java` — GET, POST, DELETE categories
- `controllers/ChatbotController.java` — `POST /api/chat`
- `service/AiChatbotService.java` — Groq API (llama-3.3-70b-versatile) via REST
- `entity/Medicine.java` — includes `imageUrl` field
- `entity/Category.java`
- `repository/MedicineRepository.java`, `repository/CategoryRepository.java`
- `seeder/DatabaseSeeder.java` — imports 72 medicines from `data/medicines.csv`
- `config/WebMvcConfig.java` — serves `/uploads/**` static files
- `payload/request/ChatbotRequest.java`, `payload/response/ChatbotResponse.java`

**Frontend files:**
- `pages/Home.jsx` — medicine catalog with category gradients, uploaded images, search, cart controls
- `pages/AdminDashboard.jsx` — Medicines tab (CRUD + image upload per medicine), Categories tab
- `components/Chatbot/ChatButton.jsx` — floating chat button
- `components/Chatbot/ChatWindow.jsx` — chat UI with session storage
- `components/Chatbot/ChatMessage.jsx` — individual message bubble

**API Endpoints:**
```
GET    /api/medicines
GET    /api/medicines/{id}
GET    /api/medicines/search?query=dolo
GET    /api/medicines/category/{id}
POST   /api/medicines          (admin)
PUT    /api/medicines/{id}     (admin)
DELETE /api/medicines/{id}     (admin)
POST   /api/medicines/{id}/image  (admin, multipart)
GET    /api/categories
POST   /api/categories         (admin)
DELETE /api/categories/{id}    (admin)
POST   /api/chat
```

---

### 👤 Member 3 — Orders, Prescriptions & Notifications

**Pitch:** *"I implemented order lifecycle including prescription validation and notifications."*

**Responsibilities:**
- Cart & order placement
- Order history, reorder, cancel
- Prescription upload & validation
- Email + SMS notifications
- Order status tracking (user dashboard)

**Backend files:**
- `controllers/OrderController.java` — create order, get user orders, admin get all, update status, reorder, cancel
- `controllers/PrescriptionController.java` — upload with file type/size validation, admin validate/reject
- `service/EmailService.java` — `sendOrderConfirmation()`, `sendOrderStatusUpdate()`
- `service/SmsService.java` — Twilio SMS on status change
- `entity/Order.java` — status, paymentStatus, deliveryStatus, address, contactNumber
- `entity/OrderItem.java`, `entity/Prescription.java`
- `repository/OrderRepository.java` — `findByUser_Id()`
- `repository/OrderItemRepository.java` — `findByOrder_Id()`
- `repository/PrescriptionRepository.java` — `findByOrder_Id()`
- `payload/request/OrderRequest.java`, `OrderItemRequest.java`

**Frontend files:**
- `pages/Home.jsx` — cart drawer with address/contact/prescription/coupon/points, "Proceed to Payment" button
- `pages/Dashboard.jsx` — order history table, 5-step status timeline, cancel order, reorder, view details modal
- `pages/AdminDashboard.jsx` — Orders tab: view all orders, approve, view prescription image

**API Endpoints:**
```
POST   /api/orders                    (user)
GET    /api/orders/user               (user)
GET    /api/orders                    (admin)
PUT    /api/orders/{id}/status        (admin)
POST   /api/orders/{id}/reorder       (user)
DELETE /api/orders/{id}               (user - cancel)
POST   /api/prescriptions/upload/{orderId}   (user, multipart)
PUT    /api/prescriptions/{id}/validate      (admin)
```

---

### 👤 Member 4 — Payment Integration & Rewards

**Pitch:** *"I handled payment integration along with coupons and reward system."*

**Responsibilities:**
- Razorpay payment gateway integration
- Payment order creation & signature verification
- Coupon CRUD and validation
- Loyalty points system (earn & redeem)
- Daily login streak rewards

**Backend files:**
- `controllers/PaymentController.java` — create Razorpay order, verify HMAC-SHA256 signature, handle failure
- `controllers/CouponController.java` — GET, POST, PUT, DELETE coupons
- `controllers/RewardController.java` — loyalty points status, daily claim
- `entity/Payment.java` — razorpayOrderId, razorpayPaymentId, signature, amount, status (PENDING/SUCCESS/FAILED)
- `entity/Coupon.java` — code, discountType (FLAT/PERCENTAGE), value, expiry, minOrder, usageLimit
- `repository/PaymentRepository.java` — `findByOrder_Id()`, `findByRazorpayOrderId()`
- `repository/CouponRepository.java`
- `payload/request/PaymentVerifyRequest.java`
- `payload/response/PaymentOrderResponse.java`
- `config/DataSeeder.java` — seeds WELCOME10, FLAT100, WELLNESS20 coupons
- `application.properties` — `razorpay.key.id`, `razorpay.key.secret`

**Frontend files:**
- `pages/PaymentPage.jsx` — loads Razorpay SDK, opens checkout popup, calls verify/failure APIs, shows success/failure UI
- `pages/Home.jsx` — coupon input, loyalty points toggle, final total calculation in cart drawer
- `pages/Offers.jsx` — displays active coupons
- `pages/Dashboard.jsx` — loyalty points display, daily reward claim button, coupon copy section
- `pages/AdminDashboard.jsx` — Coupons tab (create/edit/delete coupons)
- `context/RewardContext.jsx` — coupon state, points state, validate coupon API call

**API Endpoints:**
```
POST /api/payment/create-order        (user)
POST /api/payment/verify              (user)
POST /api/payment/failure             (user)
GET  /api/payment/order/{orderId}     (user/admin)
GET  /api/coupons
POST /api/coupons                     (admin)
PUT  /api/coupons/{id}                (admin)
DELETE /api/coupons/{id}              (admin)
POST /api/coupons/validate
GET  /api/rewards/status              (user)
POST /api/rewards/claim-login         (user)
```

**Razorpay Test Details:**
| Field | Value |
|---|---|
| Card Number | `4718 6092 0990 8132` |
| Expiry | `12/26` |
| CVV | `123` |
| OTP | `1234` |
| Net Banking | Select any bank → click "Success" |

---

### 👤 Member 5 — Delivery Module & DevOps

**Pitch:** *"I developed delivery management and handled final system integration."*

**Responsibilities:**
- Delivery agent login portal
- Admin assigns orders to agents
- Delivery tracking (Assigned → Accepted → Out for Delivery → Delivered)
- Project integration & deployment setup

**Backend files:**
- `controllers/DeliveryController.java` — assign agent (admin), list agents, get assigned orders (agent), accept order, update delivery status
- `entity/DeliveryAssignment.java` — links order ↔ agent with status tracking, exposes deliveryAddress, contactNumber, userName as transient fields
- `repository/DeliveryAssignmentRepository.java` — `findByAgent_Id()`, `findByOrder_Id()`
- `entity/ERole.java` — `ROLE_DELIVERY_AGENT` added
- `config/DataSeeder.java` — seeds `delivery1` agent account on startup

**Frontend files:**
- `pages/DeliveryLogin.jsx` — dedicated delivery agent login portal at `/delivery/login`
- `pages/DeliveryDashboard.jsx` — agent views assigned orders with customer address/contact, accepts orders, updates status step-by-step with visual progress tracker
- `pages/AdminDashboard.jsx` — Delivery tab (registered agents list), assign agent modal on Orders tab (👥 button)
- `App.jsx` — `DeliveryRoute` guard, `/delivery/login` and `/delivery/dashboard` routes

**DevOps files:**
- `docker-compose.yml` — MySQL + backend + frontend containers
- `.env` — environment variables
- `application.properties` — all service configurations
- `pom.xml` — all Maven dependencies including Razorpay SDK

**API Endpoints:**
```
POST /api/delivery/assign             (admin)
GET  /api/delivery/agents             (admin)
GET  /api/delivery/assignments        (admin)
GET  /api/delivery/orders             (delivery agent)
PUT  /api/delivery/{id}/accept        (delivery agent)
PUT  /api/delivery/{id}/status        (delivery agent)
GET  /api/delivery/{id}               (agent/admin)
```

**Delivery Agent Default Login:**
| Field | Value |
|---|---|
| Username | `delivery1` |
| Password | `Delivery@123` |
| Login URL | http://localhost:5173/delivery/login |

---

## Feature → File Mapping

### Payment Flow
```
User clicks "Proceed to Payment"
  → POST /api/orders          (creates ORDER_CREATED)
  → Redirect to /payment page
  → POST /api/payment/create-order  (creates Razorpay order)
  → Razorpay checkout popup opens
  → User pays
  → POST /api/payment/verify  (verifies HMAC signature)
  → Order status → PAID
```

### Delivery Flow
```
Admin sees PAID order in Orders tab
  → Clicks ✓ (Approve) → status: INITIATED
  → Clicks 👥 (Assign) → selects delivery agent → POST /api/delivery/assign
Delivery Agent logs in at /delivery/login
  → Sees assigned order with customer address
  → Clicks "Accept" → status: ACCEPTED
  → Clicks "Out for Delivery" → status: DISPATCHED
  → Clicks "Mark Delivered" → status: DELIVERED
User sees 5-step timeline update in /dashboard
```

### Order Status Timeline (User Dashboard)
| Step | Status | Icon |
|---|---|---|
| 1 | ORDER_CREATED | 📦 Package |
| 2 | PAID | 💳 CreditCard |
| 3 | INITIATED | ✅ CheckCircle |
| 4 | DISPATCHED | 🚚 Truck |
| 5 | DELIVERED | ✅ CheckCircle |

---

## Postman — All API Endpoints

Base URL: `http://localhost:8081`

Protected endpoints need header: `Authorization: Bearer <token>`

### Authentication
| Method | URL | Auth |
|---|---|---|
| POST | `/api/auth/signup` | No |
| POST | `/api/auth/signin` | No |
| POST | `/api/auth/forgot-password` | No |
| POST | `/api/auth/verify-otp` | No |
| POST | `/api/auth/reset-password` | No |

### Orders
| Method | URL | Auth |
|---|---|---|
| POST | `/api/orders` | User |
| GET | `/api/orders/user` | User |
| GET | `/api/orders` | Admin |
| PUT | `/api/orders/{id}/status` | Admin |
| POST | `/api/orders/{id}/reorder` | User |
| DELETE | `/api/orders/{id}` | User |

### Payment
| Method | URL | Auth |
|---|---|---|
| POST | `/api/payment/create-order` | User |
| POST | `/api/payment/verify` | User |
| POST | `/api/payment/failure` | User |
| GET | `/api/payment/order/{orderId}` | User/Admin |

### Delivery
| Method | URL | Auth |
|---|---|---|
| POST | `/api/delivery/assign` | Admin |
| GET | `/api/delivery/agents` | Admin |
| GET | `/api/delivery/assignments` | Admin |
| GET | `/api/delivery/orders` | Delivery Agent |
| PUT | `/api/delivery/{id}/accept` | Delivery Agent |
| PUT | `/api/delivery/{id}/status` | Delivery Agent |

### Medicines & Categories
| Method | URL | Auth |
|---|---|---|
| GET | `/api/medicines` | No |
| GET | `/api/medicines/search?query=` | No |
| POST | `/api/medicines` | Admin |
| PUT | `/api/medicines/{id}` | Admin |
| DELETE | `/api/medicines/{id}` | Admin |
| POST | `/api/medicines/{id}/image` | Admin |
| GET | `/api/categories` | No |
| POST | `/api/categories` | Admin |
| DELETE | `/api/categories/{id}` | Admin |

### Coupons & Rewards
| Method | URL | Auth |
|---|---|---|
| GET | `/api/coupons` | No |
| POST | `/api/coupons` | Admin |
| PUT | `/api/coupons/{id}` | Admin |
| DELETE | `/api/coupons/{id}` | Admin |
| POST | `/api/coupons/validate` | No |
| GET | `/api/rewards/status` | User |
| POST | `/api/rewards/claim-login` | User |

### Prescriptions & Chatbot
| Method | URL | Auth |
|---|---|---|
| POST | `/api/prescriptions/upload/{orderId}` | User |
| PUT | `/api/prescriptions/{id}/validate` | Admin |
| POST | `/api/chat` | No |

---

## Default Seeded Coupons

| Code | Type | Value | Min Order |
|---|---|---|---|
| `WELCOME10` | PERCENTAGE | 10% | None |
| `FLAT100` | FLAT | ₹100 | ₹500 |
| `WELLNESS20` | PERCENTAGE | 20% | ₹1000 |

---

## Environment Variables

| Variable | Purpose | Member |
|---|---|---|
| `spring.datasource.password` | MySQL password (`Kalyan@234`) | 5 |
| `jwt.secret` | JWT signing secret | 1 |
| `jwt.expiration` | Token expiry ms (86400000 = 24h) | 1 |
| `razorpay.key.id` | Razorpay Key ID | 4 |
| `razorpay.key.secret` | Razorpay Key Secret | 4 |
| `groq.api-key` | Groq API key for AI chatbot | 2 |
| `spring.mail.username` | Gmail for OTP + order emails | 3 |
| `spring.mail.password` | Gmail App Password | 3 |
| `twilio.account.sid` | Twilio SID for SMS | 3 |
| `twilio.auth.token` | Twilio auth token | 3 |
| `file.upload-dir` | Root upload folder | 2 |

---

## Useful Commands

```bash
# Start backend
cd pharma/pharma/backend
mvn spring-boot:run

# Full clean rebuild
mvn clean spring-boot:run

# Start frontend
cd pharma/pharma/frontend
npm run dev

# MySQL shell
mysql -u root -pKalyan@234 pharma_db

# Fix roles column (run once on existing DB before first start)
mysql -u root -pKalyan@234 pharma_db -e "ALTER TABLE roles MODIFY COLUMN name VARCHAR(30);"
```
