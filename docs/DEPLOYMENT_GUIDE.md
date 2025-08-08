# Carbon-Pixels Deployment & Infrastructure Guide

## Overview

This guide provides comprehensive instructions for deploying the carbon-pixels Thailand waste diary backend infrastructure. The deployment strategy focuses on cost-effectiveness, scalability, and reliability while supporting millions of users.

## Infrastructure Architecture

### Cloud Provider: AWS (Primary) + Supabase

**Rationale for AWS:**
- Strong presence in Asia-Pacific region
- Cost-effective with reserved instances
- Comprehensive monitoring and logging
- Good connectivity to Thailand
- Supports both containers and serverless

**Supabase Integration:**
- Authentication and user management
- PostgreSQL database with RLS
- Real-time subscriptions
- File storage for images
- Edge functions for lightweight operations

## 1. Environment Setup

### Development Environment

```bash
# Prerequisites
- Docker 24+
- Node.js 20+
- Go 1.21+
- Python 3.11+
- AWS CLI v2
- Terraform 1.0+
- kubectl 1.28+

# Repository structure
carbon-pixels-backend/
├── services/
│   ├── user-service/         # Node.js + Fastify
│   ├── waste-service/        # Go + Gin
│   ├── gamification-service/ # Node.js + TypeScript
│   ├── social-service/       # Node.js + Express
│   └── analytics-service/    # Python + FastAPI
├── infrastructure/
│   ├── terraform/           # Infrastructure as Code
│   ├── kubernetes/          # K8s manifests
│   └── docker/             # Docker configurations
├── shared/
│   ├── proto/              # gRPC definitions
│   ├── schemas/            # Database schemas
│   └── configs/            # Shared configurations
└── scripts/
    ├── deploy.sh           # Deployment scripts
    ├── migrate.sh          # Database migrations
    └── seed.sh             # Test data seeding
```

### Environment Variables

```bash
# Create .env file for each service
# User Service (.env.user-service)
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DATABASE_URL=postgresql://user:pass@host:5432/carbon_pixels

# Redis Cache
REDIS_URL=redis://carbon-pixels-cache.abc123.cache.amazonaws.com:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-chars
JWT_EXPIRY=3600
REFRESH_TOKEN_EXPIRY=604800

# External APIs
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_VERIFY_SID=your-verify-service-sid

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# AWS
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=carbon-pixels-storage
```

### Docker Development Setup

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: carbon_pixels_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./shared/schemas:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  user-service:
    build: 
      context: ./services/user-service
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/carbon_pixels_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./services/user-service:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  waste-service:
    build:
      context: ./services/waste-service
      dockerfile: Dockerfile.dev
    ports:
      - "3002:3002"
    environment:
      - GIN_MODE=debug
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/carbon_pixels_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./services/waste-service:/app
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

## 2. Production Infrastructure

### Terraform Infrastructure

