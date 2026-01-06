
🔧 Tool: Task
Input: {
  "description": "Explore codebase structure",
  "prompt": "Explore the codebase to understand its structure. I need to implement production monitoring with health checks, performance metrics, uptime monitoring, user analytics, and dashboard for system status. Include alerting for anomalies and performance degradation.\n\nPlease look at:\n1. The overall project structure (directories, key files)\n2. What framework/technology stack is being used\n3. Existing patterns for API routes, components, services\n4. Any existing monitoring or analytics code\n5. Configuration files and how the app is structured\n\nGive me a comprehensive overview so I can plan the implementation.",
  "subagent_type": "Explore"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\" -type f -name \"package.json\" | head -20",
  "description": "Find package.json files to understand project structure"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\" | head -50",
  "description": "List root directory contents"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.json",
  "path": "F:\\CodeBase\\Kametrix"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\package.json"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\src\" | head -50",
  "description": "List src directory structure"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\prisma\"",
  "description": "List prisma directory"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\\src\" -type f -name \"*.ts\" -o -name \"*.tsx\" | head -50",
  "description": "Find all TypeScript files in src"
}

🔧 Tool: Bash
Input: {
  "command": "ls -R \"F:\\CodeBase\\Kametrix\\src\\app\" | head -100",
  "description": "List app directory structure recursively"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma"
}

🔧 Tool: Bash
Input: {
  "command": "ls -R \"F:\\CodeBase\\Kametrix\\src\\lib\"",
  "description": "List lib directory structure"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\src\\components\"",
  "description": "List components directory"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/lib/**/*.ts",
  "path": "F:\\CodeBase\\Kametrix"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\errors\\monitoring.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\performance\\metrics.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\next.config.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\errors\\logger.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\calls\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\middleware.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\\src\\app\\api\" -type f -name \"*.ts\" | head -15",
  "description": "List API route files"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\errors\\app-error.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\errors\\handler.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find \"F:\\CodeBase\\Kametrix\\src\\app\\api\\admin\" -type f -name \"*.ts\"",
  "description": "List admin API routes"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\admin\\performance\\route.ts"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\src\\app\\(dashboard)\\admin\"",
  "description": "List admin dashboard pages"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\errors\\types.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\errors\\types.ts",
  "offset": 95
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\.env.example"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\performance\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\CI-CD.md",
  "limit": 150
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\.github\\workflows\" 2>/dev/null || echo \"No workflows directory\"",
  "description": "Check GitHub workflows"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\docker-compose.prod.yml"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\auth-guard.ts",
  "limit": 80
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\(dashboard)\\admin\\page.tsx"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\src\\types\"",
  "description": "List types directory"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\tsconfig.json"
}

Excellent! The exploration provided a comprehensive overview. Now let me plan and implement the production monitoring system. Based on the analysis, I can see there's already substantial infrastructure in place. I need to add:

1. Health check endpoints
2. Persistent metrics storage (database models)
3. User analytics tracking
4. Anomaly detection
5. Dashboard UI for system status

Let me start implementing:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\errors\\monitoring.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\performance\\metrics.ts"
}

Now let me check the existing admin components and API routes to understand the patterns better:

🔧 Tool: Glob
Input: {
  "pattern": "src/app/api/admin/**/*.ts",
  "path": "F:\\CodeBase\\Kametrix"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/app/(dashboard)/admin/**/*.tsx",
  "path": "F:\\CodeBase\\Kametrix"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\admin\\performance\\route.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add database models for persistent metrics and analytics",
      "status": "in_progress",
      "activeForm": "Adding database models for persistent metrics and analytics"
    },
    {
      "content": "Create health check API endpoints",
      "status": "pending",
      "activeForm": "Creating health check API endpoints"
    },
    {
      "content": "Implement uptime monitoring service",
      "status": "pending",
      "activeForm": "Implementing uptime monitoring service"
    },
    {
      "content": "Create user analytics tracking",
      "status": "pending",
      "activeForm": "Creating user analytics tracking"
    },
    {
      "content": "Implement anomaly detection and alerting",
      "status": "pending",
      "activeForm": "Implementing anomaly detection and alerting"
    },
    {
      "content": "Build monitoring dashboard UI",
      "status": "pending",
      "activeForm": "Building monitoring dashboard UI"
    },
    {
      "content": "Verify with Playwright tests",
      "status": "pending",
      "activeForm": "Verifying with Playwright tests"
    }
  ]
}

Let me check more patterns and existing components:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\(dashboard)\\admin\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\prisma.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "src/components/ui/*.tsx",
  "path": "F:\\CodeBase\\Kametrix"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\dashboard\\stats-card.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\ui\\card.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\ui\\badge.tsx"
}

Now I have a good understanding of the codebase. Let me implement the production monitoring feature. I'll start by:

1. Adding database models for persistent metrics and analytics
2. Creating health check endpoints
3. Implementing monitoring services
4. Building the dashboard

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma",
  "old_string": "model SiteSetting {\n  key       String   @id\n  value     String\n  updatedAt DateTime @updatedAt\n}",
  "new_string": "model SiteSetting {\n  key       String   @id\n  value     String\n  updatedAt DateTime @updatedAt\n}\n\n// ============================================\n// Monitoring & Analytics Models\n// ============================================\n\nenum MetricType {\n  COUNTER\n  GAUGE\n  HISTOGRAM\n  TIMING\n}\n\nenum AlertSeverity {\n  LOW\n  MEDIUM\n  HIGH\n  CRITICAL\n}\n\nenum AlertStatus {\n  ACTIVE\n  ACKNOWLEDGED\n  RESOLVED\n}\n\nenum ServiceStatus {\n  HEALTHY\n  DEGRADED\n  UNHEALTHY\n  UNKNOWN\n}\n\n// Persistent system metrics for historical analysis\nmodel SystemMetric {\n  id          String     @id @default(cuid())\n  name        String\n  type        MetricType\n  value       Float\n  tags        Json?      // {\"route\": \"/api/calls\", \"method\": \"GET\"}\n  recordedAt  DateTime   @default(now())\n\n  @@index([name, recordedAt(sort: Desc)])\n  @@index([recordedAt(sort: Desc)])\n}\n\n// Uptime monitoring records\nmodel UptimeRecord {\n  id            String        @id @default(cuid())\n  serviceName   String        // \"api\", \"database\", \"vapi\", \"google\", \"stripe\"\n  status        ServiceStatus\n  responseTimeMs Int?\n  errorMessage  String?\n  checkedAt     DateTime      @default(now())\n\n  @@index([serviceName, checkedAt(sort: Desc)])\n  @@index([checkedAt(sort: Desc)])\n}\n\n// User analytics and engagement tracking\nmodel UserAnalytics {\n  id                String   @id @default(cuid())\n  userId            String   @unique\n  totalSessions     Int      @default(0)\n  totalCallsPlaced  Int      @default(0)\n  totalCallDuration Int      @default(0)  // in seconds\n  totalCreditsUsed  Int      @default(0)\n  lastActiveAt      DateTime?\n  firstSeenAt       DateTime @default(now())\n  updatedAt         DateTime @updatedAt\n\n  @@index([lastActiveAt(sort: Desc)])\n  @@index([userId])\n}\n\n// Event log for user activity tracking\nmodel EventLog {\n  id         String   @id @default(cuid())\n  userId     String?\n  eventType  String   // \"login\", \"logout\", \"agent_created\", \"call_made\", \"credits_purchased\"\n  eventData  Json?    // Additional event-specific data\n  ipAddress  String?\n  userAgent  String?\n  createdAt  DateTime @default(now())\n\n  @@index([userId, createdAt(sort: Desc)])\n  @@index([eventType, createdAt(sort: Desc)])\n  @@index([createdAt(sort: Desc)])\n}\n\n// Alerts for anomalies and issues\nmodel MonitoringAlert {\n  id          String        @id @default(cuid())\n  severity    AlertSeverity\n  status      AlertStatus   @default(ACTIVE)\n  title       String\n  message     String        @db.Text\n  source      String        // \"error_rate\", \"latency\", \"memory\", \"service_down\"\n  metadata    Json?\n  triggeredAt DateTime      @default(now())\n  resolvedAt  DateTime?\n  resolvedBy  String?       // admin userId who resolved\n\n  @@index([status, severity])\n  @@index([triggeredAt(sort: Desc)])\n  @@index([source, status])\n}\n\n// Aggregated metrics for dashboard (hourly/daily rollups)\nmodel MetricAggregate {\n  id         String   @id @default(cuid())\n  name       String\n  period     String   // \"hourly\", \"daily\"\n  periodKey  String   // \"2024-01-15-14\" for hourly, \"2024-01-15\" for daily\n  count      Int      @default(0)\n  sum        Float    @default(0)\n  min        Float?\n  max        Float?\n  avg        Float?\n  p50        Float?\n  p95        Float?\n  p99        Float?\n  createdAt  DateTime @default(now())\n\n  @@unique([name, period, periodKey])\n  @@index([name, periodKey(sort: Desc)])\n}"
}

Now let me generate the Prisma migration and create the monitoring services:

🔧 Tool: Bash
Input: {
  "command": "npx prisma generate",
  "description": "Generate Prisma client",
  "timeout": 60000
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add database models for persistent metrics and analytics",
      "status": "completed",
      "activeForm": "Adding database models for persistent metrics and analytics"
    },
    {
      "content": "Create health check API endpoints",
      "status": "in_progress",
      "activeForm": "Creating health check API endpoints"
    },
    {
      "content": "Implement uptime monitoring service",
      "status": "pending",
      "activeForm": "Implementing uptime monitoring service"
    },
    {
      "content": "Create user analytics tracking",
      "status": "pending",
      "activeForm": "Creating user analytics tracking"
    },
    {
      "content": "Implement anomaly detection and alerting",
      "status": "pending",
      "activeForm": "Implementing anomaly detection and alerting"
    },
    {
      "content": "Build monitoring dashboard UI",
      "status": "pending",
      "activeForm": "Building monitoring dashboard UI"
    },
    {
      "content": "Verify with Playwright tests",
      "status": "pending",
      "activeForm": "Verifying with Playwright tests"
    }
  ]
}

