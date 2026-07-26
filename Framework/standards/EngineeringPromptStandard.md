# Engineering Prompt Standard

**Document ID:** MUF-STD-0006  
**Version:** 1.0.0  
**Status:** Approved  
**Classification:** Engineering Standard  
**Applies To:** Prompt Engineer, Engineering Manager, Specialist Agents, Consensus Agent

---

# 1. Purpose

This standard defines how engineering prompts shall be designed, documented, versioned, executed, and preserved within the MUF Labs Engineering Framework.

Engineering prompts are engineering artifacts.

They shall be treated with the same level of rigor, traceability, and reproducibility as source code, engineering reports, and technical documentation.

---

# 2. Scope

This standard applies to every prompt used to:

- Generate engineering analyses
- Produce engineering documentation
- Request technical research
- Perform external inspections
- Generate software
- Review software
- Produce engineering recommendations
- Support engineering decision making

---

# 3. Engineering Prompt Principles

Every engineering prompt shall be:

- Clear
- Deterministic
- Context-aware
- Traceable
- Reproducible
- Versioned
- Auditable
- Purpose-driven

Prompts shall never rely on hidden assumptions.

---

# 4. Prompt Lifecycle

Every engineering prompt follows the lifecycle below.

```text
Engineering Need
        │
        ▼
Prompt Planning
        │
        ▼
Prompt Design
        │
        ▼
Prompt Review
        │
        ▼
Prompt Execution
        │
        ▼
Engineering Output
        │
        ▼
Prompt Documentation (EPR)
        │
        ▼
Archive
```

---

# 5. Prompt Categories

The Framework defines the following prompt categories.

- Analysis Prompt
- Architecture Prompt
- Consensus Prompt
- Documentation Prompt
- External Research Prompt
- Inspection Prompt
- Implementation Prompt
- Planning Prompt
- Refactoring Prompt
- Security Prompt
- Validation Prompt

Each prompt shall belong to one primary category.

---

# 6. Mandatory Prompt Structure

Every engineering prompt shall contain the following sections whenever applicable.

## Objective

What shall be accomplished.

---

## Context

Project information.

Relevant documentation.

Engineering constraints.

Current project state.

---

## Scope

Define exactly what is included.

Define what is excluded.

---

## Constraints

Examples:

- Technology stack
- Coding standards
- Framework rules
- Architectural limitations
- Performance requirements

---

## Required Deliverables

Examples:

- Engineering Report
- Architecture Proposal
- Validation Report
- External Inspection Report

---

## Expected Output Format

Examples:

- Markdown
- JSON
- Mermaid
- ASCII Diagram
- Source Code
- Technical Report

---

## Completion Criteria

Define when the task is considered complete.

---

# 7. Prompt Context Rules

Prompts shall include only the context required to complete the task.

Insufficient context shall be reported.

Excessive context should be avoided.

Prompts shall never assume undocumented project knowledge.

---

# 8. Prompt Constraints

Prompts shall explicitly state:

- Allowed technologies
- Forbidden technologies
- Performance expectations
- Security requirements
- Documentation requirements
- Engineering standards

Constraints shall be explicit.

---

# 9. Prompt Outputs

Every prompt shall define expected outputs before execution.

Examples:

- ER
- ERP
- EER
- EIR
- ERR
- EAR
- EVR
- Engineering Consensus Report
- Documentation
- Source Code

---

# 10. Engineering Prompt Record (EPR)

Prompts that materially influence engineering decisions shall be documented as Engineering Prompt Records (EPR).

Each EPR shall contain:

- Identifier
- Author
- Date
- Purpose
- Prompt Category
- Prompt
- Target Model
- Model Version
- Execution Summary
- Result Summary
- Related ECR

---

# 11. Prompt Versioning

Engineering prompts shall be version controlled.

Every significant modification shall increment the prompt version.

Historical prompt versions shall remain available.

---

# 12. Prompt Traceability

Every Engineering Prompt Record shall reference:

- Parent ECR
- Responsible Engineer
- Target Agent
- Related Engineering Reports
- Consensus Report
- Validation Report

Prompt history shall never be lost.

---

# 13. Prompt Quality Requirements

Engineering prompts shall be:

- Specific
- Unambiguous
- Complete
- Technically accurate
- Free from contradictory instructions

Poorly defined prompts shall be revised before execution.

---

# 14. Prompt Reusability

Reusable prompts shall be preserved within the Framework Knowledge Base.

Reusable prompts become engineering assets.

---

# 15. External Resource Prompts

When external resources are required:

- An approved ERP shall exist.
- The prompt shall reference the ERP.
- Approved sources shall be respected.
- Findings shall be documented as EER, EIR, ERR, or EAR.

Unauthorized external research is prohibited.

---

# 16. Prompt Engineering Responsibilities

The Prompt Engineer shall:

- Design engineering prompts.
- Optimize prompt quality.
- Eliminate ambiguity.
- Preserve reproducibility.
- Maintain prompt templates.
- Document significant prompts as EPR.

---

# 17. AI Model Independence

Engineering prompts shall be model-independent whenever possible.

Prompts shall avoid vendor-specific behavior unless explicitly required.

The Framework shall support multiple AI providers without requiring prompt redesign.

---

# 18. Prompt Review

Engineering prompts shall be reviewed when they:

- Produce inconsistent outputs.
- Generate ambiguous results.
- Fail to satisfy engineering objectives.
- Introduce unnecessary complexity.

Prompt review shall improve future engineering performance.

---

# 19. Prompt Security

Prompts shall not:

- Request confidential information unnecessarily.
- Expose credentials.
- Circumvent security controls.
- Encourage unsafe engineering practices.

Sensitive information shall be minimized.

---

# 20. Prompt Validation

Prompt quality shall be evaluated according to:

- Objective achieved
- Output quality
- Reproducibility
- Consistency
- Engineering usefulness

Prompt effectiveness shall be continuously improved.

---

# 21. Prompt Templates

The Framework may provide reusable prompt templates for:

- Architecture Reviews
- Code Reviews
- Security Audits
- Performance Analysis
- Documentation
- Research
- Validation
- Consensus
- Planning
- Refactoring

Templates are starting points and may be adapted to individual ECRs.

---

# 22. Prohibited Prompt Practices

The following practices are prohibited:

- Hidden assumptions
- Undefined objectives
- Contradictory instructions
- Missing constraints
- Undocumented external research
- Prompt injection against Framework rules
- Circumventing engineering standards
- Bypassing traceability

---

# 23. Compliance

Engineering prompts that do not comply with this standard shall be considered non-conformant.

Prompt Engineers and Engineering Managers are responsible for ensuring compliance.

---

# 24. Continuous Improvement

Prompt quality shall improve continuously through:

- Engineering experience
- Lessons learned
- Consensus recommendations
- Validation findings
- Framework evolution

Reusable prompt patterns shall be incorporated into the Framework Knowledge Base.

---

# 25. Closing Statement

Within the MUF Labs Engineering Framework, prompts are engineering specifications rather than conversational instructions.

A well-designed engineering prompt defines the objective, provides the necessary context, establishes the constraints, specifies the expected deliverables, and preserves complete traceability.

Engineering prompts shall always be clear, reproducible, auditable, and aligned with the engineering standards governing the Framework.
