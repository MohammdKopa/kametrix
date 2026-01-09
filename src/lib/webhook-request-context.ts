/**
 * Webhook Request Context
 *
 * Provides per-request caching for webhook processing to avoid
 * redundant database queries within a single webhook invocation.
 *
 * Features:
 * - Agent data caching (agent with user, escalation config)
 * - OAuth2 client caching per user
 * - Call record caching
 * - Escalation config caching
 *
 * Usage:
 * ```typescript
 * const ctx = new WebhookRequestContext();
 * const agent = await ctx.getAgentByVapiId(assistantId);
 * const oauth = await ctx.getOAuth2Client(userId);
 * ```
 */

import { prisma } from '@/lib/prisma';
import { getCachedAgentByVapiId, queryCache, cacheKeys } from '@/lib/performance';
import { getOAuth2ClientForUser } from '@/lib/google/auth';
import type { Agent, User, EscalationConfig, Call } from '@/generated/prisma/client';
import type { OAuth2Client } from 'google-auth-library';

type AgentWithUser = Agent & { user: User };
type AgentWithUserAndConfig = Agent & { user: User; escalationConfig: EscalationConfig | null };

/**
 * Request-scoped context for webhook processing
 * Caches frequently accessed data within a single request lifecycle
 */
export class WebhookRequestContext {
  // Per-request caches
  private agentCache = new Map<string, AgentWithUser | null>();
  private agentWithConfigCache = new Map<string, AgentWithUserAndConfig | null>();
  private oauth2ClientCache = new Map<string, OAuth2Client | null>();
  private escalationConfigCache = new Map<string, EscalationConfig | null>();
  private callRecordCache = new Map<string, Call | null>();
  private userCache = new Map<string, User | null>();

  // Request metadata
  public readonly createdAt = Date.now();
  public vapiCallId?: string;
  public assistantId?: string;

  /**
   * Get agent by Vapi assistant ID with request-level caching
   * Uses global cache first, then stores in request cache
   */
  async getAgentByVapiId(vapiAssistantId: string): Promise<AgentWithUser | null> {
    // Check request cache first
    if (this.agentCache.has(vapiAssistantId)) {
      return this.agentCache.get(vapiAssistantId) ?? null;
    }

    // Use global cached lookup
    const agent = await getCachedAgentByVapiId(vapiAssistantId);

    // Store in request cache for subsequent lookups within same request
    this.agentCache.set(vapiAssistantId, agent);

    return agent;
  }

  /**
   * Get agent with escalation config - useful for escalation operations
   */
  async getAgentWithConfig(agentId: string): Promise<AgentWithUserAndConfig | null> {
    // Check request cache
    if (this.agentWithConfigCache.has(agentId)) {
      return this.agentWithConfigCache.get(agentId) ?? null;
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: true,
        escalationConfig: true,
      },
    });

    this.agentWithConfigCache.set(agentId, agent);
    return agent;
  }

  /**
   * Get OAuth2 client for a user with request-level caching
   * Avoids multiple encrypted token decryptions within same request
   */
  async getOAuth2Client(userId: string): Promise<OAuth2Client | null> {
    // Check request cache
    if (this.oauth2ClientCache.has(userId)) {
      return this.oauth2ClientCache.get(userId) ?? null;
    }

    const client = await getOAuth2ClientForUser(userId);
    this.oauth2ClientCache.set(userId, client);
    return client;
  }

  /**
   * Get escalation config for an agent
   */
  async getEscalationConfig(agentId: string): Promise<EscalationConfig | null> {
    // Check request cache
    if (this.escalationConfigCache.has(agentId)) {
      return this.escalationConfigCache.get(agentId) ?? null;
    }

    // Check global cache
    const cacheKey = `escalation:config:${agentId}`;
    const cached = queryCache.get(cacheKey) as EscalationConfig | null | undefined;
    if (cached !== undefined) {
      this.escalationConfigCache.set(agentId, cached);
      return cached;
    }

    const config = await prisma.escalationConfig.findUnique({
      where: { agentId },
    });

    // Store in both request and global cache
    this.escalationConfigCache.set(agentId, config);
    queryCache.set(cacheKey, config, 5 * 60 * 1000); // 5 minute TTL

    return config;
  }

  /**
   * Get call record by Vapi call ID
   */
  async getCallByVapiId(vapiCallId: string): Promise<Call | null> {
    // Check request cache
    if (this.callRecordCache.has(vapiCallId)) {
      return this.callRecordCache.get(vapiCallId) ?? null;
    }

    const call = await prisma.call.findUnique({
      where: { vapiCallId },
    });

    this.callRecordCache.set(vapiCallId, call);
    return call;
  }

  /**
   * Get call record by Vapi call ID with relations
   */
  async getCallWithRelations(vapiCallId: string): Promise<(Call & { agent: Agent & { escalationConfig: EscalationConfig | null } }) | null> {
    const call = await prisma.call.findUnique({
      where: { vapiCallId },
      include: {
        agent: {
          include: { escalationConfig: true },
        },
      },
    });

    if (call) {
      // Also cache the escalation config if available
      if (call.agent.escalationConfig) {
        this.escalationConfigCache.set(call.agentId, call.agent.escalationConfig);
      }
    }

    return call;
  }

  /**
   * Get user by ID with request-level caching
   */
  async getUser(userId: string): Promise<User | null> {
    // Check request cache
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId) ?? null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    this.userCache.set(userId, user);
    return user;
  }

  /**
   * Get user credit info (optimized fields only)
   */
  async getUserCreditInfo(userId: string): Promise<{ creditBalance: number; graceCreditsUsed: number; email: string; name: string | null } | null> {
    const cacheKey = `user:credit:${userId}`;

    // Don't use long-term cache for credit balance - it changes frequently
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        creditBalance: true,
        graceCreditsUsed: true,
        email: true,
        name: true,
      },
    });

    return user;
  }

  /**
   * Set agent in cache (useful when agent is already loaded)
   */
  setAgent(vapiAssistantId: string, agent: AgentWithUser | null): void {
    this.agentCache.set(vapiAssistantId, agent);
  }

  /**
   * Set call record in cache
   */
  setCall(vapiCallId: string, call: Call | null): void {
    this.callRecordCache.set(vapiCallId, call);
  }

  /**
   * Clear all request caches
   */
  clear(): void {
    this.agentCache.clear();
    this.agentWithConfigCache.clear();
    this.oauth2ClientCache.clear();
    this.escalationConfigCache.clear();
    this.callRecordCache.clear();
    this.userCache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): Record<string, number> {
    return {
      agents: this.agentCache.size,
      agentsWithConfig: this.agentWithConfigCache.size,
      oauth2Clients: this.oauth2ClientCache.size,
      escalationConfigs: this.escalationConfigCache.size,
      calls: this.callRecordCache.size,
      users: this.userCache.size,
      requestAgeMs: Date.now() - this.createdAt,
    };
  }
}

/**
 * Factory function to create a new request context
 */
export function createWebhookContext(): WebhookRequestContext {
  return new WebhookRequestContext();
}