Now let me create the monitoring services and health check endpoints:

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\index.ts",
  "content": "/**\n * Production Monitoring Module\n *\n * Provides:\n * - Health checks for all services\n * - Uptime monitoring\n * - User analytics tracking\n * - Anomaly detection\n * - Performance metrics persistence\n */\n\nexport * from './health-check';\nexport * from './uptime-monitor';\nexport * from './analytics';\nexport * from './anomaly-detector';\nexport * from './metrics-persistence';\n"
}

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\health-check.ts",
  "content": "/**\n * Health Check Service\n *\n * Provides health check functionality for all system components:\n * - Database connectivity\n * - External services (Vapi, Google, Stripe)\n * - Memory and system resources\n * - Circuit breaker states\n */\n\nimport { prisma } from '@/lib/prisma';\nimport { metrics } from '@/lib/performance';\nimport { circuitBreakers, CircuitState } from '@/lib/errors/circuit-breaker';\nimport { errorMonitor } from '@/lib/errors/monitoring';\n\nexport type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';\n\nexport interface ServiceHealth {\n  name: string;\n  status: HealthStatus;\n  responseTimeMs?: number;\n  message?: string;\n  lastChecked: string;\n}\n\nexport interface SystemHealth {\n  status: HealthStatus;\n  version: string;\n  uptime: number;\n  timestamp: string;\n  services: ServiceHealth[];\n  memory: {\n    heapUsed: number;\n    heapTotal: number;\n    rss: number;\n    usagePercent: number;\n  } | null;\n  metrics: {\n    errorRate: number;\n    activeRequests: number;\n    openCircuits: string[];\n  };\n}\n\n// Track app start time for uptime calculation\nconst APP_START_TIME = Date.now();\n\n/**\n * Check database connectivity\n */\nasync function checkDatabase(): Promise<ServiceHealth> {\n  const start = performance.now();\n  try {\n    await prisma.$queryRaw`SELECT 1`;\n    const responseTime = performance.now() - start;\n    return {\n      name: 'database',\n      status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'unhealthy',\n      responseTimeMs: Math.round(responseTime),\n      lastChecked: new Date().toISOString(),\n    };\n  } catch (error) {\n    return {\n      name: 'database',\n      status: 'unhealthy',\n      message: error instanceof Error ? error.message : 'Database connection failed',\n      responseTimeMs: Math.round(performance.now() - start),\n      lastChecked: new Date().toISOString(),\n    };\n  }\n}\n\n/**\n * Check Vapi API connectivity\n */\nasync function checkVapi(): Promise<ServiceHealth> {\n  const start = performance.now();\n  const apiKey = process.env.VAPI_API_KEY;\n\n  if (!apiKey) {\n    return {\n      name: 'vapi',\n      status: 'unhealthy',\n      message: 'VAPI_API_KEY not configured',\n      lastChecked: new Date().toISOString(),\n    };\n  }\n\n  try {\n    const response = await fetch('https://api.vapi.ai/assistant', {\n      method: 'GET',\n      headers: {\n        'Authorization': `Bearer ${apiKey}`,\n      },\n      signal: AbortSignal.timeout(5000),\n    });\n\n    const responseTime = performance.now() - start;\n\n    if (response.ok || response.status === 401) {\n      // 401 means the API is reachable but auth might be invalid\n      return {\n        name: 'vapi',\n        status: response.ok ? 'healthy' : 'degraded',\n        responseTimeMs: Math.round(responseTime),\n        message: response.ok ? undefined : 'Authentication issue',\n        lastChecked: new Date().toISOString(),\n      };\n    }\n\n    return {\n      name: 'vapi',\n      status: 'degraded',\n      responseTimeMs: Math.round(responseTime),\n      message: `Status: ${response.status}`,\n      lastChecked: new Date().toISOString(),\n    };\n  } catch (error) {\n    return {\n      name: 'vapi',\n      status: 'unhealthy',\n      message: error instanceof Error ? error.message : 'Connection failed',\n      responseTimeMs: Math.round(performance.now() - start),\n      lastChecked: new Date().toISOString(),\n    };\n  }\n}\n\n/**\n * Check Stripe API connectivity\n */\nasync function checkStripe(): Promise<ServiceHealth> {\n  const start = performance.now();\n  const apiKey = process.env.STRIPE_SECRET_KEY;\n\n  if (!apiKey) {\n    return {\n      name: 'stripe',\n      status: 'unhealthy',\n      message: 'STRIPE_SECRET_KEY not configured',\n      lastChecked: new Date().toISOString(),\n    };\n  }\n\n  try {\n    const response = await fetch('https://api.stripe.com/v1/balance', {\n      method: 'GET',\n      headers: {\n        'Authorization': `Bearer ${apiKey}`,\n      },\n      signal: AbortSignal.timeout(5000),\n    });\n\n    const responseTime = performance.now() - start;\n\n    return {\n      name: 'stripe',\n      status: response.ok ? 'healthy' : 'degraded',\n      responseTimeMs: Math.round(responseTime),\n      message: response.ok ? undefined : `Status: ${response.status}`,\n      lastChecked: new Date().toISOString(),\n    };\n  } catch (error) {\n    return {\n      name: 'stripe',\n      status: 'unhealthy',\n      message: error instanceof Error ? error.message : 'Connection failed',\n      responseTimeMs: Math.round(performance.now() - start),\n      lastChecked: new Date().toISOString(),\n    };\n  }\n}\n\n/**\n * Check Google APIs connectivity\n */\nasync function checkGoogle(): Promise<ServiceHealth> {\n  const start = performance.now();\n\n  try {\n    const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo', {\n      method: 'GET',\n      signal: AbortSignal.timeout(5000),\n    });\n\n    const responseTime = performance.now() - start;\n\n    // Even a 400 means the API is reachable\n    return {\n      name: 'google',\n      status: responseTime < 500 ? 'healthy' : 'degraded',\n      responseTimeMs: Math.round(responseTime),\n      lastChecked: new Date().toISOString(),\n    };\n  } catch (error) {\n    return {\n      name: 'google',\n      status: 'unhealthy',\n      message: error instanceof Error ? error.message : 'Connection failed',\n      responseTimeMs: Math.round(performance.now() - start),\n      lastChecked: new Date().toISOString(),\n    };\n  }\n}\n\n/**\n * Get memory usage\n */\nfunction getMemoryUsage() {\n  if (typeof process === 'undefined' || !process.memoryUsage) {\n    return null;\n  }\n\n  const usage = process.memoryUsage();\n  return {\n    heapUsed: usage.heapUsed,\n    heapTotal: usage.heapTotal,\n    rss: usage.rss,\n    usagePercent: Math.round((usage.heapUsed / usage.heapTotal) * 100),\n  };\n}\n\n/**\n * Perform comprehensive health check\n */\nexport async function performHealthCheck(includeExternalServices = true): Promise<SystemHealth> {\n  const services: ServiceHealth[] = [];\n\n  // Always check database\n  services.push(await checkDatabase());\n\n  // Check external services if requested\n  if (includeExternalServices) {\n    const [vapi, stripe, google] = await Promise.all([\n      checkVapi(),\n      checkStripe(),\n      checkGoogle(),\n    ]);\n    services.push(vapi, stripe, google);\n  }\n\n  // Get error stats\n  const errorStats = errorMonitor.getStats();\n  const openCircuits = circuitBreakers.getOpenCircuits();\n\n  // Determine overall status\n  const unhealthyServices = services.filter(s => s.status === 'unhealthy');\n  const degradedServices = services.filter(s => s.status === 'degraded');\n\n  let status: HealthStatus = 'healthy';\n  if (unhealthyServices.some(s => s.name === 'database')) {\n    status = 'unhealthy';\n  } else if (unhealthyServices.length > 0 || degradedServices.length > 1 || openCircuits.length > 0) {\n    status = 'degraded';\n  } else if (degradedServices.length === 1) {\n    status = 'healthy'; // One degraded external service is acceptable\n  }\n\n  // High error rate degrades status\n  if (errorStats.errorRate.perMinute > 10) {\n    status = status === 'healthy' ? 'degraded' : status;\n  }\n  if (errorStats.errorRate.perMinute > 50) {\n    status = 'unhealthy';\n  }\n\n  return {\n    status,\n    version: process.env.npm_package_version || '1.0.0',\n    uptime: Math.floor((Date.now() - APP_START_TIME) / 1000),\n    timestamp: new Date().toISOString(),\n    services,\n    memory: getMemoryUsage(),\n    metrics: {\n      errorRate: errorStats.errorRate.perMinute,\n      activeRequests: metrics.getGauge('api.active_requests'),\n      openCircuits,\n    },\n  };\n}\n\n/**\n * Quick health check (database only)\n */\nexport async function quickHealthCheck(): Promise<{ status: HealthStatus; timestamp: string }> {\n  try {\n    await prisma.$queryRaw`SELECT 1`;\n    return {\n      status: 'healthy',\n      timestamp: new Date().toISOString(),\n    };\n  } catch {\n    return {\n      status: 'unhealthy',\n      timestamp: new Date().toISOString(),\n    };\n  }\n}\n"
}

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\uptime-monitor.ts",
  "content": "/**\n * Uptime Monitoring Service\n *\n * Tracks service availability over time and provides uptime statistics.\n * Stores records in the database for historical analysis.\n */\n\nimport { prisma } from '@/lib/prisma';\nimport { ServiceStatus } from '@/generated/prisma/client';\nimport { performHealthCheck, type HealthStatus } from './health-check';\nimport { logger } from '@/lib/errors/logger';\n\n// Map our health status to database enum\nfunction mapToServiceStatus(status: HealthStatus): ServiceStatus {\n  switch (status) {\n    case 'healthy':\n      return 'HEALTHY';\n    case 'degraded':\n      return 'DEGRADED';\n    case 'unhealthy':\n      return 'UNHEALTHY';\n    default:\n      return 'UNKNOWN';\n  }\n}\n\nexport interface UptimeStats {\n  serviceName: string;\n  uptimePercent: number;\n  totalChecks: number;\n  healthyChecks: number;\n  degradedChecks: number;\n  unhealthyChecks: number;\n  avgResponseTimeMs: number;\n  lastStatus: ServiceStatus;\n  lastCheckedAt: Date;\n}\n\nexport interface UptimeSummary {\n  overall: {\n    uptimePercent: number;\n    status: ServiceStatus;\n  };\n  services: UptimeStats[];\n  period: {\n    start: Date;\n    end: Date;\n  };\n}\n\n/**\n * Record a health check result to the database\n */\nexport async function recordHealthCheck(): Promise<void> {\n  try {\n    const health = await performHealthCheck(true);\n\n    // Record each service status\n    const records = health.services.map(service => ({\n      serviceName: service.name,\n      status: mapToServiceStatus(service.status),\n      responseTimeMs: service.responseTimeMs ?? null,\n      errorMessage: service.message ?? null,\n    }));\n\n    // Also record overall API status\n    records.push({\n      serviceName: 'api',\n      status: mapToServiceStatus(health.status),\n      responseTimeMs: null,\n      errorMessage: null,\n    });\n\n    await prisma.uptimeRecord.createMany({\n      data: records,\n    });\n\n    logger.debug('Health check recorded', {\n      status: health.status,\n      services: health.services.length,\n    });\n  } catch (error) {\n    logger.error('Failed to record health check', error);\n  }\n}\n\n/**\n * Get uptime statistics for a time period\n */\nexport async function getUptimeStats(\n  hoursBack = 24\n): Promise<UptimeSummary> {\n  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);\n\n  // Get all records in the time period\n  const records = await prisma.uptimeRecord.findMany({\n    where: {\n      checkedAt: { gte: since },\n    },\n    orderBy: { checkedAt: 'desc' },\n  });\n\n  // Group by service\n  const serviceMap = new Map<string, {\n    total: number;\n    healthy: number;\n    degraded: number;\n    unhealthy: number;\n    totalResponseTime: number;\n    responseTimeCount: number;\n    lastStatus: ServiceStatus;\n    lastCheckedAt: Date;\n  }>();\n\n  for (const record of records) {\n    let stats = serviceMap.get(record.serviceName);\n    if (!stats) {\n      stats = {\n        total: 0,\n        healthy: 0,\n        degraded: 0,\n        unhealthy: 0,\n        totalResponseTime: 0,\n        responseTimeCount: 0,\n        lastStatus: record.status,\n        lastCheckedAt: record.checkedAt,\n      };\n      serviceMap.set(record.serviceName, stats);\n    }\n\n    stats.total++;\n    if (record.status === 'HEALTHY') stats.healthy++;\n    else if (record.status === 'DEGRADED') stats.degraded++;\n    else if (record.status === 'UNHEALTHY') stats.unhealthy++;\n\n    if (record.responseTimeMs !== null) {\n      stats.totalResponseTime += record.responseTimeMs;\n      stats.responseTimeCount++;\n    }\n  }\n\n  // Calculate stats for each service\n  const services: UptimeStats[] = [];\n  let totalUptime = 0;\n  let serviceCount = 0;\n\n  for (const [serviceName, stats] of serviceMap) {\n    const uptimePercent = stats.total > 0\n      ? ((stats.healthy + stats.degraded * 0.5) / stats.total) * 100\n      : 100;\n\n    services.push({\n      serviceName,\n      uptimePercent: Math.round(uptimePercent * 100) / 100,\n      totalChecks: stats.total,\n      healthyChecks: stats.healthy,\n      degradedChecks: stats.degraded,\n      unhealthyChecks: stats.unhealthy,\n      avgResponseTimeMs: stats.responseTimeCount > 0\n        ? Math.round(stats.totalResponseTime / stats.responseTimeCount)\n        : 0,\n      lastStatus: stats.lastStatus,\n      lastCheckedAt: stats.lastCheckedAt,\n    });\n\n    totalUptime += uptimePercent;\n    serviceCount++;\n  }\n\n  // Sort by service name for consistency\n  services.sort((a, b) => a.serviceName.localeCompare(b.serviceName));\n\n  // Get overall status from API service or calculate\n  const apiStats = serviceMap.get('api');\n  const overallStatus = apiStats?.lastStatus ?? 'UNKNOWN';\n  const overallUptime = serviceCount > 0 ? totalUptime / serviceCount : 100;\n\n  return {\n    overall: {\n      uptimePercent: Math.round(overallUptime * 100) / 100,\n      status: overallStatus,\n    },\n    services,\n    period: {\n      start: since,\n      end: new Date(),\n    },\n  };\n}\n\n/**\n * Get uptime history for charting\n */\nexport async function getUptimeHistory(\n  serviceName: string,\n  hoursBack = 24,\n  resolution: 'minute' | 'hour' = 'hour'\n): Promise<Array<{ timestamp: Date; status: ServiceStatus; responseTimeMs: number | null }>> {\n  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);\n\n  const records = await prisma.uptimeRecord.findMany({\n    where: {\n      serviceName,\n      checkedAt: { gte: since },\n    },\n    orderBy: { checkedAt: 'asc' },\n    select: {\n      checkedAt: true,\n      status: true,\n      responseTimeMs: true,\n    },\n  });\n\n  if (resolution === 'minute') {\n    return records.map(r => ({\n      timestamp: r.checkedAt,\n      status: r.status,\n      responseTimeMs: r.responseTimeMs,\n    }));\n  }\n\n  // Aggregate by hour\n  const hourlyMap = new Map<string, {\n    timestamp: Date;\n    statuses: ServiceStatus[];\n    responseTimes: number[];\n  }>();\n\n  for (const record of records) {\n    const hourKey = record.checkedAt.toISOString().slice(0, 13); // \"2024-01-15T14\"\n    let entry = hourlyMap.get(hourKey);\n    if (!entry) {\n      entry = {\n        timestamp: new Date(hourKey + ':00:00.000Z'),\n        statuses: [],\n        responseTimes: [],\n      };\n      hourlyMap.set(hourKey, entry);\n    }\n    entry.statuses.push(record.status);\n    if (record.responseTimeMs !== null) {\n      entry.responseTimes.push(record.responseTimeMs);\n    }\n  }\n\n  // Determine worst status per hour\n  const result: Array<{ timestamp: Date; status: ServiceStatus; responseTimeMs: number | null }> = [];\n  for (const [, entry] of hourlyMap) {\n    let worstStatus: ServiceStatus = 'HEALTHY';\n    if (entry.statuses.includes('UNHEALTHY')) worstStatus = 'UNHEALTHY';\n    else if (entry.statuses.includes('DEGRADED')) worstStatus = 'DEGRADED';\n\n    result.push({\n      timestamp: entry.timestamp,\n      status: worstStatus,\n      responseTimeMs: entry.responseTimes.length > 0\n        ? Math.round(entry.responseTimes.reduce((a, b) => a + b, 0) / entry.responseTimes.length)\n        : null,\n    });\n  }\n\n  return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());\n}\n\n/**\n * Clean up old uptime records (keep last 30 days)\n */\nexport async function cleanupOldUptimeRecords(): Promise<number> {\n  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);\n\n  const result = await prisma.uptimeRecord.deleteMany({\n    where: {\n      checkedAt: { lt: cutoff },\n    },\n  });\n\n  logger.info('Cleaned up old uptime records', { deleted: result.count });\n  return result.count;\n}\n\n// Start periodic health checks if in Node.js environment\nlet healthCheckInterval: ReturnType<typeof setInterval> | null = null;\n\nexport function startUptimeMonitoring(intervalMs = 60000): void {\n  if (healthCheckInterval) {\n    return; // Already running\n  }\n\n  healthCheckInterval = setInterval(() => {\n    recordHealthCheck().catch(err => {\n      logger.error('Periodic health check failed', err);\n    });\n  }, intervalMs);\n\n  logger.info('Uptime monitoring started', { intervalMs });\n}\n\nexport function stopUptimeMonitoring(): void {\n  if (healthCheckInterval) {\n    clearInterval(healthCheckInterval);\n    healthCheckInterval = null;\n    logger.info('Uptime monitoring stopped');\n  }\n}\n"
}

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\analytics.ts",
  "content": "/**\n * User Analytics Service\n *\n * Tracks user engagement and activity for business insights:\n * - Session tracking\n * - Feature usage\n * - User journey analytics\n */\n\nimport { prisma } from '@/lib/prisma';\nimport { logger } from '@/lib/errors/logger';\n\nexport type EventType =\n  | 'login'\n  | 'logout'\n  | 'signup'\n  | 'agent_created'\n  | 'agent_updated'\n  | 'agent_deleted'\n  | 'call_initiated'\n  | 'call_completed'\n  | 'credits_purchased'\n  | 'page_view'\n  | 'feature_used';\n\nexport interface TrackEventOptions {\n  userId?: string;\n  eventType: EventType;\n  eventData?: Record<string, unknown>;\n  ipAddress?: string;\n  userAgent?: string;\n}\n\n/**\n * Track a user event\n */\nexport async function trackEvent(options: TrackEventOptions): Promise<void> {\n  try {\n    await prisma.eventLog.create({\n      data: {\n        userId: options.userId ?? null,\n        eventType: options.eventType,\n        eventData: options.eventData ?? null,\n        ipAddress: options.ipAddress ?? null,\n        userAgent: options.userAgent ?? null,\n      },\n    });\n\n    // Update user analytics if userId is provided\n    if (options.userId) {\n      await updateUserAnalytics(options.userId, options.eventType, options.eventData);\n    }\n  } catch (error) {\n    logger.error('Failed to track event', error);\n  }\n}\n\n/**\n * Update user analytics based on event\n */\nasync function updateUserAnalytics(\n  userId: string,\n  eventType: EventType,\n  eventData?: Record<string, unknown>\n): Promise<void> {\n  const updates: Record<string, unknown> = {\n    lastActiveAt: new Date(),\n  };\n\n  switch (eventType) {\n    case 'login':\n      updates.totalSessions = { increment: 1 };\n      break;\n    case 'call_completed':\n      updates.totalCallsPlaced = { increment: 1 };\n      if (typeof eventData?.duration === 'number') {\n        updates.totalCallDuration = { increment: eventData.duration };\n      }\n      if (typeof eventData?.creditsUsed === 'number') {\n        updates.totalCreditsUsed = { increment: eventData.creditsUsed };\n      }\n      break;\n  }\n\n  try {\n    await prisma.userAnalytics.upsert({\n      where: { userId },\n      create: {\n        userId,\n        totalSessions: eventType === 'login' ? 1 : 0,\n        totalCallsPlaced: eventType === 'call_completed' ? 1 : 0,\n        totalCallDuration: typeof eventData?.duration === 'number' ? eventData.duration : 0,\n        totalCreditsUsed: typeof eventData?.creditsUsed === 'number' ? eventData.creditsUsed : 0,\n        lastActiveAt: new Date(),\n        firstSeenAt: new Date(),\n      },\n      update: updates,\n    });\n  } catch (error) {\n    logger.error('Failed to update user analytics', error);\n  }\n}\n\n/**\n * Get user analytics summary\n */\nexport async function getUserAnalytics(userId: string) {\n  return prisma.userAnalytics.findUnique({\n    where: { userId },\n  });\n}\n\n/**\n * Get platform-wide analytics summary\n */\nexport async function getPlatformAnalytics(hoursBack = 24) {\n  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);\n\n  // Get event counts by type\n  const eventCounts = await prisma.eventLog.groupBy({\n    by: ['eventType'],\n    where: {\n      createdAt: { gte: since },\n    },\n    _count: true,\n  });\n\n  // Get active users count\n  const activeUsers = await prisma.userAnalytics.count({\n    where: {\n      lastActiveAt: { gte: since },\n    },\n  });\n\n  // Get total events\n  const totalEvents = await prisma.eventLog.count({\n    where: {\n      createdAt: { gte: since },\n    },\n  });\n\n  // Get new signups\n  const newSignups = await prisma.user.count({\n    where: {\n      createdAt: { gte: since },\n    },\n  });\n\n  // Get calls stats\n  const callStats = await prisma.call.aggregate({\n    where: {\n      createdAt: { gte: since },\n    },\n    _count: true,\n    _sum: {\n      durationSeconds: true,\n      creditsUsed: true,\n    },\n  });\n\n  return {\n    period: {\n      start: since,\n      end: new Date(),\n      hoursBack,\n    },\n    users: {\n      activeUsers,\n      newSignups,\n    },\n    events: {\n      total: totalEvents,\n      byType: Object.fromEntries(\n        eventCounts.map(e => [e.eventType, e._count])\n      ),\n    },\n    calls: {\n      total: callStats._count,\n      totalDuration: callStats._sum.durationSeconds ?? 0,\n      totalCreditsUsed: callStats._sum.creditsUsed ?? 0,\n    },\n  };\n}\n\n/**\n * Get event timeline for a user\n */\nexport async function getUserEventTimeline(\n  userId: string,\n  limit = 50\n) {\n  return prisma.eventLog.findMany({\n    where: { userId },\n    orderBy: { createdAt: 'desc' },\n    take: limit,\n    select: {\n      id: true,\n      eventType: true,\n      eventData: true,\n      createdAt: true,\n    },\n  });\n}\n\n/**\n * Get recent platform events\n */\nexport async function getRecentEvents(limit = 100) {\n  return prisma.eventLog.findMany({\n    orderBy: { createdAt: 'desc' },\n    take: limit,\n    select: {\n      id: true,\n      userId: true,\n      eventType: true,\n      eventData: true,\n      createdAt: true,\n    },\n  });\n}\n\n/**\n * Get top users by activity\n */\nexport async function getTopUsersByActivity(limit = 10) {\n  return prisma.userAnalytics.findMany({\n    orderBy: [\n      { totalCallsPlaced: 'desc' },\n      { totalSessions: 'desc' },\n    ],\n    take: limit,\n    select: {\n      userId: true,\n      totalSessions: true,\n      totalCallsPlaced: true,\n      totalCallDuration: true,\n      totalCreditsUsed: true,\n      lastActiveAt: true,\n    },\n  });\n}\n\n/**\n * Clean up old event logs (keep last 90 days)\n */\nexport async function cleanupOldEventLogs(): Promise<number> {\n  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);\n\n  const result = await prisma.eventLog.deleteMany({\n    where: {\n      createdAt: { lt: cutoff },\n    },\n  });\n\n  logger.info('Cleaned up old event logs', { deleted: result.count });\n  return result.count;\n}\n"
}

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\anomaly-detector.ts",
  "content": "/**\n * Anomaly Detection Service\n *\n * Detects anomalies in system metrics and triggers alerts:\n * - Error rate spikes\n * - Latency degradation\n * - Memory leaks\n * - Traffic anomalies\n */\n\nimport { prisma } from '@/lib/prisma';\nimport { AlertSeverity, AlertStatus } from '@/generated/prisma/client';\nimport { metrics } from '@/lib/performance';\nimport { errorMonitor } from '@/lib/errors/monitoring';\nimport { logger } from '@/lib/errors/logger';\n\nexport interface AnomalyThresholds {\n  errorRatePerMinute: { warning: number; critical: number };\n  latencyP95Ms: { warning: number; critical: number };\n  memoryUsagePercent: { warning: number; critical: number };\n  activeRequests: { warning: number; critical: number };\n}\n\nconst DEFAULT_THRESHOLDS: AnomalyThresholds = {\n  errorRatePerMinute: { warning: 5, critical: 20 },\n  latencyP95Ms: { warning: 1000, critical: 5000 },\n  memoryUsagePercent: { warning: 80, critical: 95 },\n  activeRequests: { warning: 100, critical: 500 },\n};\n\n/**\n * Check for anomalies and create alerts\n */\nexport async function checkForAnomalies(\n  thresholds: AnomalyThresholds = DEFAULT_THRESHOLDS\n): Promise<void> {\n  const anomalies: Array<{\n    source: string;\n    severity: AlertSeverity;\n    title: string;\n    message: string;\n    metadata: Record<string, unknown>;\n  }> = [];\n\n  // Check error rate\n  const errorStats = errorMonitor.getStats();\n  const errorRate = errorStats.errorRate.perMinute;\n\n  if (errorRate >= thresholds.errorRatePerMinute.critical) {\n    anomalies.push({\n      source: 'error_rate',\n      severity: 'CRITICAL',\n      title: 'Critical Error Rate Detected',\n      message: `Error rate is at ${errorRate} errors/minute, exceeding critical threshold of ${thresholds.errorRatePerMinute.critical}`,\n      metadata: {\n        currentRate: errorRate,\n        threshold: thresholds.errorRatePerMinute.critical,\n        topErrors: errorStats.topErrors.slice(0, 5),\n      },\n    });\n  } else if (errorRate >= thresholds.errorRatePerMinute.warning) {\n    anomalies.push({\n      source: 'error_rate',\n      severity: 'HIGH',\n      title: 'Elevated Error Rate Detected',\n      message: `Error rate is at ${errorRate} errors/minute, exceeding warning threshold of ${thresholds.errorRatePerMinute.warning}`,\n      metadata: {\n        currentRate: errorRate,\n        threshold: thresholds.errorRatePerMinute.warning,\n        topErrors: errorStats.topErrors.slice(0, 5),\n      },\n    });\n  }\n\n  // Check latency\n  const apiMetrics = metrics.getAllMetrics().filter(m => m.name.startsWith('api.'));\n  for (const metric of apiMetrics) {\n    const p95 = metrics.getPercentile(metric.name, 95);\n    if (p95 !== null) {\n      if (p95 >= thresholds.latencyP95Ms.critical) {\n        anomalies.push({\n          source: 'latency',\n          severity: 'CRITICAL',\n          title: `Critical Latency on ${metric.name}`,\n          message: `P95 latency is ${Math.round(p95)}ms, exceeding critical threshold of ${thresholds.latencyP95Ms.critical}ms`,\n          metadata: {\n            metricName: metric.name,\n            p95Latency: Math.round(p95),\n            avgLatency: Math.round(metric.avgMs),\n            maxLatency: Math.round(metric.maxMs),\n            threshold: thresholds.latencyP95Ms.critical,\n          },\n        });\n      } else if (p95 >= thresholds.latencyP95Ms.warning) {\n        anomalies.push({\n          source: 'latency',\n          severity: 'MEDIUM',\n          title: `High Latency on ${metric.name}`,\n          message: `P95 latency is ${Math.round(p95)}ms, exceeding warning threshold of ${thresholds.latencyP95Ms.warning}ms`,\n          metadata: {\n            metricName: metric.name,\n            p95Latency: Math.round(p95),\n            avgLatency: Math.round(metric.avgMs),\n            threshold: thresholds.latencyP95Ms.warning,\n          },\n        });\n      }\n    }\n  }\n\n  // Check memory usage\n  const memoryUsage = metrics.getMemoryUsage();\n  if (memoryUsage) {\n    if (memoryUsage.usagePercent >= thresholds.memoryUsagePercent.critical) {\n      anomalies.push({\n        source: 'memory',\n        severity: 'CRITICAL',\n        title: 'Critical Memory Usage',\n        message: `Memory usage is at ${Math.round(memoryUsage.usagePercent)}%, exceeding critical threshold of ${thresholds.memoryUsagePercent.critical}%`,\n        metadata: {\n          usagePercent: Math.round(memoryUsage.usagePercent),\n          heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),\n          heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),\n          threshold: thresholds.memoryUsagePercent.critical,\n        },\n      });\n    } else if (memoryUsage.usagePercent >= thresholds.memoryUsagePercent.warning) {\n      anomalies.push({\n        source: 'memory',\n        severity: 'MEDIUM',\n        title: 'High Memory Usage',\n        message: `Memory usage is at ${Math.round(memoryUsage.usagePercent)}%, exceeding warning threshold of ${thresholds.memoryUsagePercent.warning}%`,\n        metadata: {\n          usagePercent: Math.round(memoryUsage.usagePercent),\n          heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),\n          threshold: thresholds.memoryUsagePercent.warning,\n        },\n      });\n    }\n  }\n\n  // Check active requests\n  const activeRequests = metrics.getGauge('api.active_requests');\n  if (activeRequests >= thresholds.activeRequests.critical) {\n    anomalies.push({\n      source: 'traffic',\n      severity: 'HIGH',\n      title: 'Very High Traffic',\n      message: `${activeRequests} concurrent requests, exceeding critical threshold of ${thresholds.activeRequests.critical}`,\n      metadata: {\n        activeRequests,\n        threshold: thresholds.activeRequests.critical,\n      },\n    });\n  } else if (activeRequests >= thresholds.activeRequests.warning) {\n    anomalies.push({\n      source: 'traffic',\n      severity: 'MEDIUM',\n      title: 'High Traffic',\n      message: `${activeRequests} concurrent requests, exceeding warning threshold of ${thresholds.activeRequests.warning}`,\n      metadata: {\n        activeRequests,\n        threshold: thresholds.activeRequests.warning,\n      },\n    });\n  }\n\n  // Create alerts for detected anomalies (avoid duplicates)\n  for (const anomaly of anomalies) {\n    await createAlertIfNew(anomaly);\n  }\n}\n\n/**\n * Create an alert if there isn't an active one for the same source\n */\nasync function createAlertIfNew(anomaly: {\n  source: string;\n  severity: AlertSeverity;\n  title: string;\n  message: string;\n  metadata: Record<string, unknown>;\n}): Promise<void> {\n  try {\n    // Check for existing active alert from same source\n    const existingAlert = await prisma.monitoringAlert.findFirst({\n      where: {\n        source: anomaly.source,\n        status: 'ACTIVE',\n        triggeredAt: {\n          gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes\n        },\n      },\n    });\n\n    if (existingAlert) {\n      // Update existing alert if severity changed\n      if (existingAlert.severity !== anomaly.severity) {\n        await prisma.monitoringAlert.update({\n          where: { id: existingAlert.id },\n          data: {\n            severity: anomaly.severity,\n            message: anomaly.message,\n            metadata: anomaly.metadata,\n          },\n        });\n      }\n      return;\n    }\n\n    // Create new alert\n    await prisma.monitoringAlert.create({\n      data: {\n        severity: anomaly.severity,\n        title: anomaly.title,\n        message: anomaly.message,\n        source: anomaly.source,\n        metadata: anomaly.metadata,\n      },\n    });\n\n    logger.warn('Anomaly alert created', {\n      source: anomaly.source,\n      severity: anomaly.severity,\n      title: anomaly.title,\n    });\n  } catch (error) {\n    logger.error('Failed to create anomaly alert', error);\n  }\n}\n\n/**\n * Get active alerts\n */\nexport async function getActiveAlerts() {\n  return prisma.monitoringAlert.findMany({\n    where: {\n      status: 'ACTIVE',\n    },\n    orderBy: [\n      { severity: 'desc' },\n      { triggeredAt: 'desc' },\n    ],\n  });\n}\n\n/**\n * Get alert history\n */\nexport async function getAlertHistory(limit = 100) {\n  return prisma.monitoringAlert.findMany({\n    orderBy: { triggeredAt: 'desc' },\n    take: limit,\n  });\n}\n\n/**\n * Acknowledge an alert\n */\nexport async function acknowledgeAlert(alertId: string): Promise<void> {\n  await prisma.monitoringAlert.update({\n    where: { id: alertId },\n    data: { status: 'ACKNOWLEDGED' },\n  });\n}\n\n/**\n * Resolve an alert\n */\nexport async function resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {\n  await prisma.monitoringAlert.update({\n    where: { id: alertId },\n    data: {\n      status: 'RESOLVED',\n      resolvedAt: new Date(),\n      resolvedBy,\n    },\n  });\n}\n\n/**\n * Auto-resolve alerts that are no longer relevant\n */\nexport async function autoResolveStaleAlerts(): Promise<number> {\n  // Resolve alerts older than 1 hour that are still active\n  const staleThreshold = new Date(Date.now() - 60 * 60 * 1000);\n\n  const result = await prisma.monitoringAlert.updateMany({\n    where: {\n      status: 'ACTIVE',\n      triggeredAt: { lt: staleThreshold },\n    },\n    data: {\n      status: 'RESOLVED',\n      resolvedAt: new Date(),\n    },\n  });\n\n  if (result.count > 0) {\n    logger.info('Auto-resolved stale alerts', { count: result.count });\n  }\n\n  return result.count;\n}\n\n/**\n * Clean up old resolved alerts (keep last 30 days)\n */\nexport async function cleanupOldAlerts(): Promise<number> {\n  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);\n\n  const result = await prisma.monitoringAlert.deleteMany({\n    where: {\n      status: 'RESOLVED',\n      resolvedAt: { lt: cutoff },\n    },\n  });\n\n  logger.info('Cleaned up old alerts', { deleted: result.count });\n  return result.count;\n}\n\n// Periodic anomaly checking\nlet anomalyCheckInterval: ReturnType<typeof setInterval> | null = null;\n\nexport function startAnomalyDetection(intervalMs = 60000): void {\n  if (anomalyCheckInterval) {\n    return;\n  }\n\n  anomalyCheckInterval = setInterval(() => {\n    checkForAnomalies().catch(err => {\n      logger.error('Anomaly check failed', err);\n    });\n    autoResolveStaleAlerts().catch(err => {\n      logger.error('Auto-resolve failed', err);\n    });\n  }, intervalMs);\n\n  logger.info('Anomaly detection started', { intervalMs });\n}\n\nexport function stopAnomalyDetection(): void {\n  if (anomalyCheckInterval) {\n    clearInterval(anomalyCheckInterval);\n    anomalyCheckInterval = null;\n    logger.info('Anomaly detection stopped');\n  }\n}\n"
}

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\metrics-persistence.ts",
  "content": "/**\n * Metrics Persistence Service\n *\n * Persists in-memory metrics to the database for historical analysis:\n * - Periodic metric snapshots\n * - Metric aggregation (hourly/daily rollups)\n * - Historical data queries\n */\n\nimport { prisma } from '@/lib/prisma';\nimport { MetricType } from '@/generated/prisma/client';\nimport { metrics } from '@/lib/performance';\nimport { logger } from '@/lib/errors/logger';\n\n/**\n * Persist current metrics to database\n */\nexport async function persistMetrics(): Promise<void> {\n  try {\n    const report = metrics.generateReport();\n    const records: Array<{\n      name: string;\n      type: MetricType;\n      value: number;\n      tags: Record<string, unknown> | null;\n    }> = [];\n\n    // Persist timing metrics\n    for (const metric of report.metrics) {\n      records.push({\n        name: metric.name,\n        type: 'TIMING',\n        value: metric.avgMs,\n        tags: {\n          count: metric.count,\n          minMs: metric.minMs,\n          maxMs: metric.maxMs,\n          errorRate: metric.errorRate,\n        },\n      });\n    }\n\n    // Persist gauges\n    for (const [name, value] of Object.entries(report.gauges)) {\n      records.push({\n        name,\n        type: 'GAUGE',\n        value,\n        tags: null,\n      });\n    }\n\n    // Persist memory metrics\n    if (report.memory) {\n      records.push({\n        name: 'memory.heap_used',\n        type: 'GAUGE',\n        value: report.memory.heapUsed,\n        tags: null,\n      });\n      records.push({\n        name: 'memory.heap_total',\n        type: 'GAUGE',\n        value: report.memory.heapTotal,\n        tags: null,\n      });\n      records.push({\n        name: 'memory.rss',\n        type: 'GAUGE',\n        value: report.memory.rss,\n        tags: null,\n      });\n      records.push({\n        name: 'memory.usage_percent',\n        type: 'GAUGE',\n        value: report.memory.usagePercent,\n        tags: null,\n      });\n    }\n\n    if (records.length > 0) {\n      await prisma.systemMetric.createMany({\n        data: records,\n      });\n      logger.debug('Metrics persisted', { count: records.length });\n    }\n  } catch (error) {\n    logger.error('Failed to persist metrics', error);\n  }\n}\n\n/**\n * Create hourly metric aggregates\n */\nexport async function createHourlyAggregates(): Promise<void> {\n  const now = new Date();\n  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);\n  const hourKey = hourAgo.toISOString().slice(0, 13).replace('T', '-'); // \"2024-01-15-14\"\n\n  try {\n    // Get distinct metric names from the last hour\n    const metricNames = await prisma.systemMetric.findMany({\n      where: {\n        recordedAt: {\n          gte: hourAgo,\n          lt: now,\n        },\n      },\n      select: { name: true },\n      distinct: ['name'],\n    });\n\n    for (const { name } of metricNames) {\n      // Get all values for this metric in the hour\n      const values = await prisma.systemMetric.findMany({\n        where: {\n          name,\n          recordedAt: {\n            gte: hourAgo,\n            lt: now,\n          },\n        },\n        select: { value: true },\n      });\n\n      if (values.length === 0) continue;\n\n      const sortedValues = values.map(v => v.value).sort((a, b) => a - b);\n      const sum = sortedValues.reduce((a, b) => a + b, 0);\n      const count = sortedValues.length;\n\n      const aggregate = {\n        name,\n        period: 'hourly',\n        periodKey: hourKey,\n        count,\n        sum,\n        min: sortedValues[0],\n        max: sortedValues[count - 1],\n        avg: sum / count,\n        p50: sortedValues[Math.floor(count * 0.5)],\n        p95: sortedValues[Math.floor(count * 0.95)],\n        p99: sortedValues[Math.floor(count * 0.99)],\n      };\n\n      await prisma.metricAggregate.upsert({\n        where: {\n          name_period_periodKey: {\n            name,\n            period: 'hourly',\n            periodKey: hourKey,\n          },\n        },\n        create: aggregate,\n        update: aggregate,\n      });\n    }\n\n    logger.debug('Hourly aggregates created', { periodKey: hourKey, metrics: metricNames.length });\n  } catch (error) {\n    logger.error('Failed to create hourly aggregates', error);\n  }\n}\n\n/**\n * Create daily metric aggregates\n */\nexport async function createDailyAggregates(): Promise<void> {\n  const now = new Date();\n  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);\n  const dayKey = dayAgo.toISOString().slice(0, 10); // \"2024-01-15\"\n\n  try {\n    // Aggregate from hourly data\n    const hourlyAggregates = await prisma.metricAggregate.findMany({\n      where: {\n        period: 'hourly',\n        periodKey: { startsWith: dayKey },\n      },\n    });\n\n    // Group by metric name\n    const metricGroups = new Map<string, typeof hourlyAggregates>();\n    for (const agg of hourlyAggregates) {\n      const existing = metricGroups.get(agg.name) ?? [];\n      existing.push(agg);\n      metricGroups.set(agg.name, existing);\n    }\n\n    for (const [name, aggregates] of metricGroups) {\n      const totalCount = aggregates.reduce((sum, a) => sum + a.count, 0);\n      const totalSum = aggregates.reduce((sum, a) => sum + a.sum, 0);\n      const allMins = aggregates.map(a => a.min).filter((v): v is number => v !== null);\n      const allMaxs = aggregates.map(a => a.max).filter((v): v is number => v !== null);\n\n      const dailyAggregate = {\n        name,\n        period: 'daily',\n        periodKey: dayKey,\n        count: totalCount,\n        sum: totalSum,\n        min: allMins.length > 0 ? Math.min(...allMins) : null,\n        max: allMaxs.length > 0 ? Math.max(...allMaxs) : null,\n        avg: totalCount > 0 ? totalSum / totalCount : null,\n        // Approximate percentiles from hourly data\n        p50: aggregates.length > 0 ? aggregates.reduce((sum, a) => sum + (a.p50 ?? 0), 0) / aggregates.length : null,\n        p95: aggregates.length > 0 ? aggregates.reduce((sum, a) => sum + (a.p95 ?? 0), 0) / aggregates.length : null,\n        p99: aggregates.length > 0 ? aggregates.reduce((sum, a) => sum + (a.p99 ?? 0), 0) / aggregates.length : null,\n      };\n\n      await prisma.metricAggregate.upsert({\n        where: {\n          name_period_periodKey: {\n            name,\n            period: 'daily',\n            periodKey: dayKey,\n          },\n        },\n        create: dailyAggregate,\n        update: dailyAggregate,\n      });\n    }\n\n    logger.debug('Daily aggregates created', { periodKey: dayKey, metrics: metricGroups.size });\n  } catch (error) {\n    logger.error('Failed to create daily aggregates', error);\n  }\n}\n\n/**\n * Get metric history for charting\n */\nexport async function getMetricHistory(\n  metricName: string,\n  hoursBack = 24\n): Promise<Array<{ timestamp: Date; value: number }>> {\n  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);\n\n  const records = await prisma.systemMetric.findMany({\n    where: {\n      name: metricName,\n      recordedAt: { gte: since },\n    },\n    orderBy: { recordedAt: 'asc' },\n    select: {\n      recordedAt: true,\n      value: true,\n    },\n  });\n\n  return records.map(r => ({\n    timestamp: r.recordedAt,\n    value: r.value,\n  }));\n}\n\n/**\n * Get aggregated metrics for dashboard\n */\nexport async function getAggregatedMetrics(\n  period: 'hourly' | 'daily',\n  daysBack = 7\n) {\n  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);\n  const sinceKey = since.toISOString().slice(0, period === 'hourly' ? 13 : 10).replace('T', '-');\n\n  return prisma.metricAggregate.findMany({\n    where: {\n      period,\n      periodKey: { gte: sinceKey },\n    },\n    orderBy: { periodKey: 'asc' },\n  });\n}\n\n/**\n * Clean up old metrics (keep raw metrics for 7 days, aggregates for 90 days)\n */\nexport async function cleanupOldMetrics(): Promise<{ raw: number; aggregates: number }> {\n  const rawCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);\n  const aggCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);\n  const aggCutoffKey = aggCutoff.toISOString().slice(0, 10);\n\n  const rawResult = await prisma.systemMetric.deleteMany({\n    where: {\n      recordedAt: { lt: rawCutoff },\n    },\n  });\n\n  const aggResult = await prisma.metricAggregate.deleteMany({\n    where: {\n      periodKey: { lt: aggCutoffKey },\n    },\n  });\n\n  logger.info('Cleaned up old metrics', {\n    rawDeleted: rawResult.count,\n    aggregatesDeleted: aggResult.count,\n  });\n\n  return {\n    raw: rawResult.count,\n    aggregates: aggResult.count,\n  };\n}\n\n// Periodic persistence\nlet persistInterval: ReturnType<typeof setInterval> | null = null;\nlet aggregateInterval: ReturnType<typeof setInterval> | null = null;\n\nexport function startMetricsPersistence(\n  persistIntervalMs = 5 * 60 * 1000, // Every 5 minutes\n  aggregateIntervalMs = 60 * 60 * 1000 // Every hour\n): void {\n  if (persistInterval) {\n    return;\n  }\n\n  persistInterval = setInterval(() => {\n    persistMetrics().catch(err => {\n      logger.error('Metric persistence failed', err);\n    });\n  }, persistIntervalMs);\n\n  aggregateInterval = setInterval(() => {\n    createHourlyAggregates().catch(err => {\n      logger.error('Hourly aggregation failed', err);\n    });\n  }, aggregateIntervalMs);\n\n  logger.info('Metrics persistence started', { persistIntervalMs, aggregateIntervalMs });\n}\n\nexport function stopMetricsPersistence(): void {\n  if (persistInterval) {\n    clearInterval(persistInterval);\n    persistInterval = null;\n  }\n  if (aggregateInterval) {\n    clearInterval(aggregateInterval);\n    aggregateInterval = null;\n  }\n  logger.info('Metrics persistence stopped');\n}\n"
}

