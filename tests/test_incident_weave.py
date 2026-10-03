import json
import sys

CONTRACT = "contracts/incident_weave.py"
URL_A = "https://status.example.org/core"
URL_B = "https://edge.example.net/api"
URL_C = "https://ops.example.com/final"
SOURCE_A = "Core API incident log. 09:15 UTC: Requests are failing for customers in Europe. 10:00 UTC: The incident remains active while engineers investigate."
SOURCE_B = "Edge status bulletin. 09:45 UTC: API traffic is operating normally in every region. No active incident is shown on this page."
SOURCE_C = "Independent operations note. 10:20 UTC: Error rates returned to normal and the incident is resolved. Monitoring continues."


def result(with_third=False):
    events = [
        {"index": 0, "kind": "OUTAGE", "source_index": 0, "time_quote": "09:15 UTC", "quote": "Requests are failing for customers in Europe"},
        {"index": 1, "kind": "OPERATIONAL", "source_index": 1, "time_quote": "09:45 UTC", "quote": "API traffic is operating normally in every region"},
    ]
    if with_third:
        events.append({"index": 2, "kind": "RESOLVED", "source_index": 2, "time_quote": "10:20 UTC", "quote": "Error rates returned to normal and the incident is resolved"})
    return {"events": events, "conflicts": [{"left_event": 0, "right_event": 1, "reason": "The sources disagree on whether the API was impaired."}]}


def open_record(contract):
    return contract.open_incident("core-api-oct", "Core API regional incident", "Determine the operational sequence and expose conflicts between public status reports.", "October 3, 2026 from 09:00 to 11:00 UTC", json.dumps([URL_A, URL_B]))


def enable_consensus(contract, monkeypatch, comparator=None):
    module = sys.modules[contract.__class__.__module__]
    monkeypatch.setattr(module.gl.eq_principle, "strict_eq", lambda fn: fn())
    monkeypatch.setattr(module.gl.eq_principle, "prompt_comparative", comparator or (lambda fn, *_args, **_kwargs: fn()))


def mocks(vm, with_third=False):
    vm.mock_web(URL_A, {"method": "GET", "status": 200, "body": SOURCE_A})
    vm.mock_web(URL_B, {"method": "GET", "status": 200, "body": SOURCE_B})
    if with_third:
        vm.mock_web(URL_C, {"method": "GET", "status": 200, "body": SOURCE_C})
    vm.mock_llm("INCIDENTWEAVE_PRODUCER", json.dumps(json.dumps(result(with_third))))


def test_contract_loads(direct_deploy):
    assert direct_deploy(CONTRACT) is not None


def test_rejects_unsafe_and_duplicate_sources(direct_vm, direct_deploy):
    contract = direct_deploy(CONTRACT)
    with direct_vm.expect_revert("public HTTPS"):
        contract.open_incident("unsafe-case", "Unsafe incident", "Trace a detailed incident across at least two operator sources.", "Today 09:00 to 10:00 UTC", json.dumps(["http://localhost/a", URL_B]))
    open_record(contract)
    with direct_vm.expect_revert("already exists"):
        open_record(contract)


def test_synthesis_binds_every_source_and_conflict(direct_vm, direct_deploy, monkeypatch):
    contract = direct_deploy(CONTRACT); enable_consensus(contract, monkeypatch); incident_id = open_record(contract); mocks(direct_vm)
    weave = contract.synthesize(incident_id)
    assert weave["phase"] == "DISPUTED" and len(weave["source_receipts"]) == 2 and len(weave["conflicts"]) == 1
    assert contract.get_incident(incident_id)["status"] == "SYNTHESIZED"


def test_forged_event_quote_fails_closed(direct_vm, direct_deploy, monkeypatch):
    contract = direct_deploy(CONTRACT); enable_consensus(contract, monkeypatch); incident_id = open_record(contract)
    forged = result(); forged["events"][0]["quote"] = "All systems were healthy"
    direct_vm.mock_web(URL_A, {"method": "GET", "status": 200, "body": SOURCE_A}); direct_vm.mock_web(URL_B, {"method": "GET", "status": 200, "body": SOURCE_B}); direct_vm.mock_llm("INCIDENTWEAVE_PRODUCER", json.dumps(json.dumps(forged)))
    with direct_vm.expect_revert("Event quote"):
        contract.synthesize(incident_id)


def test_conflict_must_cross_sources(direct_vm, direct_deploy, monkeypatch):
    contract = direct_deploy(CONTRACT); enable_consensus(contract, monkeypatch); incident_id = open_record(contract)
    forged = result(); forged["events"][1]["source_index"] = 0; forged["events"][1]["time_quote"] = "10:00 UTC"; forged["events"][1]["quote"] = "The incident remains active while engineers investigate"
    direct_vm.mock_web(URL_A, {"method": "GET", "status": 200, "body": SOURCE_A}); direct_vm.mock_web(URL_B, {"method": "GET", "status": 200, "body": SOURCE_B}); direct_vm.mock_llm("INCIDENTWEAVE_PRODUCER", json.dumps(json.dumps(forged)))
    with direct_vm.expect_revert("Every source"):
        contract.synthesize(incident_id)


def test_comparator_cannot_replace_schema(direct_vm, direct_deploy, monkeypatch):
    contract = direct_deploy(CONTRACT)
    def replace(fn, *_args, **_kwargs):
        fn(); return json.dumps({"timeline": [], "phase": "STABLE"})
    enable_consensus(contract, monkeypatch, replace); incident_id = open_record(contract); mocks(direct_vm)
    with direct_vm.expect_revert("Two to twelve events"):
        contract.synthesize(incident_id)


def test_owner_adds_one_witness_reweaves_and_seals(direct_vm, direct_deploy, direct_alice, direct_bob, monkeypatch):
    contract = direct_deploy(CONTRACT); enable_consensus(contract, monkeypatch); direct_vm.sender = direct_alice; incident_id = open_record(contract); mocks(direct_vm); contract.synthesize(incident_id); direct_vm.clear_mocks()
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only the incident owner"):
        contract.add_witness_source(incident_id, URL_C)
    direct_vm.sender = direct_alice
    assert contract.add_witness_source(incident_id, URL_C)["source_count"] == 3
    mocks(direct_vm, True); weave = contract.synthesize(incident_id); direct_vm.clear_mocks()
    assert weave["phase"] == "RESOLVED_DISPUTED"
    assert contract.seal(incident_id)["status"] == "SEALED"
    with direct_vm.expect_revert("Only a synthesized incident"):
        contract.seal(incident_id)
