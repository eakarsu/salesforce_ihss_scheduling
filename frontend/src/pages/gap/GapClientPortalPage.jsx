// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapClientPortalPage() {
  return (
    <GapFeaturePage
      title="Client/Family Self-Service Portal"
      description="Client/Family Self-Service Portal"
      slug="client-portal"
      aiResultKey="request"
      fields={[
  {
    "name": "clientId",
    "label": "Client ID",
    "required": true,
    "placeholder": ""
  },
  {
    "name": "request",
    "label": "Request",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}