Now let me update the todo and create the health check API endpoints:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add database models for persistent metrics and analytics",
      "status": "completed",
      "activeForm": "Adding database models for persistent metrics and analytics"
    },
    {
      "content": "Create health check API endpoints",
      "status": "completed",
      "activeForm": "Creating health check API endpoints"
    },
    {
      "content": "Implement uptime monitoring service",
      "status": "completed",
      "activeForm": "Implementing uptime monitoring service"
    },
    {
      "content": "Create user analytics tracking",
      "status": "completed",
      "activeForm": "Creating user analytics tracking"
    },
    {
      "content": "Implement anomaly detection and alerting",
      "status": "completed",
      "activeForm": "Implementing anomaly detection and alerting"
    },
    {
      "content": "Build monitoring dashboard UI",
      "status": "in_progress",
      "activeForm": "Building monitoring dashboard UI"
    },
    {
      "content": "Verify with Playwright tests",
      "status": "pending",
      "activeForm": "Verifying with Playwright tests"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\health\\route.ts",
  "content": "import { NextResponse } from 'next/server';\nimport { quickHealthCheck, performHealthCheck } from '@/lib/monitoring';\n\n/**\n * GET /api/health - Quick health check (public)\n *\n * Returns basic health status for load balancers and monitoring systems.\n * Does not require authentication.\n */\nexport async function GET() {\n  try {\n    const health = await quickHealthCheck();\n\n    const statusCode = health.status === 'healthy' ? 200 : 503;\n\n    return NextResponse.json(health, {\n      status: statusCode,\n      headers: {\n        'Cache-Control': 'no-store, max-age=0',\n      },\n    });\n  } catch (error) {\n    console.error('Health check failed:', error);\n    return NextResponse.json(\n      {\n        status: 'unhealthy',\n        timestamp: new Date().toISOString(),\n        error: 'Health check failed',\n      },\n      { status: 503 }\n    );\n  }\n}\n"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"F:\\CodeBase\\Kametrix\\src\\app\\api\\health\" 2>/dev/null || echo \"Directory does not exist\"",
  "description": "Check if health directory exists"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\health\\route.ts"
}

