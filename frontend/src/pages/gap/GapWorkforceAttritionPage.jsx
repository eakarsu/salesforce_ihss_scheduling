// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapWorkforceAttritionPage() {
  return (
    <GapFeaturePage
      title="Workforce Attrition Predictor"
      description="Workforce Attrition Predictor"
      slug="workforce-attrition"
      aiResultKey="risk"
      fields={[
  {
    "name": "workerId",
    "label": "Worker ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "history",
    "label": "History (JSON)",
    "type": "json"
  }
]}
    />
  )
}