```hcl
# infrastructure/terraform/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "carbon-pixels-terraform-state"
    key    = "production/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "carbon-pixels-vpc"
    Environment = var.environment
  }
}

# Subnets (Multi-AZ for high availability)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "carbon-pixels-private-${count.index + 1}"
    Type = "private"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "carbon-pixels-public-${count.index + 1}"
    Type = "public"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "carbon-pixels-igw"
  }
}

# NAT Gateways for private subnet internet access
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
  
  tags = {
    Name = "carbon-pixels-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "carbon-pixels-nat-${count.index + 1}"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "carbon-pixels-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "carbon-pixels-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = var.environment == "production"
  
  tags = {
    Environment = var.environment
  }
}

# RDS PostgreSQL (Multi-AZ for production)
resource "aws_db_instance" "main" {
  identifier = "carbon-pixels-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true
  
  db_name  = "carbon_pixels"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  # High availability for production
  multi_az               = var.environment == "production"
  backup_retention_period = var.environment == "production" ? 7 : 3
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Performance monitoring
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn
  
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  
  tags = {
    Name        = "carbon-pixels-db"
    Environment = var.environment
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "carbon-pixels-cache"
  description                = "Redis cluster for carbon-pixels"
  
  port                = 6379
  parameter_group_name = "default.redis7"
  node_type           = var.redis_node_type
  
  num_cache_clusters = var.redis_num_replicas
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token
  
  tags = {
    Name        = "carbon-pixels-cache"
    Environment = var.environment
  }
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "storage" {
  bucket = "carbon-pixels-storage-${var.environment}"
  
  tags = {
    Name        = "carbon-pixels-storage"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "storage" {
  bucket = aws_s3_bucket.storage.id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# CloudFront Distribution for global content delivery
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-${aws_lb.main.name}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  enabled = true
  comment = "Carbon Pixels CDN"
  
  # Global edge locations for better performance
  price_class = "PriceClass_All"
  
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-${aws_lb.main.name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin"]
      cookies {
        forward = "none"
      }
    }
    
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }
  
  # Separate behavior for API endpoints (no caching)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${aws_lb.main.name}"
    
    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "https-only"
    min_ttl               = 0
    default_ttl           = 0
    max_ttl               = 0
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
  }
  
  tags = {
    Environment = var.environment
  }
}
```

### ECS Service Definitions

```json
// infrastructure/kubernetes/user-service.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  labels:
    app: user-service
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: 123456789.dkr.ecr.ap-southeast-1.amazonaws.com/carbon-pixels-user-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: carbon-pixels-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: carbon-pixels-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: carbon-pixels-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 3001
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### API Gateway Configuration (Kong)

```yaml
# infrastructure/kubernetes/kong-gateway.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kong-config
data:
  kong.yml: |
    _format_version: "3.0"
    services:
    - name: user-service
      url: http://user-service:80
      routes:
      - name: user-routes
        paths:
        - /api/v1/auth
        - /api/v1/user
        methods:
        - GET
        - POST
        - PUT
        - DELETE
        plugins:
        - name: rate-limiting
          config:
            minute: 60
            hour: 1000
            policy: redis
            redis_host: carbon-pixels-cache.abc123.cache.amazonaws.com
        - name: cors
          config:
            origins:
            - https://carbon-pixels.com
            - https://app.carbon-pixels.com
            methods:
            - GET
            - POST
            - PUT
            - DELETE
            - OPTIONS
            headers:
            - Accept
            - Authorization
            - Content-Type
            - User-Agent
            - X-Requested-With
            exposed_headers:
            - X-Auth-Token
            credentials: true
            max_age: 3600

    - name: waste-service
      url: http://waste-service:80
      routes:
      - name: waste-routes
        paths:
        - /api/v1/waste
        plugins:
        - name: jwt
          config:
            key_claim_name: kid
            secret_is_base64: false
        - name: rate-limiting
          config:
            minute: 100
            hour: 2000
            policy: redis

    - name: gamification-service
      url: http://gamification-service:80
      routes:
      - name: gamification-routes
        paths:
        - /api/v1/gamification
        plugins:
        - name: jwt
        - name: rate-limiting
          config:
            minute: 200
            hour: 5000
            policy: redis

    plugins:
    - name: prometheus
      config:
        per_consumer: true
        status_code_metrics: true
        latency_metrics: true
        bandwidth_metrics: true
        upstream_health_metrics: true
```

## 3. Container Configuration

### User Service Dockerfile

```dockerfile
# services/user-service/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Production image
FROM node:20-alpine AS runtime

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Security: Use non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health/live || exit 1

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Waste Service Dockerfile (Go)

```dockerfile
# services/waste-service/Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install git for dependency management
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo -o waste-service cmd/server/main.go

# Production image
FROM alpine:3.18

# Security: Install CA certificates and create non-root user
RUN apk --no-cache add ca-certificates && \
    addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy binary
COPY --from=builder --chown=appuser:appgroup /app/waste-service .

# Use non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

EXPOSE 3002

CMD ["./waste-service"]
```

## 4. Database Management

### Migration System