Good, there's already a health route. Let me enhance it and create the detailed health endpoint:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\health\\route.ts",
  "old_string": "import { NextResponse } from 'next/server';\nimport { prisma } from '@/lib/prisma';\nimport { metrics, appCache, queryCache } from '@/lib/performance';\nimport { getMonitoringHealth, circuitBreakers, errorMonitor } from '@/lib/errors';\n\nexport async function GET() {\n  const timestamp = new Date().toISOString();\n  const startTime = Date.now();\n\n  try {\n    // Simple database connectivity check\n    await prisma.$queryRaw`SELECT 1`;\n\n    const dbLatency = Date.now() - startTime;\n\n    // Get basic cache stats\n    const cacheStats = {\n      app: appCache.getStats().hitRate,\n      query: queryCache.getStats().hitRate,\n    };\n\n    // Get memory usage if available\n    const memory = metrics.getMemoryUsage();\n\n    // Get error monitoring health\n    const monitoringHealth = getMonitoringHealth();\n\n    // Get circuit breaker stats\n    const circuitStats = circuitBreakers.getAllStats();\n\n    // Get error statistics\n    const errorStats = errorMonitor.getStats();\n\n    return NextResponse.json(\n      {\n        status: monitoringHealth.status,\n        database: 'connected',\n        dbLatencyMs: dbLatency,\n        cacheHitRates: cacheStats,\n        memory: memory\n          ? {\n              heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),\n              heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),\n              usagePercent: Math.round(memory.usagePercent),\n            }\n          : null,\n        monitoring: {\n          errorRate: monitoringHealth.errorRate,\n          recentErrors: monitoringHealth.recentErrors,\n          openCircuits: monitoringHealth.openCircuits,\n        },\n        circuits: Object.fromEntries(\n          Object.entries(circuitStats).map(([name, stats]) => [\n            name,\n            {\n              state: stats.state,\n              failures: stats.failures,\n              successRate: stats.totalRequests > 0\n                ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) + '%'\n                : 'N/A',\n            },\n          ])\n        ),\n        errors: {\n          topErrors: errorStats.topErrors.slice(0, 5),\n          ratePerMinute: errorStats.errorRate.perMinute,\n        },\n        timestamp,\n      },\n      {\n        status: monitoringHealth.status === 'unhealthy' ? 503 : 200,\n        headers: {\n          'Cache-Control': 'no-cache, no-store, must-revalidate',\n        },\n      }\n    );\n  } catch (error) {\n    console.error('Health check failed:', error);\n\n    return NextResponse.json(\n      {\n        status: 'error',\n        database: 'error',\n        timestamp,\n      },\n      { status: 503 }\n    );\n  }\n}",
  "new_string": "import { NextRequest, NextResponse } from 'next/server';\nimport { prisma } from '@/lib/prisma';\nimport { metrics, appCache, queryCache } from '@/lib/performance';\nimport { getMonitoringHealth, circuitBreakers, errorMonitor } from '@/lib/errors';\nimport { performHealthCheck, quickHealthCheck } from '@/lib/monitoring';\n\n/**\n * GET /api/health - Health check endpoint\n *\n * Query params:\n * - detailed=true: Include detailed service checks (requires more time)\n * - quick=true: Minimal check for load balancers\n */\nexport async function GET(request: NextRequest) {\n  const { searchParams } = new URL(request.url);\n  const isQuick = searchParams.get('quick') === 'true';\n  const isDetailed = searchParams.get('detailed') === 'true';\n\n  const timestamp = new Date().toISOString();\n\n  try {\n    // Quick check for load balancers\n    if (isQuick) {\n      const health = await quickHealthCheck();\n      return NextResponse.json(health, {\n        status: health.status === 'healthy' ? 200 : 503,\n        headers: { 'Cache-Control': 'no-store, max-age=0' },\n      });\n    }\n\n    // Detailed check with external services\n    if (isDetailed) {\n      const health = await performHealthCheck(true);\n      return NextResponse.json(health, {\n        status: health.status === 'unhealthy' ? 503 : 200,\n        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },\n      });\n    }\n\n    // Standard check (original behavior)\n    const startTime = Date.now();\n    await prisma.$queryRaw`SELECT 1`;\n    const dbLatency = Date.now() - startTime;\n\n    // Get basic cache stats\n    const cacheStats = {\n      app: appCache.getStats().hitRate,\n      query: queryCache.getStats().hitRate,\n    };\n\n    // Get memory usage if available\n    const memory = metrics.getMemoryUsage();\n\n    // Get error monitoring health\n    const monitoringHealth = getMonitoringHealth();\n\n    // Get circuit breaker stats\n    const circuitStats = circuitBreakers.getAllStats();\n\n    // Get error statistics\n    const errorStats = errorMonitor.getStats();\n\n    return NextResponse.json(\n      {\n        status: monitoringHealth.status,\n        database: 'connected',\n        dbLatencyMs: dbLatency,\n        cacheHitRates: cacheStats,\n        memory: memory\n          ? {\n              heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),\n              heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),\n              usagePercent: Math.round(memory.usagePercent),\n            }\n          : null,\n        monitoring: {\n          errorRate: monitoringHealth.errorRate,\n          recentErrors: monitoringHealth.recentErrors,\n          openCircuits: monitoringHealth.openCircuits,\n        },\n        circuits: Object.fromEntries(\n          Object.entries(circuitStats).map(([name, stats]) => [\n            name,\n            {\n              state: stats.state,\n              failures: stats.failures,\n              successRate: stats.totalRequests > 0\n                ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) + '%'\n                : 'N/A',\n            },\n          ])\n        ),\n        errors: {\n          topErrors: errorStats.topErrors.slice(0, 5),\n          ratePerMinute: errorStats.errorRate.perMinute,\n        },\n        timestamp,\n      },\n      {\n        status: monitoringHealth.status === 'unhealthy' ? 503 : 200,\n        headers: {\n          'Cache-Control': 'no-cache, no-store, must-revalidate',\n        },\n      }\n    );\n  } catch (error) {\n    console.error('Health check failed:', error);\n\n    return NextResponse.json(\n      {\n        status: 'unhealthy',\n        database: 'error',\n        error: error instanceof Error ? error.message : 'Unknown error',\n        timestamp,\n      },\n      { status: 503 }\n    );\n  }\n}"
}

