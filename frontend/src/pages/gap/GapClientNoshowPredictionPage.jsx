// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapClientNoshowPredictionPage() {
  return (
    <GapFeaturePage
      title="Client No-Show Prediction"
      description="Client No-Show Prediction"
      slug="client-noshow-prediction"
      aiResultKey="risk"
      fields={[
  {
    "name": "clientId",
    "label": "Client ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "appointmentTime",
    "label": "Appointment Time",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}
