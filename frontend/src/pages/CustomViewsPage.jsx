// Custom Views Page — composes the 4 IHSS custom views
import React from 'react';
import VisitCompletionChart from '../components/VisitCompletionChart';
import CaregiverCoverageHeatmap from '../components/CaregiverCoverageHeatmap';
import VisitVerificationPdf from '../components/VisitVerificationPdf';
import SchedulingRulesEditor from '../components/SchedulingRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page" style={{ padding: 24, maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
          {'\u{1F4CB}'} IHSS Custom Views
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
          Salesforce IHSS scheduling overlays: visit completion analytics, caregiver coverage heatmap,
          on-demand visit verification PDFs, and editable scheduling rules.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <VisitCompletionChart />
        <CaregiverCoverageHeatmap />
      </div>

      <VisitVerificationPdf />
      <SchedulingRulesEditor />
    </div>
  );
}