Now let me create the admin monitoring API endpoints:

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\api\\admin\\monitoring\\route.ts",
  "content": "import { NextRequest, NextResponse } from 'next/server';\nimport { requireAdmin } from '@/lib/auth-guard';\nimport { performHealthCheck } from '@/lib/monitoring/health-check';\nimport { getUptimeStats, getUptimeHistory, recordHealthCheck } from '@/lib/monitoring/uptime-monitor';\nimport { getPlatformAnalytics, getRecentEvents, getTopUsersByActivity } from '@/lib/monitoring/analytics';\nimport { getActiveAlerts, getAlertHistory, acknowledgeAlert, resolveAlert } from '@/lib/monitoring/anomaly-detector';\nimport { getAggregatedMetrics, getMetricHistory } from '@/lib/monitoring/metrics-persistence';\nimport { metrics } from '@/lib/performance';\nimport { errorMonitor } from '@/lib/errors/monitoring';\n\n/**\n * GET /api/admin/monitoring - Get comprehensive monitoring data (admin only)\n */\nexport async function GET(request: NextRequest) {\n  try {\n    await requireAdmin(request);\n\n    const { searchParams } = new URL(request.url);\n    const section = searchParams.get('section') || 'overview';\n    const hoursBack = parseInt(searchParams.get('hours') || '24', 10);\n\n    switch (section) {\n      case 'overview':\n        return await getOverviewData(hoursBack);\n      case 'uptime':\n        return await getUptimeData(hoursBack);\n      case 'analytics':\n        return await getAnalyticsData(hoursBack);\n      case 'alerts':\n        return await getAlertsData();\n      case 'metrics':\n        return await getMetricsData(hoursBack, searchParams.get('metric') || undefined);\n      default:\n        return NextResponse.json({ error: 'Invalid section' }, { status: 400 });\n    }\n  } catch (error) {\n    console.error('Error fetching monitoring data:', error);\n\n    if (error instanceof Error && error.message === 'Authentication required') {\n      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n    }\n\n    if (error instanceof Error && error.message === 'Admin access required') {\n      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });\n    }\n\n    return NextResponse.json(\n      { error: 'Failed to fetch monitoring data' },\n      { status: 500 }\n    );\n  }\n}\n\nasync function getOverviewData(hoursBack: number) {\n  const [health, uptime, analytics, alerts, metricsReport] = await Promise.all([\n    performHealthCheck(true),\n    getUptimeStats(hoursBack),\n    getPlatformAnalytics(hoursBack),\n    getActiveAlerts(),\n    Promise.resolve(metrics.generateReport()),\n  ]);\n\n  const errorStats = errorMonitor.getStats();\n\n  return NextResponse.json({\n    health,\n    uptime: {\n      overall: uptime.overall,\n      period: uptime.period,\n    },\n    analytics: {\n      activeUsers: analytics.users.activeUsers,\n      newSignups: analytics.users.newSignups,\n      totalCalls: analytics.calls.total,\n      totalEvents: analytics.events.total,\n    },\n    alerts: {\n      active: alerts.length,\n      critical: alerts.filter(a => a.severity === 'CRITICAL').length,\n      high: alerts.filter(a => a.severity === 'HIGH').length,\n    },\n    performance: {\n      errorRate: errorStats.errorRate.perMinute,\n      topErrors: errorStats.topErrors.slice(0, 5),\n      memory: metricsReport.memory,\n      activeRequests: metricsReport.gauges['api.active_requests'] ?? 0,\n    },\n    timestamp: new Date().toISOString(),\n  });\n}\n\nasync function getUptimeData(hoursBack: number) {\n  const [stats, apiHistory, dbHistory] = await Promise.all([\n    getUptimeStats(hoursBack),\n    getUptimeHistory('api', hoursBack, 'hour'),\n    getUptimeHistory('database', hoursBack, 'hour'),\n  ]);\n\n  return NextResponse.json({\n    stats,\n    history: {\n      api: apiHistory,\n      database: dbHistory,\n    },\n    timestamp: new Date().toISOString(),\n  });\n}\n\nasync function getAnalyticsData(hoursBack: number) {\n  const [platformAnalytics, recentEvents, topUsers] = await Promise.all([\n    getPlatformAnalytics(hoursBack),\n    getRecentEvents(50),\n    getTopUsersByActivity(10),\n  ]);\n\n  return NextResponse.json({\n    platform: platformAnalytics,\n    recentEvents,\n    topUsers,\n    timestamp: new Date().toISOString(),\n  });\n}\n\nasync function getAlertsData() {\n  const [active, history] = await Promise.all([\n    getActiveAlerts(),\n    getAlertHistory(50),\n  ]);\n\n  return NextResponse.json({\n    active,\n    history,\n    timestamp: new Date().toISOString(),\n  });\n}\n\nasync function getMetricsData(hoursBack: number, metricName?: string) {\n  if (metricName) {\n    const history = await getMetricHistory(metricName, hoursBack);\n    return NextResponse.json({\n      metric: metricName,\n      history,\n      timestamp: new Date().toISOString(),\n    });\n  }\n\n  const [hourlyAggregates, currentMetrics] = await Promise.all([\n    getAggregatedMetrics('hourly', Math.ceil(hoursBack / 24)),\n    Promise.resolve(metrics.generateReport()),\n  ]);\n\n  return NextResponse.json({\n    current: currentMetrics,\n    aggregates: hourlyAggregates,\n    timestamp: new Date().toISOString(),\n  });\n}\n\n/**\n * POST /api/admin/monitoring - Perform monitoring actions (admin only)\n */\nexport async function POST(request: NextRequest) {\n  try {\n    await requireAdmin(request);\n\n    const body = await request.json();\n    const { action, alertId, resolvedBy } = body;\n\n    switch (action) {\n      case 'record-health-check':\n        await recordHealthCheck();\n        return NextResponse.json({ message: 'Health check recorded' });\n\n      case 'acknowledge-alert':\n        if (!alertId) {\n          return NextResponse.json({ error: 'alertId required' }, { status: 400 });\n        }\n        await acknowledgeAlert(alertId);\n        return NextResponse.json({ message: 'Alert acknowledged' });\n\n      case 'resolve-alert':\n        if (!alertId) {\n          return NextResponse.json({ error: 'alertId required' }, { status: 400 });\n        }\n        await resolveAlert(alertId, resolvedBy);\n        return NextResponse.json({ message: 'Alert resolved' });\n\n      default:\n        return NextResponse.json(\n          { error: 'Invalid action. Use: record-health-check, acknowledge-alert, resolve-alert' },\n          { status: 400 }\n        );\n    }\n  } catch (error) {\n    console.error('Error performing monitoring action:', error);\n\n    if (error instanceof Error && error.message === 'Authentication required') {\n      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n    }\n\n    if (error instanceof Error && error.message === 'Admin access required') {\n      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });\n    }\n\n    return NextResponse.json(\n      { error: 'Failed to perform action' },\n      { status: 500 }\n    );\n  }\n}\n"
}

Now let me create the monitoring dashboard UI:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\(dashboard)\\admin\\layout.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\admin\\admin-nav-tabs.tsx"
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\admin\\admin-nav-tabs.tsx",
  "old_string": "import { Users, Bot, Phone, Settings, type LucideIcon } from 'lucide-react';",
  "new_string": "import { Users, Bot, Phone, Settings, Activity, type LucideIcon } from 'lucide-react';"
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\admin\\admin-nav-tabs.tsx",
  "old_string": "const tabs: Tab[] = [\n  { name: 'Users', href: '/admin', icon: Users },\n  { name: 'Agents', href: '/admin/agents', icon: Bot },\n  { name: 'Phone Numbers', href: '/admin/phone-numbers', icon: Phone },\n  { name: 'Settings', href: '/admin/settings', icon: Settings },\n];",
  "new_string": "const tabs: Tab[] = [\n  { name: 'Users', href: '/admin', icon: Users },\n  { name: 'Agents', href: '/admin/agents', icon: Bot },\n  { name: 'Phone Numbers', href: '/admin/phone-numbers', icon: Phone },\n  { name: 'Monitoring', href: '/admin/monitoring', icon: Activity },\n  { name: 'Settings', href: '/admin/settings', icon: Settings },\n];"
}

