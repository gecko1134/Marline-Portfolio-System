import React, { useState, useEffect, useCallback, useMemo } from "react";

const API_URL = "/api/anthropic";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOOL_ROUNDS = 12;

const C = {
  bg:"#060A10",card:"#0C1018",header:"#0E1320",surface:"#1A2942",
  border:"#161D2E",borderLight:"#1E2740",
  accent:"#00D4AA",blue:"#2E8BFF",purple:"#9366FF",cyan:"#00BCD4",
  magenta:"#E040FB",green:"#00E676",red:"#FF3D57",amber:"#FFB300",orange:"#FF7043",
  text:"#CDD6E4",textDim:"#6A7590",textMuted:"#3D4A63",
  navy:"#060E1F",deep:"#0B1529",panel:"#0F1D35",
  gradientAccent:"linear-gradient(135deg,#00D4AA,#0088CC)",
};

const USERS = {
  "shaun@marlinewm.com":{name:"Shaun",role:"advisor",pass:"Marline2026!",modules:["intelligence","options","portfolio"]},
  "advisor@marlinewm.com":{name:"Advisor",role:"advisor",pass:"advisor123",modules:["intelligence","options","portfolio"]},
  "client1@example.com":{name:"Sarah Chen",role:"client",pass:"client123",modules:["portfolio"]},
  "client2@example.com":{name:"Michael Torres",role:"client",pass:"client456",modules:["portfolio"]},
};

const INVESTOR_STYLES = {
  balanced:{id:"balanced",name:"Balanced",icon:"\u25CE",color:"#00D4AA",short:"Default multi-factor",persona:"Portfolio Manager",weights:{trend:30,tech:25,fund:25,dwa:20},thresholds:{strongBuy:75,buy:60,sell:35,strongSell:20},fsm:{fullyInvested:0.70,caution:0.50,defensive:0.30},rebalanceBand:5,cashMax:15,hedgeMultiplier:1.0,aiPersona:"You are a balanced portfolio manager. Weight all signal systems equally.",emphasis:"Multi-factor agreement, risk-adjusted returns",category:"core"},
  technical:{id:"technical",name:"Technical",icon:"\u27E1",color:"#2E8BFF",short:"Chart-driven momentum",persona:"Technical Analyst",weights:{trend:20,tech:40,fund:10,dwa:30},thresholds:{strongBuy:70,buy:55,sell:40,strongSell:25},fsm:{fullyInvested:0.65,caution:0.45,defensive:0.30},rebalanceBand:3,cashMax:20,hedgeMultiplier:1.2,aiPersona:"You are a technical analyst. Prioritize Bollinger Bands, Elliott Wave, Gann angles.",emphasis:"Bollinger %B, Elliott Wave, Gann, RSI",category:"active"},
  contrarian:{id:"contrarian",name:"Contrarian",icon:"\u27F2",color:"#E040FB",short:"Buy fear, sell greed",persona:"Contrarian Strategist",weights:{trend:15,tech:30,fund:35,dwa:20},thresholds:{strongBuy:25,buy:35,sell:70,strongSell:85},fsm:{fullyInvested:0.30,caution:0.45,defensive:0.65},rebalanceBand:8,cashMax:30,hedgeMultiplier:0.5,invertSignals:true,aiPersona:"You are a contrarian. Buy when others fear, sell when greedy.",emphasis:"VIX, sentiment extremes, mean reversion",category:"active"},
  longTerm:{id:"longTerm",name:"Long-Term Growth",icon:"\u27F6",color:"#00E676",short:"Buy quality, hold",persona:"Long-Term Investor",weights:{trend:35,tech:10,fund:40,dwa:15},thresholds:{strongBuy:80,buy:65,sell:25,strongSell:15},fsm:{fullyInvested:0.75,caution:0.55,defensive:0.25},rebalanceBand:10,cashMax:10,hedgeMultiplier:0.6,aiPersona:"You are a long-term growth investor. Focus on secular trends and compounding.",emphasis:"Multi-year trend, fundamentals, dividend yield",category:"core"},
  momentum:{id:"momentum",name:"Momentum",icon:"\u27FF",color:"#FFB300",short:"Ride winners, cut losers",persona:"Momentum Trader",weights:{trend:35,tech:25,fund:5,dwa:35},thresholds:{strongBuy:72,buy:58,sell:38,strongSell:22},fsm:{fullyInvested:0.68,caution:0.48,defensive:0.28},rebalanceBand:3,cashMax:20,hedgeMultiplier:1.3,aiPersona:"You are a momentum trader. Ride winners hard, cut losers quickly.",emphasis:"1M/3M/6M returns, DWA relative strength",category:"active"},
  value:{id:"value",name:"Value",icon:"\u25C8",color:"#00BCD4",short:"Buy cheap, fundamentals first",persona:"Value Analyst",weights:{trend:15,tech:10,fund:50,dwa:25},thresholds:{strongBuy:78,buy:62,sell:32,strongSell:18},fsm:{fullyInvested:0.72,caution:0.52,defensive:0.28},rebalanceBand:7,cashMax:20,hedgeMultiplier:0.8,aiPersona:"You are a value analyst. Prioritize forward P/E, dividend yield, Sharpe ratio.",emphasis:"Forward P/E, dividend yield, Sharpe ratio",category:"core"},
  income:{id:"income",name:"Income",icon:"\u25C9",color:"#66BB6A",short:"Maximize yield",persona:"Income Strategist",weights:{trend:20,tech:10,fund:45,dwa:25},thresholds:{strongBuy:72,buy:58,sell:38,strongSell:22},fsm:{fullyInvested:0.70,caution:0.55,defensive:0.35},rebalanceBand:6,cashMax:15,hedgeMultiplier:1.1,aiPersona:"You are an income strategist. Prioritize dividend yield and capital preservation.",emphasis:"Dividend yield, income reliability, bond allocation",category:"core"},
  thematic:{id:"thematic",name:"Thematic/Macro",icon:"\u25C6",color:"#9366FF",short:"Big-picture themes",persona:"Macro Strategist",weights:{trend:30,tech:15,fund:25,dwa:30},thresholds:{strongBuy:73,buy:58,sell:37,strongSell:22},fsm:{fullyInvested:0.68,caution:0.48,defensive:0.28},rebalanceBand:6,cashMax:20,hedgeMultiplier:1.0,aiPersona:"You are a macro strategist. Analyze through AI disruption, monetary policy, geopolitics.",emphasis:"Economic cycle, sector rotation, macro themes",category:"active"},
  riskParity:{id:"riskParity",name:"Risk Parity",icon:"\u2295",color:"#FF7043",short:"Equal risk contribution",persona:"Risk Parity Manager",weights:{trend:25,tech:20,fund:30,dwa:25},thresholds:{strongBuy:76,buy:62,sell:33,strongSell:18},fsm:{fullyInvested:0.72,caution:0.52,defensive:0.32},rebalanceBand:4,cashMax:12,hedgeMultiplier:1.5,aiPersona:"You are a risk parity manager. Focus on volatility contribution and correlation.",emphasis:"Volatility, beta, correlation, managed futures",category:"systematic"},
  tactical:{id:"tactical",name:"Tactical",icon:"\u27E1",color:"#FF3D57",short:"Shift with regimes",persona:"Tactical Allocator",weights:{trend:30,tech:30,fund:15,dwa:25},thresholds:{strongBuy:68,buy:52,sell:42,strongSell:28},fsm:{fullyInvested:0.65,caution:0.45,defensive:0.30},rebalanceBand:2,cashMax:35,hedgeMultiplier:1.8,aiPersona:"You are a tactical allocator. React quickly to regime changes.",emphasis:"Regime detection, VIX, cash triggers",category:"active"},
  esg:{id:"esg",name:"ESG",icon:"\u22C9",color:"#4CAF50",short:"Sustainability",persona:"ESG Analyst",weights:{trend:25,tech:15,fund:40,dwa:20},thresholds:{strongBuy:74,buy:60,sell:34,strongSell:20},fsm:{fullyInvested:0.70,caution:0.50,defensive:0.30},rebalanceBand:6,cashMax:15,hedgeMultiplier:0.9,aiPersona:"You are an ESG analyst. Evaluate holdings for environmental and governance risks.",emphasis:"ESG risk, governance, carbon exposure",category:"systematic"},
  quantitative:{id:"quantitative",name:"Quantitative",icon:"\u27E0",color:"#AB47BC",short:"Pure rules-based",persona:"Quant Strategist",weights:{trend:25,tech:25,fund:25,dwa:25},thresholds:{strongBuy:75,buy:60,sell:35,strongSell:20},fsm:{fullyInvested:0.70,caution:0.50,defensive:0.30},rebalanceBand:5,cashMax:15,hedgeMultiplier:1.0,aiPersona:"You are a quant. Base ALL recommendations strictly on composite scores.",emphasis:"Composite scores, signal agreement, systematic output",category:"systematic"},
};
const STYLE_CATEGORIES = {core:{label:"Core"},active:{label:"Active"},systematic:{label:"Systematic"}};
function getStyleWeights(id){const s=INVESTOR_STYLES[id]||INVESTOR_STYLES.balanced;return{trend:s.weights.trend/100,tech:s.weights.tech/100,fund:s.weights.fund/100,dwa:s.weights.dwa/100}}
function getStyleThresholds(id){return(INVESTOR_STYLES[id]||INVESTOR_STYLES.balanced).thresholds}
function getStyleFSM(id){return(INVESTOR_STYLES[id]||INVESTOR_STYLES.balanced).fsm}

const HOLDINGS=[
  {ticker:"SPY",name:"S&P 500 ETF",class:"US Eq",type:"ETF",target:8},{ticker:"QQQ",name:"Nasdaq 100 ETF",class:"US Eq",type:"ETF",target:7},
  {ticker:"IWM",name:"Russell 2000 ETF",class:"US Eq",type:"ETF",target:4},{ticker:"EFA",name:"MSCI EAFE",class:"Intl",type:"ETF",target:5},
  {ticker:"EEM",name:"MSCI Emerging Mkts",class:"Intl",type:"ETF",target:3},{ticker:"AGG",name:"US Agg Bond",class:"Bond",type:"ETF",target:10},
  {ticker:"TLT",name:"20+ Yr Treasury",class:"Bond",type:"ETF",target:5},{ticker:"GLD",name:"Gold Trust",class:"Alt",type:"ETF",target:8},
  {ticker:"VNQ",name:"US REITs",class:"REIT",type:"ETF",target:5},{ticker:"XLK",name:"Technology Select",class:"US Eq",type:"ETF",target:8},
  {ticker:"XLV",name:"Healthcare Select",class:"US Eq",type:"ETF",target:4},{ticker:"XLE",name:"Energy Select",class:"US Eq",type:"ETF",target:3},
  {ticker:"XLF",name:"Financial Select",class:"US Eq",type:"ETF",target:4},{ticker:"DBMF",name:"iMGP DBi Mgd Fut",class:"MF",type:"ETF",target:6},
  {ticker:"CTA",name:"Simplify Mgd Fut",class:"MF",type:"ETF",target:4},{ticker:"KMLM",name:"KFA Mgd Fut",class:"MF",type:"ETF",target:4},
  {ticker:"BTAL",name:"Anti-Beta L/S",class:"Hedge",type:"ETF",target:3},{ticker:"TAIL",name:"Cambria Tail Risk",class:"Hedge",type:"ETF",target:2},
  {ticker:"AAPL",name:"Apple Inc",class:"US Eq",type:"Stock",target:2},{ticker:"MSFT",name:"Microsoft Corp",class:"US Eq",type:"Stock",target:2},
  {ticker:"NVDA",name:"NVIDIA Corp",class:"US Eq",type:"Stock",target:1},{ticker:"JPM",name:"JPMorgan Chase",class:"US Eq",type:"Stock",target:2},
];

const SI_UNIVERSE=[
  {ticker:"GME",name:"GameStop",sector:"Retail",category:"Meme/Squeeze",siPct:24.2,dtc:6.8,floatShort:28.1,avgVol:"4.2M",optionsVol:"Very High",iv:89,ivRank:78,catalyst:"Ryan Cohen"},
  {ticker:"AMC",name:"AMC Entertainment",sector:"Entertainment",category:"Meme/Squeeze",siPct:21.5,dtc:3.2,floatShort:22.8,avgVol:"12.1M",optionsVol:"Very High",iv:95,ivRank:72,catalyst:"Box office"},
  {ticker:"UPST",name:"Upstart Holdings",sector:"Fintech",category:"High SI",siPct:31.5,dtc:7.2,floatShort:35.1,avgVol:"3.8M",optionsVol:"High",iv:82,ivRank:71,catalyst:"AI lending"},
  {ticker:"CVNA",name:"Carvana Co",sector:"Auto",category:"High SI",siPct:18.7,dtc:5.4,floatShort:21.3,avgVol:"8.5M",optionsVol:"High",iv:78,ivRank:65,catalyst:"Profitability"},
  {ticker:"SMCI",name:"Super Micro",sector:"Tech/AI",category:"High SI",siPct:14.2,dtc:2.8,floatShort:16.5,avgVol:"22.1M",optionsVol:"Very High",iv:88,ivRank:82,catalyst:"AI servers"},
  {ticker:"MSTR",name:"MicroStrategy",sector:"Tech/Crypto",category:"High SI",siPct:19.3,dtc:3.5,floatShort:22.1,avgVol:"15.7M",optionsVol:"Very High",iv:102,ivRank:68,catalyst:"Bitcoin"},
  {ticker:"TSLA",name:"Tesla",sector:"EV/Tech",category:"Options Flow",siPct:3.2,dtc:1.1,floatShort:3.8,avgVol:"85M",optionsVol:"Extreme",iv:52,ivRank:45,catalyst:"Robotaxi"},
  {ticker:"NVDA",name:"NVIDIA",sector:"Semiconductors",category:"Options Flow",siPct:1.1,dtc:0.8,floatShort:1.4,avgVol:"120M",optionsVol:"Extreme",iv:48,ivRank:38,catalyst:"Blackwell"},
  {ticker:"AAPL",name:"Apple",sector:"Tech",category:"Options Flow",siPct:0.7,dtc:0.9,floatShort:0.9,avgVol:"52M",optionsVol:"Extreme",iv:22,ivRank:32,catalyst:"Apple Intelligence"},
  {ticker:"AMD",name:"AMD",sector:"Semiconductors",category:"Options Flow",siPct:4.5,dtc:1.8,floatShort:5.2,avgVol:"38M",optionsVol:"Very High",iv:45,ivRank:42,catalyst:"MI400"},
  {ticker:"SPY",name:"S&P 500 ETF",sector:"Index",category:"ETF Options",siPct:0.1,dtc:0.1,floatShort:0.1,avgVol:"65M",optionsVol:"Extreme",iv:15,ivRank:28,catalyst:"Fed policy"},
  {ticker:"QQQ",name:"Invesco QQQ",sector:"Tech ETF",category:"ETF Options",siPct:0.2,dtc:0.1,floatShort:0.2,avgVol:"42M",optionsVol:"Extreme",iv:19,ivRank:31,catalyst:"AI theme"},
  {ticker:"IWM",name:"Russell 2000",sector:"Small Cap",category:"ETF Options",siPct:0.3,dtc:0.2,floatShort:0.4,avgVol:"28M",optionsVol:"Very High",iv:22,ivRank:35,catalyst:"Rotation"},
  {ticker:"TLT",name:"20+ Year Treasury",sector:"Bond ETF",category:"ETF Options",siPct:2.1,dtc:1.5,floatShort:2.5,avgVol:"22M",optionsVol:"Very High",iv:18,ivRank:55,catalyst:"Fed pivot"},
  {ticker:"GLD",name:"SPDR Gold",sector:"Commodity",category:"ETF Options",siPct:0.1,dtc:0.1,floatShort:0.1,avgVol:"8M",optionsVol:"High",iv:16,ivRank:45,catalyst:"Inflation"},
  {ticker:"XLE",name:"Energy Select",sector:"Energy",category:"ETF Options",siPct:0.5,dtc:0.3,floatShort:0.6,avgVol:"15M",optionsVol:"High",iv:25,ivRank:40,catalyst:"Oil"},
];

// ═══ YCHARTS DATA ENGINE ═══
const YCHART_METRICS=["price","one_year_return","three_year_annualized_return","five_year_annualized_return","one_year_volatility","max_drawdown_3_year","beta_5_year","dividend_yield","forward_pe_ratio","one_month_return","three_month_return","six_month_return"];