```sql
-- migrations/001_initial_schema.up.sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create initial tables (from DATABASE_SCHEMA.md)
-- ... (include all table creation statements)

-- Insert reference data
INSERT INTO waste_categories (id, name_en, name_th, icon, color, carbon_impact, carbon_credits) VALUES
('food_waste', 'Food Waste', 'เศษอาหาร', '🍎', '#dc2626', 
 '{"landfill": 2.53, "compost": 0.3326}', '{"disposed": -25, "composted": 22}'),
-- ... other categories
```

```bash
#!/bin/bash
# scripts/migrate.sh
set -e

DB_URL=${DATABASE_URL:-"postgresql://postgres:password@localhost:5432/carbon_pixels"}
MIGRATIONS_DIR="./migrations"

echo "Running database migrations..."

# Check if migrate tool is installed
if ! command -v migrate &> /dev/null; then
    echo "Installing golang-migrate..."
    curl -L https://github.com/golang-migrate/migrate/releases/latest/download/migrate.linux-amd64.tar.gz | tar xvz
    sudo mv migrate /usr/local/bin/
fi

# Run migrations
migrate -path $MIGRATIONS_DIR -database $DB_URL up

echo "Migrations completed successfully!"

# Run post-migration tasks
echo "Setting up cron jobs for maintenance tasks..."
psql $DB_URL -c "SELECT cron.schedule('refresh-leaderboards', '0 * * * *', 'SELECT refresh_leaderboards();');"
psql $DB_URL -c "SELECT cron.schedule('update-daily-streaks', '0 0 * * *', 'SELECT update_daily_streaks();');"

echo "Database setup complete!"
```

### Backup Strategy

```bash
#!/bin/bash
# scripts/backup.sh
set -e

# Configuration
BACKUP_BUCKET="carbon-pixels-backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "Starting database backup: $TIMESTAMP"

# Create database dump
pg_dump $DATABASE_URL \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file=/tmp/carbon_pixels_backup_${TIMESTAMP}.dump

# Upload to S3
aws s3 cp /tmp/carbon_pixels_backup_${TIMESTAMP}.dump \
  s3://${BACKUP_BUCKET}/daily/carbon_pixels_backup_${TIMESTAMP}.dump \
  --storage-class STANDARD_IA

# Cleanup old backups
aws s3 ls s3://${BACKUP_BUCKET}/daily/ --recursive | \
  while read -r line; do
    createDate=$(echo $line | awk '{print $1" "$2}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "$RETENTION_DAYS days ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
      fileName=$(echo $line | awk '{print $4}')
      aws s3 rm s3://${BACKUP_BUCKET}/$fileName
    fi
  done

# Cleanup local file
rm /tmp/carbon_pixels_backup_${TIMESTAMP}.dump

echo "Backup completed successfully!"
```

## 5. Monitoring and Observability

### Prometheus Configuration

```yaml
# infrastructure/monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "carbon-pixels-rules.yml"

scrape_configs:
  - job_name: 'carbon-pixels-services'
    static_configs:
      - targets: 
        - 'user-service:3001'
        - 'waste-service:3002'
        - 'gamification-service:3003'
        - 'social-service:3004'
        - 'analytics-service:3005'
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'kong-gateway'
    static_configs:
      - targets: ['kong:8001']
    metrics_path: '/metrics'

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Carbon-Pixels Production Metrics",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "API Response Times",
        "type": "graph", 
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "singlestat",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"carbon_pixels\"}"
          }
        ]
      },
      {
        "title": "Daily Active Users",
        "type": "singlestat",
        "targets": [
          {
            "expr": "count(increase(user_login_total[24h]) > 0)"
          }
        ]
      },
      {
        "title": "Waste Entries Created (24h)",
        "type": "singlestat",
        "targets": [
          {
            "expr": "sum(increase(waste_entries_created_total[24h]))"
          }
        ]
      }
    ]
  }
}
```

### Alert Rules