Now let me create the monitoring dashboard page and components:

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\app\\(dashboard)\\admin\\monitoring\\page.tsx",
  "content": "import { Suspense } from 'react';\nimport { MonitoringDashboard } from '@/components/admin/monitoring-dashboard';\nimport { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';\n\nexport const dynamic = 'force-dynamic';\n\nexport default function MonitoringPage() {\n  return (\n    <div>\n      <div className=\"flex items-center justify-between mb-6\">\n        <h1 className=\"text-2xl font-bold text-foreground\">System Monitoring</h1>\n      </div>\n\n      <Suspense\n        fallback={\n          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8\">\n            {[...Array(4)].map((_, i) => (\n              <Card key={i} className=\"glass-card animate-pulse\">\n                <CardHeader>\n                  <CardTitle className=\"text-lg h-5 bg-muted rounded\" />\n                </CardHeader>\n                <CardContent>\n                  <div className=\"h-8 bg-muted rounded mb-2\" />\n                  <div className=\"h-4 bg-muted rounded w-3/4\" />\n                </CardContent>\n              </Card>\n            ))}\n          </div>\n        }\n      >\n        <MonitoringDashboard />\n      </Suspense>\n    </div>\n  );\n}\n"
}

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\components\\admin\\monitoring-dashboard.tsx",
  "content": "'use client';\n\nimport { useEffect, useState, useCallback } from 'react';\nimport { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';\nimport { Badge } from '@/components/ui/badge';\nimport { Button } from '@/components/ui/button';\nimport {\n  Activity,\n  AlertTriangle,\n  CheckCircle,\n  XCircle,\n  Clock,\n  Users,\n  Server,\n  Database,\n  Cpu,\n  HardDrive,\n  RefreshCw,\n  Bell,\n  TrendingUp,\n  Zap,\n} from 'lucide-react';\n\ninterface MonitoringData {\n  health: {\n    status: 'healthy' | 'degraded' | 'unhealthy';\n    uptime: number;\n    services: Array<{\n      name: string;\n      status: 'healthy' | 'degraded' | 'unhealthy';\n      responseTimeMs?: number;\n      message?: string;\n    }>;\n    memory: {\n      heapUsed: number;\n      heapTotal: number;\n      usagePercent: number;\n    } | null;\n  };\n  uptime: {\n    overall: {\n      uptimePercent: number;\n      status: string;\n    };\n    period: {\n      start: string;\n      end: string;\n    };\n  };\n  analytics: {\n    activeUsers: number;\n    newSignups: number;\n    totalCalls: number;\n    totalEvents: number;\n  };\n  alerts: {\n    active: number;\n    critical: number;\n    high: number;\n  };\n  performance: {\n    errorRate: number;\n    topErrors: Array<{ code: string; count: number }>;\n    memory: {\n      heapUsed: number;\n      heapTotal: number;\n      usagePercent: number;\n    } | null;\n    activeRequests: number;\n  };\n  timestamp: string;\n}\n\ninterface AlertData {\n  active: Array<{\n    id: string;\n    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';\n    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';\n    title: string;\n    message: string;\n    source: string;\n    triggeredAt: string;\n  }>;\n  history: Array<{\n    id: string;\n    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';\n    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';\n    title: string;\n    message: string;\n    triggeredAt: string;\n    resolvedAt?: string;\n  }>;\n}\n\nconst statusColors = {\n  healthy: 'bg-green-500',\n  degraded: 'bg-yellow-500',\n  unhealthy: 'bg-red-500',\n  HEALTHY: 'bg-green-500',\n  DEGRADED: 'bg-yellow-500',\n  UNHEALTHY: 'bg-red-500',\n};\n\nconst statusIcons = {\n  healthy: CheckCircle,\n  degraded: AlertTriangle,\n  unhealthy: XCircle,\n};\n\nconst severityColors = {\n  LOW: 'secondary',\n  MEDIUM: 'outline',\n  HIGH: 'default',\n  CRITICAL: 'destructive',\n} as const;\n\nexport function MonitoringDashboard() {\n  const [data, setData] = useState<MonitoringData | null>(null);\n  const [alerts, setAlerts] = useState<AlertData | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [refreshing, setRefreshing] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n\n  const fetchData = useCallback(async (isRefresh = false) => {\n    try {\n      if (isRefresh) setRefreshing(true);\n      else setLoading(true);\n\n      const [overviewRes, alertsRes] = await Promise.all([\n        fetch('/api/admin/monitoring?section=overview'),\n        fetch('/api/admin/monitoring?section=alerts'),\n      ]);\n\n      if (!overviewRes.ok || !alertsRes.ok) {\n        throw new Error('Failed to fetch monitoring data');\n      }\n\n      const [overviewData, alertsData] = await Promise.all([\n        overviewRes.json(),\n        alertsRes.json(),\n      ]);\n\n      setData(overviewData);\n      setAlerts(alertsData);\n      setError(null);\n    } catch (err) {\n      setError(err instanceof Error ? err.message : 'Failed to load data');\n    } finally {\n      setLoading(false);\n      setRefreshing(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    fetchData();\n\n    // Auto-refresh every 30 seconds\n    const interval = setInterval(() => fetchData(true), 30000);\n    return () => clearInterval(interval);\n  }, [fetchData]);\n\n  const handleAcknowledgeAlert = async (alertId: string) => {\n    try {\n      await fetch('/api/admin/monitoring', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ action: 'acknowledge-alert', alertId }),\n      });\n      fetchData(true);\n    } catch (err) {\n      console.error('Failed to acknowledge alert:', err);\n    }\n  };\n\n  const handleResolveAlert = async (alertId: string) => {\n    try {\n      await fetch('/api/admin/monitoring', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ action: 'resolve-alert', alertId }),\n      });\n      fetchData(true);\n    } catch (err) {\n      console.error('Failed to resolve alert:', err);\n    }\n  };\n\n  if (loading) {\n    return (\n      <div className=\"flex items-center justify-center py-12\">\n        <RefreshCw className=\"w-8 h-8 animate-spin text-muted-foreground\" />\n      </div>\n    );\n  }\n\n  if (error) {\n    return (\n      <Card className=\"glass-card border-destructive\">\n        <CardContent className=\"py-12 text-center\">\n          <XCircle className=\"w-12 h-12 mx-auto text-destructive mb-4\" />\n          <p className=\"text-destructive font-medium\">{error}</p>\n          <Button onClick={() => fetchData()} className=\"mt-4\">\n            Retry\n          </Button>\n        </CardContent>\n      </Card>\n    );\n  }\n\n  if (!data) return null;\n\n  const StatusIcon = statusIcons[data.health.status] || AlertTriangle;\n  const formatUptime = (seconds: number) => {\n    const days = Math.floor(seconds / 86400);\n    const hours = Math.floor((seconds % 86400) / 3600);\n    const minutes = Math.floor((seconds % 3600) / 60);\n    if (days > 0) return `${days}d ${hours}h`;\n    if (hours > 0) return `${hours}h ${minutes}m`;\n    return `${minutes}m`;\n  };\n\n  const formatBytes = (bytes: number) => {\n    const mb = bytes / (1024 * 1024);\n    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;\n    return `${mb.toFixed(0)} MB`;\n  };\n\n  return (\n    <div className=\"space-y-6\">\n      {/* Header with Refresh */}\n      <div className=\"flex items-center justify-between\">\n        <div className=\"flex items-center gap-3\">\n          <div\n            className={`w-3 h-3 rounded-full ${statusColors[data.health.status]} animate-pulse`}\n          />\n          <span className=\"text-sm text-muted-foreground\">\n            Last updated: {new Date(data.timestamp).toLocaleTimeString()}\n          </span>\n        </div>\n        <Button\n          variant=\"outline\"\n          size=\"sm\"\n          onClick={() => fetchData(true)}\n          disabled={refreshing}\n        >\n          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />\n          Refresh\n        </Button>\n      </div>\n\n      {/* Status Cards */}\n      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">\n        {/* System Status */}\n        <Card className=\"glass-card\">\n          <CardContent className=\"pt-6\">\n            <div className=\"flex items-start justify-between\">\n              <div>\n                <p className=\"text-sm text-muted-foreground\">System Status</p>\n                <p className=\"text-2xl font-bold capitalize mt-1\">{data.health.status}</p>\n                <p className=\"text-sm text-muted-foreground mt-1\">\n                  Uptime: {formatUptime(data.health.uptime)}\n                </p>\n              </div>\n              <div\n                className={`p-3 rounded-xl ${\n                  data.health.status === 'healthy'\n                    ? 'bg-green-500/20 text-green-500'\n                    : data.health.status === 'degraded'\n                    ? 'bg-yellow-500/20 text-yellow-500'\n                    : 'bg-red-500/20 text-red-500'\n                }`}\n              >\n                <StatusIcon className=\"w-5 h-5\" />\n              </div>\n            </div>\n          </CardContent>\n        </Card>\n\n        {/* Active Alerts */}\n        <Card className={`glass-card ${data.alerts.critical > 0 ? 'border-red-500/50' : ''}`}>\n          <CardContent className=\"pt-6\">\n            <div className=\"flex items-start justify-between\">\n              <div>\n                <p className=\"text-sm text-muted-foreground\">Active Alerts</p>\n                <p className=\"text-2xl font-bold mt-1\">{data.alerts.active}</p>\n                <div className=\"flex gap-2 mt-1\">\n                  {data.alerts.critical > 0 && (\n                    <Badge variant=\"destructive\" className=\"text-xs\">\n                      {data.alerts.critical} Critical\n                    </Badge>\n                  )}\n                  {data.alerts.high > 0 && (\n                    <Badge variant=\"default\" className=\"text-xs\">\n                      {data.alerts.high} High\n                    </Badge>\n                  )}\n                </div>\n              </div>\n              <div className=\"p-3 rounded-xl bg-amber-500/20 text-amber-500\">\n                <Bell className=\"w-5 h-5\" />\n              </div>\n            </div>\n          </CardContent>\n        </Card>\n\n        {/* Error Rate */}\n        <Card className=\"glass-card\">\n          <CardContent className=\"pt-6\">\n            <div className=\"flex items-start justify-between\">\n              <div>\n                <p className=\"text-sm text-muted-foreground\">Error Rate</p>\n                <p className=\"text-2xl font-bold mt-1\">{data.performance.errorRate}/min</p>\n                <p className=\"text-sm text-muted-foreground mt-1\">\n                  {data.performance.activeRequests} active requests\n                </p>\n              </div>\n              <div className=\"p-3 rounded-xl bg-primary/20 text-primary\">\n                <Zap className=\"w-5 h-5\" />\n              </div>\n            </div>\n          </CardContent>\n        </Card>\n\n        {/* Uptime */}\n        <Card className=\"glass-card\">\n          <CardContent className=\"pt-6\">\n            <div className=\"flex items-start justify-between\">\n              <div>\n                <p className=\"text-sm text-muted-foreground\">Uptime (24h)</p>\n                <p className=\"text-2xl font-bold mt-1\">{data.uptime.overall.uptimePercent}%</p>\n                <p className=\"text-sm text-muted-foreground mt-1\">\n                  Status: {data.uptime.overall.status}\n                </p>\n              </div>\n              <div className=\"p-3 rounded-xl bg-green-500/20 text-green-500\">\n                <TrendingUp className=\"w-5 h-5\" />\n              </div>\n            </div>\n          </CardContent>\n        </Card>\n      </div>\n\n      {/* Service Status & Memory */}\n      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n        {/* Services */}\n        <Card className=\"glass-card\">\n          <CardHeader>\n            <CardTitle className=\"text-lg flex items-center gap-2\">\n              <Server className=\"w-5 h-5\" />\n              Service Status\n            </CardTitle>\n            <CardDescription>Health of connected services</CardDescription>\n          </CardHeader>\n          <CardContent>\n            <div className=\"space-y-3\">\n              {data.health.services.map((service) => (\n                <div\n                  key={service.name}\n                  className=\"flex items-center justify-between p-3 rounded-lg bg-muted/30\"\n                >\n                  <div className=\"flex items-center gap-3\">\n                    <div\n                      className={`w-2 h-2 rounded-full ${statusColors[service.status]}`}\n                    />\n                    <span className=\"font-medium capitalize\">{service.name}</span>\n                  </div>\n                  <div className=\"flex items-center gap-2\">\n                    {service.responseTimeMs && (\n                      <span className=\"text-sm text-muted-foreground\">\n                        {service.responseTimeMs}ms\n                      </span>\n                    )}\n                    <Badge\n                      variant={\n                        service.status === 'healthy'\n                          ? 'secondary'\n                          : service.status === 'degraded'\n                          ? 'outline'\n                          : 'destructive'\n                      }\n                    >\n                      {service.status}\n                    </Badge>\n                  </div>\n                </div>\n              ))}\n            </div>\n          </CardContent>\n        </Card>\n\n        {/* Memory & Resources */}\n        <Card className=\"glass-card\">\n          <CardHeader>\n            <CardTitle className=\"text-lg flex items-center gap-2\">\n              <Cpu className=\"w-5 h-5\" />\n              System Resources\n            </CardTitle>\n            <CardDescription>Memory and resource usage</CardDescription>\n          </CardHeader>\n          <CardContent>\n            {data.performance.memory ? (\n              <div className=\"space-y-4\">\n                <div>\n                  <div className=\"flex justify-between mb-2\">\n                    <span className=\"text-sm text-muted-foreground\">Heap Memory</span>\n                    <span className=\"text-sm font-medium\">\n                      {formatBytes(data.performance.memory.heapUsed)} /{' '}\n                      {formatBytes(data.performance.memory.heapTotal)}\n                    </span>\n                  </div>\n                  <div className=\"h-2 bg-muted rounded-full overflow-hidden\">\n                    <div\n                      className={`h-full rounded-full transition-all ${\n                        data.performance.memory.usagePercent > 90\n                          ? 'bg-red-500'\n                          : data.performance.memory.usagePercent > 70\n                          ? 'bg-yellow-500'\n                          : 'bg-green-500'\n                      }`}\n                      style={{ width: `${data.performance.memory.usagePercent}%` }}\n                    />\n                  </div>\n                  <p className=\"text-xs text-muted-foreground mt-1\">\n                    {Math.round(data.performance.memory.usagePercent)}% used\n                  </p>\n                </div>\n\n                <div className=\"grid grid-cols-2 gap-4 pt-4 border-t border-border\">\n                  <div className=\"flex items-center gap-2\">\n                    <HardDrive className=\"w-4 h-4 text-muted-foreground\" />\n                    <div>\n                      <p className=\"text-sm font-medium\">\n                        {formatBytes(data.performance.memory.heapUsed)}\n                      </p>\n                      <p className=\"text-xs text-muted-foreground\">Heap Used</p>\n                    </div>\n                  </div>\n                  <div className=\"flex items-center gap-2\">\n                    <Database className=\"w-4 h-4 text-muted-foreground\" />\n                    <div>\n                      <p className=\"text-sm font-medium\">\n                        {formatBytes(data.performance.memory.heapTotal)}\n                      </p>\n                      <p className=\"text-xs text-muted-foreground\">Heap Total</p>\n                    </div>\n                  </div>\n                </div>\n              </div>\n            ) : (\n              <p className=\"text-muted-foreground\">Memory data unavailable</p>\n            )}\n          </CardContent>\n        </Card>\n      </div>\n\n      {/* Analytics Summary */}\n      <Card className=\"glass-card\">\n        <CardHeader>\n          <CardTitle className=\"text-lg flex items-center gap-2\">\n            <Activity className=\"w-5 h-5\" />\n            Platform Analytics (24h)\n          </CardTitle>\n        </CardHeader>\n        <CardContent>\n          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-6\">\n            <div className=\"text-center\">\n              <p className=\"text-3xl font-bold\">{data.analytics.activeUsers}</p>\n              <p className=\"text-sm text-muted-foreground flex items-center justify-center gap-1\">\n                <Users className=\"w-4 h-4\" />\n                Active Users\n              </p>\n            </div>\n            <div className=\"text-center\">\n              <p className=\"text-3xl font-bold\">{data.analytics.newSignups}</p>\n              <p className=\"text-sm text-muted-foreground\">New Signups</p>\n            </div>\n            <div className=\"text-center\">\n              <p className=\"text-3xl font-bold\">{data.analytics.totalCalls}</p>\n              <p className=\"text-sm text-muted-foreground\">Calls Made</p>\n            </div>\n            <div className=\"text-center\">\n              <p className=\"text-3xl font-bold\">{data.analytics.totalEvents}</p>\n              <p className=\"text-sm text-muted-foreground\">Events Tracked</p>\n            </div>\n          </div>\n        </CardContent>\n      </Card>\n\n      {/* Active Alerts */}\n      {alerts && alerts.active.length > 0 && (\n        <Card className=\"glass-card border-amber-500/30\">\n          <CardHeader>\n            <CardTitle className=\"text-lg flex items-center gap-2\">\n              <AlertTriangle className=\"w-5 h-5 text-amber-500\" />\n              Active Alerts\n            </CardTitle>\n          </CardHeader>\n          <CardContent>\n            <div className=\"space-y-3\">\n              {alerts.active.map((alert) => (\n                <div\n                  key={alert.id}\n                  className=\"flex items-start justify-between p-4 rounded-lg bg-muted/30 border border-border\"\n                >\n                  <div className=\"flex-1\">\n                    <div className=\"flex items-center gap-2 mb-1\">\n                      <Badge variant={severityColors[alert.severity]}>\n                        {alert.severity}\n                      </Badge>\n                      <span className=\"text-sm text-muted-foreground\">\n                        {alert.source}\n                      </span>\n                    </div>\n                    <h4 className=\"font-medium\">{alert.title}</h4>\n                    <p className=\"text-sm text-muted-foreground mt-1\">{alert.message}</p>\n                    <p className=\"text-xs text-muted-foreground mt-2 flex items-center gap-1\">\n                      <Clock className=\"w-3 h-3\" />\n                      {new Date(alert.triggeredAt).toLocaleString()}\n                    </p>\n                  </div>\n                  <div className=\"flex gap-2 ml-4\">\n                    {alert.status === 'ACTIVE' && (\n                      <Button\n                        variant=\"outline\"\n                        size=\"sm\"\n                        onClick={() => handleAcknowledgeAlert(alert.id)}\n                      >\n                        Acknowledge\n                      </Button>\n                    )}\n                    <Button\n                      variant=\"default\"\n                      size=\"sm\"\n                      onClick={() => handleResolveAlert(alert.id)}\n                    >\n                      Resolve\n                    </Button>\n                  </div>\n                </div>\n              ))}\n            </div>\n          </CardContent>\n        </Card>\n      )}\n\n      {/* Top Errors */}\n      {data.performance.topErrors.length > 0 && (\n        <Card className=\"glass-card\">\n          <CardHeader>\n            <CardTitle className=\"text-lg flex items-center gap-2\">\n              <XCircle className=\"w-5 h-5 text-destructive\" />\n              Top Errors\n            </CardTitle>\n            <CardDescription>Most frequent errors in the last 5 minutes</CardDescription>\n          </CardHeader>\n          <CardContent>\n            <div className=\"space-y-2\">\n              {data.performance.topErrors.map((error, index) => (\n                <div\n                  key={error.code}\n                  className=\"flex items-center justify-between p-3 rounded-lg bg-muted/30\"\n                >\n                  <div className=\"flex items-center gap-3\">\n                    <span className=\"text-sm font-mono text-muted-foreground\">\n                      #{index + 1}\n                    </span>\n                    <span className=\"font-medium\">{error.code}</span>\n                  </div>\n                  <Badge variant=\"outline\">{error.count} occurrences</Badge>\n                </div>\n              ))}\n            </div>\n          </CardContent>\n        </Card>\n      )}\n    </div>\n  );\n}\n"
}

Now let's update the todo and run the build to check for any TypeScript errors:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add database models for persistent metrics and analytics",
      "status": "completed",
      "activeForm": "Adding database models for persistent metrics and analytics"
    },
    {
      "content": "Create health check API endpoints",
      "status": "completed",
      "activeForm": "Creating health check API endpoints"
    },
    {
      "content": "Implement uptime monitoring service",
      "status": "completed",
      "activeForm": "Implementing uptime monitoring service"
    },
    {
      "content": "Create user analytics tracking",
      "status": "completed",
      "activeForm": "Creating user analytics tracking"
    },
    {
      "content": "Implement anomaly detection and alerting",
      "status": "completed",
      "activeForm": "Implementing anomaly detection and alerting"
    },
    {
      "content": "Build monitoring dashboard UI",
      "status": "completed",
      "activeForm": "Building monitoring dashboard UI"
    },
    {
      "content": "Verify with Playwright tests",
      "status": "in_progress",
      "activeForm": "Verifying with Playwright tests"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && npx tsc --noEmit 2>&1 | head -100",
  "description": "Check TypeScript errors",
  "timeout": 120000
}

I need to fix the TypeScript errors with JSON handling in Prisma:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\analytics.ts",
  "offset": 35,
  "limit": 20
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\analytics.ts",
  "old_string": "export async function trackEvent(options: TrackEventOptions): Promise<void> {\n  try {\n    await prisma.eventLog.create({\n      data: {\n        userId: options.userId ?? null,\n        eventType: options.eventType,\n        eventData: options.eventData ?? null,\n        ipAddress: options.ipAddress ?? null,\n        userAgent: options.userAgent ?? null,\n      },\n    });",
  "new_string": "export async function trackEvent(options: TrackEventOptions): Promise<void> {\n  try {\n    await prisma.eventLog.create({\n      data: {\n        userId: options.userId ?? null,\n        eventType: options.eventType,\n        eventData: options.eventData ? JSON.parse(JSON.stringify(options.eventData)) : undefined,\n        ipAddress: options.ipAddress ?? null,\n        userAgent: options.userAgent ?? null,\n      },\n    });"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\anomaly-detector.ts",
  "offset": 195,
  "limit": 35
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\anomaly-detector.ts",
  "old_string": "    if (existingAlert) {\n      // Update existing alert if severity changed\n      if (existingAlert.severity !== anomaly.severity) {\n        await prisma.monitoringAlert.update({\n          where: { id: existingAlert.id },\n          data: {\n            severity: anomaly.severity,\n            message: anomaly.message,\n            metadata: anomaly.metadata,\n          },\n        });\n      }\n      return;\n    }\n\n    // Create new alert\n    await prisma.monitoringAlert.create({\n      data: {\n        severity: anomaly.severity,\n        title: anomaly.title,\n        message: anomaly.message,\n        source: anomaly.source,\n        metadata: anomaly.metadata,\n      },\n    });",
  "new_string": "    if (existingAlert) {\n      // Update existing alert if severity changed\n      if (existingAlert.severity !== anomaly.severity) {\n        await prisma.monitoringAlert.update({\n          where: { id: existingAlert.id },\n          data: {\n            severity: anomaly.severity,\n            message: anomaly.message,\n            metadata: JSON.parse(JSON.stringify(anomaly.metadata)),\n          },\n        });\n      }\n      return;\n    }\n\n    // Create new alert\n    await prisma.monitoringAlert.create({\n      data: {\n        severity: anomaly.severity,\n        title: anomaly.title,\n        message: anomaly.message,\n        source: anomaly.source,\n        metadata: JSON.parse(JSON.stringify(anomaly.metadata)),\n      },\n    });"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\metrics-persistence.ts",
  "offset": 20,
  "limit": 70
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\src\\lib\\monitoring\\metrics-persistence.ts",
  "old_string": "    const report = metrics.generateReport();\n    const records: Array<{\n      name: string;\n      type: MetricType;\n      value: number;\n      tags: Record<string, unknown> | null;\n    }> = [];\n\n    // Persist timing metrics\n    for (const metric of report.metrics) {\n      records.push({\n        name: metric.name,\n        type: 'TIMING',\n        value: metric.avgMs,\n        tags: {\n          count: metric.count,\n          minMs: metric.minMs,\n          maxMs: metric.maxMs,\n          errorRate: metric.errorRate,\n        },\n      });\n    }\n\n    // Persist gauges\n    for (const [name, value] of Object.entries(report.gauges)) {\n      records.push({\n        name,\n        type: 'GAUGE',\n        value,\n        tags: null,\n      });\n    }\n\n    // Persist memory metrics\n    if (report.memory) {\n      records.push({\n        name: 'memory.heap_used',\n        type: 'GAUGE',\n        value: report.memory.heapUsed,\n        tags: null,\n      });\n      records.push({\n        name: 'memory.heap_total',\n        type: 'GAUGE',\n        value: report.memory.heapTotal,\n        tags: null,\n      });\n      records.push({\n        name: 'memory.rss',\n        type: 'GAUGE',\n        value: report.memory.rss,\n        tags: null,\n      });\n      records.push({\n        name: 'memory.usage_percent',\n        type: 'GAUGE',\n        value: report.memory.usagePercent,\n        tags: null,\n      });\n    }\n\n    if (records.length > 0) {\n      await prisma.systemMetric.createMany({\n        data: records,\n      });\n      logger.debug('Metrics persisted', { count: records.length });\n    }",
  "new_string": "    const report = metrics.generateReport();\n    const records: Array<{\n      name: string;\n      type: MetricType;\n      value: number;\n      tags?: object;\n    }> = [];\n\n    // Persist timing metrics\n    for (const metric of report.metrics) {\n      records.push({\n        name: metric.name,\n        type: 'TIMING',\n        value: metric.avgMs,\n        tags: {\n          count: metric.count,\n          minMs: metric.minMs,\n          maxMs: metric.maxMs,\n          errorRate: metric.errorRate,\n        },\n      });\n    }\n\n    // Persist gauges\n    for (const [name, value] of Object.entries(report.gauges)) {\n      records.push({\n        name,\n        type: 'GAUGE',\n        value,\n      });\n    }\n\n    // Persist memory metrics\n    if (report.memory) {\n      records.push({\n        name: 'memory.heap_used',\n        type: 'GAUGE',\n        value: report.memory.heapUsed,\n      });\n      records.push({\n        name: 'memory.heap_total',\n        type: 'GAUGE',\n        value: report.memory.heapTotal,\n      });\n      records.push({\n        name: 'memory.rss',\n        type: 'GAUGE',\n        value: report.memory.rss,\n      });\n      records.push({\n        name: 'memory.usage_percent',\n        type: 'GAUGE',\n        value: report.memory.usagePercent,\n      });\n    }\n\n    if (records.length > 0) {\n      await prisma.systemMetric.createMany({\n        data: records,\n      });\n      logger.debug('Metrics persisted', { count: records.length });\n    }"
}

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && npx tsc --noEmit 2>&1 | head -50",
  "description": "Check TypeScript errors again",
  "timeout": 120000
}

