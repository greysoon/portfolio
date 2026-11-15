---
name: company-orchestrator
description: >-
  Master orchestration playbook for spawning, registering, and coordinating the
  10-role Greyson Web Studio agent team across Product/Design, Growth/Content,
  Engineering, and Security/QA divisions. Activate when running multi-agent
  website tasks, sprints, or cross-department workflows.
---

# Greyson Web Studio — Company Orchestrator Runbook

## 1. Overview
This skill guides the main agent (CEO / Lead Coordinator) on how to define, spawn, connect, and coordinate the 10 specialized subagents in **Greyson Web Studio**.

## 2. Step-by-Step Orchestration Workflow

### Step 1: Register Required Subagent Types (`define_subagent`)
Before invoking any role for the first time in a conversation, register its `TypeName` with `define_subagent`:
- `pm-director` (`EnableWriteTools: true`, `EnableMCPTools: true`)
- `ui-ux-designer` (`EnableWriteTools: true`, `EnableMCPTools: true`)
- `frontend-engineer` (`EnableWriteTools: true`, `EnableMCPTools: true`)
- `backend-devops` (`EnableWriteTools: true`, `EnableMCPTools: true`)
- `copywriter` (`EnableWriteTools: true`, `EnableMCPTools: true`)
- `marketing-seo` (`EnableWriteTools: true`, `EnableMCPTools: true`)
- `data-analytics` (`EnableWriteTools: true`, `EnableMCPTools: true`)
- `qa-tester` (`EnableWriteTools: true`, `EnableMCPTools: true`)
- `red-team-hacker` (`EnableWriteTools: true`, `EnableMCPTools: true`)
- `blue-team-security` (`EnableWriteTools: true`, `EnableMCPTools: true`)

### Step 2: Spawn Wave 1 (Strategy, Audit & Offensive Recon)
1. Invoke `pm-director`, `ui-ux-designer`, `copywriter`, `marketing-seo`, `data-analytics`, and `red-team-hacker` in parallel via `invoke_subagent`.
2. Immediately record their returned `conversationId`s in `.agents/company/registry.json`.
3. Send a quick directory broadcast via `send_message` to active agents so they have each other's live `conversationId`s for direct peer-to-peer DMs without waiting.

### Step 3: Spawn Wave 2 (Remediation, Hardening & Engineering Build)
1. Once Wave 1 agents post their specs/exploits on `.agents/company/board.md` (and DM peers), spawn `blue-team-security`, `frontend-engineer`, and `backend-devops` (or message them if already active).
2. Update `.agents/company/registry.json` with their `conversationId`s and instruct them to coordinate directly with `red-team-hacker`, `ui-ux-designer`, `copywriter`, `marketing-seo`, and `data-analytics`.

### Step 4: Spawn Wave 3 (Adversarial Re-Test & QA Release Certification)
1. Message `red-team-hacker` to re-test `blue-team-security`'s patches and confirm all vulnerabilities in Section 4 of `.agents/company/board.md` are `CLOSED`.
2. Spawn `qa-tester` to run automated build/typecheck/test verification and browser/accessibility checks.
3. Have `pm-director` perform final sprint sign-off on `.agents/company/board.md`.

## 3. Adding New Departments
Run `scripts/add-agent-role.ps1` to scaffold a new role into `.agents/company/registry.json`, `.agents/skills/<role-slug>/SKILL.md`, and `.agents/company/board.md`.