```yaml
# infrastructure/monitoring/carbon-pixels-rules.yml
groups:
  - name: carbon-pixels-alerts
    rules:
    - alert: HighErrorRate
      expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value | humanizePercentage }} for 5 minutes"

    - alert: HighResponseTime
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "High response time detected"
        description: "95th percentile response time is {{ $value }}s"

    - alert: DatabaseConnectionsHigh
      expr: pg_stat_database_numbackends > 80
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High number of database connections"
        description: "Database has {{ $value }} active connections"

    - alert: RedisMemoryHigh
      expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Redis memory usage high"
        description: "Redis is using {{ $value | humanizePercentage }} of available memory"

    - alert: ServiceDown
      expr: up == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Service is down"
        description: "{{ $labels.instance }} has been down for more than 1 minute"
```

## 6. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: ap-southeast-1
  ECR_REPOSITORY: carbon-pixels
  EKS_CLUSTER_NAME: carbon-pixels-cluster

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [user-service, waste-service, gamification-service, social-service, analytics-service]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js (for JS services)
      if: contains(fromJson('["user-service", "gamification-service", "social-service"]'), matrix.service)
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: services/${{ matrix.service }}/package-lock.json
    
    - name: Setup Go (for Go services)
      if: matrix.service == 'waste-service'
      uses: actions/setup-go@v4
      with:
        go-version: '1.21'
        cache-dependency-path: services/${{ matrix.service }}/go.sum
    
    - name: Setup Python (for Python services)
      if: matrix.service == 'analytics-service'
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        cache: 'pip'
    
    - name: Install dependencies and run tests
      run: |
        cd services/${{ matrix.service }}
        if [ -f "package.json" ]; then
          npm ci
          npm run test
          npm run lint
        elif [ -f "go.mod" ]; then
          go mod download
          go test ./...
          go vet ./...
        elif [ -f "requirements.txt" ]; then
          pip install -r requirements.txt
          python -m pytest tests/
          python -m flake8 app/
        fi

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  build-and-deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [user-service, waste-service, gamification-service, social-service, analytics-service]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2
    
    - name: Build, tag, and push image to Amazon ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd services/${{ matrix.service }}
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-${{ matrix.service }}:$IMAGE_TAG .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY-${{ matrix.service }}:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY-${{ matrix.service }}:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY-${{ matrix.service }}:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY-${{ matrix.service }}:latest
    
    - name: Deploy to EKS
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER_NAME
        
        # Update deployment with new image
        kubectl set image deployment/${{ matrix.service }} \
          ${{ matrix.service }}=$ECR_REGISTRY/$ECR_REPOSITORY-${{ matrix.service }}:$IMAGE_TAG
        
        # Wait for rollout to complete
        kubectl rollout status deployment/${{ matrix.service }} --timeout=300s
        
        # Verify deployment
        kubectl get pods -l app=${{ matrix.service }}

  smoke-test:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run smoke tests
      run: |
        # Wait for services to be ready
        sleep 60
        
        # Basic health checks
        curl -f https://api.carbon-pixels.com/health || exit 1
        curl -f https://api.carbon-pixels.com/api/v1/user/health || exit 1
        curl -f https://api.carbon-pixels.com/api/v1/waste/health || exit 1
        curl -f https://api.carbon-pixels.com/api/v1/gamification/health || exit 1
        
        echo "Smoke tests passed!"

  notify:
    needs: [build-and-deploy, smoke-test]
    runs-on: ubuntu-latest
    if: always()
    steps:
    - name: Notify Slack
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        message: |
          Deployment to production: ${{ job.status }}
          Commit: ${{ github.sha }}
          Author: ${{ github.actor }}
```

## 7. Cost Optimization

### Reserved Instances Strategy

```bash
#!/bin/bash
# scripts/optimize-costs.sh

# Purchase Reserved Instances for predictable workloads
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id ri-1234567890abcdef0 \
  --instance-count 2

