# Phase 2: Core Dashboard - Context

**Gathered:** 2025-12-24
**Status:** Ready for planning

<vision>
## How This Should Work

Users land on a clean dashboard with a simple overview — their agents, recent calls, and credit balance visible at a glance. The focus is on recent activity: what calls came in, anything that needs attention.

Navigation is tab-based within the main content area. Users switch between Dashboard, Agents, Calls, and Settings via tabs — keeps the interface focused without a persistent sidebar eating screen space.

Agent management is the core workflow. Users can create agents, edit their configuration, and toggle them active/inactive. The agent list shows status-focused cards: name, phone number, active/inactive state with a quick toggle.

Admin sees the same interface but with access to all users' data. No separate admin section — just broader visibility while maintaining consistent UX.

The overall feel is clean and minimal — think Linear or Stripe. Lots of white space, clear visual hierarchy, nothing cluttered.

</vision>

<essential>
## What Must Be Nailed

- **Agent management** — Creating, editing, and managing agents must feel effortless. This is the core action users take.
- **Status-focused agent cards** — Name, phone number, active/inactive with quick toggle. Users should see agent status at a glance.
- **Tab-based navigation** — Clean switching between views without heavy chrome.

</essential>

<boundaries>
## What's Out of Scope

- Detailed analytics — No graphs or metrics breakdowns. Just a simple call history list.
- Vapi integration — Agent creation saves to database but doesn't connect to Vapi yet (Phase 3).
- Complex admin features — Admin uses same layout with broader data access, no separate admin-specific UI.

</boundaries>

<specifics>
## Specific Ideas

- Clean and minimal aesthetic — Linear/Stripe style with whitespace and clear hierarchy
- Agent cards show: name, phone number, active/inactive status, toggle button
- Recent activity takes priority on the dashboard overview
- Tab navigation pattern for switching between Dashboard, Agents, Calls, Settings

</specifics>

<notes>
## Additional Context

This phase creates the UI shell and data display. The actual Vapi integration for making agents functional comes in Phase 3. For now, "creating an agent" means saving configuration to the database — the form fields and workflow, not the voice AI connection.

Admin role uses the same interface patterns as regular users, just with visibility into all users' data rather than a distinct admin console.

</notes>

---

*Phase: 02-core-dashboard*
*Context gathered: 2025-12-24*
