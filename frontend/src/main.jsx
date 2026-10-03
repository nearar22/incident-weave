import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { createTransactionKit } from "@genlayer/transaction-kit";
import { GenLayerTransactionPanel } from "@genlayer/transaction-kit-react";
import { Activity, AlertTriangle, ArrowUpRight, Check, CircleDot, ExternalLink, Fingerprint, Link2, LoaderCircle, Lock, Plus, Radio, ScanLine, ShieldAlert, Wallet, X } from "lucide-react";
import "./styles.css";
import "./tx.css";

const ADDRESS=import.meta.env.VITE_CONTRACT_ADDRESS||"";
const RPC=import.meta.env.VITE_GENLAYER_RPC_URL||"https://studio-next.genlayer.com/api";
const CHAIN_ID=Number(import.meta.env.VITE_GENLAYER_CHAIN_ID||"61997");
const CHAIN={...studioDevnet,id:CHAIN_ID,name:"GenLayer Studio Next",rpcUrls:{default:{http:[RPC]}}};
const EXPLORER="https://explorer-studio-dev.genlayer.com";
const SOURCE_A="https://raw.githubusercontent.com/nearar22/incident-weave/b45a1780b71e82a2917fa6d1ef14b057429541b6/docs/status-core.txt";
const SOURCE_B="https://raw.githubusercontent.com/nearar22/incident-weave/b45a1780b71e82a2917fa6d1ef14b057429541b6/docs/status-edge.txt";
const SOURCE_C="https://raw.githubusercontent.com/nearar22/incident-weave/ae6850d1ac1831674cd68bc6a190faa3522a8729/docs/status-resolution.txt";
const clean=value=>value instanceof Map?Object.fromEntries([...value].map(([k,v])=>[k,clean(v)])):Array.isArray(value)?value.map(clean):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clean(v)])):typeof value==="bigint"?Number(value):value;
const short=value=>value?`${value.slice(0,6)}…${value.slice(-4)}`:"";

