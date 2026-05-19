// === Batch 11 Gaps & Frontend Mounts ===
import GapFeaturePage from '../../components/GapFeaturePage'
export default function GapPayrollConnectorPage() {
  return (
    <GapFeaturePage
      title="Payroll System Connector"
      description="Payroll System Connector"
      slug="payroll-connector"
      aiResultKey="syncJob"
      fields={[
  {
    "name": "provider",
    "label": "Provider (ADP/Gusto)",
    "required": false,
    "placeholder": ""
  },
  {
    "name": "period",
    "label": "Period",
    "required": false,
    "placeholder": ""
  }
]}
    />
  )
}