async function fetchYChartsAPI(apiKey){
  if(!apiKey)return null;const tickers=HOLDINGS.map(h=>h.ticker);
  try{const resp=await fetch("/api/ycharts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tickers,key:apiKey})});
    if(!resp.ok)return null;const result=await resp.json();
    if(result.success&&result.data){
      const mapped={};Object.entries(result.data).forEach(([ticker,d])=>{mapped[ticker]={price:d.price,one_year_return:d.one_year_return,one_year_volatility:d.one_year_volatility,beta_5_year:d.beta_5_year,max_drawdown_3_year:d.max_drawdown,dividend_yield:d.dividend_yield,forward_pe_ratio:d.forward_pe,one_month_return:d.one_month_return,three_month_return:d.three_month_return,six_month_return:d.six_month_return,three_year_annualized_return:d.three_year_return,five_year_annualized_return:d.five_year_return}});
      return Object.keys(mapped).length>0?mapped:null}
    return null}catch(e){console.error("YCharts proxy error:",e);return null}
}

function mapHeader(h){
  const m={"price":"price","last price":"price","close":"price","1 year return":"one_year_return","1y return":"one_year_return","3 year return":"three_year_annualized_return","5 year return":"five_year_annualized_return","volatility":"one_year_volatility","1y volatility":"one_year_volatility","1 year volatility":"one_year_volatility","max drawdown":"max_drawdown_3_year","beta":"beta_5_year","dividend yield":"dividend_yield","div yield":"dividend_yield","forward p/e":"forward_pe_ratio","fwd pe":"forward_pe_ratio","1 month return":"one_month_return","1m return":"one_month_return","3 month return":"three_month_return","3m return":"three_month_return","6 month return":"six_month_return","6m return":"six_month_return"};
  return m[h]||null;
}

function parseYChartsPaste(text){
  if(!text?.trim())return null;const lines=text.trim().split("\n");if(lines.length<2)return null;
  const headers=lines[0].split(/[,\t]/).map(h=>h.trim().toLowerCase().replace(/"/g,""));
  const tickerCol=headers.findIndex(h=>h==="ticker"||h==="symbol"||h==="name");
  if(tickerCol===-1)return null;const results={};
  for(let i=1;i<lines.length;i++){
    const cols=lines[i].split(/[,\t]/).map(c=>c.trim().replace(/"/g,""));
    const ticker=cols[tickerCol]?.toUpperCase();if(!ticker)continue;results[ticker]={};
    headers.forEach((h,idx)=>{if(idx===tickerCol)return;const val=parseFloat(cols[idx]?.replace(/[%$,]/g,""));
      if(!isNaN(val)){const key=mapHeader(h);if(key)results[ticker][key]=(h.includes("return")||h.includes("yield")||h.includes("volatility")||h.includes("drawdown"))?val/100:val}});
  }
  return Object.keys(results).length>0?results:null;
}

// ═══ STYLE-AWARE SCORING ENGINE ═══
function computeDerivedMetrics(ycData,styleId="balanced"){
  const w=getStyleWeights(styleId),t=getStyleThresholds(styleId),style=INVESTOR_STYLES[styleId]||INVESTOR_STYLES.balanced,enriched={};
  for(const[ticker,data]of Object.entries(ycData)){
    const d={...data},ret=d.one_year_return,vol=d.one_year_volatility,beta=d.beta_5_year;
    d.sharpe=vol&&vol!==0?(ret-0.045)/vol:null;d.sortino=d.sharpe?d.sharpe*1.3:null;
    const m1=d.one_month_return||0,m3=d.three_month_return||0,m6=d.six_month_return||0,m12=d.one_year_return||0;
    if(m12!=null)d.trendScore=Math.min(100,Math.max(0,Math.round(50+m12*150+(ret>0?15:0)+(beta>0?5:-5))));
    if(m1!=null)d.techScore=Math.min(100,Math.max(0,Math.round(50+m1*200+(m1>0&&m3>0?10:-5)+(vol<0.20?10:-5))));
    if(ret!=null&&vol!=null)d.fundScore=Math.min(100,Math.max(0,Math.round(30+(vol>0?ret/vol:0)*40+(Math.abs(beta||1)<0.5?15:0)+(ret>0.08?10:0))));
    d.dwaProxy=Math.min(100,Math.max(0,Math.round(50+(m1*0.4+m3*0.3+m6*0.2+m12*0.1)*200)));
    d.composite=Math.round((d.trendScore||50)*w.trend+(d.techScore||50)*w.tech+(d.fundScore||50)*w.fund+(d.dwaProxy||50)*w.dwa);
    if(d.price&&m1!=null&&vol!=null){const sma=d.price/(1+m1),dv=vol/Math.sqrt(252),upper=sma+2*sma*dv*Math.sqrt(20),lower=sma-2*sma*dv*Math.sqrt(20);
      d.bbPercentB=upper!==lower?(d.price-lower)/(upper-lower):0.5;d.bbWidth=sma?(upper-lower)/sma:0;
      d.bbSignal=d.bbPercentB<0.05&&d.bbWidth<0.04?"SQUEEZE BUY":d.bbPercentB<0.1?"OVERSOLD BUY":d.bbPercentB>0.95?"OVERBOUGHT SELL":d.bbPercentB>=0.5?"TREND HOLD":"NEUTRAL"}
    if(m12!=null&&m3!=null&&m1!=null)d.wavePhase=m12>0&&m3>0&&m1>0?"IMPULSE UP":m12>0&&m3<0?"CORRECTIVE":m12<0&&m1>0?"WAVE 1 START":m12<0&&m1<0?"DECLINE":"TRANSITION";
    d.rsiProxy=Math.min(100,Math.max(0,50+m1*500));d.gannAngle=Math.round(Math.atan(m1*12/0.1)*180/Math.PI*10)/10;d.above1x1=(d.gannAngle||0)>=45;
    if(style.invertSignals){d.signal=d.composite<=t.strongBuy?"STRONG BUY":d.composite<=t.buy?"BUY":d.composite>=t.strongSell?"STRONG SELL":d.composite>=t.sell?"SELL":"HOLD"}
    else{d.signal=d.composite>=t.strongBuy?"STRONG BUY":d.composite>=t.buy?"BUY":d.composite<=t.strongSell?"STRONG SELL":d.composite<=t.sell?"SELL":"HOLD"}
    d.priority=d.signal.includes("STRONG")?"P1":"BUY"===d.signal||"SELL"===d.signal?"P2":"P3";
    enriched[ticker]=d;
  }
  return enriched;
}

function computePortfolioMetrics(enrichedData,styleId="balanced"){
  const fsm=getStyleFSM(styleId);let wtdReturn=0,wtdVol=0,wtdBeta=0,wtdSharpe=0,compositeAvg=0,count=0;
  for(const h of HOLDINGS){const d=enrichedData[h.ticker];if(!d)continue;const wt=h.target/100;
    if(d.one_year_return!=null)wtdReturn+=wt*d.one_year_return;if(d.one_year_volatility!=null)wtdVol+=wt*d.one_year_volatility;
    if(d.beta_5_year!=null)wtdBeta+=wt*d.beta_5_year;if(d.sharpe!=null)wtdSharpe+=wt*d.sharpe;
    if(d.composite!=null){compositeAvg+=d.composite;count++}}
  const avgComposite=count>0?compositeAvg/count:50;
  const bullishPct=HOLDINGS.filter(h=>(enrichedData[h.ticker]?.composite||0)>=60).length/HOLDINGS.length;
  const fsmSignal=bullishPct>=fsm.fullyInvested?"FULLY INVESTED":bullishPct>=fsm.caution?"CAUTION":bullishPct>=fsm.defensive?"DEFENSIVE":"RISK OFF";
  const signals={strongBuy:0,buy:0,hold:0,sell:0,strongSell:0};
  HOLDINGS.forEach(h=>{const s=enrichedData[h.ticker]?.signal;if(s==="STRONG BUY")signals.strongBuy++;else if(s==="BUY")signals.buy++;else if(s==="SELL")signals.sell++;else if(s==="STRONG SELL")signals.strongSell++;else signals.hold++});
  const pctAbove50=HOLDINGS.filter(h=>(enrichedData[h.ticker]?.composite||0)>=50).length/HOLDINGS.length;
  const cashTriggers={mmpr50:pctAbove50<0.40,pr4050:avgComposite<45,anyActive:false};
  cashTriggers.anyActive=cashTriggers.mmpr50||cashTriggers.pr4050;
  return{wtdReturn,wtdVol,wtdBeta,wtdSharpe,avgComposite,bullishPct,fsmSignal,signals,cashTriggers,styleId};
}

// ═══ 8 YCHARTS QUERY TOOLS ═══
const YCHARTS_TOOLS=[
  {name:"query_holding",description:"Get complete data for specific holdings.",input_schema:{type:"object",properties:{tickers:{type:"array",items:{type:"string"}}},required:["tickers"]}},
  {name:"query_sector",description:"Aggregated metrics for asset class. Valid: US Eq, Intl, Bond, Alt, REIT, MF, Hedge, all, ETF, Stock.",input_schema:{type:"object",properties:{class_filter:{type:"string"}},required:["class_filter"]}},
  {name:"compare_holdings",description:"Side-by-side comparison of holdings.",input_schema:{type:"object",properties:{tickers:{type:"array",items:{type:"string"}},metrics:{type:"array",items:{type:"string"}}},required:["tickers"]}},
  {name:"screen_holdings",description:"Filter holdings by thresholds.",input_schema:{type:"object",properties:{conditions:{type:"array",items:{type:"object",properties:{metric:{type:"string"},operator:{type:"string"},value:{type:"number"}},required:["metric","operator","value"]}}},required:["conditions"]}},
  {name:"query_market_indicators",description:"Get VIX, yields, FSM, cash triggers.",input_schema:{type:"object",properties:{}}},
  {name:"query_signals",description:"Signal distribution and agreement matrix.",input_schema:{type:"object",properties:{}}},
  {name:"query_technicals",description:"Bollinger, Elliott Wave, Gann, RSI.",input_schema:{type:"object",properties:{tickers:{type:"array",items:{type:"string"}}},required:["tickers"]}},
  {name:"run_scenario",description:"What-if: equity_shock, rate_shock, vol_spike.",input_schema:{type:"object",properties:{scenario_type:{type:"string"},magnitude:{type:"number"},description:{type:"string"}},required:["scenario_type","magnitude"]}},
];

function executeYChartsTool(toolName,toolInput,ycData,pm){
  if(!ycData||Object.keys(ycData).length===0)return{error:"No YCharts data. Use web_search instead."};
  const fmt=(v,d=4)=>v!=null?Number(v.toFixed?v.toFixed(d):v):null;const pct=v=>v!=null?Number((v*100).toFixed(2)):null;
  const holdingProfile=ticker=>{const d=ycData[ticker],h=HOLDINGS.find(x=>x.ticker===ticker);if(!d)return{ticker,error:"No data"};
    return{ticker,name:h?.name,class:h?.class,target:h?.target,price:fmt(d.price,2),
      returns:{m1:pct(d.one_month_return),m3:pct(d.three_month_return),m6:pct(d.six_month_return),y1:pct(d.one_year_return)},
      risk:{vol:pct(d.one_year_volatility),beta:fmt(d.beta_5_year,2),sharpe:fmt(d.sharpe,2)},
      scores:{trend:d.trendScore,tech:d.techScore,fund:d.fundScore,dwa:d.dwaProxy,composite:d.composite},
      technicals:{bbPctB:fmt(d.bbPercentB,3),bbSignal:d.bbSignal,wave:d.wavePhase,gann:d.gannAngle,rsi:fmt(d.rsiProxy,0)},
      signal:d.signal,priority:d.priority}};
  switch(toolName){
    case"query_holding":return{holdings:(toolInput.tickers||[]).map(t=>holdingProfile(t.toUpperCase()))};
    case"query_sector":{const f=toolInput.class_filter;let fl=f==="all"?HOLDINGS:f==="ETF"||f==="Stock"?HOLDINGS.filter(h=>h.type===f):HOLDINGS.filter(h=>h.class===f);
      if(!fl.length)return{error:`No holdings for '${f}'`};const agg={count:fl.length,tickers:fl.map(h=>h.ticker)};
      ["one_year_return","composite"].forEach(m=>{const vals=fl.map(h=>ycData[h.ticker]?.[m]).filter(v=>v!=null);agg[m]={avg:vals.length?fmt(vals.reduce((a,b)=>a+b,0)/vals.length,3):null}});return{sector:f,aggregates:agg}}
    case"compare_holdings":{const comp={};(toolInput.tickers||[]).forEach(t=>comp[t.toUpperCase()]=holdingProfile(t.toUpperCase()));return{comparison:comp}}
    case"screen_holdings":{const matches=HOLDINGS.filter(h=>{const d=ycData[h.ticker];if(!d)return false;
      return(toolInput.conditions||[]).every(c=>{const v=d[c.metric];if(v==null)return false;const n=typeof v==="number"?v:parseFloat(v);if(isNaN(n))return false;
        return c.operator===">"?n>c.value:c.operator==="<"?n<c.value:c.operator===">="?n>=c.value:c.operator==="<="?n<=c.value:false})});
      return{matchCount:matches.length,holdings:matches.map(h=>holdingProfile(h.ticker))}}
    case"query_market_indicators":{const vix=ycData["^VIX"];return{indicators:{vix:fmt(vix?.price,1)},regime:{fsmSignal:pm?.fsmSignal,avgComposite:fmt(pm?.avgComposite,0),cashTriggers:pm?.cashTriggers,volRegime:(vix?.price||0)<15?"LOW":(vix?.price||0)<20?"MODERATE":(vix?.price||0)<30?"ELEVATED":"EXTREME"}}}
    case"query_signals":{return{signalDistribution:pm?.signals,fsmSignal:pm?.fsmSignal,cashTriggers:pm?.cashTriggers,consensus:pm?.avgComposite>=65?"BULLISH":pm?.avgComposite>=45?"NEUTRAL":"BEARISH"}}
    case"query_technicals":{return{technicals:(toolInput.tickers||[]).map(t=>{const d=ycData[t.toUpperCase()];if(!d)return{ticker:t,error:"No data"};
      return{ticker:t,bb:{pctB:fmt(d.bbPercentB,3),signal:d.bbSignal},wave:{phase:d.wavePhase},gann:{angle:d.gannAngle,above1x1:d.above1x1},rsi:fmt(d.rsiProxy,0),scores:{trend:d.trendScore,tech:d.techScore,composite:d.composite},signal:d.signal}})}}
    case"run_scenario":{const{scenario_type,magnitude}=toolInput;const results=HOLDINGS.map(h=>{const d=ycData[h.ticker];if(!d)return{ticker:h.ticker,impact:0};
      const beta=d.beta_5_year||0.5;let impact=0;if(scenario_type==="equity_shock")impact=magnitude*beta;else if(scenario_type==="rate_shock")impact=magnitude*(h.class==="Bond"?-7:-0.5)*100;else impact=magnitude*beta;
      return{ticker:h.ticker,impact:fmt(impact*100,2)}});const total=results.reduce((s,r)=>s+(r.impact||0),0)/HOLDINGS.length;
      return{scenario:toolInput.description||scenario_type,portfolioImpact:fmt(total,2)+"%",mostImpacted:results.sort((a,b)=>(a.impact||0)-(b.impact||0)).slice(0,5)}}
    default:return{error:`Unknown: ${toolName}`};
  }
}

// ═══ AGENTIC LOOP (12 rounds max) ═══
function buildSummaryContext(ycData,pm){
  if(!pm)return"No portfolio metrics.";
  return`Style: ${INVESTOR_STYLES[pm.styleId]?.name||"Balanced"} | Holdings: ${HOLDINGS.length} | FSM: ${pm.fsmSignal} | Composite: ${pm.avgComposite.toFixed(0)}/100 | Bullish: ${(pm.bullishPct*100).toFixed(0)}%\nSignals: ${pm.signals.strongBuy} SB, ${pm.signals.buy} B, ${pm.signals.hold} H, ${pm.signals.sell} S, ${pm.signals.strongSell} SS\nCash Triggers: ${pm.cashTriggers.anyActive?"ACTIVE":"CLEAR"}\nWeighted: Ret ${(pm.wtdReturn*100).toFixed(1)}%, Vol ${(pm.wtdVol*100).toFixed(1)}%, Beta ${pm.wtdBeta.toFixed(2)}, Sharpe ${pm.wtdSharpe.toFixed(2)}\nHoldings: ${HOLDINGS.map(h=>h.ticker).join(", ")}`;
}

async function runAgenticAnalysis(ycData,pm,reportType,styleId,onProgress){
  const hasData=ycData&&Object.keys(ycData).length>0;
  const ctx=hasData?buildSummaryContext(ycData,pm):"No YCharts data loaded. Use web_search for all market data.";
  const style=INVESTOR_STYLES[styleId]||INVESTOR_STYLES.balanced;
  const systemPrompt=`You are a senior analyst at Marline Wealth Management operating as a ${style.persona}.\nSTYLE: ${style.name.toUpperCase()}\n${style.aiPersona}\nEMPHASIS: ${style.emphasis}\nWeights: Trend ${style.weights.trend}%, Tech ${style.weights.tech}%, Fund ${style.weights.fund}%, DWA ${style.weights.dwa}%\nThresholds: SB>=${style.thresholds.strongBuy}, B>=${style.thresholds.buy}, S<=${style.thresholds.sell}\nFSM: Full@${(style.fsm.fullyInvested*100).toFixed(0)}%, Caution@${(style.fsm.caution*100).toFixed(0)}%\nCash Max: ${style.cashMax}% | Hedge: ${style.hedgeMultiplier}x${style.invertSignals?"\nCONTRARIAN: Signals INVERTED":""}\n\nWORKFLOW: 1) Query YCharts tools for data 2) web_search for news 3) Synthesize through ${style.persona} lens\n\nPORTFOLIO:\n${ctx}\n\nDate: ${new Date().toISOString().split("T")[0]}`;
  const reportPrompts={
    daily:`Daily market report through ${style.name} lens. Query indicators, signals, extreme holdings. Use web_search for today's news.\n\nReturn JSON:\n{"date":"YYYY-MM-DD","investorStyle":"${style.name}","marketNarrative":"3-4 sentences","regimeAssessment":{"regime":"BULLISH|BEARISH|NEUTRAL|CAUTIOUS","regimeScore":0,"confidence":"HIGH|MEDIUM|LOW","trendDirection":"UP|DOWN|SIDEWAYS","volatilityRegime":"LOW|MODERATE|ELEVATED|EXTREME","breadthAssessment":"str","momentumRegime":"str","recessionProbability":0,"selloffRisk":"str","rationale":"str"},"cycleDiagnosis":{"currentCycle":"str","cycleAge":"str","leadingIndicators":"str","transitionRisk":"str","nextPhaseETA":"str","historicalAnalog":"str"},"sectorRotation":{"favored":[],"disfavored":[],"rotationSignal":"str"},"keyRisks":[{"risk":"str","probability":"str"}],"catalysts":["str"],"forwardOutlook":{"daily":"str","weekly":"str","monthly":"str","quarterly":"str"},"portfolioActions":[{"action":"str","urgency":"IMMEDIATE|THIS WEEK|THIS MONTH","rationale":"str"}]}`,
    equity:`${style.name} buy/sell analysis for all holdings. Query signals, technicals. web_search for news.\n\nReturn JSON:\n{"analysisDate":"YYYY-MM-DD","investorStyle":"${style.name}","marketContext":"2-3 sentences","equities":[{"ticker":"SPY","analystSignal":"STRONG BUY|BUY|HOLD|SELL|STRONG SELL","technicalView":"BULLISH|NEUTRAL|BEARISH","fundamentalView":"str","catalystView":"str","relativeStrength":"str","conviction":"HIGH|MEDIUM|LOW","bollingerRead":"str","elliottWaveRead":"str","newsContext":"str","recommendation":"str"}]}`,
    portfolio:`Morningstar-style portfolio analysis. Query aggregates, sectors, indicators. web_search for benchmarks.\n\nReturn JSON:\n{"reportDate":"YYYY-MM-DD","investorStyle":"${style.name}","portfolioGrade":"A|B|C|D","benchmarkData":{"sp500Ytd":0,"aggBondYtd":0,"sixtyFortyYtd":0,"portfolioVsBenchmark":0},"economicSnapshot":{"gdpGrowth":0,"cpiInflation":0,"fedFundsRate":0,"unemploymentRate":0,"leadingIndicators":"str"},"styleAnalysis":{"overallStyle":"str","equityStyle":"str","fixedIncomeStyle":"str","riskLevel":3},"riskAssessment":{"portfolioRiskLevel":"str","drawdownRisk":"str"},"quarterlyOutlook":"str","strategicRecommendations":[{"priority":1,"recommendation":"str","rationale":"str"}]}`
  };
  const tools=[...YCHARTS_TOOLS.map(t=>({name:t.name,description:t.description,input_schema:t.input_schema})),{type:"web_search_20250305",name:"web_search"}];
  const messages=[{role:"user",content:reportPrompts[reportType]}];
  let finalResult=null,rounds=0;
  while(rounds<MAX_TOOL_ROUNDS){rounds++;
    onProgress?.({phase:"calling_api",message:`${style.persona} thinking (round ${rounds})...`,round:rounds});
    try{const resp=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:4096,system:systemPrompt,tools,messages})});
      const data=await resp.json();if(!data.content?.length)break;
      const toolUse=data.content.filter(b=>b.type==="tool_use"),textBlocks=data.content.filter(b=>b.type==="text");
      if(toolUse.length===0){const text=textBlocks.map(b=>b.text).join("\n").replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
        const match=text.match(/\{[\s\S]*\}/);if(match)try{finalResult=JSON.parse(match[0])}catch{}
        onProgress?.({phase:"complete",message:`${style.name} complete (${rounds} rounds)`,round:rounds});break}
      messages.push({role:"assistant",content:data.content});const toolResults=[];
      for(const tb of toolUse){if(tb.name==="web_search"){onProgress?.({phase:"web_search",message:`Searching: ${tb.input?.query||"..."}`,round:rounds,tool:tb.name});
        toolResults.push({type:"tool_result",tool_use_id:tb.id,content:"Web search executed by API"})}
        else{onProgress?.({phase:"tool_call",message:`${tb.name}(${JSON.stringify(tb.input).substring(0,50)}...)`,round:rounds,tool:tb.name});
          toolResults.push({type:"tool_result",tool_use_id:tb.id,content:JSON.stringify(executeYChartsTool(tb.name,tb.input,ycData,pm))})}}
      messages.push({role:"user",content:toolResults});
    }catch(e){onProgress?.({phase:"error",message:e.message});break}
  }
  return finalResult;
}

// ═══ OPTIONS SCORING ═══
function computeSqueezeScore(s){let sc=0;if(s.siPct>=30)sc+=30;else if(s.siPct>=20)sc+=25;else if(s.siPct>=15)sc+=20;else if(s.siPct>=10)sc+=15;else if(s.siPct>=5)sc+=8;
  if(s.dtc>=8)sc+=25;else if(s.dtc>=5)sc+=20;else if(s.dtc>=3)sc+=15;else if(s.dtc>=2)sc+=10;else sc+=5;
  if(s.ivRank>=80)sc+=20;else if(s.ivRank>=60)sc+=15;else if(s.ivRank>=40)sc+=10;else sc+=5;
  sc+=({Extreme:15,"Very High":12,High:9,Medium:6})[s.optionsVol]||3;if(s.floatShort>=30)sc+=10;else if(s.floatShort>=20)sc+=7;else if(s.floatShort>=10)sc+=4;return Math.min(100,sc)}
function getSqueezeSignal(sc){return sc>=80?{signal:"STRONG BUY",color:C.green}:sc>=65?{signal:"BUY",color:"#66FF99"}:sc>=45?{signal:"WATCH",color:C.amber}:sc>=25?{signal:"NEUTRAL",color:C.textMuted}:{signal:"AVOID",color:C.red}}

// ═══ EXPORT UTILITIES ═══
function exportCSV(ycData,portMetrics,label="portfolio"){
  if(!ycData)return;const rows=[["Ticker","Name","Class","Target%","Price","1Y Return","Volatility","Beta","Sharpe","Composite","Signal","BB%B","Wave","Priority"]];
  HOLDINGS.forEach(h=>{const d=ycData[h.ticker];if(!d)return;
    rows.push([h.ticker,h.name,h.class,h.target,d.price?.toFixed(2)||"",d.one_year_return!=null?(d.one_year_return*100).toFixed(2)+"%":"",d.one_year_volatility!=null?(d.one_year_volatility*100).toFixed(2)+"%":"",d.beta_5_year?.toFixed(2)||"",d.sharpe?.toFixed(2)||"",d.composite||"",d.signal||"",d.bbPercentB?.toFixed(3)||"",d.wavePhase||"",d.priority||""])});
  if(portMetrics)rows.push([],[`FSM: ${portMetrics.fsmSignal}`,`Composite: ${portMetrics.avgComposite?.toFixed(0)}`,`Bullish: ${(portMetrics.bullishPct*100).toFixed(0)}%`,`Return: ${(portMetrics.wtdReturn*100).toFixed(1)}%`,`Vol: ${(portMetrics.wtdVol*100).toFixed(1)}%`,`Sharpe: ${portMetrics.wtdSharpe?.toFixed(2)}`]);
  const csv=rows.map(r=>r.join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`marline_${label}_${new Date().toISOString().split("T")[0]}.csv`;a.click();URL.revokeObjectURL(url);
}
function copySummary(ycData,portMetrics,styleId){
  if(!portMetrics)return;const style=INVESTOR_STYLES[styleId]||INVESTOR_STYLES.balanced;
  const sigs=portMetrics.signals;const top=HOLDINGS.filter(h=>(ycData[h.ticker]?.composite||0)>=70).map(h=>`${h.ticker}(${ycData[h.ticker].composite})`).join(", ");
  const bottom=HOLDINGS.filter(h=>(ycData[h.ticker]?.composite||0)<=35).map(h=>`${h.ticker}(${ycData[h.ticker].composite})`).join(", ");
  const text=`MARLINE PORTFOLIO SUMMARY — ${new Date().toLocaleDateString()}\nStyle: ${style.name} | FSM: ${portMetrics.fsmSignal} | Composite: ${portMetrics.avgComposite.toFixed(0)}/100\nReturn: ${(portMetrics.wtdReturn*100).toFixed(1)}% | Vol: ${(portMetrics.wtdVol*100).toFixed(1)}% | Sharpe: ${portMetrics.wtdSharpe.toFixed(2)} | Beta: ${portMetrics.wtdBeta.toFixed(2)}\nSignals: ${sigs.strongBuy}SB ${sigs.buy}B ${sigs.hold}H ${sigs.sell}S ${sigs.strongSell}SS\nCash Triggers: ${portMetrics.cashTriggers.anyActive?"ACTIVE":"Clear"}\n${top?`Top: ${top}`:""}${bottom?`\nBottom: ${bottom}`:""}`;
  navigator.clipboard.writeText(text).catch(()=>{});return text;
}
function compareCSV(dataA,pmA,dataB,pmB){
  if(!dataA||!dataB)return;const rows=[["Ticker","Name","Class","Comp A","Signal A","Comp B","Signal B","Delta","Signal Change"]];
  const allTickers=new Set([...Object.keys(dataA),...Object.keys(dataB)]);
  allTickers.forEach(t=>{const a=dataA[t],b=dataB[t],h=HOLDINGS.find(x=>x.ticker===t);if(!a&&!b)return;
    const cA=a?.composite||"—",cB=b?.composite||"—",sA=a?.signal||"—",sB=b?.signal||"—";
    const delta=typeof cA==="number"&&typeof cB==="number"?cB-cA:"—";const changed=sA!==sB?"YES":"";
    rows.push([t,h?.name||t,h?.class||"",cA,sA,cB,sB,delta,changed])});
  if(pmA&&pmB)rows.push([],[`Portfolio A: FSM ${pmA.fsmSignal}, Comp ${pmA.avgComposite?.toFixed(0)}`],[`Portfolio B: FSM ${pmB.fsmSignal}, Comp ${pmB.avgComposite?.toFixed(0)}`]);
  const csv=rows.map(r=>r.join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`marline_comparison_${new Date().toISOString().split("T")[0]}.csv`;a.click();URL.revokeObjectURL(url);
}

// ═══ SHARED UI COMPONENTS ═══
const sigColor=s=>{if(!s)return C.textDim;const u=s.toUpperCase();
  if(/STRONG BUY|BULLISH|FULLY|EXPANSION|IMPULSE UP/.test(u))return C.green;if(/^BUY$|GROWTH|WAVE 1/.test(u))return"#66BB6A";
  if(/STRONG SELL|BEARISH|RISK OFF|RECESSION|DECLINE/.test(u))return C.red;if(/^SELL$|UNDERPERFORM/.test(u))return C.orange;
  if(/CAUTIOUS|CAUTION|ELEVATED|MODERATE/.test(u))return C.amber;return C.textDim};
const Pill=({children,color})=><span style={{display:"inline-block",padding:"2px 7px",borderRadius:3,fontSize:9,fontWeight:700,color:color||C.text,background:`${color||C.textDim}15`,border:`1px solid ${color||C.textDim}30`}}>{children}</span>;
const Card=({title,children,accent=C.accent,span=1,row=1})=><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"14px 16px",gridColumn:`span ${span}`,gridRow:`span ${row}`,borderTop:`2px solid ${accent}`}}>{title&&<div style={{fontSize:10,fontWeight:700,color:accent,letterSpacing:1.2,textTransform:"uppercase",marginBottom:10}}>{title}</div>}{children}</div>;
const Gauge=({value,label,color})=><div style={{marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.textDim,marginBottom:2}}><span>{label}</span><span style={{color,fontWeight:600}}>{typeof value==="number"?value.toFixed(0):value}</span></div><div style={{height:4,background:C.border,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,Math.max(0,typeof value==="number"?value:50))}%`,background:`linear-gradient(90deg,${color}90,${color})`,borderRadius:2,transition:"width 0.8s ease"}}/></div></div>;
const MR=({label,value,color})=><div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}`,fontSize:11}}><span style={{color:C.textDim}}>{label}</span><span style={{color:color||C.text,fontWeight:500}}>{value}</span></div>;
const StatusDot=({active,color=C.green})=><span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:active?color:C.textMuted,boxShadow:active?`0 0 6px ${color}60`:"none",marginRight:5}}/>;
const Btn=({onClick,loading,children,accent=C.accent,small})=><button onClick={onClick} disabled={loading} style={{padding:small?"4px 10px":"7px 18px",border:`1px solid ${accent}40`,borderRadius:4,background:loading?C.card:`${accent}10`,color:accent,fontSize:small?9:10,fontWeight:700,cursor:loading?"wait":"pointer",fontFamily:"inherit",letterSpacing:0.6,display:"flex",alignItems:"center",gap:6}}>{loading&&<span style={{width:12,height:12,border:`2px solid ${C.textMuted}`,borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/>}{children}</button>;
const pctFmt=v=>v!=null?`${v>=0?"+":""}${(v*100).toFixed(1)}%`:"\u2014";
const usd=v=>v!=null?`$${Number(v).toFixed(2)}`:"\u2014";
const n=(v,d=2)=>v!=null?Number(v).toFixed(d):"\u2014";
const deltaFmt=(a,b)=>{if(a==null||b==null)return"\u2014";const d=b-a;return `${d>=0?"+":""}${d.toFixed(1)}`};
const CSS_GLOBAL=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes glow{0%,100%{box-shadow:0 0 20px #00D4AA20}50%{box-shadow:0 0 40px #00D4AA40}}
*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}table{border-collapse:collapse;width:100%}th,td{padding:6px 8px;text-align:center;border-bottom:1px solid ${C.border};font-size:11px}th{background:${C.header};color:${C.textDim};font-weight:600;font-size:9px;letter-spacing:0.8px;text-transform:uppercase;position:sticky;top:0}
@media print{body{background:white!important;color:black!important}[data-no-print]{display:none!important}.print-break{page-break-before:always}}`;

// ═══ LOGIN SCREEN ═══
function LoginScreen({onLogin}){
  const[email,setEmail]=useState(""),[pass,setPass]=useState(""),[error,setError]=useState(""),[showDemo,setShowDemo]=useState(false),[loading,setLoading]=useState(false);
  const go=()=>{setLoading(true);setError("");setTimeout(()=>{const u=USERS[email.toLowerCase().trim()];if(!u||u.pass!==pass){setError("Invalid email or password");setLoading(false);return}onLogin({email:email.toLowerCase().trim(),...u})},500)};
  return (
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 30% 20%,${C.deep} 0%,${C.bg} 70%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif"}}><style>{CSS_GLOBAL}</style>
      <div style={{width:420,animation:"fadeIn 0.6s ease"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:68,height:68,background:C.gradientAccent,borderRadius:16,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:28,color:C.bg,marginBottom:16,boxShadow:`0 12px 40px ${C.accent}30`,animation:"glow 3s ease-in-out infinite"}}>M</div>
          <div style={{fontSize:26,fontWeight:800,letterSpacing:6,color:C.text}}>MARLINE</div>
          <div style={{fontSize:11,letterSpacing:4,color:C.accent,marginTop:4}}>WEALTH MANAGEMENT PLATFORM</div></div>
        <div style={{background:C.panel,borderRadius:14,padding:32,border:`1px solid ${C.border}`,boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>Sign in to your account</div>
          <div style={{fontSize:12,color:C.textDim,marginBottom:24}}>Intelligence \u00B7 Options \u00B7 Portfolio</div>
          {[["EMAIL",email,setEmail,"email","you@marlinewm.com"],["PASSWORD",pass,setPass,"password","password"]].map(([l,v,set,type,ph])=>(
            <div key={l} style={{marginBottom:16}}><label style={{fontSize:10,fontWeight:600,color:C.textDim,letterSpacing:0.5,display:"block",marginBottom:5}}>{l}</label>
              <input type={type} value={v} onChange={e=>set(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder={ph}
                style={{width:"100%",padding:"11px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>))}
          {error&&<div style={{background:C.red+"15",border:`1px solid ${C.red}40`,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:C.red}}>{error}</div>}
          <button onClick={go} disabled={loading} style={{width:"100%",padding:"12px",background:loading?C.border:C.gradientAccent,border:"none",borderRadius:8,color:C.bg,fontSize:14,fontWeight:800,cursor:loading?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading&&<span style={{width:14,height:14,border:`2px solid ${C.bg}`,borderTop:"2px solid transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>}{loading?"Signing in...":"Sign In"}</button></div>
        <div style={{marginTop:16,textAlign:"center"}}>
          <button onClick={()=>setShowDemo(!showDemo)} style={{background:"none",border:"none",color:C.textDim,fontSize:11,cursor:"pointer",textDecoration:"underline"}}>{showDemo?"Hide":"Show"} demo credentials</button>
          {showDemo&&<div style={{marginTop:10,background:C.panel,borderRadius:8,padding:12,border:`1px solid ${C.border}`,textAlign:"left"}}>
            {Object.entries(USERS).map(([e,u])=><div key={e} onClick={()=>{setEmail(e);setPass(u.pass)}} style={{padding:"6px 10px",borderRadius:4,cursor:"pointer",display:"flex",justifyContent:"space-between",marginBottom:2,fontSize:12}} onMouseEnter={ev=>ev.currentTarget.style.background=C.surface} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
              <span style={{color:C.text,fontWeight:600}}>{u.name} <span style={{color:C.textDim,fontWeight:400}}>{e}</span></span>
              <span style={{background:u.role==="advisor"?C.accent+"20":C.green+"20",color:u.role==="advisor"?C.accent:C.green,padding:"1px 6px",borderRadius:3,fontSize:9,fontWeight:700}}>{u.role.toUpperCase()}</span></div>)}</div>}
        </div></div></div>);
}

// ═══ STYLE SELECTOR ═══
function StyleSelector({styleId,onChange,expanded,onToggle}){
  const style=INVESTOR_STYLES[styleId];
  return (<div style={{position:"relative"}}>
    <button onClick={onToggle} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",border:`1px solid ${style.color}40`,borderRadius:4,background:`${style.color}10`,cursor:"pointer",fontFamily:"inherit"}}>
      <span style={{fontSize:12,color:style.color}}>{style.icon}</span><span style={{fontSize:9,fontWeight:700,color:style.color,letterSpacing:0.5}}>{style.name.toUpperCase()}</span>
      <span style={{fontSize:7,color:C.textMuted,transform:expanded?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}>{"\u25BC"}</span></button>
    {expanded&&<div style={{position:"absolute",top:"calc(100% + 4px)",right:0,width:440,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,boxShadow:"0 12px 40px rgba(0,0,0,0.6)",zIndex:200,overflow:"hidden",animation:"fadeUp 0.15s ease"}}>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,background:`${style.color}08`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18,color:style.color}}>{style.icon}</span><div><div style={{fontSize:11,fontWeight:700,color:style.color}}>{style.name}</div><div style={{fontSize:8,color:C.textDim}}>{style.short}</div></div></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,marginTop:8}}>
          {[["Trend",style.weights.trend],["Tech",style.weights.tech],["Fund",style.weights.fund],["DWA",style.weights.dwa]].map(([l,v])=><div key={l} style={{textAlign:"center",padding:3,background:C.bg,borderRadius:3}}><div style={{fontSize:7,color:C.textMuted}}>{l}</div><div style={{fontSize:11,fontWeight:700,color:style.color}}>{v}%</div></div>)}</div></div>
      <div style={{maxHeight:260,overflow:"auto",padding:6}}>
        {Object.entries(STYLE_CATEGORIES).map(([catId,cat])=><div key={catId} style={{marginBottom:6}}>
          <div style={{fontSize:8,fontWeight:700,letterSpacing:1,color:C.textMuted,padding:"3px 6px"}}>{cat.label.toUpperCase()}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
            {Object.values(INVESTOR_STYLES).filter(s=>s.category===catId).map(s=><button key={s.id} onClick={()=>{onChange(s.id);onToggle()}} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",border:`1px solid ${s.id===styleId?s.color+"60":C.border}`,borderRadius:4,background:s.id===styleId?`${s.color}15`:"transparent",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
              <span style={{fontSize:13,color:s.color}}>{s.icon}</span><div><div style={{fontSize:9,fontWeight:600,color:s.id===styleId?s.color:C.text}}>{s.name}</div><div style={{fontSize:7,color:C.textDim}}>{s.short}</div></div>
              {s.id===styleId&&<span style={{marginLeft:"auto",fontSize:9,color:s.color}}>{"\u2713"}</span>}</button>)}</div></div>)}</div>
    </div>}</div>);
}

// ═══ DATA SLOT COMPONENT ═══
function DataSlot({label,color,ycData,pasteVal,setPaste,apiKey,setApiKey,onLoad,onClear,loading,error}){
  const hasData=ycData&&Object.keys(ycData).length>0;const[expanded,setExpanded]=useState(!hasData);
  return (<div style={{background:`${color}06`,border:`1px solid ${color}20`,borderRadius:6,padding:10}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:expanded?8:0}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <StatusDot active={hasData} color={color}/>
        <span style={{fontSize:11,fontWeight:700,color,letterSpacing:0.5}}>{label}</span>
        {hasData&&<span style={{fontSize:10,color:C.textDim}}>{Object.keys(ycData).length} tickers</span>}</div>
      <div style={{display:"flex",gap:4}}>
        {hasData&&<Btn onClick={onClear} accent={C.red} small>{"\u2715"}</Btn>}
        <button onClick={()=>setExpanded(!expanded)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:3,padding:"2px 6px",fontSize:8,color:C.textDim,cursor:"pointer"}}>{expanded?"\u25B2":hasData?"\u27F3 Change":"\u25BC Load"}</button></div></div>
    {expanded&&<div>
      <div style={{marginBottom:6}}>
        <div style={{fontSize:8,fontWeight:700,color:C.textDim,letterSpacing:0.8,marginBottom:3}}>YCHARTS API KEY</div>
        <input type="text" value={apiKey||""} onChange={e=>setApiKey(e.target.value)} placeholder="Enter YCharts API key to auto-fetch all holdings..."
          style={{width:"100%",padding:"7px 10px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,fontSize:10,fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}/>
        <div style={{fontSize:8,color:C.textMuted,marginTop:2}}>Auto-fetches 12 metrics for all holdings. Works in production deployment; browser sandbox may block CORS.</div></div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:8,color:C.textMuted,fontWeight:600}}>OR PASTE CSV/TSV</span><div style={{flex:1,height:1,background:C.border}}/></div>
      <textarea value={pasteVal} onChange={e=>setPaste(e.target.value)} rows={2} placeholder="Paste YCharts Comp Tables export here (Ticker column + numeric data)..."
        style={{width:"100%",fontFamily:"'JetBrains Mono',monospace",fontSize:10,background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:4,padding:8,resize:"vertical",boxSizing:"border-box",marginBottom:6}}/>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <Btn onClick={onLoad} loading={loading} accent={color} small>{loading?"Loading...":"\u27F3 Load"}</Btn>
        {error&&<span style={{fontSize:10,color:C.red}}>{error}</span>}</div></div>}</div>);
}

// ═══ COMPARE VIEW ═══
function CompareView({dataA,metricsA,dataB,metricsB,styleId}){
  const style=INVESTOR_STYLES[styleId];
  const allTickers=useMemo(()=>{const s=new Set([...Object.keys(dataA||{}),...Object.keys(dataB||{})]);return HOLDINGS.filter(h=>s.has(h.ticker))},[dataA,dataB]);
  const allocA=useMemo(()=>{const g={};HOLDINGS.forEach(h=>{if(dataA[h.ticker])g[h.class]=(g[h.class]||0)+h.target});return g},[dataA]);
  const allocB=useMemo(()=>{const g={};HOLDINGS.forEach(h=>{if(dataB[h.ticker])g[h.class]=(g[h.class]||0)+h.target});return g},[dataB]);
  const signalChanges=useMemo(()=>allTickers.filter(h=>{const sA=dataA[h.ticker]?.signal,sB=dataB[h.ticker]?.signal;return sA&&sB&&sA!==sB}),[allTickers,dataA,dataB]);
  const clr={"US Eq":C.blue,Intl:C.purple,Bond:C.cyan,Alt:C.amber,REIT:C.green,MF:C.orange,Hedge:C.magenta};

  return (<div style={{animation:"fadeUp 0.25s ease"}}>
    {/* SUMMARY COMPARISON */}
    <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,marginBottom:14}}>
      {[["A",metricsA,C.accent],["vs",null,null],["B",metricsB,C.purple]].map(([label,pm,color],i)=>
        i===1?<div key="vs" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20,fontWeight:800,color:C.textMuted}}>vs</span></div>:
        <div key={label} style={{background:C.card,border:`1px solid ${color}30`,borderRadius:8,padding:14,borderTop:`2px solid ${color}`}}>
          <div style={{fontSize:10,fontWeight:700,color,letterSpacing:1,marginBottom:8}}>PORTFOLIO {label}</div>
          {pm?<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {[["FSM",pm.fsmSignal,sigColor(pm.fsmSignal)],["Return",pctFmt(pm.wtdReturn),pm.wtdReturn>=0?C.green:C.red],["Vol",pctFmt(pm.wtdVol),C.text],
              ["Sharpe",n(pm.wtdSharpe),pm.wtdSharpe>0.5?C.green:C.amber],["Beta",n(pm.wtdBeta),C.text],["Composite",`${pm.avgComposite.toFixed(0)}/100`,pm.avgComposite>=60?C.green:C.amber]
            ].map(([l,v,c])=><div key={l} style={{textAlign:"center",padding:4,background:C.bg,borderRadius:3}}><div style={{fontSize:7,color:C.textMuted}}>{l}</div><div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div></div>)}</div>
            :<div style={{fontSize:10,color:C.textDim}}>Load data</div>}
        </div>)}
    </div>

    {/* DELTA METRICS */}
    {metricsA&&metricsB&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
      <div style={{fontSize:9,fontWeight:700,color:C.cyan,letterSpacing:1.2,marginBottom:8}}>DELTA (B \u2212 A)</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6}}>
        {[["Return",((metricsB.wtdReturn-metricsA.wtdReturn)*100).toFixed(1)+"%"],["Vol",((metricsB.wtdVol-metricsA.wtdVol)*100).toFixed(1)+"%"],["Sharpe",(metricsB.wtdSharpe-metricsA.wtdSharpe).toFixed(2)],["Beta",(metricsB.wtdBeta-metricsA.wtdBeta).toFixed(2)],["Composite",(metricsB.avgComposite-metricsA.avgComposite).toFixed(0)],["Bullish",((metricsB.bullishPct-metricsA.bullishPct)*100).toFixed(0)+"%"]].map(([l,v])=>{
          const num=parseFloat(v);const c=num>0?C.green:num<0?C.red:C.textDim;
          return <div key={l} style={{textAlign:"center",padding:6,background:C.bg,borderRadius:4}}><div style={{fontSize:8,color:C.textDim}}>{l}</div><div style={{fontSize:14,fontWeight:700,color:c,fontFamily:"'JetBrains Mono',monospace"}}>{num>0?"+":""}{v}</div></div>})}</div></div>}

    {/* SIGNAL CHANGES */}
    {signalChanges.length>0&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:14}}>
      <div style={{fontSize:9,fontWeight:700,color:C.amber,letterSpacing:1.2,marginBottom:8}}>SIGNAL CHANGES ({signalChanges.length})</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6}}>
        {signalChanges.map(h=>{const a=dataA[h.ticker],b=dataB[h.ticker];return <div key={h.ticker} style={{padding:6,background:C.bg,borderRadius:4,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontWeight:700,color:C.accent,fontSize:11,fontFamily:"'JetBrains Mono',monospace",minWidth:36}}>{h.ticker}</span>
          <Pill color={sigColor(a?.signal)}>{a?.signal}</Pill><span style={{color:C.textMuted}}>{"\u2192"}</span><Pill color={sigColor(b?.signal)}>{b?.signal}</Pill></div>})}</div></div>}

    {/* ALLOCATION DRIFT */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
      <Card title="Allocation Comparison" accent={C.cyan} span={2}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
          {Object.keys({...allocA,...allocB}).sort().map(cls=>{const a=allocA[cls]||0,b=allocB[cls]||0,d=b-a;return <div key={cls} style={{padding:6,background:C.bg,borderRadius:4}}>
            <div style={{fontSize:9,fontWeight:700,color:clr[cls]||C.text,marginBottom:4}}>{cls}</div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}><span style={{color:C.accent}}>A: {a}%</span><span style={{color:C.purple}}>B: {b}%</span></div>
            <div style={{fontSize:11,fontWeight:700,color:d>0?C.green:d<0?C.red:C.textDim,textAlign:"center",marginTop:2}}>{d>0?"+":""}{d}%</div></div>})}</div></Card></div>

    {/* SIDE-BY-SIDE HOLDINGS */}
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
      <div style={{padding:"8px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.text}}>Holdings Comparison</span>
        <Btn onClick={()=>compareCSV(dataA,metricsA,dataB,metricsB)} accent={C.cyan} small>{"\u2913"} Export Comparison CSV</Btn></div>
      <div style={{overflow:"auto",maxHeight:400}}>
        <table><thead><tr>{["Ticker","Class","Comp A","Signal A","Comp B","Signal B","\u0394 Comp","\u0394 Signal"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>{allTickers.map(h=>{const a=dataA[h.ticker],b=dataB[h.ticker];const cA=a?.composite,cB=b?.composite;const delta=cA!=null&&cB!=null?cB-cA:null;const changed=a?.signal!==b?.signal;
            return <tr key={h.ticker} style={{background:changed?C.amber+"08":"transparent"}}>
              <td style={{fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{h.ticker}</td><td style={{color:C.textDim}}>{h.class}</td>
              <td style={{fontWeight:600,color:cA>=60?C.green:cA<=40?C.red:C.amber}}>{cA||"\u2014"}</td><td>{a?.signal?<Pill color={sigColor(a.signal)}>{a.signal}</Pill>:"\u2014"}</td>
              <td style={{fontWeight:600,color:cB>=60?C.green:cB<=40?C.red:C.amber}}>{cB||"\u2014"}</td><td>{b?.signal?<Pill color={sigColor(b.signal)}>{b.signal}</Pill>:"\u2014"}</td>
              <td style={{fontWeight:700,color:delta>0?C.green:delta<0?C.red:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{delta!=null?`${delta>0?"+":""}${delta}`:"\u2014"}</td>
              <td>{changed?<span style={{color:C.amber,fontWeight:700,fontSize:9}}>CHANGED</span>:<span style={{color:C.textMuted,fontSize:9}}>\u2014</span>}</td></tr>})}</tbody></table></div></div>
  </div>);
}

// ═══ INTELLIGENCE MODULE ═══
function IntelligenceModule({ycDataA,portMetricsA,ycDataB,portMetricsB,onDataLoadA,onDataLoadB,onClearA,onClearB,pasteA,setPasteA,pasteB,setPasteB,apiKeyA,setApiKeyA,apiKeyB,setApiKeyB,styleId,dataMode,setDataMode,loadingA,loadingB,errorA,errorB}){
  const[tab,setTab]=useState("daily");
  const[aiDaily,setAiDaily]=useState(null),[aiEquity,setAiEquity]=useState(null),[aiPortfolio,setAiPortfolio]=useState(null);
  const[loading,setLoading]=useState({}),[progress,setProgress]=useState({}),[toolLog,setToolLog]=useState([]);
  const[copiedMsg,setCopiedMsg]=useState("");
  const hasA=ycDataA&&Object.keys(ycDataA).length>0;const hasB=ycDataB&&Object.keys(ycDataB).length>0;
  const ycData=hasA?ycDataA:null;const portMetrics=hasA?portMetricsA:null;const hasData=hasA;
  const style=INVESTOR_STYLES[styleId];const isLoading=loading.daily||loading.equity||loading.portfolio;
  const runReport=useCallback(async type=>{
    setLoading(p=>({...p,[type]:true}));setToolLog([]);setProgress({});
    const onProg=info=>{setProgress(info);if(info.tool||info.phase==="web_search")setToolLog(prev=>[...prev,{time:new Date().toLocaleTimeString(),...info}])};
    try{const result=await runAgenticAnalysis(ycData||{},portMetrics,type,styleId,onProg);
      if(result){if(type==="daily")setAiDaily(result);else if(type==="equity")setAiEquity(result);else setAiPortfolio(result)}}catch(e){console.error(e)}
    setLoading(p=>({...p,[type]:false}));
  },[ycData,portMetrics,styleId]);
  const handleCopy=()=>{const t=copySummary(ycData,portMetrics,styleId);if(t){setCopiedMsg("Copied!");setTimeout(()=>setCopiedMsg(""),2000)}};

  const tabs=[{id:"daily",label:"Market Report",icon:"\u25C9"},{id:"equity",label:"Equity Analysis",icon:"\u25C8"},{id:"portfolio",label:"Portfolio Report",icon:"\u25C6"}];
  if(hasA&&hasB)tabs.push({id:"compare",label:"Compare A/B",icon:"\u2194"});

  return (<div>
    {/* TAB BAR */}
    <div style={{display:"flex",gap:2,marginBottom:14,flexWrap:"wrap"}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 16px",border:`1px solid ${tab===t.id?(t.id==="compare"?C.cyan:C.accent)+"40":C.border}`,borderRadius:6,background:tab===t.id?(t.id==="compare"?C.cyan:C.accent)+"12":"transparent",color:tab===t.id?(t.id==="compare"?C.cyan:C.accent):C.textDim,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{t.icon} {t.label}</button>)}</div>

    {/* DATA CONFIG - A/B SLOTS */}
    <div style={{background:C.card,borderRadius:8,padding:14,border:`1px solid ${C.border}`,marginBottom:14}} data-no-print>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <StatusDot active={hasA} color={C.accent}/><span style={{fontSize:10,fontWeight:700,color:hasA?C.green:C.amber}}>{hasA?`A: ${Object.keys(ycDataA).length} tickers`:"A: Empty"}</span>
          <span style={{color:C.border}}>|</span>
          <StatusDot active={hasB} color={C.purple}/><span style={{fontSize:10,fontWeight:700,color:hasB?C.purple:C.textMuted}}>{hasB?`B: ${Object.keys(ycDataB).length} tickers`:"B: Empty"}</span>
          {portMetrics&&<><span style={{color:C.border}}>|</span><span style={{fontSize:10,color:sigColor(portMetrics.fsmSignal),fontWeight:700}}>FSM: {portMetrics.fsmSignal}</span></>}</div>
        <div style={{display:"flex",gap:4}}>
          {hasData&&<><Btn onClick={handleCopy} accent={C.cyan} small>{copiedMsg||"\u2398 Copy Summary"}</Btn>
            <Btn onClick={()=>exportCSV(ycData,portMetrics,"portfolio_A")} accent={C.green} small>{"\u2913 Export CSV"}</Btn>
            <Btn onClick={()=>window.print()} accent={C.textDim} small>{"\u2399 Print"}</Btn></>}
          <button onClick={()=>setDataMode(dataMode==="ai-only"?"ycharts":"ai-only")} style={{padding:"4px 10px",borderRadius:4,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:0.5,
            background:dataMode==="ai-only"?C.blue+"15":"transparent",color:dataMode==="ai-only"?C.blue:C.textDim,border:`1px solid ${dataMode==="ai-only"?C.blue+"40":C.border}`}}>
            {dataMode==="ai-only"?"\uD83C\uDF10 AI-ONLY":"\uD83C\uDF10 AI-Only"}</button>
          {tab!=="compare"&&<Btn onClick={()=>runReport(tab)} loading={loading[tab]}>
            {loading[tab]?`${progress.message||"..."}`:`\u27F3 Generate`}</Btn>}</div></div>
      {dataMode!=="ai-only"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <DataSlot label="PORTFOLIO A" color={C.accent} ycData={ycDataA} pasteVal={pasteA} setPaste={setPasteA} apiKey={apiKeyA} setApiKey={setApiKeyA} onLoad={onDataLoadA} onClear={onClearA} loading={loadingA} error={errorA}/>
        <DataSlot label="PORTFOLIO B" color={C.purple} ycData={ycDataB} pasteVal={pasteB} setPaste={setPasteB} apiKey={apiKeyB} setApiKey={setApiKeyB} onLoad={onDataLoadB} onClear={onClearB} loading={loadingB} error={errorB}/></div>}
      {dataMode==="ai-only"&&!hasData&&<div style={{fontSize:10,color:C.blue,marginTop:4}}>{"\uD83C\uDF10"} AI-Only mode \u2014 Click Generate. No YCharts required.</div>}</div>

    {/* TOOL LOG */}
    {(isLoading||toolLog.length>0)&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 14px",marginBottom:12,borderLeft:`2px solid ${style.color}`}} data-no-print>
      <div style={{fontSize:9,fontWeight:700,color:style.color,letterSpacing:1.2,marginBottom:4}}>{style.icon} {style.persona.toUpperCase()} ACTIVITY LOG {isLoading&&<span style={{animation:"pulse 1s infinite"}}>{"\u25CF"}</span>}</div>
      <div style={{maxHeight:100,overflow:"auto"}}>{toolLog.map((e,i)=><div key={i} style={{fontSize:10,padding:"2px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6}}>
        <span style={{color:C.textMuted,fontSize:9,minWidth:50}}>{e.time}</span>
        <span style={{color:e.phase==="web_search"?C.blue:C.green}}>{e.phase==="web_search"?"\uD83C\uDF10":"\uD83D\uDCCA"}</span>
        <span style={{color:C.text,fontSize:10}}>{e.message}</span></div>)}
        {isLoading&&progress.message&&<div style={{fontSize:10,color:style.color,padding:"2px 0"}}>{"\u2192"} {progress.message}</div>}</div></div>}

    {/* ═══ COMPARE TAB ═══ */}
    {tab==="compare"&&hasA&&hasB&&<CompareView dataA={ycDataA} metricsA={portMetricsA} dataB={ycDataB} metricsB={portMetricsB} styleId={styleId}/>}

    {/* ═══ DAILY REPORT ═══ */}
    {tab==="daily"&&aiDaily&&<div style={{animation:"fadeUp 0.25s ease"}}>
      {hasData&&portMetrics&&<div style={{marginBottom:12}}>
        <div style={{fontSize:9,fontWeight:700,color:C.green,letterSpacing:1.2,marginBottom:6}}>LAYER 1 \u2014 YCHARTS ({style.name.toUpperCase()} SCORING)</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6}}>
          {[["FSM",portMetrics.fsmSignal,sigColor(portMetrics.fsmSignal)],["Bullish",`${(portMetrics.bullishPct*100).toFixed(0)}%`,portMetrics.bullishPct>0.5?C.green:C.red],["Return",pctFmt(portMetrics.wtdReturn),portMetrics.wtdReturn>=0?C.green:C.red],["Vol",pctFmt(portMetrics.wtdVol),C.text],["Sharpe",n(portMetrics.wtdSharpe),portMetrics.wtdSharpe>0.5?C.green:C.amber],["Composite",`${portMetrics.avgComposite.toFixed(0)}/100`,portMetrics.avgComposite>=60?C.green:C.amber]].map(([l,v,c])=><div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:4,padding:6,textAlign:"center"}}><div style={{fontSize:8,color:C.textDim}}>{l}</div><div style={{fontSize:13,fontWeight:700,color:c}}>{v}</div></div>)}</div></div>}
      <div style={{fontSize:9,fontWeight:700,color:style.color,letterSpacing:1.2,marginBottom:6}}>LAYER 2 \u2014 {style.persona.toUpperCase()} INTERPRETATION</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <Card title="Regime Assessment" accent={sigColor(aiDaily.regimeAssessment?.regime)} row={2}>
          <div style={{fontSize:28,fontWeight:700,color:sigColor(aiDaily.regimeAssessment?.regime),lineHeight:1,marginBottom:4}}>{aiDaily.regimeAssessment?.regime}</div>
          <div style={{fontSize:10,color:C.textDim,marginBottom:6}}>Confidence: <span style={{color:sigColor(aiDaily.regimeAssessment?.confidence)}}>{aiDaily.regimeAssessment?.confidence}</span></div>
          <Gauge value={aiDaily.regimeAssessment?.regimeScore} label="Regime Score" color={sigColor(aiDaily.regimeAssessment?.regime)}/>
          <Gauge value={aiDaily.regimeAssessment?.recessionProbability} label="Recession Prob" color={(aiDaily.regimeAssessment?.recessionProbability||0)>35?C.red:C.green}/>
          {["trendDirection","volatilityRegime","breadthAssessment","momentumRegime","selloffRisk"].map(k=><MR key={k} label={k.replace(/([A-Z])/g," $1").trim()} value={aiDaily.regimeAssessment?.[k]} color={sigColor(aiDaily.regimeAssessment?.[k])}/>)}
          <div style={{marginTop:6,fontSize:10,color:C.textDim,lineHeight:1.6,padding:6,background:C.bg,borderRadius:3}}>{aiDaily.regimeAssessment?.rationale}</div></Card>
        <Card title="Business Cycle" accent={C.purple} row={2}>
          <div style={{fontSize:18,fontWeight:700,color:sigColor(aiDaily.cycleDiagnosis?.currentCycle),marginBottom:4}}>{aiDaily.cycleDiagnosis?.currentCycle}</div>
          <MR label="Cycle Age" value={aiDaily.cycleDiagnosis?.cycleAge}/><MR label="Transition Risk" value={aiDaily.cycleDiagnosis?.transitionRisk} color={sigColor(aiDaily.cycleDiagnosis?.transitionRisk)}/>
          <MR label="Next Phase" value={aiDaily.cycleDiagnosis?.nextPhaseETA}/><MR label="Analog" value={aiDaily.cycleDiagnosis?.historicalAnalog}/>
          {aiDaily.sectorRotation&&<div style={{marginTop:6}}><div style={{fontSize:10,color:C.green}}>Favored: {aiDaily.sectorRotation.favored?.join(", ")}</div><div style={{fontSize:10,color:C.red}}>Disfavored: {aiDaily.sectorRotation.disfavored?.join(", ")}</div></div>}</Card>
        <Card title="Forward Outlook" accent={C.cyan} row={2}>
          {aiDaily.forwardOutlook&&Object.entries(aiDaily.forwardOutlook).map(([p,t])=><div key={p} style={{marginBottom:6,padding:"4px 6px",background:C.bg,borderRadius:3,borderLeft:`2px solid ${p==="daily"?C.cyan:p==="weekly"?C.blue:C.purple}`}}><div style={{fontSize:8,fontWeight:700,color:C.textDim,textTransform:"uppercase"}}>{p}</div><div style={{fontSize:10,color:C.text,lineHeight:1.5}}>{t}</div></div>)}</Card>
        <Card title={`${style.persona} Narrative`} accent={style.color} span={2}>
          <p style={{fontSize:12,lineHeight:1.8,color:C.text,margin:0}}>{aiDaily.marketNarrative}</p></Card>
        <Card title="Risks \u00B7 Actions" accent={C.amber}>
          {aiDaily.keyRisks?.map((r,i)=><div key={i} style={{fontSize:10,padding:"2px 0",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}><span style={{color:C.red}}>{"\u26A0"} {r.risk||r}</span>{r.probability&&<Pill color={sigColor(r.probability)}>{r.probability}</Pill>}</div>)}
          <div style={{marginTop:4,fontSize:8,fontWeight:700,color:C.blue}}>ACTIONS</div>
          {aiDaily.portfolioActions?.map((a,i)=><div key={i} style={{fontSize:10,padding:"2px 0",borderBottom:`1px solid ${C.border}`}}><span>{a.action||a}</span>{a.urgency&&<span style={{marginLeft:4}}><Pill color={sigColor(a.urgency)}>{a.urgency}</Pill></span>}</div>)}</Card></div></div>}

    {/* ═══ EQUITY REPORT ═══ */}
    {tab==="equity"&&<div style={{animation:"fadeUp 0.25s ease"}}>
      {hasData&&<div style={{marginBottom:12}}>
        <div style={{fontSize:9,fontWeight:700,color:C.green,letterSpacing:1.2,marginBottom:4}}>LAYER 1 \u2014 YCHARTS (T{style.weights.trend}/TC{style.weights.tech}/F{style.weights.fund}/D{style.weights.dwa})</div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,overflow:"auto",maxHeight:300}}>
          <table><thead><tr>{["Ticker","Price","1Y","Vol","Beta","Sharpe","1M","Comp","BB%B","Wave","Signal"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>{HOLDINGS.map(h=>{const d=ycData[h.ticker];if(!d) return null;return <tr key={h.ticker} style={{background:d.signal?.includes("BUY")?C.green+"06":d.signal?.includes("SELL")?C.red+"06":"transparent"}}>
              <td style={{fontWeight:700,color:C.text}}>{h.ticker}</td><td>{usd(d.price)}</td>
              <td style={{color:(d.one_year_return||0)>=0?C.green:C.red}}>{pctFmt(d.one_year_return)}</td>
              <td>{pctFmt(d.one_year_volatility)}</td><td>{n(d.beta_5_year)}</td><td style={{color:(d.sharpe||0)>0.5?C.green:C.textDim}}>{n(d.sharpe)}</td>
              <td style={{color:(d.one_month_return||0)>=0?C.green:C.red}}>{pctFmt(d.one_month_return)}</td>
              <td style={{fontWeight:700,color:(d.composite||0)>=60?C.green:(d.composite||0)<=40?C.red:C.amber}}>{d.composite||"\u2014"}</td>
              <td>{d.bbPercentB!=null?n(d.bbPercentB):"\u2014"}</td><td><Pill color={sigColor(d.wavePhase)}>{d.wavePhase||"\u2014"}</Pill></td>
              <td><Pill color={sigColor(d.signal)}>{d.signal}</Pill></td></tr>})}</tbody></table></div></div>}
      {aiEquity&&<div>
        <div style={{fontSize:9,fontWeight:700,color:style.color,letterSpacing:1.2,marginBottom:4}}>LAYER 2 \u2014 {style.persona.toUpperCase()}</div>
        {aiEquity.marketContext&&<div style={{fontSize:11,color:C.text,lineHeight:1.6,padding:"6px 10px",background:C.card,borderRadius:4,marginBottom:8,borderLeft:`2px solid ${style.color}`}}>{aiEquity.marketContext}</div>}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,overflow:"auto"}}>
          <table><thead><tr>{[hasData&&"YC","Ticker","AI Signal","Tech","Fund","Catalyst","RS","Conv","News","Action"].filter(Boolean).map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>{aiEquity.equities?.map((eq,i)=> <tr key={i}>
              {hasData&&<td style={{fontWeight:600,color:sigColor(ycData[eq.ticker]?.signal)}}>{ycData[eq.ticker]?.composite||"\u2014"}</td>}
              <td style={{fontWeight:700,color:C.text}}>{eq.ticker}</td>
              <td><Pill color={sigColor(eq.analystSignal)}>{eq.analystSignal}</Pill></td>
              <td><Pill color={sigColor(eq.technicalView)}>{eq.technicalView}</Pill></td>
              <td><Pill color={sigColor(eq.fundamentalView)}>{eq.fundamentalView}</Pill></td>
              <td><Pill color={sigColor(eq.catalystView)}>{eq.catalystView}</Pill></td>
              <td><Pill color={sigColor(eq.relativeStrength)}>{eq.relativeStrength}</Pill></td>
              <td style={{color:sigColor(eq.conviction),fontWeight:600,fontSize:10}}>{eq.conviction}</td>
              <td style={{fontSize:9,color:C.textDim,textAlign:"left",maxWidth:120}}>{eq.newsContext}</td>
              <td style={{fontSize:9,color:C.text,textAlign:"left",maxWidth:130}}>{eq.recommendation}</td></tr>)}</tbody></table></div></div>}</div>}

    {/* ═══ PORTFOLIO REPORT ═══ */}
    {tab==="portfolio"&&(aiPortfolio||hasData)&&(()=>{
      const allocGrps={};HOLDINGS.forEach(h=>{allocGrps[h.class]=(allocGrps[h.class]||0)+h.target});
      const clr={"US Eq":C.blue,Intl:C.purple,Bond:C.cyan,Alt:C.amber,REIT:C.green,MF:C.orange,Hedge:C.magenta};
      const sortedHoldings=hasData?[...HOLDINGS].filter(h=>ycData[h.ticker]).sort((a,b)=>(ycData[b.ticker]?.composite||0)-(ycData[a.ticker]?.composite||0)):HOLDINGS;
      const topHoldings=sortedHoldings.slice(0,5);const bottomHoldings=[...sortedHoldings].reverse().slice(0,5);
      const sectorPerf={};if(hasData)HOLDINGS.forEach(h=>{const d=ycData[h.ticker];if(!d)return;if(!sectorPerf[h.class])sectorPerf[h.class]={ret:0,vol:0,comp:0,n:0};
        sectorPerf[h.class].ret+=(d.one_year_return||0);sectorPerf[h.class].vol+=(d.one_year_volatility||0);sectorPerf[h.class].comp+=(d.composite||0);sectorPerf[h.class].n++});
      Object.values(sectorPerf).forEach(s=>{if(s.n){s.ret/=s.n;s.vol/=s.n;s.comp/=s.n}});
      const grade=aiPortfolio?.portfolioGrade||(hasData&&portMetrics?(portMetrics.avgComposite>=70?"A":portMetrics.avgComposite>=55?"B":portMetrics.avgComposite>=40?"C":"D"):null);
      return <div style={{animation:"fadeUp 0.25s ease",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",background:C.bg}}>
      {/* HEADER */}
      <div style={{background:`linear-gradient(135deg,${C.header},${C.card})`,padding:"16px 20px",borderBottom:`2px solid ${style.color}`,display:"flex",justifyContent:"space-between"}}>
        <div><div style={{fontSize:8,fontWeight:700,letterSpacing:5,color:C.accent}}>MARLINE WEALTH MANAGEMENT</div><div style={{fontSize:16,fontWeight:300,color:C.text,marginTop:4}}>Portfolio Analysis Report</div>
          <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})} {"\u00B7"} {style.icon} {style.name} {"\u00B7"} {hasData?"YCharts Verified":"AI Sourced"}{aiPortfolio?" + AI Enhanced":""}</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:40,fontWeight:700,color:sigColor(grade==="A"?"BULLISH":grade==="B"?"BUY":grade==="C"?"CAUTIOUS":"BEARISH"),lineHeight:1}}>{grade||"\u2014"}</div><div style={{fontSize:9,color:C.textDim}}>GRADE</div></div></div>

      {/* ROW 1: 3 PANELS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
        {/* STYLE + SIGNALS */}
        <div style={{padding:"12px 16px",borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:C.accent,letterSpacing:1,marginBottom:6}}>STYLE {"\u00B7"} SIGNALS</div>
          {aiPortfolio?.styleAnalysis?<><div style={{fontSize:14,fontWeight:600,color:C.text}}>{aiPortfolio.styleAnalysis.overallStyle}</div>
            <div style={{fontSize:10,color:C.textDim,marginTop:3}}>Eq: {aiPortfolio.styleAnalysis.equityStyle}</div><div style={{fontSize:10,color:C.textDim}}>FI: {aiPortfolio.styleAnalysis.fixedIncomeStyle}</div>
            <div style={{fontSize:10,color:C.amber,marginTop:3}}>{"\u2605".repeat(aiPortfolio.styleAnalysis.riskLevel||3)}{"\u2606".repeat(5-(aiPortfolio.styleAnalysis.riskLevel||3))}</div></>
            :<><div style={{fontSize:13,fontWeight:600,color:style.color}}>{style.icon} {style.name}</div>
            <div style={{fontSize:10,color:C.textDim,marginTop:2}}>T{style.weights.trend}/TC{style.weights.tech}/F{style.weights.fund}/D{style.weights.dwa}</div></>}
          {portMetrics&&<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:2,marginTop:6}}>
            {[["SB",portMetrics.signals.strongBuy,C.green],["B",portMetrics.signals.buy,"#66BB6A"],["H",portMetrics.signals.hold,C.textDim],["S",portMetrics.signals.sell,C.orange],["SS",portMetrics.signals.strongSell,C.red]].map(([l,v,c])=><div key={l} style={{textAlign:"center",padding:2,background:C.bg,borderRadius:2}}><div style={{fontSize:12,fontWeight:700,color:c,fontFamily:"'JetBrains Mono',monospace"}}>{v}</div><div style={{fontSize:7,color:C.textMuted}}>{l}</div></div>)}</div>}</div>
        {/* PERFORMANCE */}
        <div style={{padding:"12px 16px",borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:C.accent,letterSpacing:1,marginBottom:6}}>PERFORMANCE</div>
          {hasData&&portMetrics?<>{[["Return",pctFmt(portMetrics.wtdReturn),portMetrics.wtdReturn>=0?C.green:C.red],["Volatility",pctFmt(portMetrics.wtdVol),C.text],["Sharpe",n(portMetrics.wtdSharpe),(portMetrics.wtdSharpe||0)>0.5?C.green:C.amber],["Beta",n(portMetrics.wtdBeta),C.text],["Composite",`${portMetrics.avgComposite.toFixed(0)}/100`,portMetrics.avgComposite>=60?C.green:C.amber],["FSM",portMetrics.fsmSignal,sigColor(portMetrics.fsmSignal)]].map(([l,v,c])=><MR key={l} label={l} value={v} color={c}/>)}</>
            :<div style={{fontSize:10,color:C.textMuted}}>Load YCharts data</div>}</div>
        {/* BENCHMARKS + ECONOMY */}
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:C.accent,letterSpacing:1,marginBottom:6}}>BENCHMARKS {"\u00B7"} ECONOMY {aiPortfolio&&<span style={{color:C.blue}}>{"\u00B7"} AI</span>}</div>
          {aiPortfolio?.benchmarkData?<>{[["S&P YTD",`${aiPortfolio.benchmarkData.sp500Ytd}%`,(aiPortfolio.benchmarkData.sp500Ytd||0)>=0?C.green:C.red],["Bond YTD",`${aiPortfolio.benchmarkData.aggBondYtd}%`],["60/40",`${aiPortfolio.benchmarkData.sixtyFortyYtd}%`]].map(([l,v,c])=><MR key={l} label={l} value={v} color={c}/>)}</>
            :<div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>Generate report for benchmarks</div>}
          {aiPortfolio?.economicSnapshot&&<div style={{marginTop:4,paddingTop:4,borderTop:`1px solid ${C.border}`}}>
            {[["GDP",`${aiPortfolio.economicSnapshot.gdpGrowth}%`,(aiPortfolio.economicSnapshot.gdpGrowth||0)>0?C.green:C.red],["CPI",`${aiPortfolio.economicSnapshot.cpiInflation}%`],["Fed",`${aiPortfolio.economicSnapshot.fedFundsRate}%`],["Unemp",`${aiPortfolio.economicSnapshot.unemploymentRate}%`]].map(([l,v,c])=><MR key={l} label={l} value={v} color={c}/>)}</div>}</div></div>

      {/* ROW 2: ALLOCATION + SECTOR PERF + RISK */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
        <div style={{padding:"12px 16px",borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:C.accent,letterSpacing:1,marginBottom:6}}>ALLOCATION</div>
          {Object.entries(allocGrps).sort((a,b)=>b[1]-a[1]).map(([c,v])=><div key={c} style={{marginBottom:4}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.textDim,marginBottom:1}}><span>{c}</span><span style={{color:clr[c],fontWeight:600}}>{v}%</span></div>
            <div style={{height:4,background:C.border,borderRadius:2}}><div style={{height:"100%",width:`${v}%`,background:clr[c],borderRadius:2}}/></div></div>)}</div>
        <div style={{padding:"12px 16px",borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:C.accent,letterSpacing:1,marginBottom:6}}>SECTOR PERFORMANCE</div>
          {Object.keys(sectorPerf).length>0?Object.entries(sectorPerf).sort((a,b)=>b[1].comp-a[1].comp).map(([cls,s])=><div key={cls} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",borderBottom:`1px solid ${C.border}`,fontSize:10}}>
            <span style={{color:clr[cls],fontWeight:600,minWidth:50}}>{cls}</span>
            <span style={{color:s.ret>=0?C.green:C.red}}>{(s.ret*100).toFixed(1)}%</span>
            <span style={{color:C.textDim}}>Vol {(s.vol*100).toFixed(1)}%</span>
            <span style={{fontWeight:700,color:s.comp>=60?C.green:s.comp<=40?C.red:C.amber,fontFamily:"'JetBrains Mono',monospace"}}>{s.comp.toFixed(0)}</span></div>)
            :<div style={{fontSize:10,color:C.textMuted}}>Load data for sector breakdown</div>}</div>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:C.accent,letterSpacing:1,marginBottom:6}}>RISK ASSESSMENT</div>
          {hasData&&portMetrics&&<><MR label="Cash Triggers" value={portMetrics.cashTriggers.anyActive?"ACTIVE":"Clear"} color={portMetrics.cashTriggers.anyActive?C.red:C.green}/>
            <MR label="Bullish %" value={`${(portMetrics.bullishPct*100).toFixed(0)}%`} color={portMetrics.bullishPct>0.5?C.green:C.red}/>
            <MR label="Hedge Mult" value={`${style.hedgeMultiplier}x`} color={C.textDim}/>
            <MR label="Cash Max" value={`${style.cashMax}%`} color={C.textDim}/></>}
          {aiPortfolio?.riskAssessment&&<><MR label="Risk Level" value={aiPortfolio.riskAssessment.portfolioRiskLevel} color={sigColor(aiPortfolio.riskAssessment.portfolioRiskLevel)}/>
            <MR label="Drawdown" value={aiPortfolio.riskAssessment.drawdownRisk} color={sigColor(aiPortfolio.riskAssessment.drawdownRisk)}/></>}</div></div>

      {/* ROW 3: TOP/BOTTOM HOLDINGS */}
      {hasData&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
        <div style={{padding:"12px 16px",borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:C.green,letterSpacing:1,marginBottom:6}}>TOP 5 HOLDINGS</div>
          {topHoldings.map(h=>{const d=ycData[h.ticker];return <div key={h.ticker} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700,color:C.accent,fontSize:11,fontFamily:"'JetBrains Mono',monospace",minWidth:36}}>{h.ticker}</span><span style={{fontSize:9,color:C.textDim}}>{h.class}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10,color:(d?.one_year_return||0)>=0?C.green:C.red}}>{pctFmt(d?.one_year_return)}</span>
              <span style={{fontWeight:700,color:C.green,fontFamily:"'JetBrains Mono',monospace",fontSize:11,minWidth:22,textAlign:"right"}}>{d?.composite}</span>
              <Pill color={sigColor(d?.signal)}>{d?.signal}</Pill></div></div>})}</div>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,fontWeight:700,color:C.red,letterSpacing:1,marginBottom:6}}>BOTTOM 5 HOLDINGS</div>
          {bottomHoldings.map(h=>{const d=ycData[h.ticker];return <div key={h.ticker} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700,color:C.accent,fontSize:11,fontFamily:"'JetBrains Mono',monospace",minWidth:36}}>{h.ticker}</span><span style={{fontSize:9,color:C.textDim}}>{h.class}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10,color:(d?.one_year_return||0)>=0?C.green:C.red}}>{pctFmt(d?.one_year_return)}</span>
              <span style={{fontWeight:700,color:(d?.composite||0)<=40?C.red:C.amber,fontFamily:"'JetBrains Mono',monospace",fontSize:11,minWidth:22,textAlign:"right"}}>{d?.composite}</span>
              <Pill color={sigColor(d?.signal)}>{d?.signal}</Pill></div></div>})}</div></div>}

      {/* FULL HOLDINGS TABLE */}
      {hasData&&<div style={{borderBottom:`1px solid ${C.border}`}}>
        <div style={{padding:"8px 16px",fontSize:9,fontWeight:700,color:C.accent,letterSpacing:1,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>ALL HOLDINGS ({HOLDINGS.length})</span>
          <Btn onClick={()=>exportCSV(ycData,portMetrics,"portfolio_report")} accent={C.green} small>{"\u2913 Export CSV"}</Btn></div>
        <div style={{overflow:"auto",maxHeight:300}}>
          <table><thead><tr>{["Ticker","Name","Class","Target","Price","1Y Ret","Vol","Beta","Sharpe","Comp","Signal"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>{sortedHoldings.map(h=>{const d=ycData[h.ticker];if(!d) return null; return <tr key={h.ticker} style={{background:d.signal?.includes("BUY")?C.green+"06":d.signal?.includes("SELL")?C.red+"06":"transparent"}}>
              <td style={{fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{h.ticker}</td>
              <td style={{color:C.text,textAlign:"left"}}>{h.name}</td><td>{h.class}</td><td>{h.target}%</td>
              <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{usd(d.price)}</td>
              <td style={{color:(d.one_year_return||0)>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{pctFmt(d.one_year_return)}</td>
              <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{pctFmt(d.one_year_volatility)}</td>
              <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{n(d.beta_5_year)}</td>
              <td style={{color:(d.sharpe||0)>0.5?C.green:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{n(d.sharpe)}</td>
              <td style={{fontWeight:700,color:(d.composite||0)>=60?C.green:(d.composite||0)<=40?C.red:C.amber,fontFamily:"'JetBrains Mono',monospace"}}>{d.composite}</td>
              <td><Pill color={sigColor(d.signal)}>{d.signal}</Pill></td></tr>})}</tbody></table></div></div>}

      {/* AI OUTLOOK + RECOMMENDATIONS */}
      {aiPortfolio?.quarterlyOutlook&&<div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:9,fontWeight:700,color:C.purple,letterSpacing:1,marginBottom:6}}>{style.icon} {style.name.toUpperCase()} OUTLOOK <span style={{color:C.blue}}>{"\u00B7"} AI</span></div>
        <p style={{fontSize:12,lineHeight:1.8,color:C.text,margin:"0 0 8px 0"}}>{aiPortfolio.quarterlyOutlook}</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {aiPortfolio.strategicRecommendations?.map((r,i)=><div key={i} style={{padding:"6px 10px",background:C.card,borderRadius:4,borderLeft:`2px solid ${[style.color,C.blue,C.purple][i%3]}`}}>
            <div style={{fontSize:9,fontWeight:700,color:[style.color,C.blue,C.purple][i%3]}}>P{r.priority||i+1}</div>
            <div style={{fontSize:10,color:C.text,marginTop:2,lineHeight:1.5}}>{r.recommendation}</div>
            <div style={{fontSize:9,color:C.textMuted,marginTop:2}}>{r.rationale}</div></div>)}</div></div>}
      {!aiPortfolio&&hasData&&<div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:C.card+"80"}}>
        <div style={{fontSize:10,color:C.textDim,textAlign:"center"}}>Click <span style={{color:C.accent,fontWeight:700}}>Generate</span> to add AI-powered outlook, benchmarks, economic snapshot, and strategic recommendations to this report.</div></div>}

      {/* FOOTER */}
      <div style={{padding:"6px 16px",display:"flex",justifyContent:"space-between",fontSize:8,color:C.textMuted}}>
        <span>Marline Wealth Management {"\u00B7"} {new Date().getFullYear()}</span>
        <span>{hasData?"YCharts":"AI"}{aiPortfolio?" + AI":""} {"\u00B7"} {style.name} ({toolLog.length} tools) {"\u00B7"} Not Investment Advice</span></div></div>})()} 

    {/* EMPTY STATE */}
    {!isLoading&&tab!=="compare"&&((tab==="daily"&&!aiDaily)||(tab==="equity"&&!aiEquity&&!hasData)||(tab==="portfolio"&&!aiPortfolio&&!hasData))&&
      <div style={{textAlign:"center",padding:40,color:C.textMuted}}>
        <div style={{fontSize:32,marginBottom:6,opacity:0.3}}>{style.icon}</div>
        <div style={{fontSize:12,color:C.textDim}}>{hasData?"YCharts loaded \u2014 click Generate":dataMode==="ai-only"?"AI-Only mode \u2014 click Generate":"Paste data into Portfolio A above, or switch to AI-Only mode"}</div></div>}
  </div>);
}
// ═══ OPTIONS MODULE (Full Trade Management) ═══
function OptionsModule({regimeData}){
  const[view,setView]=useState("dashboard"),[sortField,setSortField]=useState("squeezeScore"),[sortDir,setSortDir]=useState("desc");
  const[filterCat,setFilterCat]=useState("All"),[selectedStock,setSelectedStock]=useState(null),[searchTerm,setSearchTerm]=useState("");
  const[scanResults,setScanResults]=useState(null),[scanning,setScanning]=useState(false);
  const[aiIdeas,setAiIdeas]=useState(null),[loadingIdeas,setLoadingIdeas]=useState(false);
  const[trades,setTrades]=useState([]),[showEntry,setShowEntry]=useState(null),[advising,setAdvising]=useState({}),[advice,setAdvice]=useState({});
  const[entryForm,setEntryForm]=useState({ticker:"",type:"CALL",strike:"",expiry:"",entry:"",qty:1,target:"",stop:"",notes:""});
  const[editingPrice,setEditingPrice]=useState({}),[refreshing,setRefreshing]=useState({});
  const enriched=useMemo(()=>SI_UNIVERSE.map(s=>({...s,squeezeScore:computeSqueezeScore(s),...getSqueezeSignal(computeSqueezeScore(s))})),[]);
  const filtered=useMemo(()=>enriched.filter(s=>filterCat==="All"||s.category===filterCat).filter(s=>!searchTerm||s.ticker.toLowerCase().includes(searchTerm.toLowerCase())||s.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a,b)=>(sortDir==="desc"?-1:1)*((a[sortField]||0)-(b[sortField]||0))),[enriched,filterCat,searchTerm,sortField,sortDir]);
  const top5=enriched.filter(s=>s.squeezeScore>=65).sort((a,b)=>b.squeezeScore-a.squeezeScore).slice(0,5);
  const activeTrades=trades.filter(t=>t.status==="OPEN");const closedTrades=trades.filter(t=>t.status==="CLOSED");
  const totalPnl=activeTrades.reduce((s,t)=>s+(t.current-t.entry)*t.qty*100,0);
  const handleSort=f=>{if(sortField===f)setSortDir(d=>d==="desc"?"asc":"desc");else{setSortField(f);setSortDir("desc")}};
  const regimeCtx=regimeData?`Portfolio FSM: ${regimeData.fsmSignal}, Composite: ${regimeData.avgComposite?.toFixed(0)}/100, Cash Triggers: ${regimeData.cashTriggers?.anyActive?"ACTIVE":"Clear"}, Bullish: ${(regimeData.bullishPct*100).toFixed(0)}%`:"No regime data";

  const fetchAiIdeas=async()=>{setLoadingIdeas(true);try{
    const resp=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:2000,tools:[{type:"web_search_20250305",name:"web_search"}],
      messages:[{role:"user",content:`You are an options strategist. Search for current options market conditions, unusual activity, short squeeze candidates, and VIX.\n${regimeCtx}\nReturn JSON array of 5 trade ideas:\n[{"ticker":"SPY","strategy":"CALL|PUT|CALL SPREAD|PUT SPREAD|STRADDLE|STRANGLE|IRON CONDOR","strike":"specific strike","expiry":"MMM DD","rationale":"why now, 2 sentences","riskReward":"e.g. 1:3","confidence":"HIGH|MEDIUM|LOW","regime":"how regime affects this"}]\nReturn ONLY the JSON array.`}]})});
    const d=await resp.json();const text=d.content?.map(c=>c.type==="text"?c.text:"").join("");
    const match=text?.match(/\[[\s\S]*\]/);if(match)try{setAiIdeas(JSON.parse(match[0]))}catch{setAiIdeas(null)}
  }catch(e){console.error(e)}setLoadingIdeas(false)};

  const enterTrade=(prefill)=>{setEntryForm({ticker:prefill?.ticker||"",type:prefill?.strategy||prefill?.type||"CALL",strike:prefill?.strike||"",expiry:prefill?.expiry||"",entry:"",qty:1,target:"",stop:"",notes:prefill?.rationale||""});setShowEntry(true)};
  const saveTrade=()=>{if(!entryForm.ticker||!entryForm.entry)return;
    setTrades(prev=>[...prev,{id:Date.now(),ticker:entryForm.ticker.toUpperCase(),type:entryForm.type,strike:parseFloat(entryForm.strike)||0,expiry:entryForm.expiry,entry:parseFloat(entryForm.entry),current:parseFloat(entryForm.entry),qty:parseInt(entryForm.qty)||1,target:parseFloat(entryForm.target)||null,stop:parseFloat(entryForm.stop)||null,notes:entryForm.notes,status:"OPEN",date:new Date().toLocaleDateString(),alerts:[]}]);setShowEntry(false)};
  const closeTrade=(id)=>setTrades(prev=>prev.map(t=>t.id===id?{...t,status:"CLOSED",closeDate:new Date().toLocaleDateString()}:t));
  const updatePrice=(id,price)=>setTrades(prev=>prev.map(t=>t.id===id?{...t,current:parseFloat(price)||t.current}:t));

  const refreshPrice=async(trade)=>{setRefreshing(p=>({...p,[trade.id]:true}));try{
    const resp=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:300,tools:[{type:"web_search_20250305",name:"web_search"}],
      messages:[{role:"user",content:`Search for the current price of ${trade.ticker} ${trade.type} options with strike $${trade.strike} expiring ${trade.expiry}. If you cannot find exact option price, find the current stock price of ${trade.ticker} and estimate. Return ONLY a JSON: {"currentPrice": number, "stockPrice": number, "note": "brief context"}`}]})});
    const d=await resp.json();const text=d.content?.map(c=>c.type==="text"?c.text:"").join("");
    const match=text?.match(/\{[\s\S]*\}/);if(match){const parsed=JSON.parse(match[0]);if(parsed.currentPrice)updatePrice(trade.id,parsed.currentPrice)}
  }catch(e){console.error(e)}setRefreshing(p=>({...p,[trade.id]:false}))};

  const getAdvice=async(trade)=>{setAdvising(p=>({...p,[trade.id]:true}));try{
    const pnl=(trade.current-trade.entry)*trade.qty*100;const pnlPct=((trade.current-trade.entry)/trade.entry*100).toFixed(1);
    const resp=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:800,tools:[{type:"web_search_20250305",name:"web_search"}],
      messages:[{role:"user",content:`You are an options trading advisor. Analyze this open position:\nTicker: ${trade.ticker} | Type: ${trade.type} | Strike: $${trade.strike} | Expiry: ${trade.expiry}\nEntry: $${trade.entry} | Current: $${trade.current} | Qty: ${trade.qty} | P&L: $${pnl.toFixed(0)} (${pnlPct}%)\n${trade.target?`Profit Target: $${trade.target}`:""} ${trade.stop?`Stop Loss: $${trade.stop}`:""}\n${regimeCtx}\nSearch for current ${trade.ticker} news, price action, IV environment.\nReturn JSON: {"action":"ADD|HOLD|TAKE PROFIT|CUT LOSS|ROLL","confidence":"HIGH|MEDIUM|LOW","reasoning":"2-3 sentences","priceTarget":"specific level","timeframe":"when to act","riskNote":"key risk"}`}]})});
    const d=await resp.json();const text=d.content?.map(c=>c.type==="text"?c.text:"").join("");
    const match=text?.match(/\{[\s\S]*\}/);if(match)setAdvice(p=>({...p,[trade.id]:JSON.parse(match[0])}));
  }catch(e){console.error(e)}setAdvising(p=>({...p,[trade.id]:false}))};

  const getAlertStatus=(t)=>{if(t.status!=="OPEN")return null;const pnlPct=(t.current-t.entry)/t.entry*100;
    if(t.target&&t.current>=t.target)return{type:"TARGET",msg:`Hit target $${t.target}`,color:C.green};
    if(t.stop&&t.current<=t.stop)return{type:"STOP",msg:`Hit stop $${t.stop}`,color:C.red};
    if(pnlPct>=50)return{type:"PROFIT",msg:`Up ${pnlPct.toFixed(0)}%`,color:C.green};
    if(pnlPct<=-30)return{type:"LOSS",msg:`Down ${pnlPct.toFixed(0)}%`,color:C.red};return null};
  const advColor=a=>{if(!a)return C.textDim;const u=a.toUpperCase();return u.includes("ADD")?C.green:u.includes("HOLD")?C.blue:u.includes("PROFIT")?C.green:u.includes("CUT")||u.includes("LOSS")?C.red:u.includes("ROLL")?C.amber:C.textDim};

  return <div>
    {regimeData&&<div style={{background:regimeData.fsmSignal==="FULLY INVESTED"?C.green+"08":regimeData.fsmSignal==="CAUTION"?C.amber+"08":C.red+"08",border:`1px solid ${regimeData.fsmSignal==="FULLY INVESTED"?C.green:regimeData.fsmSignal==="CAUTION"?C.amber:C.red}30`,borderRadius:8,padding:"8px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10,fontSize:10}}>
      <span style={{fontWeight:800,color:C.accent,letterSpacing:1}}>INTELLIGENCE BRIDGE</span><span style={{color:C.border}}>|</span>
      <span style={{color:sigColor(regimeData.fsmSignal),fontWeight:700}}>FSM: {regimeData.fsmSignal}</span><span style={{color:C.border}}>|</span>
      <span>Composite: {regimeData.avgComposite?.toFixed(0)}</span><span style={{color:C.border}}>|</span>
      <span style={{color:regimeData.cashTriggers?.anyActive?C.red:C.green,fontWeight:600}}>Cash: {regimeData.cashTriggers?.anyActive?"ACTIVE":"Clear"}</span></div>}

    <div style={{display:"flex",gap:2,marginBottom:14,flexWrap:"wrap"}}>
      {[{id:"dashboard",label:"Dashboard"},{id:"ideas",label:"AI Ideas",badge:aiIdeas?.length},{id:"trades",label:`Trades (${activeTrades.length})`,alert:activeTrades.some(t=>getAlertStatus(t))},{id:"scanner",label:"Scanner"},{id:"history",label:"History"}].map(v=>
        <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"6px 14px",border:`1px solid ${view===v.id?C.accent+"40":C.border}`,borderRadius:6,background:view===v.id?C.accent+"12":"transparent",color:view===v.id?C.accent:C.textDim,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
          {v.label}{v.badge&&<span style={{background:C.accent+"20",color:C.accent,padding:"0 4px",borderRadius:3,fontSize:8,fontWeight:700}}>{v.badge}</span>}
          {v.alert&&<span style={{width:5,height:5,borderRadius:"50%",background:C.red,animation:"pulse 1s infinite"}}/>}</button>)}</div>

    {/* DASHBOARD */}
    {view==="dashboard"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {[["Top Score",top5[0]?.squeezeScore||"\u2014",top5[0]?.ticker,C.accent],["Active Signals",enriched.filter(s=>s.squeezeScore>=65).length,`of ${enriched.length}`,C.green],["Open P&L",`${totalPnl>=0?"+":""}$${Math.abs(totalPnl).toLocaleString(undefined,{maximumFractionDigits:0})}`,`${activeTrades.length} active`,totalPnl>=0?C.green:C.red],["Avg IV Rank",(enriched.reduce((s,e)=>s+e.ivRank,0)/enriched.length).toFixed(0),"pricing",C.purple]].map(([l,v,sub,c],i)=><div key={i} style={{background:C.card,borderRadius:8,padding:"12px 14px",border:`1px solid ${C.border}`}}><div style={{fontSize:8,color:C.textDim,letterSpacing:0.8,marginBottom:4}}>{l.toUpperCase()}</div><div style={{fontSize:20,fontWeight:800,color:c,fontFamily:"'JetBrains Mono',monospace"}}>{v}</div>{sub&&<div style={{fontSize:10,color:C.textDim,marginTop:2}}>{sub}</div>}</div>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:10}}>
        <Card title="Top Squeeze Candidates" accent={C.accent}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
            {top5.map(s=><div key={s.ticker} onClick={()=>setSelectedStock(s)} style={{background:C.bg,borderRadius:6,padding:10,cursor:"pointer",border:`1px solid ${C.border}`,textAlign:"center"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{fontWeight:800,color:C.accent,fontSize:13,fontFamily:"'JetBrains Mono',monospace"}}>{s.ticker}</div>
              <div style={{fontSize:22,fontWeight:800,color:s.color,margin:"4px 0",fontFamily:"'JetBrains Mono',monospace"}}>{s.squeezeScore}</div>
              <div style={{fontSize:9,color:s.color,fontWeight:700}}>{s.signal}</div><div style={{fontSize:9,color:C.textDim}}>SI: {s.siPct}%</div></div>)}</div></Card>
        <Card title="Active Alerts" accent={C.amber}>
          {activeTrades.length===0?<div style={{fontSize:10,color:C.textMuted,padding:10}}>No active trades. Use AI Ideas to find opportunities.</div>
            :activeTrades.map(t=>{const alert=getAlertStatus(t);const pnl=(t.current-t.entry)*t.qty*100;
              return <div key={t.id} style={{padding:"6px 0",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {alert&&<span style={{width:6,height:6,borderRadius:"50%",background:alert.color,animation:"pulse 1s infinite"}}/>}
                  <span style={{fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{t.ticker}</span>
                  <Pill color={C.purple}>{t.type}</Pill></div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontWeight:700,color:pnl>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace",fontSize:10}}>{pnl>=0?"+":""}${pnl.toFixed(0)}</span>
                  {alert&&<Pill color={alert.color}>{alert.msg}</Pill>}</div></div>})}</Card></div></div>}

    {/* AI IDEAS */}
    {view==="ideas"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div><div style={{fontSize:14,fontWeight:700}}>AI Trade Ideas</div><div style={{fontSize:11,color:C.textDim,marginTop:2}}>Regime-aware structured recommendations{regimeData&&<span style={{color:sigColor(regimeData.fsmSignal),marginLeft:6}}>{"\u00B7"} {regimeData.fsmSignal}</span>}</div></div>
        <div style={{display:"flex",gap:6}}><Btn onClick={fetchAiIdeas} loading={loadingIdeas}>{loadingIdeas?"Scanning...":"\u26A1 Generate Ideas"}</Btn>
          <Btn onClick={()=>enterTrade()} accent={C.green}>+ Manual Trade</Btn></div></div>
      {aiIdeas&&<div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
        {aiIdeas.map((idea,i)=><div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:14,display:"grid",gridTemplateColumns:"auto 1fr auto",gap:14,alignItems:"center"}}>
          <div style={{textAlign:"center",minWidth:60}}>
            <div style={{fontWeight:800,color:C.accent,fontSize:16,fontFamily:"'JetBrains Mono',monospace"}}>{idea.ticker}</div>
            <Pill color={sigColor(idea.confidence)}>{idea.confidence}</Pill></div>
          <div><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}><Pill color={C.purple}>{idea.strategy}</Pill><span style={{fontSize:10,color:C.textDim}}>Strike: {idea.strike} {"\u00B7"} Exp: {idea.expiry} {"\u00B7"} R:R {idea.riskReward}</span></div>
            <div style={{fontSize:11,color:C.text,lineHeight:1.5}}>{idea.rationale}</div>
            {idea.regime&&<div style={{fontSize:10,color:C.amber,marginTop:3}}>{"\u2139"} {idea.regime}</div>}</div>
          <Btn onClick={()=>enterTrade(idea)} accent={C.green} small>Enter Trade</Btn></div>)}</div>}
      {!aiIdeas&&!loadingIdeas&&<div style={{textAlign:"center",padding:40,color:C.textMuted}}>
        <div style={{fontSize:28,marginBottom:8,opacity:0.3}}>{"\u26A1"}</div>
        <div style={{fontSize:12}}>Click Generate Ideas for AI-powered trade recommendations</div></div>}</div>}

    {/* ACTIVE TRADES */}
    {view==="trades"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700}}>Active Trades ({activeTrades.length})</div>
        <div style={{display:"flex",gap:6}}><Btn onClick={()=>enterTrade()} accent={C.green} small>+ New Trade</Btn></div></div>
      {activeTrades.length===0?<div style={{textAlign:"center",padding:40,background:C.card,borderRadius:8,border:`1px solid ${C.border}`,color:C.textMuted}}><div style={{fontSize:28,marginBottom:8,opacity:0.3}}>{"\u25C8"}</div><div style={{fontSize:12}}>No active trades. Go to AI Ideas to find opportunities.</div></div>
        :<div style={{display:"grid",gap:8}}>{activeTrades.map(t=>{const pnl=(t.current-t.entry)*t.qty*100;const pnlPct=(t.current-t.entry)/t.entry*100;const alert=getAlertStatus(t);const adv=advice[t.id];
          return <div key={t.id} style={{background:C.card,border:`1px solid ${alert?alert.color+"40":C.border}`,borderRadius:8,overflow:"hidden",borderLeft:`3px solid ${pnl>=0?C.green:C.red}`}}>
            {/* TRADE HEADER */}
            <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {alert&&<span style={{width:8,height:8,borderRadius:"50%",background:alert.color,animation:"pulse 1s infinite"}}/>}
                <span style={{fontWeight:800,color:C.accent,fontSize:14,fontFamily:"'JetBrains Mono',monospace"}}>{t.ticker}</span>
                <Pill color={C.purple}>{t.type}</Pill>
                <span style={{fontSize:10,color:C.textDim}}>${t.strike} {"\u00B7"} {t.expiry}</span>
                {alert&&<Pill color={alert.color}>{alert.type}</Pill>}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:18,fontWeight:800,color:pnl>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{pnl>=0?"+":""}${pnl.toFixed(0)}</span>
                <span style={{fontSize:10,color:pnlPct>=0?C.green:C.red}}>({pnlPct>=0?"+":""}{pnlPct.toFixed(1)}%)</span></div></div>
            {/* TRADE DETAILS */}
            <div style={{padding:"8px 14px",display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6}}>
              {[["Entry",`$${t.entry.toFixed(2)}`],["Current",null],["Qty",t.qty],["Target",t.target?`$${t.target}`:"\u2014"],["Stop",t.stop?`$${t.stop}`:"\u2014"],["Opened",t.date]].map(([l,v],idx)=><div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:8,color:C.textDim}}>{l}</div>
                {l==="Current"?<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                  {editingPrice[t.id]?<input type="number" step="0.01" defaultValue={t.current} onBlur={e=>{updatePrice(t.id,e.target.value);setEditingPrice(p=>({...p,[t.id]:false}))}} onKeyDown={e=>e.key==="Enter"&&e.target.blur()} autoFocus style={{width:60,padding:"2px 4px",background:C.bg,border:`1px solid ${C.accent}40`,borderRadius:3,color:C.accent,fontSize:11,fontFamily:"'JetBrains Mono',monospace",textAlign:"center"}}/>
                    :<><span onClick={()=>setEditingPrice(p=>({...p,[t.id]:true}))} style={{fontWeight:700,color:C.accent,fontSize:11,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",borderBottom:`1px dashed ${C.accent}40`}}>${t.current.toFixed(2)}</span>
                    <button onClick={()=>refreshPrice(t)} disabled={refreshing[t.id]} style={{background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:9,padding:0}}>{refreshing[t.id]?"\u27F3":"\uD83C\uDF10"}</button></>}</div>
                  :<div style={{fontWeight:600,color:C.text,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>{v}</div>}</div>)}</div>
            {/* ACTION BUTTONS */}
            <div style={{padding:"6px 14px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bg+"40"}}>
              <div style={{display:"flex",gap:4}}>
                <Btn onClick={()=>getAdvice(t)} loading={advising[t.id]} accent={C.blue} small>{advising[t.id]?"Analyzing...":"\uD83E\uDDE0 Get Advice"}</Btn>
                <Btn onClick={()=>closeTrade(t.id)} accent={C.red} small>{"\u2715 Close"}</Btn></div>
              {t.notes&&<div style={{fontSize:9,color:C.textMuted,maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.notes}</div>}</div>
            {/* AI ADVICE */}
            {adv&&<div style={{padding:"8px 14px",borderTop:`1px solid ${advColor(adv.action)}30`,background:`${advColor(adv.action)}06`}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:800,color:advColor(adv.action)}}>{adv.action}</span>
                <Pill color={sigColor(adv.confidence)}>{adv.confidence}</Pill>
                {adv.timeframe&&<span style={{fontSize:9,color:C.textDim}}>{adv.timeframe}</span>}
                {adv.priceTarget&&<span style={{fontSize:9,color:C.accent}}>Target: {adv.priceTarget}</span>}</div>
              <div style={{fontSize:11,color:C.text,lineHeight:1.6}}>{adv.reasoning}</div>
              {adv.riskNote&&<div style={{fontSize:10,color:C.amber,marginTop:3}}>{"\u26A0"} {adv.riskNote}</div>}</div>}
          </div>})}</div>}</div>}

    {/* SCANNER */}
    {view==="scanner"&&<div>
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search..." style={{padding:"6px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:11,fontFamily:"inherit",width:180,boxSizing:"border-box"}}/>
        {["All",...new Set(SI_UNIVERSE.map(s=>s.category))].map(c=><button key={c} onClick={()=>setFilterCat(c)} style={{background:filterCat===c?C.accent+"15":"transparent",color:filterCat===c?C.accent:C.textDim,border:`1px solid ${filterCat===c?C.accent+"40":C.border}`,padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer"}}>{c}</button>)}</div>
      <div style={{background:C.card,borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden"}}><div style={{overflowX:"auto"}}>
        <table><thead><tr>{[{k:"ticker",l:"TICKER"},{k:null,l:"NAME"},{k:"siPct",l:"SI %"},{k:"dtc",l:"DTC"},{k:"ivRank",l:"IV RANK"},{k:null,l:"VOL"},{k:"squeezeScore",l:"SCORE"},{k:null,l:"SIGNAL"},{k:null,l:""}].map((col,i)=><th key={i} onClick={()=>col.k&&handleSort(col.k)} style={{cursor:col.k?"pointer":"default"}}>{col.l}{col.k===sortField&&<span style={{marginLeft:3}}>{sortDir==="desc"?"\u25BC":"\u25B2"}</span>}</th>)}</tr></thead>
          <tbody>{filtered.map((s,i)=><tr key={s.ticker} style={{background:i%2===0?"transparent":C.bg+"60"}}>
            <td style={{fontWeight:800,color:C.accent,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer"}} onClick={()=>setSelectedStock(s)}>{s.ticker}</td><td style={{color:C.text,fontSize:11}}>{s.name}</td>
            <td style={{fontWeight:700,color:s.siPct>=20?C.red:s.siPct>=10?C.amber:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{s.siPct}%</td>
            <td style={{fontWeight:700,color:s.dtc>=5?C.red:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{s.dtc}</td>
            <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{s.ivRank}</td>
            <td style={{fontSize:10,color:s.optionsVol==="Extreme"?C.green:C.textDim,fontWeight:600}}>{s.optionsVol}</td>
            <td style={{fontWeight:800,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.squeezeScore}</td>
            <td><Pill color={s.color}>{s.signal}</Pill></td>
            <td><button onClick={()=>enterTrade({ticker:s.ticker,type:"CALL"})} style={{background:C.green+"15",border:`1px solid ${C.green}30`,borderRadius:3,color:C.green,fontSize:8,padding:"2px 6px",cursor:"pointer",fontWeight:700}}>Trade</button></td></tr>)}</tbody></table></div></div></div>}

    {/* HISTORY */}
    {view==="history"&&<div>
      <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Closed Trades ({closedTrades.length})</div>
      {closedTrades.length===0?<div style={{textAlign:"center",padding:40,background:C.card,borderRadius:8,border:`1px solid ${C.border}`,color:C.textMuted}}>No closed trades yet.</div>
        :<div style={{background:C.card,borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden"}}>
          <table><thead><tr>{["Ticker","Type","Strike","Expiry","Entry","Exit","Qty","P&L","Closed"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>{closedTrades.map(t=>{const pnl=(t.current-t.entry)*t.qty*100;return <tr key={t.id}>
              <td style={{fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{t.ticker}</td>
              <td><Pill color={C.purple}>{t.type}</Pill></td><td style={{fontFamily:"'JetBrains Mono',monospace"}}>${t.strike}</td><td style={{color:C.textDim}}>{t.expiry}</td>
              <td style={{fontFamily:"'JetBrains Mono',monospace"}}>${t.entry.toFixed(2)}</td><td style={{fontFamily:"'JetBrains Mono',monospace"}}>${t.current.toFixed(2)}</td>
              <td>{t.qty}</td><td style={{fontWeight:800,color:pnl>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{pnl>=0?"+":""}${pnl.toFixed(0)}</td>
              <td style={{color:C.textDim,fontSize:10}}>{t.closeDate}</td></tr>})}</tbody></table></div>}</div>}

    {/* TRADE ENTRY MODAL */}
    {showEntry&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowEntry(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.panel,border:`1px solid ${C.accent}40`,borderRadius:14,maxWidth:500,width:"100%",padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:700}}>Enter Trade</div>
          <button onClick={()=>setShowEntry(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textDim,width:30,height:30,borderRadius:6,cursor:"pointer",fontSize:14}}>{"\u2715"}</button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["TICKER","ticker","text","AAPL"],["TYPE","type","select",null],["STRIKE","strike","number","150"],["EXPIRY","expiry","text","Mar 21"],["ENTRY PRICE","entry","number","5.50"],["QUANTITY","qty","number","1"],["PROFIT TARGET","target","number","Optional"],["STOP LOSS","stop","number","Optional"]].map(([label,key,type,ph])=><div key={key}>
            <div style={{fontSize:9,fontWeight:700,color:C.textDim,letterSpacing:0.5,marginBottom:3}}>{label}</div>
            {type==="select"?<select value={entryForm[key]} onChange={e=>setEntryForm(p=>({...p,[key]:e.target.value}))} style={{width:"100%",padding:"8px 10px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}}>
              {["CALL","PUT","CALL SPREAD","PUT SPREAD","STRADDLE","STRANGLE","IRON CONDOR","COVERED CALL","PROTECTIVE PUT"].map(o=><option key={o} value={o}>{o}</option>)}</select>
              :<input type={type} value={entryForm[key]} onChange={e=>setEntryForm(p=>({...p,[key]:e.target.value}))} placeholder={ph} style={{width:"100%",padding:"8px 10px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,fontFamily:type==="number"?"'JetBrains Mono',monospace":"inherit",boxSizing:"border-box"}}/>}</div>)}</div>
        <div style={{marginTop:10}}>
          <div style={{fontSize:9,fontWeight:700,color:C.textDim,letterSpacing:0.5,marginBottom:3}}>NOTES</div>
          <textarea value={entryForm.notes} onChange={e=>setEntryForm(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Trade thesis..."
            style={{width:"100%",padding:8,background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:11,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/></div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:14}}>
          <Btn onClick={()=>setShowEntry(false)} accent={C.textDim}>Cancel</Btn>
          <Btn onClick={saveTrade} accent={C.green}>{"\u2713 Save Trade"}</Btn></div></div></div>}

    {/* STOCK DETAIL MODAL */}
    {selectedStock&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setSelectedStock(null)}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.panel,border:`1px solid ${C.accent}40`,borderRadius:14,maxWidth:600,width:"100%",maxHeight:"80vh",overflow:"auto",padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div><span style={{fontSize:20,fontWeight:800,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{selectedStock.ticker}</span> <Pill color={getSqueezeSignal(computeSqueezeScore(selectedStock)).color}>{getSqueezeSignal(computeSqueezeScore(selectedStock)).signal}</Pill>
            <div style={{color:C.textDim,fontSize:12,marginTop:4}}>{selectedStock.name} {"\u00B7"} {selectedStock.sector}</div></div>
          <button onClick={()=>setSelectedStock(null)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textDim,width:30,height:30,borderRadius:6,cursor:"pointer",fontSize:14}}>{"\u2715"}</button></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>
          {[["SI %",selectedStock.siPct+"%",selectedStock.siPct>=20?C.red:C.amber],["DTC",selectedStock.dtc,selectedStock.dtc>=5?C.red:C.amber],["IV Rank",selectedStock.ivRank,C.purple],["Score",computeSqueezeScore(selectedStock),getSqueezeSignal(computeSqueezeScore(selectedStock)).color]].map(([l,v,c])=><div key={l} style={{background:C.bg,borderRadius:6,padding:8,textAlign:"center"}}><div style={{fontSize:8,color:C.textDim}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:c,fontFamily:"'JetBrains Mono',monospace"}}>{v}</div></div>)}</div>
        <div style={{fontSize:11,color:C.textDim,marginBottom:10}}>Catalyst: {selectedStock.catalyst} {"\u00B7"} Options Vol: {selectedStock.optionsVol} {"\u00B7"} Float Short: {selectedStock.floatShort}%</div>
        <Btn onClick={()=>{enterTrade({ticker:selectedStock.ticker,type:"CALL"});setSelectedStock(null)}} accent={C.green}>Enter Trade on {selectedStock.ticker}</Btn></div></div>}
  </div>;
}

// ═══ MAIN APPLICATION SHELL ═══
export default function MarlineUnifiedPlatform(){
  const[user,setUser]=useState(null),[activeModule,setActiveModule]=useState("intelligence");
  const[pasteA,setPasteA]=useState(""),[pasteB,setPasteB]=useState("");
  const[apiKeyA,setApiKeyA]=useState(""),[apiKeyB,setApiKeyB]=useState("");
  const[rawA,setRawA]=useState(null),[rawB,setRawB]=useState(null);
  const[ycDataA,setYcDataA]=useState(null),[ycDataB,setYcDataB]=useState(null);
  const[portMetricsA,setPortMetricsA]=useState(null),[portMetricsB,setPortMetricsB]=useState(null);
  const[styleId,setStyleId]=useState("balanced"),[showStyleSelector,setShowStyleSelector]=useState(false);
  const[dataMode,setDataMode]=useState("ycharts");
  const[loadingA,setLoadingA]=useState(false),[loadingB,setLoadingB]=useState(false);
  const[errorA,setErrorA]=useState(null),[errorB,setErrorB]=useState(null);

  useEffect(()=>{if(rawA&&Object.keys(rawA).length>0){const e=computeDerivedMetrics(rawA,styleId);setYcDataA(e);setPortMetricsA(computePortfolioMetrics(e,styleId))}},[styleId,rawA]);
  useEffect(()=>{if(rawB&&Object.keys(rawB).length>0){const e=computeDerivedMetrics(rawB,styleId);setYcDataB(e);setPortMetricsB(computePortfolioMetrics(e,styleId))}},[styleId,rawB]);

  const loadSlot=useCallback(async(paste,apiKey,setRaw,setYc,setPm,setLoading,setError)=>{
    setLoading(true);setError(null);
    try{let data=null;
      if(apiKey?.trim())data=await fetchYChartsAPI(apiKey.trim());
      if(!data&&paste?.trim())data=parseYChartsPaste(paste.trim());
      if(!data){setError(apiKey?.trim()?"API fetch failed (CORS in browser). Try pasting CSV data instead.":"No data found. Paste needs Ticker/Symbol column + numeric columns.");setLoading(false);return}
      setRaw(data);const enriched=computeDerivedMetrics(data,styleId);setYc(enriched);setPm(computePortfolioMetrics(enriched,styleId));
    }catch(e){setError(e.message)}setLoading(false);
  },[styleId]);
  const loadA=useCallback(()=>loadSlot(pasteA,apiKeyA,setRawA,setYcDataA,setPortMetricsA,setLoadingA,setErrorA),[pasteA,apiKeyA,loadSlot]);
  const loadB=useCallback(()=>loadSlot(pasteB,apiKeyB,setRawB,setYcDataB,setPortMetricsB,setLoadingB,setErrorB),[pasteB,apiKeyB,loadSlot]);
  const clearA=useCallback(()=>{setRawA(null);setYcDataA(null);setPortMetricsA(null);setPasteA("");setApiKeyA("");setErrorA(null)},[]);
  const clearB=useCallback(()=>{setRawB(null);setYcDataB(null);setPortMetricsB(null);setPasteB("");setApiKeyB("");setErrorB(null)},[]);

  if(!user) return <LoginScreen onLogin={setUser}/>;
  const style=INVESTOR_STYLES[styleId];const portMetrics=portMetricsA;
  const modules=[{id:"intelligence",label:"Intelligence",icon:"\u25C9",color:C.accent},{id:"options",label:"Options",icon:"\u26A1",color:C.purple},{id:"portfolio",label:"Portfolio",icon:"\u25C6",color:C.green}].filter(m=>user.modules?.includes(m.id)||user.role==="advisor");

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif"}}><style>{CSS_GLOBAL}</style>
      {/* HEADER */}
      <div style={{background:C.header,borderBottom:`1px solid ${C.border}`,padding:"0 20px",position:"sticky",top:0,zIndex:100}} data-no-print>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",height:52}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:30,height:30,background:C.gradientAccent,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:C.bg}}>M</div>
              <div><div style={{fontWeight:800,fontSize:13,letterSpacing:2}}>MARLINE</div><div style={{fontSize:7,color:C.accent,letterSpacing:2}}>WEALTH MANAGEMENT</div></div></div>
            <div style={{width:1,height:24,background:C.border}}/>
            <div style={{display:"flex",gap:2}}>
              {modules.map(m=><button key={m.id} onClick={()=>setActiveModule(m.id)} style={{background:activeModule===m.id?m.color+"15":"transparent",color:activeModule===m.id?m.color:C.textDim,border:activeModule===m.id?`1px solid ${m.color}40`:"1px solid transparent",padding:"6px 14px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{m.icon} {m.label}</button>)}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {activeModule==="intelligence"&&<StyleSelector styleId={styleId} onChange={setStyleId} expanded={showStyleSelector} onToggle={()=>setShowStyleSelector(!showStyleSelector)}/>}
            {portMetrics&&<span style={{padding:"3px 7px",borderRadius:4,fontSize:9,fontWeight:700,background:sigColor(portMetrics.fsmSignal)+"15",color:sigColor(portMetrics.fsmSignal),border:`1px solid ${sigColor(portMetrics.fsmSignal)}30`}}>FSM: {portMetrics.fsmSignal}</span>}
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:26,height:26,borderRadius:6,background:C.accent+"20",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:C.accent}}>{user.name[0]}</div>
              <div><div style={{fontSize:11,fontWeight:600}}>{user.name}</div><div style={{fontSize:8,color:C.accent,letterSpacing:1}}>{user.role.toUpperCase()}</div></div></div>
            <button onClick={()=>setUser(null)} style={{background:"none",border:`1px solid ${C.border}`,color:C.textDim,padding:"4px 8px",borderRadius:4,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button></div></div></div>

      {/* STYLE BAR */}
      {activeModule==="intelligence"&&styleId!=="balanced"&&<div style={{background:`${style.color}06`,borderBottom:`1px solid ${style.color}20`,padding:"4px 20px",display:"flex",alignItems:"center",gap:10,fontSize:9}} data-no-print>
        <span style={{fontWeight:700,color:style.color,letterSpacing:1}}>{style.icon} {style.name.toUpperCase()} ACTIVE</span><span style={{color:C.border}}>|</span>
        <span style={{color:C.textDim}}>T{style.weights.trend}/TC{style.weights.tech}/F{style.weights.fund}/D{style.weights.dwa}</span>
        <span style={{color:C.textDim}}>Band: \u00B1{style.rebalanceBand}%</span><span style={{color:C.textDim}}>Cash: {style.cashMax}%</span>
        {style.invertSignals&&<span style={{color:C.magenta,fontWeight:700}}>CONTRARIAN INVERSION</span>}
        <span style={{marginLeft:"auto",color:C.textDim}}>Persona: {style.persona}</span></div>}

      {/* CONTENT */}
      <div style={{padding:"16px 20px",animation:"fadeUp 0.3s ease"}}>
        {activeModule==="intelligence"&&<IntelligenceModule ycDataA={ycDataA} portMetricsA={portMetricsA} ycDataB={ycDataB} portMetricsB={portMetricsB} onDataLoadA={loadA} onDataLoadB={loadB} onClearA={clearA} onClearB={clearB} pasteA={pasteA} setPasteA={setPasteA} pasteB={pasteB} setPasteB={setPasteB} apiKeyA={apiKeyA} setApiKeyA={setApiKeyA} apiKeyB={apiKeyB} setApiKeyB={setApiKeyB} styleId={styleId} dataMode={dataMode} setDataMode={setDataMode} loadingA={loadingA} loadingB={loadingB} errorA={errorA} errorB={errorB}/>}
        {activeModule==="options"&&<OptionsModule regimeData={portMetricsA}/>}
        {activeModule==="portfolio"&&(()=>{
          const hasData=ycDataA&&Object.keys(ycDataA).length>0;const pm=portMetricsA;const yd=ycDataA;
          const allocGrps={};HOLDINGS.forEach(h=>{allocGrps[h.class]=(allocGrps[h.class]||0)+h.target});
          const clr={"US Eq":C.blue,Intl:C.purple,Bond:C.cyan,Alt:C.amber,REIT:C.green,MF:C.orange,Hedge:C.magenta};
          const sorted=hasData?[...HOLDINGS].filter(h=>yd[h.ticker]).sort((a,b)=>(yd[b.ticker]?.composite||0)-(yd[a.ticker]?.composite||0)):HOLDINGS;
          const sectorPerf={};if(hasData)HOLDINGS.forEach(h=>{const d=yd[h.ticker];if(!d)return;if(!sectorPerf[h.class])sectorPerf[h.class]={ret:0,vol:0,comp:0,n:0};
            sectorPerf[h.class].ret+=(d.one_year_return||0);sectorPerf[h.class].vol+=(d.one_year_volatility||0);sectorPerf[h.class].comp+=(d.composite||0);sectorPerf[h.class].n++});
          Object.values(sectorPerf).forEach(s=>{if(s.n){s.ret/=s.n;s.vol/=s.n;s.comp/=s.n}});
          return <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:700,color:C.accent,letterSpacing:1.2}}>PORTFOLIO DASHBOARD</div>
            {hasData&&<div style={{display:"flex",gap:4}}>
              <Btn onClick={()=>exportCSV(yd,pm,"portfolio")} accent={C.green} small>{"\u2913 Export CSV"}</Btn>
              <Btn onClick={()=>{copySummary(yd,pm,styleId)}} accent={C.cyan} small>{"\u2398 Copy"}</Btn>
              <Btn onClick={()=>window.print()} accent={C.textDim} small>{"\u2399 Print"}</Btn></div>}</div>
          {/* SUMMARY CARDS */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:14}}>
            {[["Return",pm?pctFmt(pm.wtdReturn):"\u2014",(pm?.wtdReturn||0)>=0?C.green:C.red],
              ["Volatility",pm?pctFmt(pm.wtdVol):"\u2014",C.text],
              ["Beta",pm?n(pm.wtdBeta):"\u2014",C.text],
              ["Sharpe",pm?n(pm.wtdSharpe):"\u2014",(pm?.wtdSharpe||0)>0.5?C.green:C.amber],
              ["Composite",pm?`${pm.avgComposite.toFixed(0)}/100`:"\u2014",pm?.avgComposite>=60?C.green:C.amber],
              ["FSM",pm?.fsmSignal||"\u2014",sigColor(pm?.fsmSignal)]
            ].map(([l,v,c],i)=><div key={i} style={{background:C.card,borderRadius:8,padding:"10px 12px",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:8,color:C.textDim,letterSpacing:0.8,marginBottom:3}}>{l.toUpperCase()}</div>
              <div style={{fontSize:18,fontWeight:800,color:c,fontFamily:"'JetBrains Mono',monospace"}}>{v}</div></div>)}</div>

          {hasData&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
            {/* ALLOCATION */}
            <Card title="Asset Allocation" accent={C.accent}>
              {Object.entries(allocGrps).sort((a,b)=>b[1]-a[1]).map(([c,v])=><div key={c} style={{marginBottom:5}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}><span style={{color:C.textDim}}>{c}</span><span style={{color:clr[c],fontWeight:700}}>{v}%</span></div>
                <div style={{height:5,background:C.border,borderRadius:2}}><div style={{height:"100%",width:`${v}%`,background:clr[c],borderRadius:2}}/></div></div>)}</Card>
            {/* SIGNALS */}
            <Card title="Signal Distribution" accent={C.green}>
              {pm&&<div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
                {[["SB",pm.signals.strongBuy,C.green],["B",pm.signals.buy,"#66BB6A"],["H",pm.signals.hold,C.textDim],["S",pm.signals.sell,C.orange],["SS",pm.signals.strongSell,C.red]].map(([l,v,c])=><div key={l} style={{textAlign:"center",padding:6,background:C.bg,borderRadius:4}}><div style={{fontSize:18,fontWeight:800,color:c,fontFamily:"'JetBrains Mono',monospace"}}>{v}</div><div style={{fontSize:7,color:C.textMuted}}>{l}</div></div>)}</div>}
              {pm&&<div style={{marginTop:8}}>
                <MR label="Cash Triggers" value={pm.cashTriggers.anyActive?"ACTIVE":"Clear"} color={pm.cashTriggers.anyActive?C.red:C.green}/>
                <MR label="Bullish %" value={`${(pm.bullishPct*100).toFixed(0)}%`} color={pm.bullishPct>0.5?C.green:C.red}/></div>}</Card>
            {/* SECTOR PERF */}
            <Card title="Sector Performance" accent={C.blue}>
              {Object.entries(sectorPerf).sort((a,b)=>b[1].comp-a[1].comp).map(([cls,s])=><div key={cls} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",borderBottom:`1px solid ${C.border}`,fontSize:10}}>
                <span style={{color:clr[cls],fontWeight:600,minWidth:45}}>{cls}</span>
                <span style={{color:s.ret>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{(s.ret*100).toFixed(1)}%</span>
                <span style={{fontWeight:700,color:s.comp>=60?C.green:s.comp<=40?C.red:C.amber,fontFamily:"'JetBrains Mono',monospace"}}>{s.comp.toFixed(0)}</span></div>)}</Card></div>}

          {/* TOP/BOTTOM */}
          {hasData&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <Card title="Top Performers" accent={C.green}>{sorted.slice(0,5).map(h=>{const d=yd[h.ticker];return <div key={h.ticker} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700,color:C.accent,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>{h.ticker}</span><span style={{fontSize:9,color:C.textDim}}>{h.class}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,color:(d?.one_year_return||0)>=0?C.green:C.red}}>{pctFmt(d?.one_year_return)}</span><span style={{fontWeight:700,color:C.green,fontFamily:"'JetBrains Mono',monospace"}}>{d?.composite}</span><Pill color={sigColor(d?.signal)}>{d?.signal}</Pill></div></div>})}</Card>
            <Card title="Bottom Performers" accent={C.red}>{[...sorted].reverse().slice(0,5).map(h=>{const d=yd[h.ticker];return <div key={h.ticker} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700,color:C.accent,fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>{h.ticker}</span><span style={{fontSize:9,color:C.textDim}}>{h.class}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,color:(d?.one_year_return||0)>=0?C.green:C.red}}>{pctFmt(d?.one_year_return)}</span><span style={{fontWeight:700,color:(d?.composite||0)<=40?C.red:C.amber,fontFamily:"'JetBrains Mono',monospace"}}>{d?.composite}</span><Pill color={sigColor(d?.signal)}>{d?.signal}</Pill></div></div>})}</Card></div>}

          {/* FULL TABLE */}
          {hasData&&<div style={{background:C.card,borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,fontWeight:700}}>All Holdings ({sorted.length})</span></div>
            <div style={{overflow:"auto",maxHeight:400}}>
              <table><thead><tr>{["Ticker","Name","Class","Target","Price","1Y Ret","Vol","Beta","Sharpe","1M","Comp","Signal"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>{sorted.map(h=>{const d=yd[h.ticker];if(!d) return null; return <tr key={h.ticker} style={{background:d.signal?.includes("BUY")?C.green+"06":d.signal?.includes("SELL")?C.red+"06":"transparent"}}>
                  <td style={{fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{h.ticker}</td>
                  <td style={{color:C.text,textAlign:"left"}}>{h.name}</td><td>{h.class}</td><td>{h.target}%</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{usd(d.price)}</td>
                  <td style={{color:(d.one_year_return||0)>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{pctFmt(d.one_year_return)}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{pctFmt(d.one_year_volatility)}</td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{n(d.beta_5_year)}</td>
                  <td style={{color:(d.sharpe||0)>0.5?C.green:C.textDim,fontFamily:"'JetBrains Mono',monospace"}}>{n(d.sharpe)}</td>
                  <td style={{color:(d.one_month_return||0)>=0?C.green:C.red,fontFamily:"'JetBrains Mono',monospace"}}>{pctFmt(d.one_month_return)}</td>
                  <td style={{fontWeight:700,color:(d.composite||0)>=60?C.green:(d.composite||0)<=40?C.red:C.amber,fontFamily:"'JetBrains Mono',monospace"}}>{d.composite}</td>
                  <td><Pill color={sigColor(d.signal)}>{d.signal}</Pill></td></tr>})}</tbody></table></div></div>}
          {!hasData&&<div style={{textAlign:"center",padding:40,color:C.textMuted}}>
            <div style={{fontSize:28,marginBottom:8,opacity:0.3}}>{"\u25C6"}</div>
            <div style={{fontSize:12}}>Load YCharts data in Intelligence module to populate the dashboard</div></div>}
        </div>})()}
      </div>
      <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",fontSize:9,color:C.textMuted}}>
        <span>Marline Unified Platform v2.1</span>
        <span>{activeModule==="intelligence"?style.icon+" "+style.name:activeModule==="options"?"\u26A1 Options":"\u25C6 Portfolio"} {portMetrics?`\u00B7 FSM: ${portMetrics.fsmSignal}`:""} \u00B7 {new Date().toLocaleDateString()}</span></div>
    </div>);
}
