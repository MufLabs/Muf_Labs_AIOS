# ACT MODE

**Document ID:** MUF-OPS-0002  
**Version:** 1.0.0  
**Status:** Approved  
**Classification:** Operational Procedure  
**Applies To:** Engineering Manager, Specialist Agents, Consensus Agent, Validation Engineer

---

# 1. Purpose

ACT MODE is the execution phase of the MUF Labs Engineering Framework.

Its purpose is to execute the Engineering Plan approved during PLAN MODE in a controlled, traceable, and standards-compliant manner.

ACT MODE transforms engineering plans into engineering deliverables.

---

# 2. Fundamental Principle

ACT MODE answers one question:

> **"How do we execute the approved engineering work safely, consistently, and completely?"**

No engineering activity shall begin without an approved Engineering Plan.

---

# 3. Entry Requirements

ACT MODE may only begin when all of the following conditions have been satisfied:

- Engineering Request approved.
- Scope defined.
- Engineering Plan completed.
- Required specialists identified.
- ERP approved (if external resources are required).
- Required documentation available.
- Engineering Manager authorization granted.

---

# 4. Responsibilities

During ACT MODE each participant has clearly defined responsibilities.

## Engineering Manager

- Coordinate execution.
- Assign specialists.
- Monitor progress.
- Resolve blockers.
- Ensure Framework compliance.

---

## Specialist Agents

- Execute assigned engineering tasks.
- Produce Engineering Reports.
- Respect Framework Standards.
- Escalate blockers.

---

## Consensus Agent

- Wait until specialist reports are completed.
- Execute Engineering Consensus.
- Produce Engineering Consensus Report.

---

## Validation Engineer

- Validate implementation.
- Produce Validation Report.
- Confirm completion criteria.

---

# 5. ACT MODE Workflow

```text
Engineering Plan Approved
          │
          ▼
Assign Specialists
          │
          ▼
Execute Engineering Tasks
          │
          ▼
Generate Engineering Reports
          │
          ▼
Consensus Process
          │
          ▼
Engineering Consensus Report
          │
          ▼
Implementation
          │
          ▼
Validation
          │
          ▼
Project Update
          │
          ▼
Close ECR
```

---

# 6. Engineering Execution

Engineering execution shall follow the approved plan.

Execution shall not introduce unauthorized work.

Scope changes require Engineering Manager approval.

---

# 7. Task Assignment

Every engineering task shall include:

- Task Identifier
- Responsible Specialist
- Objective
- Scope
- Expected Deliverables
- Dependencies
- Completion Criteria

Tasks shall be independently traceable.

---

# 8. Engineering Reports

Every specialist shall produce an Engineering Report (ER).

Engineering Reports shall document:

- Analysis performed.
- Findings.
- Decisions.
- Risks.
- Recommendations.
- Supporting evidence.

Reports shall be completed before Consensus begins.

---

# 9. External Resources

When external resources are required:

- ERP shall already be approved.
- Only approved sources may be used.
- Findings shall be documented as:

  - EER
  - EIR
  - ERR
  - EAR

Unauthorized external research is prohibited.

---

# 10. Implementation Rules

Implementation shall:

- Respect approved architecture.
- Follow engineering standards.
- Preserve project integrity.
- Maintain documentation.
- Respect coding standards.
- Preserve traceability.

Implementation shall never exceed the approved scope.

---

# 11. Scope Control

During execution the Engineering Manager shall monitor:

- Scope changes.
- Requirement changes.
- Architectural changes.
- New dependencies.
- Newly discovered risks.

Significant changes require a new or updated ECR.

---

# 12. Progress Tracking

Execution progress shall be tracked using engineering milestones.

Recommended states:

- Planned
- Assigned
- In Progress
- Under Review
- Completed
- Validated
- Closed

Progress shall always be visible.

---

# 13. Blocking Issues

When execution becomes blocked:

1. Document the blocker.
2. Notify Engineering Manager.
3. Evaluate alternatives.
4. Decide whether to continue, pause, or escalate.

Blocked work shall never be silently ignored.

---

# 14. Consensus Transition

When all Engineering Reports are complete:

- Specialist execution ends.
- Consensus Agent begins.
- Engineering Consensus Report is generated.

Consensus determines implementation readiness.

---

# 15. Validation Transition

After implementation:

Validation Engineer shall verify:

- Scope completion.
- Functional correctness.
- Engineering quality.
- Standards compliance.
- Documentation updates.

Validation is mandatory.

---

# 16. Documentation Updates

Execution shall update all affected documentation, including when applicable:

- PROJECT_STATE.md
- ADRs
- Architecture diagrams
- API documentation
- User documentation
- Knowledge Base
- Changelog

Documentation is part of the implementation.

---

# 17. Engineering Deliverables

ACT MODE may produce:

- Source code
- Architecture updates
- Engineering Reports (ER)
- External artifacts (EER, EIR, ERR, EAR)
- Engineering Prompt Records (EPR)
- Engineering Consensus Report
- Validation Report (EVR)
- Documentation
- Updated PROJECT_STATE.md

---

# 18. Quality Requirements

Engineering work shall satisfy:

- Correctness
- Maintainability
- Security
- Performance
- Readability
- Testability
- Traceability
- Documentation quality

Quality shall not be sacrificed for speed.

---

# 19. Human Authority

The Engineering Manager may:

- Pause execution.
- Reassign work.
- Modify priorities.
- Request additional analysis.
- Reject deliverables.
- Request rework.

Human authority always supersedes AI execution.

---

# 20. Completion Criteria

ACT MODE is complete when:

- All planned tasks are completed.
- Engineering Reports are delivered.
- Consensus is approved.
- Validation is successful.
- Documentation is updated.
- Deliverables satisfy acceptance criteria.

---

# 21. Failure Conditions

ACT MODE shall be considered unsuccessful if:

- Scope is violated.
- Required specialists did not complete assigned work.
- Consensus is rejected.
- Validation fails.
- Required documentation is missing.
- Engineering standards are violated.

Corrective actions shall be initiated before closure.

---

# 22. ECR Closure

The Engineering Manager may close the ECR only after:

- Validation completed.
- Deliverables accepted.
- Documentation updated.
- PROJECT_STATE.md updated.
- Lessons learned recorded.

Closed ECRs become part of the permanent engineering history.

---

# 23. Continuous Improvement

Lessons learned during execution shall be incorporated into:

- Knowledge Base
- Reusable Patterns
- Best Practices
- Prompt Library
- Engineering Standards

Every completed ECR shall improve future engineering work.

---

# 24. Compliance

Execution performed outside ACT MODE is not compliant with the MUF Labs Engineering Framework.

All engineering work shall follow the procedures defined in this document.

---

# 25. Closing Statement

ACT MODE is the operational execution phase of the MUF Labs Engineering Framework.

Its purpose is to transform approved engineering plans into validated engineering outcomes through disciplined execution, specialist collaboration, evidence-based decision making, and complete traceability.

Engineering work is not complete when code is written.

Engineering work is complete only when it has been implemented, validated, documented, and formally accepted.
