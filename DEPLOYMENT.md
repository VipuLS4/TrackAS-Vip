# TrackAS Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- At least 2GB RAM available
- Ports 3000, 4000, and 5432 available

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd TrackAS_Final_MVP_complete
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment files
   cp backend/env.example backend/.env
   cp frontend/env.example frontend/.env.local
   
   # Edit backend/.env with your production values
   # Edit frontend/.env.local with your production values
   ```

3. **Deploy with Docker Compose**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Check service status
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   ```

4. **Initialize Database**
   ```bash
   # Run database migrations
   docker-compose exec backend node scripts/migrate.js
   
   # Seed initial data
   docker-compose exec backend node scripts/seed.js
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - Health Check: http://localhost:4000/health

## Production Configuration

### Environment Variables

**Backend (.env)**
```env
# Database
DATABASE_URL=postgres://username:password@host:port/database

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Server
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Commission
DEFAULT_COMMISSION=5

# Logging
LOG_LEVEL=info

# External Services (Optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
MAPBOX_KEY=your_mapbox_api_key
OPENAI_API_KEY=your_openai_api_key
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com
NODE_ENV=production
```

### Security Considerations

1. **Change Default Passwords**
   - Update JWT_SECRET to a strong, random string
   - Change database passwords
   - Use strong passwords for all user accounts

2. **Database Security**
   - Use SSL connections in production
   - Restrict database access to application servers only
   - Regular backups

3. **Network Security**
   - Use HTTPS in production
   - Configure firewall rules
   - Consider using a reverse proxy (nginx)

### Scaling Considerations

1. **Database**
   - Use managed PostgreSQL service (AWS RDS, Google Cloud SQL)
   - Configure read replicas for read-heavy workloads
   - Regular backups and monitoring

2. **Application**
   - Use load balancers for multiple backend instances
   - Configure horizontal pod autoscaling
   - Monitor resource usage

3. **Storage**
   - Use cloud storage for file uploads
   - Configure CDN for static assets

## Monitoring and Maintenance

### Health Checks
- Backend: `GET /health`
- Database: Built-in PostgreSQL health checks
- Frontend: Built-in Next.js health checks

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Database Maintenance
```bash
# Backup database
docker-compose exec db pg_dump -U trackas trackas > backup.sql

# Restore database
docker-compose exec -T db psql -U trackas trackas < backup.sql
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations if needed
docker-compose exec backend node scripts/migrate.js
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :4000
   lsof -i :5432
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose exec db pg_isready -U trackas
   
   # Check database logs
   docker-compose logs db
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod -R 755 .
   ```

4. **Memory Issues**
   ```bash
   # Check memory usage
   docker stats
   
   # Increase Docker memory limit
   # In Docker Desktop: Settings > Resources > Memory
   ```

### Performance Optimization

1. **Database Optimization**
   - Add indexes for frequently queried columns
   - Configure connection pooling
   - Regular VACUUM and ANALYZE

2. **Application Optimization**
   - Enable gzip compression
   - Use Redis for caching
   - Optimize images and static assets

3. **Network Optimization**
   - Use CDN for static assets
   - Enable HTTP/2
   - Configure proper caching headers

## Support

For issues and questions:
1. Check the logs first
2. Review this deployment guide
3. Check the GitHub issues
4. Contact the development team

## Test Credentials

After seeding the database, you can use these test accounts:

- **Admin**: admin@trackas.local / admin123
- **Company**: company1@trackas.local / company123  
- **Driver**: driver1@trackas.local / driver123

**Important**: Change these passwords in production!
