# TrackAS - Logistics Tracking System

A comprehensive logistics tracking system with real-time shipment monitoring, secure payments, and multi-role dashboards.

## 🚀 Features

### ✅ Implemented
- **Secure Authentication** - Password hashing, JWT tokens, input validation
- **Multi-Role System** - Admin, Company, Driver dashboards
- **Real-time Tracking** - Live location updates via SSE
- **Customer Tracking** - Public tracking without login
- **Database Management** - Proper migrations and schema
- **Docker Deployment** - Production-ready containerization
- **Modern UI** - Responsive design with Tailwind CSS

### 🔄 In Progress
- Payment gateway integration
- AI assistant enhancements
- Advanced notifications

## 🏗️ Architecture

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: Next.js + React + Tailwind CSS
- **Database**: PostgreSQL with proper migrations
- **Deployment**: Docker + Docker Compose
- **Security**: bcrypt, JWT, rate limiting, input validation

## 🚀 Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd TrackAS_Final_MVP_complete
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose up -d
   ```

3. **Initialize Database**
   ```bash
   docker-compose exec backend node scripts/migrate.js
   docker-compose exec backend node scripts/seed.js
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:4000

## 👥 Test Accounts

- **Admin**: admin@trackas.local / admin123
- **Company**: company1@trackas.local / company123
- **Driver**: driver1@trackas.local / driver123

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions
- [API Documentation](backend/README.md) - Backend API reference
- [Database Schema](backend/migrations/) - Database structure

## 🔧 Development

```bash
# Backend development
cd backend
npm install
npm start

# Frontend development
cd frontend
npm install
npm run dev
```

## 🛡️ Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Helmet for security headers

## 📦 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production deployment instructions including:
- Environment configuration
- Security considerations
- Scaling recommendations
- Monitoring and maintenance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