TypeScript errors are fixed. Now let me run a quick build check and then create the Playwright verification test:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && npm run build 2>&1 | tail -50",
  "description": "Run build to check for errors",
  "timeout": 180000
}

The build passed successfully. Now let me create the Playwright verification test:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\playwright.config.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\tests\\e2e\\monitoring-verification.spec.ts",
  "content": "/**\n * Temporary verification test for Production Monitoring Feature\n *\n * This test verifies the core monitoring functionality:\n * - Health check endpoint responds correctly\n * - Detailed health check includes service information\n * - Quick health check returns minimal data\n * - Monitoring API returns expected data structure\n *\n * DELETE THIS FILE AFTER VERIFICATION\n */\n\nimport { test, expect } from '@playwright/test';\n\ntest.describe('Production Monitoring Feature Verification', () => {\n  test('basic health check endpoint returns status', async ({ request }) => {\n    const response = await request.get('/api/health');\n\n    expect(response.ok()).toBeTruthy();\n\n    const data = await response.json();\n    expect(data).toHaveProperty('status');\n    expect(data).toHaveProperty('timestamp');\n    expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);\n  });\n\n  test('quick health check returns minimal data', async ({ request }) => {\n    const response = await request.get('/api/health?quick=true');\n\n    expect(response.status()).toBe(200);\n\n    const data = await response.json();\n    expect(data).toHaveProperty('status');\n    expect(data).toHaveProperty('timestamp');\n    // Quick check should be minimal\n    expect(Object.keys(data).length).toBeLessThanOrEqual(3);\n  });\n\n  test('detailed health check includes services', async ({ request }) => {\n    const response = await request.get('/api/health?detailed=true');\n\n    // Should return 200 or 503 depending on service health\n    expect([200, 503]).toContain(response.status());\n\n    const data = await response.json();\n    expect(data).toHaveProperty('status');\n    expect(data).toHaveProperty('services');\n    expect(data).toHaveProperty('memory');\n    expect(data).toHaveProperty('uptime');\n    expect(Array.isArray(data.services)).toBeTruthy();\n\n    // Should have at least database service\n    const serviceNames = data.services.map((s: { name: string }) => s.name);\n    expect(serviceNames).toContain('database');\n  });\n\n  test('standard health check includes monitoring info', async ({ request }) => {\n    const response = await request.get('/api/health');\n\n    expect(response.ok()).toBeTruthy();\n\n    const data = await response.json();\n    expect(data).toHaveProperty('database');\n    expect(data).toHaveProperty('monitoring');\n    expect(data.monitoring).toHaveProperty('errorRate');\n  });\n\n  test('health check handles database status', async ({ request }) => {\n    const response = await request.get('/api/health');\n\n    const data = await response.json();\n\n    // Database should report some status\n    if (data.database === 'connected') {\n      expect(data).toHaveProperty('dbLatencyMs');\n      expect(typeof data.dbLatencyMs).toBe('number');\n    }\n  });\n\n  test('health check returns proper cache-control headers', async ({ request }) => {\n    const response = await request.get('/api/health');\n\n    const cacheControl = response.headers()['cache-control'];\n    expect(cacheControl).toBeDefined();\n    expect(cacheControl).toContain('no-');\n  });\n\n  test('health endpoint responds within acceptable time', async ({ request }) => {\n    const startTime = Date.now();\n    const response = await request.get('/api/health?quick=true');\n    const duration = Date.now() - startTime;\n\n    expect(response.ok()).toBeTruthy();\n    // Quick health check should respond within 2 seconds\n    expect(duration).toBeLessThan(2000);\n  });\n\n  test('monitoring API requires authentication', async ({ request }) => {\n    const response = await request.get('/api/admin/monitoring');\n\n    // Should return 401 Unauthorized without auth\n    expect(response.status()).toBe(401);\n  });\n\n  test('health check memory info when available', async ({ request }) => {\n    const response = await request.get('/api/health');\n    const data = await response.json();\n\n    if (data.memory) {\n      expect(data.memory).toHaveProperty('heapUsedMB');\n      expect(data.memory).toHaveProperty('heapTotalMB');\n      expect(data.memory).toHaveProperty('usagePercent');\n      expect(typeof data.memory.usagePercent).toBe('number');\n      expect(data.memory.usagePercent).toBeGreaterThanOrEqual(0);\n      expect(data.memory.usagePercent).toBeLessThanOrEqual(100);\n    }\n  });\n\n  test('detailed health check includes all external services', async ({ request }) => {\n    const response = await request.get('/api/health?detailed=true');\n    const data = await response.json();\n\n    expect(data.services).toBeDefined();\n\n    // Each service should have required properties\n    for (const service of data.services) {\n      expect(service).toHaveProperty('name');\n      expect(service).toHaveProperty('status');\n      expect(service).toHaveProperty('lastChecked');\n      expect(['healthy', 'degraded', 'unhealthy']).toContain(service.status);\n    }\n  });\n});\n"
}

Now let's run the Playwright tests to verify the implementation:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && npx playwright test monitoring-verification.spec.ts --reporter=list 2>&1",
  "description": "Run Playwright verification tests",
  "timeout": 180000
}

The tests are failing because the database isn't set up with the new schema. The Playwright tests are running against a dev server that doesn't have the monitoring tables migrated yet. Let me check what's happening and create a simpler test that focuses on what's available:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && curl -s http://localhost:3000/api/health 2>&1 | head -20",
  "description": "Test health endpoint directly"
}

The server is returning an error because the database migration hasn't been applied. Let me run the migration:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && npx prisma migrate dev --name add_monitoring_models 2>&1",
  "description": "Create and apply database migration",
  "timeout": 120000
}

The migration can't run without the database URL. Let me update the test to be more resilient and handle cases where the full monitoring infrastructure isn't available:

---

## Follow-up Session

Looking at the previous work, I need to use the Docker database for the Playwright tests. Let me check the Docker setup and run the database migration before running the tests.

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && docker-compose ps 2>&1",
  "description": "Check Docker containers status"
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\docker-compose.yml"
}

Good, the Docker database is running. Let me check the `.env` file to ensure the database URL is correctly configured and then run the migration:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && cat .env 2>&1 | grep -E \"DATABASE|POSTGRES\" | head -5",
  "description": "Check database URL in .env"
}

The database URL is configured. Now let me run the Prisma migration to add the monitoring models:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && npx prisma migrate dev --name add_monitoring_models 2>&1",
  "description": "Run Prisma migration for monitoring models",
  "timeout": 120000
}

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma.config.ts"
}

The issue is that the environment variable isn't being loaded. Let me try loading it explicitly:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && set DATABASE_URL=postgresql://kametrix:kametrix123@localhost:5432/kametrix && npx prisma migrate dev --name add_monitoring_models 2>&1",
  "description": "Run Prisma migration with explicit DATABASE_URL",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && npx dotenv -e .env -- npx prisma migrate dev --name add_monitoring_models 2>&1",
  "description": "Run Prisma migration with dotenv",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && $env:DATABASE_URL='postgresql://kametrix:kametrix123@localhost:5432/kametrix'; npx prisma migrate dev --name add_monitoring_models 2>&1",
  "description": "Run Prisma migration with PowerShell env var",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && DATABASE_URL='postgresql://kametrix:kametrix123@localhost:5432/kametrix' npx prisma migrate dev --name add_monitoring_models 2>&1",
  "description": "Run Prisma migration with inline env var",
  "timeout": 120000
}

The migration is now correctly trying to use the database but can't reach it. Let me check if the Docker port is properly exposed:

🔧 Tool: Bash
Input: {
  "command": "docker ps -a | grep kametrix 2>&1",
  "description": "Check Docker container ports"
}

The port 5432 is exposed inside Docker but not mapped to the host. Looking at the docker-compose.yml, the port mapping `"5432:5432"` should expose it. Let me check the actual network:

🔧 Tool: Bash
Input: {
  "command": "docker inspect kametrix-db --format='{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{$conf}}{{println}}{{end}}' 2>&1",
  "description": "Inspect Docker container port bindings"
}

The port is not properly bound to the host. Let me restart the docker-compose to ensure proper port mapping:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && docker-compose down && docker-compose up -d 2>&1",
  "description": "Restart Docker containers",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && docker-compose up -d 2>&1",
  "description": "Start Docker containers",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "docker port kametrix-db 5432 2>&1",
  "description": "Check port mapping"
}

Now the port is properly mapped. Let me run the migration:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && DATABASE_URL='postgresql://kametrix:kametrix123@localhost:5432/kametrix' npx prisma migrate dev --name add_monitoring_models 2>&1",
  "description": "Run Prisma migration",
  "timeout": 120000
}

There's a drift between the database and migrations. Since this is development, let me try `prisma db push` instead which will sync the schema without migrations:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && DATABASE_URL='postgresql://kametrix:kametrix123@localhost:5432/kametrix' npx prisma db push 2>&1",
  "description": "Push Prisma schema to database",
  "timeout": 120000
}

I see - the current Prisma schema is missing some columns that were previously added. Let me check the full schema and ensure we have all the necessary fields, then add the monitoring tables without removing existing columns:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma"
}

I see the issue - the schema is missing some columns that were added in previous migrations. Let me add those back to the schema so we don't lose data:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma",
  "old_string": "model User {\n  id                  String              @id @default(cuid())\n  email               String              @unique @db.VarChar(255)\n  passwordHash        String\n  name                String?\n  role                Role                @default(USER)\n  creditBalance       Int                 @default(0) // current credit balance in cents\n  graceCreditsUsed    Int                 @default(0) // credits used during grace period\n\n  // Stripe integration\n  stripeCustomerId    String?             @unique // Stripe customer ID\n\n  // Google integration\n  googleRefreshToken   String?             // encrypted refresh token for Google OAuth\n  googleAccessToken    String?             // encrypted access token for Google OAuth (cached)\n  googleTokenExpiresAt DateTime?           // when the access token expires\n  googleSheetId        String?             // auto-created logging spreadsheet ID\n  googleConnectedAt    DateTime?           // when Google was connected\n  appointmentDuration  Int                 @default(30) // appointment duration in minutes\n\n  createdAt           DateTime            @default(now())\n  updatedAt           DateTime            @updatedAt\n\n  // Relations\n  agents              Agent[]\n  calls               Call[]\n  creditTransactions  CreditTransaction[]\n  sessions            Session[]\n}",
  "new_string": "model User {\n  id                  String              @id @default(cuid())\n  email               String              @unique @db.VarChar(255)\n  passwordHash        String\n  name                String?\n  role                Role                @default(USER)\n  creditBalance       Int                 @default(0) // current credit balance in cents\n  graceCreditsUsed    Int                 @default(0) // credits used during grace period\n\n  // Stripe integration\n  stripeCustomerId    String?             @unique // Stripe customer ID\n\n  // Google integration\n  googleRefreshToken   String?             // encrypted refresh token for Google OAuth\n  googleAccessToken    String?             // encrypted access token for Google OAuth (cached)\n  googleTokenExpiresAt DateTime?           // when the access token expires\n  googleSheetId        String?             // auto-created logging spreadsheet ID\n  googleConnectedAt    DateTime?           // when Google was connected\n  appointmentDuration  Int                 @default(30) // appointment duration in minutes\n\n  // Calendar settings\n  calendarSyncEnabled  Boolean             @default(false)\n  defaultTimezone      String?\n  lastCalendarSync     DateTime?\n\n  createdAt           DateTime            @default(now())\n  updatedAt           DateTime            @updatedAt\n\n  // Relations\n  agents              Agent[]\n  calls               Call[]\n  creditTransactions  CreditTransaction[]\n  sessions            Session[]\n  calendarEvents      CalendarEvent[]\n  calendarSyncLogs    CalendarSyncLog[]\n  calendarSyncQueues  CalendarSyncQueue[]\n}"
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma",
  "old_string": "model Agent {\n  id                  String      @id @default(cuid())\n  userId              String\n  name                String\n  vapiAssistantId     String?     @unique // Vapi's assistant ID (null until created in Vapi)\n  greeting            String\n  systemPrompt        String      @db.Text\n  voiceId             String\n  businessName        String\n  businessDescription String?     @db.Text\n  isActive            Boolean     @default(true)\n  createdAt           DateTime    @default(now())\n  updatedAt           DateTime    @updatedAt\n\n  // Relations\n  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)\n  calls               Call[]\n  phoneNumber         PhoneNumber?\n\n  // Performance indexes\n  @@index([userId])\n  @@index([isActive])\n  @@index([userId, isActive])\n  @@index([createdAt(sort: Desc)])\n}",
  "new_string": "model Agent {\n  id                  String      @id @default(cuid())\n  userId              String\n  name                String\n  vapiAssistantId     String?     @unique // Vapi's assistant ID (null until created in Vapi)\n  greeting            String\n  systemPrompt        String      @db.Text\n  voiceId             String\n  businessName        String\n  businessDescription String?     @db.Text\n  isActive            Boolean     @default(true)\n\n  // Calendar integration\n  primaryCalendarId   String?     // Google calendar ID for scheduling\n  checkCalendarIds    String[]    @default([]) // Calendar IDs to check for conflicts\n  defaultTimezone     String?     // Timezone for appointments\n\n  createdAt           DateTime    @default(now())\n  updatedAt           DateTime    @updatedAt\n\n  // Relations\n  user                User        @relation(fields: [userId], references: [id], onDelete: Cascade)\n  calls               Call[]\n  phoneNumber         PhoneNumber?\n  calendarEvents      CalendarEvent[]\n\n  // Performance indexes\n  @@index([userId])\n  @@index([isActive])\n  @@index([userId, isActive])\n  @@index([createdAt(sort: Desc)])\n}"
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma",
  "old_string": "model Session {\n  id        String   @id @default(cuid())\n  userId    String\n  token     String   @unique\n  expiresAt DateTime\n  createdAt DateTime @default(now())\n\n  // Relations\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  // Performance indexes\n  @@index([userId])\n  @@index([expiresAt])\n}",
  "new_string": "model Session {\n  id                 String   @id @default(cuid())\n  userId             String\n  token              String   @unique\n  expiresAt          DateTime\n  browserFingerprint String?  // Browser fingerprint for session validation\n  csrfToken          String?  // CSRF token for form validation\n  createdAt          DateTime @default(now())\n\n  // Relations\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  // Performance indexes\n  @@index([userId])\n  @@index([expiresAt])\n}"
}

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma",
  "old_string": "model Call {\n  id              String      @id @default(cuid())\n  agentId         String\n  userId          String      // denormalized for easier queries\n  vapiCallId      String?     @unique // Vapi's call ID\n  phoneNumber     String\n  status          CallStatus\n  startedAt       DateTime\n  endedAt         DateTime?\n  durationSeconds Int?\n  creditsUsed     Int         @default(0)\n  summary         String?     @db.Text // AI-generated call summary\n  transcript      String?     @db.Text // full transcript\n  createdAt       DateTime    @default(now())\n\n  // Relations\n  agent           Agent       @relation(fields: [agentId], references: [id], onDelete: Cascade)\n  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  // Performance indexes\n  @@index([userId])\n  @@index([agentId])\n  @@index([status])\n  @@index([startedAt(sort: Desc)])\n  @@index([userId, startedAt(sort: Desc)])\n  @@index([userId, status])\n}",
  "new_string": "model Call {\n  id              String      @id @default(cuid())\n  agentId         String\n  userId          String      // denormalized for easier queries\n  vapiCallId      String?     @unique // Vapi's call ID\n  phoneNumber     String\n  status          CallStatus\n  startedAt       DateTime\n  endedAt         DateTime?\n  durationSeconds Int?\n  creditsUsed     Int         @default(0)\n  summary         String?     @db.Text // AI-generated call summary\n  transcript      String?     @db.Text // full transcript\n\n  // AI Analysis fields\n  sentiment        String?     // \"positive\", \"negative\", \"neutral\"\n  sentimentScore   Float?      // -1.0 to 1.0\n  keyTopics        String[]    @default([])\n  customerIntents  String[]    @default([])\n  actionItems      String[]    @default([])\n  followUpRequired Boolean     @default(false)\n  analysisJson     Json?       // Full analysis data\n\n  createdAt       DateTime    @default(now())\n\n  // Relations\n  agent           Agent       @relation(fields: [agentId], references: [id], onDelete: Cascade)\n  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  // Performance indexes\n  @@index([userId])\n  @@index([agentId])\n  @@index([status])\n  @@index([startedAt(sort: Desc)])\n  @@index([userId, startedAt(sort: Desc)])\n  @@index([userId, status])\n}"
}

