<h1 align="center">💊 PharmaCare – Online Pharmacy Management System</h1>

<p align="center">
A full-stack web application to manage online pharmacy operations including medicines, prescriptions, orders, and AI-powered support.
</p>

<hr>

<h2>🌟 Features</h2>

<ul>
  <li><b>🔐 User Authentication:</b> Secure login & registration using JWT</li>
  <li><b>💊 Medicine Catalog:</b> Browse, search, and check availability</li>
  <li><b>🛒 Shopping Cart:</b> Add items and checkout seamlessly</li>
  <li><b>📦 Order Management:</b> Place, track, and view order history</li>
  <li><b>📄 Prescription Upload:</b> Upload and manage prescriptions</li>
  <li><b>💳 Payments:</b> Razorpay integration (Test Mode)</li>
  <li><b>🚚 Delivery Tracking:</b> Assign and track deliveries</li>
  <li><b>🤖 AI Chatbot:</b> Powered by Google Gemini & Groq</li>
  <li><b>🎁 Rewards System:</b> Earn and redeem points</li>
  <li><b>📊 Admin Dashboard:</b> Manage users, medicines, and orders</li>
  <li><b>📢 Notifications:</b> SMS (Twilio) & Email (SMTP)</li>
</ul>

<hr>

<h2>🛠️ Tech Stack</h2>

<h3>Backend</h3>
<ul>
  <li>Spring Boot 3.x</li>
  <li>Java 17+</li>
  <li>MySQL</li>
  <li>JWT Authentication</li>
  <li>Maven</li>
</ul>

<h3>Frontend</h3>
<ul>
  <li>React (Vite)</li>
  <li>Tailwind CSS</li>
  <li>Context API</li>
  <li>npm</li>
</ul>

<h3>Integrations</h3>
<ul>
  <li>Razorpay (Payments)</li>
  <li>Google Gemini & Groq (AI Chatbot)</li>
  <li>Twilio (SMS)</li>
  <li>Gmail SMTP (Email)</li>
</ul>

<hr>

<h2>📁 Project Structure</h2>

<pre>
pharma/
├── backend/
│   ├── controllers/
│   ├── services/
│   ├── repository/
│   ├── entity/
│   ├── security/
│   ├── config/
│   └── payload/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── context/
│   └── App.jsx
</pre>

<hr>

<h2>🚀 Getting Started</h2>

<h3>Prerequisites</h3>
<ul>
  <li>Java 17+</li>
  <li>Node.js 16+</li>
  <li>MySQL 8+</li>
  <li>Git</li>
</ul>

<h3>Backend Setup</h3>

<pre>
git clone https://github.com/ram-tech2026/cyberton.git
cd cyberton/backend

# Build & Run
mvn clean install
mvn spring-boot:run
</pre>

<p>Backend runs on: <b>http://localhost:8081</b></p>

<h3>Frontend Setup</h3>

<pre>
cd frontend
npm install
npm run dev
</pre>

<p>Frontend runs on: <b>http://localhost:5173</b></p>

<hr>

<h2>🗄️ Database Setup</h2>

<pre>
CREATE DATABASE pharma_db;
</pre>

<p>Tables will be auto-created using Hibernate.</p>

<hr>

<h2>📋 API Endpoints</h2>

<ul>
  <li><b>Auth:</b> /api/auth/login, /api/auth/register</li>
  <li><b>Medicines:</b> /api/medicines</li>
  <li><b>Orders:</b> /api/orders</li>
  <li><b>Prescriptions:</b> /api/prescriptions</li>
  <li><b>Payments:</b> /api/payments</li>
  <li><b>Chatbot:</b> /api/chatbot/chat</li>
  <li><b>Delivery:</b> /api/delivery</li>
  <li><b>Admin:</b> /api/admin/*</li>
</ul>

<hr>

<h2>🔑 Key Features</h2>

<ul>
  <li>✔ Secure JWT Authentication</li>
  <li>✔ RESTful API Architecture</li>
  <li>✔ AI Chatbot Integration</li>
  <li>✔ Online Payment System</li>
  <li>✔ SMS & Email Notifications</li>
</ul>

<hr>

<h2>🎯 Future Enhancements</h2>

<ul>
  <li>📱 Mobile App (React Native)</li>
  <li>📊 Analytics Dashboard</li>
  <li>🧾 AI Prescription Verification</li>
  <li>🌐 Multi-language Support</li>
</ul>

<hr>

<h2>👨‍💻 Contributor</h2>

<p><b>Rami Reddy Byredy</b></p>

<hr>

<h2>📌 Project Pitch</h2>

<p>
PharmaCare is a full-stack online pharmacy platform that streamlines the entire medicine ordering process—from prescription upload to delivery—integrated with secure payments, real-time tracking, and AI-powered customer support.
</p>

<hr>

<h2 align="center">⭐ If you like this project, give it a star!</h2>