# Set up Spot Instances for development and testing
aws autoscaling create-launch-template \
  --launch-template-name carbon-pixels-spot-template \
  --launch-template-data '{
    "ImageId": "ami-0abcdef1234567890",
    "InstanceType": "t3.medium",
    "SecurityGroupIds": ["sg-12345678"],
    "UserData": "...",
    "InstanceMarketOptions": {
      "MarketType": "spot",
      "SpotOptions": {
        "MaxPrice": "0.05"
      }
    }
  }'
```

### Auto-scaling Configuration

```yaml
# infrastructure/kubernetes/cluster-autoscaler.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.27.0
        name: cluster-autoscaler
        command:
        - ./cluster-autoscaler
        - --v=4
        - --stderrthreshold=info
        - --cloud-provider=aws
        - --skip-nodes-with-local-storage=false
        - --expander=least-waste
        - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/carbon-pixels-cluster
        - --balance-similar-node-groups
        - --scale-down-enabled=true
        - --scale-down-delay-after-add=10m
        - --scale-down-unneeded-time=10m
        - --skip-nodes-with-system-pods=false
```

## 8. Security Configuration

### Network Security Groups

```hcl
# infrastructure/terraform/security.tf
resource "aws_security_group" "alb" {
  name        = "carbon-pixels-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  # HTTP traffic from anywhere (redirected to HTTPS)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS traffic from anywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "carbon-pixels-alb-sg"
  }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "carbon-pixels-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  # Traffic from ALB
  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "carbon-pixels-ecs-tasks-sg"
  }
}

resource "aws_security_group" "rds" {
  name        = "carbon-pixels-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  # PostgreSQL traffic from ECS tasks only
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  tags = {
    Name = "carbon-pixels-rds-sg"
  }
}
```

### Secrets Management

```bash
#!/bin/bash
# scripts/setup-secrets.sh

# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "carbon-pixels/production/database" \
  --secret-string '{
    "username": "carbon_pixels_user",
    "password": "super-secure-password-123!",
    "host": "carbon-pixels-db.cluster-abc123.ap-southeast-1.rds.amazonaws.com",
    "port": "5432",
    "database": "carbon_pixels"
  }'

aws secretsmanager create-secret \
  --name "carbon-pixels/production/jwt" \
  --secret-string '{
    "secret": "your-super-secure-jwt-secret-key-minimum-32-chars-long"
  }'

aws secretsmanager create-secret \
  --name "carbon-pixels/production/redis" \
  --secret-string '{
    "url": "redis://carbon-pixels-cache.abc123.cache.amazonaws.com:6379",
    "auth_token": "redis-auth-token-here"
  }'
```

## 9. Disaster Recovery

### Multi-Region Failover

```hcl
# infrastructure/terraform/disaster-recovery.tf
# Secondary region setup for disaster recovery
provider "aws" {
  alias  = "disaster_recovery"
  region = "ap-southeast-3" # Jakarta as backup for Singapore
}

# RDS Read Replica in secondary region
resource "aws_db_instance" "replica" {
  provider = aws.disaster_recovery
  
  identifier = "carbon-pixels-db-replica"
  
  # Source database
  replicate_source_db = aws_db_instance.main.identifier
  
  instance_class = var.db_instance_class
  storage_type   = "gp3"
  
  # Enable automated backups for potential promotion
  backup_retention_period = 7
  
  tags = {
    Name        = "carbon-pixels-db-replica"
    Environment = var.environment
    Role        = "disaster-recovery"
  }
}

