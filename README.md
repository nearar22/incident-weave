# IncidentWeave

Incident timelines are usually written by one operator after the fact. IncidentWeave preserves the disagreement instead. It fetches two to four public status sources through GenLayer validators, extracts an evidence-bound chronology, and records every cross-source contradiction before the incident is sealed.

## Lifecycle

1. Open an incident with a question, observation window, and at least two public HTTPS status sources.
2. Validators agree on an exact frozen snapshot of every source.
3. The operator proposes exact event observations and conflict edges. Contract code proves every quote exists in its cited source, then comparative consensus checks the full chronology, semantic kinds, and conflict graph against the frozen record.
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

## Live deployment

- Network: GenLayer Studio Next, chain `61997`
- Contract: [`0xEC19104A5415Ba8e663a62f8a474846269dAc665`](https://explorer-studio-dev.genlayer.com/address/0xEC19104A5415Ba8e663a62f8a474846269dAc665)
- Deployment transaction: [`0x62112e2a...648e75a`](https://explorer-studio-dev.genlayer.com/tx/0x62112e2a523e12184f1925d81aaf9890bc15b2245ca67249daf636135648e75a)
- Public demo incident: `weave-demo-muskilj4`
- Exact deployed source match: verified in [`deployment.json`](deployment.json)

The public demo begins with two sources making opposite operational claims at the same 09:45 UTC checkpoint. Consensus stores the phase as `DISPUTED`. The owner then adds one independent resolution witness, the complete evidence proposal is revalidated against all three frozen sources, and the final record is sealed as `RESOLVED_DISPUTED` without erasing the original conflict.