Now let me add the calendar-related models that are missing:

🔧 Tool: Edit
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\prisma\\schema.prisma",
  "old_string": "model SiteSetting {\n  key       String   @id\n  value     String\n  updatedAt DateTime @updatedAt\n}\n\n// ============================================\n// Monitoring & Analytics Models\n// ============================================",
  "new_string": "model SiteSetting {\n  key       String   @id\n  value     String\n  updatedAt DateTime @updatedAt\n}\n\n// ============================================\n// Calendar Models\n// ============================================\n\nenum CalendarSyncStatus {\n  PENDING\n  IN_PROGRESS\n  COMPLETED\n  FAILED\n}\n\nmodel CalendarEvent {\n  id              String    @id @default(cuid())\n  userId          String\n  googleEventId   String    // Google Calendar event ID\n  title           String\n  description     String?   @db.Text\n  startTime       DateTime\n  endTime         DateTime\n  location        String?\n  attendees       Json?     // Array of attendee emails\n  createdByAgent  String?   // Agent ID if created by an agent\n  metadata        Json?     // Additional event data\n  createdAt       DateTime  @default(now())\n  updatedAt       DateTime  @updatedAt\n\n  // Relations\n  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  agent           Agent?    @relation(fields: [createdByAgent], references: [id], onDelete: SetNull)\n\n  @@unique([userId, googleEventId])\n  @@index([startTime])\n  @@index([userId, startTime])\n}\n\nmodel CalendarSyncLog {\n  id            String   @id @default(cuid())\n  userId        String\n  eventsCreated Int      @default(0)\n  eventsUpdated Int      @default(0)\n  eventsDeleted Int      @default(0)\n  errorMessage  String?\n  createdAt     DateTime @default(now())\n\n  // Relations\n  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId, createdAt])\n}\n\nmodel CalendarSyncQueue {\n  id          String             @id @default(cuid())\n  userId      String\n  status      CalendarSyncStatus @default(PENDING)\n  priority    Int                @default(0)\n  attempts    Int                @default(0)\n  lastError   String?\n  scheduledAt DateTime           @default(now())\n  startedAt   DateTime?\n  completedAt DateTime?\n  createdAt   DateTime           @default(now())\n\n  // Relations\n  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([status])\n  @@index([userId, status])\n}\n\n// ============================================\n// Monitoring & Analytics Models\n// ============================================"
}

Now let me push the schema to the database:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && DATABASE_URL='postgresql://kametrix:kametrix123@localhost:5432/kametrix' npx prisma db push 2>&1",
  "description": "Push Prisma schema to database",
  "timeout": 120000
}

The schema is now synced. Now let me regenerate the Prisma client:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && DATABASE_URL='postgresql://kametrix:kametrix123@localhost:5432/kametrix' npx prisma generate 2>&1",
  "description": "Regenerate Prisma client",
  "timeout": 60000
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add database models for persistent metrics and analytics",
      "status": "completed",
      "activeForm": "Adding database models for persistent metrics and analytics"
    },
    {
      "content": "Create health check API endpoints",
      "status": "completed",
      "activeForm": "Creating health check API endpoints"
    },
    {
      "content": "Implement uptime monitoring service",
      "status": "completed",
      "activeForm": "Implementing uptime monitoring service"
    },
    {
      "content": "Create user analytics tracking",
      "status": "completed",
      "activeForm": "Creating user analytics tracking"
    },
    {
      "content": "Implement anomaly detection and alerting",
      "status": "completed",
      "activeForm": "Implementing anomaly detection and alerting"
    },
    {
      "content": "Build monitoring dashboard UI",
      "status": "completed",
      "activeForm": "Building monitoring dashboard UI"
    },
    {
      "content": "Run database migration",
      "status": "completed",
      "activeForm": "Running database migration"
    },
    {
      "content": "Verify with Playwright tests",
      "status": "in_progress",
      "activeForm": "Verifying with Playwright tests"
    }
  ]
}

Now let's start the dev server and run the Playwright tests:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && npm run dev &>/dev/null &\nsleep 5\necho \"Dev server starting...\"",
  "description": "Start dev server in background",
  "timeout": 30000,
  "run_in_background": true
}

🔧 Tool: Bash
Input: {
  "command": "sleep 10 && curl -s http://localhost:3000/api/health 2>&1 | head -30",
  "description": "Wait and check if dev server is running",
  "timeout": 30000
}

The dev server is running and the health endpoint is working. Now let's run the Playwright tests:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && npx playwright test monitoring-verification.spec.ts --reporter=list 2>&1",
  "description": "Run Playwright verification tests",
  "timeout": 180000
}

The Playwright config is trying to start another web server. Let me check and update the Playwright config to use the existing dev server:

🔧 Tool: Read
Input: {
  "file_path": "F:\\CodeBase\\Kametrix\\playwright.config.ts"
}

The config has `reuseExistingServer: !process.env.CI` which should work. Let me kill the background process and try again with the server already running on port 3000:

🔧 Tool: Bash
Input: {
  "command": "curl -s http://localhost:3000/api/health 2>&1 | head -5",
  "description": "Check if server is running on port 3000"
}

🔧 Tool: Bash
Input: {
  "command": "lsof -i :3000 2>/dev/null | head -5",
  "description": "Check what's using port 3000"
}

🔧 Tool: Bash
Input: {
  "command": "netstat -ano | findstr :3000 | head -5",
  "description": "Check port 3000 on Windows"
}

There is a server running on port 3000. Let me check what's wrong:

🔧 Tool: Bash
Input: {
  "command": "curl -v http://localhost:3000/api/health 2>&1",
  "description": "Debug health endpoint"
}

There's a 500 error. Let me check the dev server output for error details:

🔧 Tool: TaskOutput
Input: {
  "task_id": "bb3aad3",
  "block": false,
  "timeout": 30000
}

Let me kill the current server and start fresh with the correct DATABASE_URL:

🔧 Tool: KillShell
Input: {
  "shell_id": "bb3aad3"
}

🔧 Tool: Bash
Input: {
  "command": "taskkill //F //PID 539992 2>&1 || echo \"Process already stopped\"",
  "description": "Kill the running dev server"
}

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && DATABASE_URL='postgresql://kametrix:kametrix123@localhost:5432/kametrix' npm run dev 2>&1 &\nsleep 15\ncurl -s http://localhost:3000/api/health | head -100",
  "description": "Start dev server with DATABASE_URL",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "curl -s http://localhost:3000/api/health 2>&1",
  "description": "Test health endpoint"
}

The server is running and the health endpoint is working. Now let's run the Playwright tests with the external server:

🔧 Tool: Bash
Input: {
  "command": "cd \"F:\\CodeBase\\Kametrix\" && CI=true DATABASE_URL='postgresql://kametrix:kametrix123@localhost:5432/kametrix' npx playwright test monitoring-verification.spec.ts --reporter=list 2>&1",
  "description": "Run Playwright verification tests with CI mode",
  "timeout": 180000
}

All 20 tests passed! Now let me delete the verification test file as per the instructions:

🔧 Tool: Bash
Input: {
  "command": "rm \"F:\\CodeBase\\Kametrix\\tests\\e2e\\monitoring-verification.spec.ts\" && echo \"Verification test file deleted\"",
  "description": "Delete temporary verification test"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add database models for persistent metrics and analytics",
      "status": "completed",
      "activeForm": "Adding database models for persistent metrics and analytics"
    },
    {
      "content": "Create health check API endpoints",
      "status": "completed",
      "activeForm": "Creating health check API endpoints"
    },
    {
      "content": "Implement uptime monitoring service",
      "status": "completed",
      "activeForm": "Implementing uptime monitoring service"
    },
    {
      "content": "Create user analytics tracking",
      "status": "completed",
      "activeForm": "Creating user analytics tracking"
    },
    {
      "content": "Implement anomaly detection and alerting",
      "status": "completed",
      "activeForm": "Implementing anomaly detection and alerting"
    },
    {
      "content": "Build monitoring dashboard UI",
      "status": "completed",
      "activeForm": "Building monitoring dashboard UI"
    },
    {
      "content": "Run database migration",
      "status": "completed",
      "activeForm": "Running database migration"
    },
    {
      "content": "Verify with Playwright tests",
      "status": "completed",
      "activeForm": "Verifying with Playwright tests"
    }
  ]
}

Let me also clean up the dev server running in the background:

🔧 Tool: KillShell
Input: {
  "shell_id": "b8fe763"
}

<summary>
## Summary: Production Monitoring with Health Checks, Performance Metrics, Uptime Monitoring, User Analytics, and Dashboard

### Changes Implemented
- **Database Models**: Added 7 new Prisma models for monitoring:
  - `SystemMetric` - Persistent performance metrics storage
  - `UptimeRecord` - Service uptime tracking records
  - `UserAnalytics` - User engagement and activity tracking
  - `EventLog` - Event logging for user activity
  - `MonitoringAlert` - Anomaly and issue alerts
  - `MetricAggregate` - Hourly/daily metric rollups for dashboards
  - Added enums: `MetricType`, `AlertSeverity`, `AlertStatus`, `ServiceStatus`

- **Health Check System**: 
  - Enhanced `/api/health` endpoint with query params (`?quick=true`, `?detailed=true`)
  - Quick health check for load balancers (minimal latency)
  - Detailed health check including all external services (database, Vapi, Stripe, Google)
  - Memory usage reporting

- **Monitoring Services** (`src/lib/monitoring/`):
  - `health-check.ts` - Comprehensive health checks for all system components
  - `uptime-monitor.ts` - Uptime tracking with historical analysis
  - `analytics.ts` - User analytics and event tracking
  - `anomaly-detector.ts` - Anomaly detection with configurable thresholds and alerting
  - `metrics-persistence.ts` - Metric persistence and aggregation

- **Admin API** (`/api/admin/monitoring`):
  - GET endpoint with sections: overview, uptime, analytics, alerts, metrics
  - POST endpoint for actions: record-health-check, acknowledge-alert, resolve-alert

- **Dashboard UI** (`/admin/monitoring`):
  - System status card with health indicator
  - Active alerts panel with severity badges
  - Error rate monitoring
  - Uptime percentage (24h)
  - Service status grid (database, vapi, stripe, google)
  - Memory usage bar with thresholds
  - Platform analytics (active users, signups, calls, events)
  - Alert management (acknowledge/resolve)
  - Auto-refresh every 30 seconds

### Files Modified
- `prisma/schema.prisma` - Added monitoring models, restored calendar/session fields
- `src/lib/monitoring/index.ts` - New module exports
- `src/lib/monitoring/health-check.ts` - Health check service
- `src/lib/monitoring/uptime-monitor.ts` - Uptime monitoring service
- `src/lib/monitoring/analytics.ts` - User analytics service
- `src/lib/monitoring/anomaly-detector.ts` - Anomaly detection service
- `src/lib/monitoring/metrics-persistence.ts` - Metrics persistence service
- `src/app/api/health/route.ts` - Enhanced health endpoint
- `src/app/api/admin/monitoring/route.ts` - New admin monitoring API
- `src/app/(dashboard)/admin/monitoring/page.tsx` - New monitoring dashboard page
- `src/components/admin/monitoring-dashboard.tsx` - Dashboard component
- `src/components/admin/admin-nav-tabs.tsx` - Added Monitoring nav tab

### Verification Status
- ✅ Playwright tests: 20/20 passed
- Tests verified:
  - Basic health check endpoint returns status
  - Quick health check returns minimal data
  - Detailed health check includes services
  - Standard health check includes monitoring info
  - Health check handles database status
  - Health check returns proper cache-control headers
  - Health endpoint responds within acceptable time (<2s)
  - Monitoring API requires authentication
  - Health check memory info available
  - Detailed health check includes all external services
- Temporary verification test file deleted after successful verification

### Notes for Developer
1. **Database Migration**: The schema was synced using `prisma db push`. Run migrations in production.
2. **Background Services**: The monitoring services (uptime, anomaly detection, metrics persistence) have start/stop functions that should be called in your application bootstrap:
   ```typescript
   import { startUptimeMonitoring, startAnomalyDetection, startMetricsPersistence } from '@/lib/monitoring';
   
   // In your app initialization
   startUptimeMonitoring(60000);      // Check every minute
   startAnomalyDetection(60000);      // Check every minute
   startMetricsPersistence(300000);   // Persist every 5 minutes
   ```
3. **Anomaly Thresholds**: Default thresholds are configured but can be customized. See `anomaly-detector.ts`.
4. **Cleanup Jobs**: The monitoring module includes cleanup functions for old data. Consider running them as cron jobs:
   - `cleanupOldUptimeRecords()` - Keeps 30 days
   - `cleanupOldEventLogs()` - Keeps 90 days
   - `cleanupOldMetrics()` - Keeps 7 days raw, 90 days aggregated
   - `cleanupOldAlerts()` - Keeps 30 days resolved
5. **External Service Checks**: Health checks for Vapi, Stripe, and Google APIs require valid API keys configured in environment variables.
</summary>