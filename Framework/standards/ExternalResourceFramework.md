# External Resource Framework Standard

**Document ID:** MUF-STD-0004  
**Version:** 1.0.0  
**Status:** Approved  
**Classification:** Engineering Standard  
**Applies To:** All Engineering Managers, Engineering Agents, Workflows and Projects

---

# 1. Purpose

This standard governs the acquisition, evaluation, documentation, and use of external resources within the MUF Labs Engineering Framework.

Its objective is to ensure that every external source used during engineering activities is authorized, traceable, reproducible, and properly documented.

No external information shall influence engineering decisions unless it complies with this standard.

---

# 2. Scope

This standard applies to every engineering activity requiring information, assets, or references originating outside the current project.

Examples include:

- Official documentation
- Technical standards
- RFCs
- APIs
- GitHub repositories
- Websites
- Design systems
- UI inspiration
- Third-party libraries
- Images
- Icons
- Fonts
- Videos
- Academic papers
- Vendor documentation

---

# 3. Engineering Principles

External resources shall always satisfy the following principles.

- Necessity
- Traceability
- Transparency
- Reproducibility
- Legal compliance
- Technical relevance
- Engineering value

External information shall never be collected merely because it is available.

Every external resource shall have a justified engineering purpose.

---

# 4. External Resource Lifecycle

Every external resource shall follow the lifecycle below.

```text
Need Identified
        │
        ▼
External Resource Assessment
        │
        ▼
Engineering Manager Approval
        │
        ▼
External Resource Plan (ERP)
        │
        ▼
Prompt Generation (if required)
        │
        ▼
External Resource Collection
        │
        ▼
Artifact Generation
        │
        ├── EER
        ├── EIR
        ├── ERR
        └── EAR
        │
        ▼
Specialist Analysis
        │
        ▼
Consensus
        │
        ▼
Archive
```

---

# 5. External Resource Assessment

Before collecting external information, the Engineering Manager shall determine whether external resources are required.

Questions to consider include:

- Is official documentation required?
- Is benchmarking required?
- Is competitor analysis required?
- Is API documentation required?
- Is repository inspection required?
- Is visual inspiration required?
- Are reusable assets required?

If the answer is **No**, no ERP shall be created.

If the answer is **Yes**, an ERP becomes mandatory.

---

# 6. External Resource Plan (ERP)

The ERP authorizes every external engineering activity.

The ERP shall contain:

- Parent ECR
- Engineering objective
- Reason for external research
- Requested resource types
- Assigned specialist
- Expected deliverables
- Approved sources
- Approval date
- Approval authority

No external activity shall begin before ERP approval.

---

# 7. External Resource Categories

The Framework defines four official categories.

## 7.1 External Evidence Record (EER)

Purpose:

Capture factual engineering evidence.

Examples:

- RFCs
- ISO Standards
- Vendor Documentation
- Academic Publications
- Official API Documentation
- Engineering Specifications

Output:

EER

---

## 7.2 External Inspection Report (EIR)

Purpose:

Inspect existing systems.

Examples:

- Websites
- Applications
- GitHub repositories
- APIs
- SaaS platforms
- Cloud services

Output:

EIR

---

## 7.3 External Reference Report (ERR)

Purpose:

Document engineering references used for comparison and inspiration.

Examples:

- UX patterns
- Software architecture
- Engineering methodologies
- Design systems
- Product comparisons

Output:

ERR

---

## 7.4 External Asset Record (EAR)

Purpose:

Register external assets approved for project use.

Examples:

- Fonts
- Icons
- Images
- UI Kits
- Component libraries
- Templates
- Style guides

Output:

EAR

---

# 8. Approved Sources

Preferred sources include:

- Official vendor documentation
- Standards organizations
- Official GitHub repositories
- Academic publications
- Vendor SDK documentation
- Official API documentation

Community sources may be used when properly identified.

Unofficial sources shall be clearly labeled.

---

# 9. Source Reliability

Every external source shall be evaluated according to:

- Authority
- Authenticity
- Currency
- Technical quality
- Completeness
- Engineering relevance

Each report shall document the reliability assessment.

---

# 10. Internet Access Governance

Internet access is not a default engineering capability.

It is a governed engineering activity.

Every external interaction shall:

- be justified,
- be documented,
- be reproducible,
- be traceable.

Unauthorized browsing is prohibited.

---

# 11. Repository Inspection

Repository analysis shall document:

- Repository URL
- Owner
- License
- Purpose
- Technologies
- Architecture
- Strengths
- Weaknesses
- Engineering recommendations

The Framework shall never copy third-party implementations without authorization.

---

# 12. Website Inspection

Website inspections shall evaluate:

- Information architecture
- Navigation
- User experience
- Accessibility
- Visual hierarchy
- Interaction patterns
- Performance observations
- Engineering opportunities

The objective is engineering analysis, not duplication.

---

# 13. API Inspection

API inspections shall document:

- API version
- Authentication model
- Endpoints
- Error handling
- Rate limits
- SDK availability
- Documentation quality
- Integration complexity

---

# 14. Benchmarking

Benchmarking shall compare engineering characteristics rather than visual appearance alone.

Examples include:

- Performance
- Scalability
- Maintainability
- Security
- User experience
- Accessibility
- AI integration
- Documentation quality

---

# 15. Copyright and Licensing

External resources shall respect all applicable licenses.

The Framework shall not encourage:

- Copyright infringement
- Unauthorized copying
- License violations

Every EAR shall record licensing information whenever applicable.

---

# 16. Prompt Generation

When external research is performed by an AI agent, prompts shall be documented whenever they materially influence engineering decisions.

Prompt records shall be stored as Engineering Prompt Records (EPR).

---

# 17. Traceability

Every external artifact shall reference:

- Parent ECR
- ERP
- Responsible specialist
- Source
- Date
- Version
- Related engineering reports

No engineering evidence shall exist without traceability.

---

# 18. Consensus Integration

The Consensus Agent shall consider external artifacts together with specialist reports.

Engineering consensus may use:

- ER
- ERP
- EER
- EIR
- ERR
- EAR
- EPR

External information supplements engineering judgment but does not replace it.

---

# 19. Human Authority

Engineering Managers may:

- approve ERP,
- reject ERP,
- modify ERP,
- restrict external sources,
- require additional evidence.

Human decisions take precedence over AI recommendations.

---

# 20. Prohibited Activities

The following activities are prohibited:

- Accessing external resources without ERP approval.
- Using undocumented external evidence.
- Omitting source attribution.
- Copying copyrighted implementations.
- Treating external opinions as engineering facts.
- Concealing source reliability.
- Using external assets without verifying licensing.
- Generating engineering conclusions without documenting supporting evidence.

---

# 21. Compliance

Projects not complying with this standard shall be considered non-conformant with the MUF Labs Engineering Framework.

Engineering Managers are responsible for enforcing compliance.

---

# 22. Continuous Improvement

Lessons learned from external research shall be incorporated into the Framework Knowledge Base whenever they provide reusable engineering value.

Every completed ERP should strengthen future engineering activities through improved standards, reusable references, and documented best practices.

---

# 23. Closing Statement

The MUF Labs Engineering Framework treats external resources as governed engineering inputs rather than unrestricted information sources.

Every external resource shall be:

- Authorized.
- Documented.
- Traceable.
- Reproducible.
- Legally compliant.
- Engineering relevant.

Engineering decisions shall always remain evidence-based, transparent, and accountable.
