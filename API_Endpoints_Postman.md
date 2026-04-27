# PharmaCare API Endpoints (Postman Testing Guide)

This guide divides all the backend API endpoints into 4 logical modules, perfect for a team of 4 to divide and conquer in Postman. It includes the exact JSON body structure required for POST and PUT requests.

> [!NOTE]
> All URLs below use `http://localhost:8081` which is the direct backend port. 
> For endpoints that require authentication, remember to pass the JWT token in the Postman Headers as: `Authorization: Bearer <your_token>`

---

## 👩‍💻 Member 1: Security & AI Assistant
**Focus:** User authentication, registration, and the Gemini AI Chatbot integration.

### Authentication (`/api/auth`)

* **Sign Up (Register)**
  * `POST http://localhost:8081/api/auth/signup`
  * **Body (JSON):**
    ```json
    {
      "username": "john_doe",
      "email": "john@example.com",
      "password": "Password123!",
      "roles": ["user"]
    }
    ```

* **Sign In (Login)**
  * `POST http://localhost:8081/api/auth/signin`
  * **Body (JSON):**
    ```json
    {
      "username": "john_doe",
      "password": "Password123!"
    }
    ```

### Chatbot (`/api/chat`)

* **Ask AI Assistant**
  * `POST http://localhost:8081/api/chat`
  * **Body (JSON):**
    ```json
    {
      "message": "What is Paracetamol used for?"
    }
    ```

---

## 👨‍💻 Member 2: Catalog Management 
**Focus:** Managing the medicines and their respective categories.

### Categories (`/api/categories`)

* **Get All Categories:**
  * `GET http://localhost:8081/api/categories`
* **Delete Category:**
  * `DELETE http://localhost:8081/api/categories/{id}`

* **Create Category**
  * `POST http://localhost:8081/api/categories`
  * **Body (JSON):**
    ```json
    {
      "name": "First Aid",
      "description": "Bandages and antiseptics"
    }
    ```

### Medicines (`/api/medicines`)

* **Get All Medicines:**
  * `GET http://localhost:8081/api/medicines`
* **Get Medicine by ID:**
  * `GET http://localhost:8081/api/medicines/{id}`
* **Get Medicines by Category:**
  * `GET http://localhost:8081/api/medicines/category/{categoryId}`
* **Search Medicines:**
  * `GET http://localhost:8081/api/medicines/search?name=dolo`
* **Delete Medicine:**
  * `DELETE http://localhost:8081/api/medicines/{id}`

* **Add / Update Medicine**
  * `POST http://localhost:8081/api/medicines` (Add)
  * `PUT http://localhost:8081/api/medicines/{id}` (Update)
  * **Body (JSON):**
    ```json
    {
      "name": "Dolo 650",
      "description": "Paracetamol for fever",
      "price": 30.0,
      "stock": 100,
      "requiresPrescription": false,
      "dosage": "650 mg",
      "packaging": "Strip of 15",
      "category": {
        "id": 1
      }
    }
    ```

---

## 👩‍💻 Member 3: Order Processing & Prescriptions
**Focus:** Handling user checkout, order history, and prescription uploads/validation.

### Orders (`/api/orders`)

* **Get All Orders (Admin):**
  * `GET http://localhost:8081/api/orders`
* **Get User's Orders:**
  * `GET http://localhost:8081/api/orders/user`
* **Reorder Previous Order:**
  * `POST http://localhost:8081/api/orders/{id}/reorder` *(No body required)*

* **Place New Order**
  * `POST http://localhost:8081/api/orders`
  * **Body (JSON):**
    ```json
    {
      "totalAmount": 150.0,
      "address": "123 Main St, Springfield",
      "contactNumber": "9876543210",
      "couponCode": "WELCOME10",
      "pointsUsed": 50,
      "items": [
        {
          "medicineId": 1,
          "quantity": 2,
          "price": 30.0
        },
        {
          "medicineId": 11,
          "quantity": 1,
          "price": 90.0
        }
      ]
    }
    ```

* **Update Order Status (Admin)**
  * `PUT http://localhost:8081/api/orders/{id}/status`
  * **Body (JSON String):**
    ```json
    "SHIPPED"
    ```

### Prescriptions (`/api/prescriptions`)

* **Upload Prescription Image:**
  * `POST http://localhost:8081/api/prescriptions/upload/{orderId}`
  * **Body (`multipart/form-data`):**
    * Key: `file` (Type: File) -> *Select an image file*

* **Validate Prescription (Admin)**
  * `PUT http://localhost:8081/api/prescriptions/{id}/validate`
  * **Body (JSON String):**
    ```json
    "APPROVED"
    ```

---

## 👨‍💻 Member 4: Customer Loyalty
**Focus:** Managing discount coupons and the daily login reward points system.

### Coupons (`/api/coupons`)

* **Get Available Coupons:**
  * `GET http://localhost:8081/api/coupons`

* **Validate/Apply Coupon**
  * `POST http://localhost:8081/api/coupons/validate`
  * **Body (JSON):**
    ```json
    {
      "code": "WELCOME10",
      "orderTotal": 500.0
    }
    ```

### Rewards (`/api/rewards`)

* **Get User's Reward Status:**
  * `GET http://localhost:8081/api/rewards/status`
* **Claim Daily Login Points:**
  * `POST http://localhost:8081/api/rewards/claim-login` *(No body required)*