# S3 Cross-Region Replication
resource "aws_s3_bucket_replication_configuration" "replication" {
  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.storage.id

  rule {
    id     = "replicate-to-dr-region"
    status = "Enabled"

    destination {
      bucket        = "arn:aws:s3:::carbon-pixels-storage-dr-${var.environment}"
      storage_class = "STANDARD_IA"
    }
  }
}
```

### Backup and Recovery Procedures

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

# Promote read replica to primary (in case of primary region failure)
promote_replica() {
  echo "Promoting read replica to primary database..."
  
  aws rds promote-read-replica \
    --db-instance-identifier carbon-pixels-db-replica \
    --region ap-southeast-3
  
  # Wait for promotion to complete
  aws rds wait db-instance-available \
    --db-instance-identifier carbon-pixels-db-replica \
    --region ap-southeast-3
  
  echo "Read replica promoted to primary!"
}

# Switch traffic to disaster recovery region
failover_to_dr() {
  echo "Initiating failover to disaster recovery region..."
  
  # Update Route 53 health check to point to DR region
  aws route53 change-resource-record-sets \
    --hosted-zone-id Z123456789 \
    --change-batch '{
      "Changes": [{
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "api.carbon-pixels.com",
          "Type": "CNAME",
          "TTL": 60,
          "ResourceRecords": [{"Value": "carbon-pixels-alb-dr.ap-southeast-3.elb.amazonaws.com"}]
        }
      }]
    }'
  
  echo "Traffic switched to disaster recovery region!"
}

# Test disaster recovery procedures (run monthly)
test_dr() {
  echo "Testing disaster recovery procedures..."
  
  # Create point-in-time recovery test database
  aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier carbon-pixels-db \
    --target-db-instance-identifier carbon-pixels-db-dr-test \
    --restore-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S.000Z)
  
  # Test backup restoration
  aws s3 sync s3://carbon-pixels-storage-production s3://carbon-pixels-storage-dr-test --dryrun
  
  echo "Disaster recovery test completed!"
}

case "$1" in
  promote) promote_replica ;;
  failover) failover_to_dr ;;
  test) test_dr ;;
  *) echo "Usage: $0 {promote|failover|test}" ;;
esac
```

## 10. Maintenance and Operations

### Health Monitoring Script

```bash
#!/bin/bash
# scripts/health-check.sh
set -e

echo "=== Carbon-Pixels Health Check ==="
echo "Timestamp: $(date)"

# Check API endpoints
echo "Checking API health..."
for service in user waste gamification social analytics; do
  endpoint="https://api.carbon-pixels.com/api/v1/${service}/health"
  if curl -sf "$endpoint" > /dev/null; then
    echo "✓ ${service}-service: OK"
  else
    echo "✗ ${service}-service: FAILED"
    exit 1
  fi
done

# Check database connectivity
echo "Checking database..."
if psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✓ Database: OK"
else
  echo "✗ Database: FAILED"
  exit 1
fi

# Check Redis connectivity
echo "Checking Redis..."
if redis-cli -u $REDIS_URL ping | grep -q PONG; then
  echo "✓ Redis: OK"
else
  echo "✗ Redis: FAILED"
  exit 1
fi

# Check SSL certificate
echo "Checking SSL certificate..."
cert_expiry=$(openssl s_client -connect api.carbon-pixels.com:443 -servername api.carbon-pixels.com 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
cert_expiry_epoch=$(date -d "$cert_expiry" +%s)
current_epoch=$(date +%s)
days_until_expiry=$(( (cert_expiry_epoch - current_epoch) / 86400 ))

if [ $days_until_expiry -gt 30 ]; then
  echo "✓ SSL Certificate: OK ($days_until_expiry days remaining)"
else
  echo "⚠ SSL Certificate: Expires in $days_until_expiry days"
fi

echo "=== Health Check Complete ==="
```

### Log Aggregation with ELK Stack

```yaml
# infrastructure/logging/elasticsearch.yml
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: carbon-pixels-logs
spec:
  version: 8.11.0
  nodeSets:
  - name: default
    count: 3
    config:
      node.store.allow_mmap: false
      cluster.max_shards_per_node: 2000
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          resources:
            limits:
              memory: 4Gi
              cpu: 2000m
            requests:
              memory: 2Gi
              cpu: 1000m
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
        storageClassName: gp3
```

This comprehensive deployment guide provides everything needed to set up, deploy, and maintain the carbon-pixels backend infrastructure at scale. The configuration balances cost-effectiveness with reliability and security, supporting millions of users while maintaining operational simplicity.