"""Risk Management & Rebalancing — Risk metrics, drift monitoring, and rebalance workflow."""
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from utils import (
    load_risk_management, load_rebalancing, load_portfolio_construction,
    load_buffered_etf, load_data_input, C
)

st.set_page_config(page_title="Risk & Rebalancing | Marline", page_icon="🛡️", layout="wide")
st.markdown("# 🛡️ Risk Management & Rebalancing")
st.markdown("*Risk metrics, drift monitoring, allocation bands, and rebalance workflow*")
st.divider()

risk = load_risk_management()
rebalance = load_rebalancing()
allocation = load_portfolio_construction()
buffered = load_buffered_etf()
assumptions, market_data, fsm = load_data_input()

# ═══ RISK METRICS ═══
st.subheader("Portfolio Risk Metrics")
if risk:
    risk_df = pd.DataFrame(risk)
    ok_count = sum(1 for r in risk if r["status"] == "OK")
    warn_count = sum(1 for r in risk if r["status"] == "WARNING")
    breach_count = sum(1 for r in risk if r["status"] == "BREACH")

    col1, col2, col3 = st.columns(3)
    col1.metric("✅ OK", ok_count)
    col2.metric("⚠️ Warnings", warn_count)
    col3.metric("🔴 Breaches", breach_count)

    def color_status(val):
        if val == "OK": return f"background-color: {C['green']}15; color: {C['green']}"
        elif val == "WARNING": return f"background-color: {C['amber']}15; color: {C['amber']}"
        elif val == "BREACH": return f"background-color: {C['red']}15; color: {C['red']}"
        return ""

    st.dataframe(
        risk_df.style.map(color_status, subset=["status"]),
        use_container_width=True, hide_index=True,
    )

# ═══ STRATEGIC ALLOCATION ═══
st.divider()
st.subheader("Strategic Allocation Bands")
if allocation is not None and len(allocation) > 0:
    fig = go.Figure()
    for _, row in allocation.iterrows():
        name = row["Asset Class"]
        fig.add_trace(go.Bar(name=f"{name} Range", x=[name], y=[row.get("Max%", 0) - row.get("Min%", 0)],
            base=[row.get("Min%", 0)], marker_color="#1E2530", showlegend=False, hoverinfo="skip"))
        fig.add_trace(go.Bar(name=f"{name} Target", x=[name], y=[0.002],
            base=[row.get("Target%", 0)], marker_color=C["accent"], showlegend=False,
            hovertemplate=f"Target: {row.get('Target%', 0)*100:.1f}%"))
        fig.add_trace(go.Bar(name=f"{name} Current", x=[name], y=[0.002],
            base=[row.get("Current%", 0)], marker_color=C["blue"], showlegend=False,
            hovertemplate=f"Current: {row.get('Current%', 0)*100:.1f}%"))

    fig.update_layout(
        barmode="overlay", paper_bgcolor="#0A0E14", plot_bgcolor="#12171F",
        font={"color": "#E8ECF1"}, height=350,
        yaxis={"title": "Allocation %", "gridcolor": "#1E2530", "tickformat": ".0%"},
        xaxis={"title": ""}, margin={"t": 20},
    )
    st.plotly_chart(fig, use_container_width=True)

    st.dataframe(allocation, use_container_width=True, hide_index=True)

# ═══ REBALANCING WORKFLOW ═══
st.divider()
st.subheader("Rebalancing Workflow")
st.caption(f"Rebalance band: ±{assumptions.get('rebalance_band', 0.05)*100:.1f}% | Max single asset: {assumptions.get('max_single_asset', 0.3)*100:.0f}%")

if rebalance is not None and len(rebalance) > 0:
    # Highlight action items
    actions = rebalance[rebalance["Action"].isin(["ADD", "TRIM", "REVIEW"])] if "Action" in rebalance.columns else pd.DataFrame()
    if len(actions) > 0:
        st.warning(f"**{len(actions)} assets require action**")

    display_cols = [c for c in ["Ticker", "Target%", "Current%", "Drift", "Band", "Breach?", "Signal", "Action", "Priority"] if c in rebalance.columns]
    st.dataframe(rebalance[display_cols], use_container_width=True, hide_index=True, height=450)

    # Drift chart
    if "Drift" in rebalance.columns and "Ticker" in rebalance.columns:
        drift_data = rebalance[["Ticker", "Drift"]].dropna()
        if len(drift_data) > 0:
            drift_data["Drift_Pct"] = drift_data["Drift"] * 100
            colors = [C["green"] if abs(d) < 2 else C["amber"] if abs(d) < 5 else C["red"] for d in drift_data["Drift_Pct"]]
            fig_drift = go.Figure(data=[go.Bar(
                x=drift_data["Ticker"], y=drift_data["Drift_Pct"],
                marker_color=colors,
                text=[f"{d:+.1f}%" for d in drift_data["Drift_Pct"]],
                textposition="outside",
            )])
            fig_drift.update_layout(
                paper_bgcolor="#0A0E14", plot_bgcolor="#12171F",
                font={"color": "#E8ECF1"}, height=300,
                yaxis={"title": "Drift %", "gridcolor": "#1E2530"},
                margin={"t": 20},
            )
            st.plotly_chart(fig_drift, use_container_width=True)

# ═══ BUFFERED ETF REGIME ═══
st.divider()
st.subheader("Buffered ETF Regime Engine")
if buffered:
    buf_df = pd.DataFrame(buffered)
    total_score = sum(float(r.get("score", 0) or 0) for r in buffered)
    max_score = sum(float(r.get("max", 0) or 0) for r in buffered)
    st.metric("Regime Score", f"{total_score:.0f} / {max_score:.0f}")
    st.dataframe(buf_df, use_container_width=True, hide_index=True)
