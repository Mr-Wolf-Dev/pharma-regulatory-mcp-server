# FDA Recalls, 510(k) & Clinical Trials Intel + MCP

[![Glama MCP Server](https://glama.ai/mcp/servers/Mr-Wolf-Dev/pharma-regulatory-mcp-server/badges/score.svg)](https://glama.ai/mcp/servers/Mr-Wolf-Dev/pharma-regulatory-mcp-server)

**Keyless, HTTP-only (< 512 MB RAM) Apify Actor & Standby Streamable HTTP MCP Server** for life sciences, biotech, MedTech, and regulatory intelligence.

- **Apify Store:** `https://apify.com/mr.wolf/pharma-regulatory-mcp-server`
- **Standby MCP Endpoint:** `https://mr-wolf-1--pharma-regulatory-mcp-server.apify.actor/mcp`
- **Source Code:** `https://github.com/Mr-Wolf-Dev/pharma-regulatory-mcp-server`

## Official Keyless Data Sources

1. **openFDA Enforcement Recalls (`api.fda.gov`):** Drug, medical device, and food recalls with classification, reason, recalling firm, distribution pattern, and status.
2. **openFDA 510(k) Clearances (`api.fda.gov/device/510k.json`):** Premarket medical device clearances, applicants, decision dates, product codes, and advisory committees.
3. **ClinicalTrials.gov v2 (`clinicaltrials.gov/api/v2/studies`):** Clinical studies with NCT ID, sponsor, phases, recruitment status, enrollment, conditions, interventions, and site counts.

## MCP Tools (Streamable HTTP)

- `search_fda_recalls` — Search openFDA drug, device, or food enforcement recalls.
- `search_fda_device_510k` — Search openFDA 510(k) medical device clearances.
- `search_clinical_trials` — Search ClinicalTrials.gov v2 studies by condition, intervention, sponsor, status, or phase.

---

## Quick REST API Call

```bash
curl -X POST "https://api.apify.com/v2/acts/mr.wolf~pharma-regulatory-mcp-server/run-sync-get-dataset-items?token=YOUR_APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d {}
```

## Related HTTP-Only MCP Actors by Mr. Wolf

All Actors run HTTP-only (< 512 MB RAM, zero headless browsers) with Pay-Per-Event pricing and Streamable HTTP Standby MCP endpoints:

| Actor | Use Case | Apify Store | Source |
| --- | --- | --- | --- |
| **Shopify Store Intel, Apps & Catalog** | Themes, 28+ apps & pixels, BNPL payments, /products.json | [Apify Store](https://apify.com/mr.wolf/shopify-store-intel-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/shopify-store-intel-mcp-server) |
| **Global KYB Entity, LEI & EU VAT** | GLEIF LEI parent trees, EU VIES VAT, French SIRENE | [Apify Store](https://apify.com/mr.wolf/global-kyb-entity-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/global-kyb-entity-mcp-server) |
| **SEC EDGAR Filings & XBRL Financials** | 10-K, 10-Q, 8-K, Form 4 & US-GAAP XBRL metrics | [Apify Store](https://apify.com/mr.wolf/sec-edgar-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/sec-edgar-mcp-server) |
| **Tech & Startup Jobs (4 ATS APIs)** | Greenhouse, Lever, Ashby, SmartRecruiters + hiring signals | [Apify Store](https://apify.com/mr.wolf/ats-jobs-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/ats-jobs-mcp-server) |
| **B2B Domain Intel & Email Verifier** | DNS/MX/SPF/DMARC deliverability, tech stack & contacts | [Apify Store](https://apify.com/mr.wolf/domain-intel-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/domain-intel-mcp-server) |
| **EU Public Tenders & Grants (TED Europa)** | European procurement notices by CPV, country & budget | [Apify Store](https://apify.com/mr.wolf/eu-tenders-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/eu-tenders-mcp-server) |
| **SAM.gov US Federal Contracts** | Keyless US federal RFPs, NAICS & contracting officers | [Apify Store](https://apify.com/mr.wolf/us-sam-tenders-mcp-server) | [GitHub](https://github.com/Mr-Wolf-Dev/us-sam-tenders-mcp-server) |
