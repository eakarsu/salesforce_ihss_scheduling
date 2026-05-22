const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json([
    { id: 1, appointment_number: 'SA-1042', client_name: 'Ruth Kim', resource_name: 'Mia Santos', gps_match: 'matched', clock_status: 'verified', exception: 'none', status: 'verified' },
    { id: 2, appointment_number: 'SA-1088', client_name: 'Omar Diaz', resource_name: 'Lena Reed', gps_match: 'outside radius', clock_status: 'late checkout', exception: 'supervisor review', status: 'review' },
    { id: 3, appointment_number: 'SA-1101', client_name: 'Helen Fox', resource_name: 'Grace Hill', gps_match: 'matched', clock_status: 'missing checkout', exception: 'caregiver attestation needed', status: 'pending' }
  ]);
});

module.exports = router;
