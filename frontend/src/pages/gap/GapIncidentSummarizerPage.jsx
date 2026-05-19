// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapIncidentSummarizerPage() {
  return (
    <GapFeaturePage
      title="Incident Report Summarizer"
      description="Incident Report Summarizer"
      slug="incident-summarizer"
      aiResultKey="summary"
      fields={[
  {
    "name": "report",
    "label": "Incident Report",
    "type": "textarea",
    "rows": 4,
    "required": true
  }
]}
    />
  )
}