function App(){
  const [incidentId,setIncidentId]=useState("incidentweave-demo");
  const [title,setTitle]=useState("Meridian API split report");
  const [question,setQuestion]=useState("Reconstruct the operational sequence and expose disagreements between public status reports before the postmortem is sealed.");
  const [windowText,setWindowText]=useState("October 3, 2026 from 09:00 to 11:00 UTC");
  const [sources,setSources]=useState([SOURCE_A,SOURCE_B]);
  const [witness,setWitness]=useState(SOURCE_C);
  const [events,setEvents]=useState(JSON.stringify([{index:0,kind:"OUTAGE",source_index:0,time_quote:"09:45 UTC",quote:"Requests are failing for customers in Europe."},{index:1,kind:"OPERATIONAL",source_index:1,time_quote:"09:45 UTC",quote:"API traffic is operating normally in every region."}],null,2));
  const [conflicts,setConflicts]=useState(JSON.stringify([{left_event:0,right_event:1,reason:"Both sources describe the same checkpoint but disagree on whether the API is impaired."}],null,2));
  const [witnessEvent,setWitnessEvent]=useState(JSON.stringify({kind:"RESOLVED",time_quote:"10:20 UTC",quote:"Error rates returned to normal and the incident is resolved."}));
  const [record,setRecord]=useState(null);
  const [wallet,setWallet]=useState(null);
  const [action,setAction]=useState(null);
  const [notice,setNotice]=useState("");
  const [loading,setLoading]=useState(false);
  const client=useMemo(()=>createClient({chain:CHAIN}),[]);
  const kit=useMemo(()=>wallet&&window.ethereum?createTransactionKit({chain:CHAIN,provider:window.ethereum,account:wallet}):null,[wallet]);

  const read=useCallback(async()=>{
    if(!ADDRESS||!incidentId.trim())return;
    setLoading(true);
    try{setRecord(clean(await client.readContract({address:ADDRESS,functionName:"get_incident",args:[incidentId.trim()],jsonSafeReturn:true})));setNotice("");}
    catch{setRecord(null);setNotice("No on-chain incident was found for this ID. Open a new incident or load the public demo.");}
    finally{setLoading(false);}
  },[client,incidentId]);
  useEffect(()=>{void read();},[read]);

  async function connect(){
    if(!window.ethereum){setNotice("Install a browser wallet to write. Sealed incident records remain public without one.");return;}
    try{const accounts=await window.ethereum.request({method:"eth_requestAccounts"});const hex=`0x${CHAIN_ID.toString(16)}`;try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:hex}]});}catch(error){if(error?.code!==4902)throw error;await window.ethereum.request({method:"wallet_addEthereumChain",params:[{chainId:hex,chainName:"GenLayer Studio Next",rpcUrls:[RPC],nativeCurrency:{name:"GEN",symbol:"GEN",decimals:18}}]});}setWallet(accounts[0]);setNotice("");}
    catch(error){setNotice(error?.message||"Wallet connection did not complete.");}
  }

  const tx=useMemo(()=>{
    if(!ADDRESS||!action)return null;const base={kind:"write",address:ADDRESS};
    if(action==="open")return {...base,method:"open_incident",args:[incidentId.trim(),title.trim(),question.trim(),windowText.trim(),JSON.stringify(sources.map(x=>x.trim()).filter(Boolean)),events,conflicts]};
    if(action==="synthesize")return {...base,method:"synthesize",args:[incidentId.trim()]};
    if(action==="witness")return {...base,method:"add_witness_source",args:[incidentId.trim(),witness.trim(),witnessEvent,conflicts]};
    return {...base,method:"seal",args:[incidentId.trim()]};
  },[action,incidentId,title,question,windowText,sources,witness]);
  function submit(next){if(!kit){setNotice("Connect your Studio Next wallet first.");return;}setNotice("");setAction(next);}
  function done(status){if(status.phase==="finalized"){setAction(null);if(status.successful)void read();else setNotice(`Transaction failed: ${status.executionResultName||status.statusName||"contract rejected the input"}.`);}}
  const weave=record?.weave||null;
  const eventByIndex=index=>weave?.events?.find(event=>event.index===index);

  return <div className="app-shell">
    <header><a className="brand" href="#"><span className="brand-glyph"><Radio size={18}/></span><strong>INCIDENT/<i>WEAVE</i></strong></a><div className="header-right"><span className="chain"><i/>STUDIO NEXT {CHAIN_ID}</span><button onClick={connect} className="connect"><Wallet size={15}/>{wallet?short(wallet):"CONNECT"}</button></div></header>
    <main>
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><ScanLine size={15}/> MULTI-SOURCE INCIDENT INTELLIGENCE</div><h1>One outage.<br/><span>Three versions</span> of truth.</h1><p>IncidentWeave turns contradictory status pages into a validator-audited chronology without smoothing away the disagreement.</p></div><div className="scope"><div className="scope-ring"><div><b>{weave?.events?.length||"02"}</b><span>SIGNALS</span></div></div><div className="scope-meta"><span><i className="lime"/> SOURCE SNAPSHOT</span><span><i className="red"/> CONFLICT EDGES</span><span><i className="blue"/> ON-CHAIN RECEIPTS</span></div></div></section>
      <section className="console">
        <aside>
          <p className="section-tag">INCIDENT CHANNEL</p>
          <div className="load-row"><input value={incidentId} onChange={e=>setIncidentId(e.target.value)}/><button onClick={()=>void read()} aria-label="Load incident">{loading?<LoaderCircle className="spin" size={17}/>:<ArrowUpRight size={17}/>}</button></div>
          <div className="protocol"><span>01</span><div><b>Pin sources</b><small>Strict validator equality</small></div></div><div className="protocol"><span>02</span><div><b>Weave events</b><small>Quote-bound consensus</small></div></div><div className="protocol"><span>03</span><div><b>Expose conflict</b><small>No silent reconciliation</small></div></div>
          {ADDRESS&&<a className="contract" href={`${EXPLORER}/address/${ADDRESS}`} target="_blank"><Fingerprint size={15}/> CONTRACT {short(ADDRESS)}<ExternalLink size={12}/></a>}
          <div className="boundary"><Lock size={14}/><p>Evidence organizer only. A submitted URL is not automatically authoritative.</p></div>
        </aside>
        <div className="stage">
          {notice&&<div className="notice"><AlertTriangle size={16}/><span>{notice}</span><button onClick={()=>setNotice("")}><X size={14}/></button></div>}
          {!record&&<section className="open-panel"><div className="panel-head"><span>NEW INCIDENT</span><b>IW/01</b></div><h2>Define the question.<br/>Let the sources disagree.</h2><div className="field-grid"><label><span>INCIDENT TITLE</span><input value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/></label><label><span>OBSERVATION WINDOW</span><input value={windowText} onChange={e=>setWindowText(e.target.value)} maxLength={160}/></label></div><label><span>QUESTION FOR THE RECORD</span><textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={3} maxLength={600}/></label><div className="source-stack"><div className="source-head"><div><Link2 size={16}/><b>STATUS SOURCES</b></div><small>2 to 4 public HTTPS pages</small></div>{sources.map((source,index)=><div className="source-input" key={index}><span>CH {index+1}</span><input aria-label={`Status source ${index+1}`} value={source} onChange={e=>setSources(list=>list.map((x,i)=>i===index?e.target.value:x))}/>{sources.length>2&&<button onClick={()=>setSources(list=>list.filter((_,i)=>i!==index))}><X size={14}/></button>}</div>)}{sources.length<4&&<button className="add" onClick={()=>setSources(list=>[...list,""])}><Plus size={14}/> ADD CHANNEL</button>}</div><div className="field-grid evidence-json"><label><span>EXACT EVENT OBSERVATIONS / JSON</span><textarea value={events} onChange={e=>setEvents(e.target.value)} rows={8}/></label><label><span>PROPOSED CONFLICT EDGES / JSON</span><textarea value={conflicts} onChange={e=>setConflicts(e.target.value)} rows={8}/></label></div><button className="execute" onClick={()=>submit("open")}><Activity size={17}/> OPEN INCIDENT</button></section>}
          {record&&<section className="weave-panel"><div className="record-head"><div><span>RECORD / {record.id}</span><h2>{record.title}</h2><p>{record.window}</p></div><div className={`record-status ${record.status.toLowerCase()}`}>{record.status}</div></div>
            {record.status==="READY"&&<div className="ready-block"><div className="pulse"><i/><i/><i/></div><div><b>{record.revision?"Witness source attached":"Sources pinned"}</b><p>Run semantic consensus to build the event weave and conflict graph.</p></div><button onClick={()=>submit("synthesize")}><ScanLine size={17}/> SYNTHESIZE</button></div>}
            {weave?.events&&<><div className="phase-strip"><span>DERIVED PHASE</span><b>{weave.phase.replaceAll("_"," ")}</b><small>{weave.conflicts.length} CONFLICT EDGE{weave.conflicts.length===1?"":"S"}</small></div><div className="timeline">{weave.events.map((event,index)=><article key={event.index} className={`event ${event.kind.toLowerCase()}`}><div className="rail"><span>{String(index+1).padStart(2,"0")}</span><i/></div><div className="event-card"><div><b>{event.kind}</b><time>{event.time_quote||"TIME UNSTATED"}</time></div><blockquote>“{event.quote}”</blockquote><small>CHANNEL {event.source_index+1} · {weave.source_receipts[event.source_index]?.host}</small></div></article>)}</div>
              {weave.conflicts.length>0&&<div className="conflict-board"><div className="conflict-title"><ShieldAlert size={18}/><b>CONFLICTS PRESERVED</b><span>{weave.conflicts.length}</span></div>{weave.conflicts.map((conflict,index)=><div className="conflict-row" key={index}><div><span>EV {conflict.left_event+1}</span><p>{eventByIndex(conflict.left_event)?.kind}</p></div><div className="clash"><i/><AlertTriangle size={15}/><i/></div><div><span>EV {conflict.right_event+1}</span><p>{eventByIndex(conflict.right_event)?.kind}</p></div><small>{conflict.reason}</small></div>)}</div>}
              <div className="receipt-grid">{weave.source_receipts.map(receipt=><a href={receipt.url} target="_blank" key={receipt.index}><span><CircleDot size={12}/> CH {receipt.index+1}</span><b>{receipt.host}</b><code>{receipt.sha256.slice(0,10)}…{receipt.sha256.slice(-6)}</code></a>)}</div>
              {record.status==="SYNTHESIZED"&&<div className="decision"><div><b>Keep the record open?</b><span>{record.revision===0?"Attach one witness source or seal this weave.":"The witness pass is complete. Seal the final weave."}</span></div>{record.revision===0&&<div className="witness witness-fields"><input value={witness} onChange={e=>setWitness(e.target.value)} placeholder="Witness source URL"/><input value={witnessEvent} onChange={e=>setWitnessEvent(e.target.value)} placeholder="Witness event JSON"/><button onClick={()=>submit("witness")}>ADD WITNESS</button></div>}<button className="seal" onClick={()=>submit("seal")}><Check size={15}/> SEAL WEAVE</button></div>}
            </>}
          </section>}
          {!ADDRESS&&<div className="config">LIVE CONTRACT ADDRESS NOT CONFIGURED</div>}
        </div>
      </section>
    </main>
    <footer><span>INCIDENTWEAVE / EVIDENCE BEFORE NARRATIVE</span><a href="https://github.com/nearar22/incident-weave" target="_blank">SOURCE <ExternalLink size={12}/></a></footer>
    {action&&kit&&tx&&<div className="tx-overlay"><div className="tx-modal"><div className="tx-title"><span>GENLAYER CONSENSUS</span><button onClick={()=>setAction(null)}><X size={16}/></button></div><GenLayerTransactionPanel kit={kit} tx={tx} network="GenLayer Studio Next" theme="dark" trackUntil="finalized" onDone={done}/></div></div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App/>);
