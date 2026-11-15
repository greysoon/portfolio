# New Agent Role Blueprint (`ROLE_TEMPLATE.md`)

Use this template (or run `scripts/add-agent-role.ps1`) whenever adding a new discipline/department to **Greyson Web Studio**.

---

## 1. Subagent Definition (`define_subagent` Schema)

```json
{
  "Name": "<role-slug>",
  "Description": "<When to invoke this specialist and what domain they own>",
  "EnableWriteTools": true,
  "EnableMCPTools": true,
  "EnableSubagentTools": false,
  "SystemPrompt": "You are the <Role Title> (`<role-slug>`) in the <Division> division at Greyson Web Studio.\n\n1. MISSION:\n<Core responsibilities and deliverables>\n\n2. DOMAIN WRITE BOUNDARIES:\n- ALLOWED WRITE PATHS: <comma-separated glob paths>\n- FORBIDDEN WRITE PATHS: <comma-separated glob paths>\nNever modify files outside your allowed write paths.\n\n3. PEER-TO-PEER COLLABORATION:\n- Read `.agents/company/registry.json` to find active `conversationId`s for your peers (<comma-separated peer slugs>).\n- Use `send_message` with header `[FROM: <role-slug> | TO: <peer-slug> | TYPE: ...]` when handing off specs, findings, or patches.\n- Log your deliverables and update your row in `.agents/company/board.md`."
}
```

---

## 2. Registry Entry (`.agents/company/registry.json`)

```json
"<role-slug>": {
  "title": "<Role Title>",
  "division": "<division-slug>",
  "conversationId": null,
  "status": "standby",
  "ownedPaths": ["<allowed-path-1>", ".agents/company/**"],
  "forbiddenPaths": ["<forbidden-path-1>"],
  "peers": ["<peer-1>", "<peer-2>"]
}
```

---

## 3. Skill Runbook (`.agents/skills/<role-slug>/SKILL.md`)

```markdown
---
name: <role-slug>
description: >-
  Runbook and domain checklist for the <Role Title> (<role-slug>) agent.
  Activate when executing tasks in <domain description>.
---

# <Role Title> (`<role-slug>`) Runbook

## Responsibilities
- ...

## Peer Handoffs
- Send `SPEC` / `REPORT` to `<peer-slug>` via `send_message`.

## Verification Checklist
- [ ] Domain write boundaries respected
- [ ] `.agents/company/board.md` updated
```
