# FDA Recalls, 510(k) & Clinical Trials Intel + MCP

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
