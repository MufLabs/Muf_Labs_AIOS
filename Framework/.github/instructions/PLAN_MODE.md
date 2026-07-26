# PLAN MODE

**Document ID:** MUF-OPS-0001  
**Version:** 1.0.0  
**Status:** Approved  
**Classification:** Operational Procedure  
**Applies To:** Engineering Manager, Consensus Agent, Specialist Agents

---

# 1. Purpose

PLAN MODE is the strategic planning phase of the MUF Labs Engineering Framework.

Its objective is to understand the engineering request, determine the required work, identify risks, assign specialists, and define the execution strategy before any engineering activity begins.

PLAN MODE produces engineering plans.

PLAN MODE does **not** produce implementations.

---

# 2. Fundamental Principle

PLAN MODE exists to answer one question:

> **"What should be done before anyone starts working?"**

No implementation, code generation, architecture modification, or engineering decision shall occur during PLAN MODE.

---

# 3. Responsibilities

Every agent operating in PLAN MODE shall:

- Understand the engineering request.
- Understand the project.
- Understand the current project state.
- Determine required specialists.
- Determine required engineering artifacts.
- Determine required external resources.
- Identify engineering risks.
- Produce an Engineering Plan.

---

# 4. Mandatory Inputs

Before performing any planning activity, the agent shall read the following documents, when available:

1. PROJECT_STATE.md
2. Active ECR
3. Previous related ECRs
4. Framework Standards
5. Relevant ADRs
6. Knowledge Base
7. Existing Engineering Reports (if applicable)

Planning shall never begin without sufficient project context.

---

# 5. PLAN MODE Workflow

```text
Read Project Context
        │
        ▼
Understand Engineering Request
        │
        ▼
Determine Scope
        │
        ▼
Identify Constraints
        │
        ▼
Identify Specialists
        │
        ▼
Determine External Resources
        │
        ▼
Generate ERP (if required)
        │
        ▼
Identify Risks
        │
        ▼
Estimate Deliverables
        │
        ▼
Produce Engineering Plan
```

---

# 6. Engineering Request Analysis

The agent shall determine:

- What is being requested?
- Why is it needed?
- What problem is being solved?
- What is outside the requested scope?
- What engineering disciplines are involved?

If the request is ambiguous, planning shall stop until clarification is obtained.

---

# 7. Project Context Analysis

The agent shall understand:

- Current project maturity
- Architecture
- Technology stack
- Existing limitations
- Active ECRs
- Current priorities
- Project objectives

Planning without project context is prohibited.

---

# 8. Scope Definition

The Engineering Plan shall define:

## Included

Explicitly list work to be performed.

## Excluded

Explicitly list work that is outside the scope.

Scope boundaries shall be clear.

---

# 9. Constraint Identification

Planning shall identify all relevant constraints, including:

- Technical
- Architectural
- Business
- Security
- Performance
- Documentation
- Licensing
- Time
- Budget (when applicable)

---

# 10. Specialist Assignment

The Engineering Manager shall determine which specialists are required.

Possible specialists include:

- Chief Architect
- AI System Engineer
- Backend Engineer
- Database Integration Engineer
- DevOps Engineer
- Documentation Engineer
- Performance Engineer
- Prompt Engineer
- Security Auditor
- Storage Engineer
- UI/UX Architect
- Validation Engineer

Only required specialists shall participate.

---

# 11. External Resource Assessment

The Engineering Manager shall determine whether external resources are required.

Possible outcomes:

- No external resources required.
- ERP required.

If ERP is required, planning shall identify:

- Resource category
- Responsible specialist
- Expected artifact
- Approved sources

---

# 12. Engineering Artifact Planning

Planning shall determine which engineering artifacts will be produced.

Possible artifacts include:

- ECR
- ERP
- ER
- EPR
- EER
- EIR
- ERR
- EAR
- Engineering Consensus Report
- EVR

---

# 13. Risk Assessment

Planning shall identify:

- Technical risks
- Architectural risks
- Performance risks
- Security risks
- Integration risks
- Documentation risks
- Schedule risks

Each identified risk shall include:

- Description
- Probability
- Impact
- Mitigation strategy

---

# 14. Deliverable Planning

Every Engineering Plan shall define expected deliverables.

Examples include:

- Engineering Reports
- Architecture proposals
- Consensus reports
- Validation reports
- Documentation
- Source code
- External inspection reports

Deliverables shall be measurable.

---

# 15. Dependencies

Planning shall identify:

- Internal dependencies
- External dependencies
- Blocking issues
- Required approvals
- Required documentation

Dependencies shall be documented before execution begins.

---

# 16. Success Criteria

Planning shall define measurable completion criteria.

Examples:

- Consensus achieved
- Validation passed
- Documentation updated
- Performance target achieved
- Security requirements satisfied

Success shall never be subjective.

---

# 17. Engineering Plan

PLAN MODE produces a single Engineering Plan.

The Engineering Plan shall contain:

- Executive Summary
- Scope
- Objectives
- Constraints
- Risks
- Specialists
- External Resources
- Deliverables
- Dependencies
- Success Criteria
- Recommended Workflow

---

# 18. PLAN MODE Restrictions

Agents operating in PLAN MODE shall NOT:

- Generate production code.
- Modify architecture.
- Edit project files.
- Implement features.
- Execute fixes.
- Produce consensus.
- Skip planning activities.

PLAN MODE is analytical, not operational.

---

# 19. Transition to ACT MODE

PLAN MODE ends when:

- Scope is defined.
- Specialists are identified.
- Risks are documented.
- External resources are planned.
- Engineering Plan is complete.

Once approved by the Engineering Manager, execution transitions to ACT MODE.

---

# 20. Human Authority

The Engineering Manager may:

- Modify the Engineering Plan.
- Add specialists.
- Remove specialists.
- Expand scope.
- Reduce scope.
- Request replanning.
- Reject the Engineering Plan.

Human decisions always supersede AI planning.

---

# 21. Compliance

Every Engineering Change Request shall complete PLAN MODE before entering ACT MODE.

Skipping PLAN MODE constitutes a Framework non-conformance.

---

# 22. Continuous Improvement

Lessons learned during planning shall be incorporated into the Framework Knowledge Base whenever they improve future planning quality.

Planning templates and workflows shall evolve continuously through completed Engineering Change Requests.

---

# 23. Closing Statement

PLAN MODE establishes the engineering strategy before execution begins.

Its purpose is to ensure that engineering work starts with complete understanding, clearly defined scope, documented constraints, appropriate specialist participation, identified risks, and measurable objectives.

A well-executed PLAN MODE reduces uncertainty, improves engineering quality, and enables predictable, traceable, and reproducible execution throughout the MUF Labs Engineering Framework.
