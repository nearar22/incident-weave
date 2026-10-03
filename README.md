# IncidentWeave

Incident timelines are usually written by one operator after the fact. IncidentWeave preserves the disagreement instead. It fetches two to four public status sources through GenLayer validators, extracts an evidence-bound chronology, and records every cross-source contradiction before the incident is sealed.

## Lifecycle

1. Open an incident with a question, observation window, and at least two public HTTPS status sources.
2. Validators agree on an exact frozen snapshot of every source.
3. A proposed chronology cites exact event and timestamp quotes. Comparative consensus checks the full event set and conflict graph against the frozen record.
4. The owner may add one witness source, forcing a complete resynthesis.
5. The owner seals the final weave. Source receipts, events, conflicts, and phase remain on-chain.

The phase is derived by contract code. It becomes `DISPUTED` when sources conflict, `RESOLVED_DISPUTED` when a resolution exists but historical conflict remains, `ACTIVE` for unopposed impairment, `RESOLVED` for an unopposed resolution, and `STABLE` otherwise.

## Safety boundary

IncidentWeave is an evidence-organizing tool, not an availability monitor or authoritative root-cause report. Caller-provided URLs are not automatically official. The three included status files are explicitly marked demonstration fixtures.

## Verify locally

```bash
python -m pytest tests -q
genvm-lint lint contracts/incident_weave.py --json
cd frontend
npm ci
npm test
npm run build
```

Deployment evidence will be added only after the exact reviewed source passes its live Studio Next lifecycle.
