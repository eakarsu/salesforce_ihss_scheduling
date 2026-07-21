const bcrypt = require('bcryptjs');
const pool = require('../db');

if (process.env.ALLOW_FIXTURE_SEED !== 'YES') {
  console.error('Refusing fixture load. Set ALLOW_FIXTURE_SEED=YES only for a migrated, empty, disposable database.');
  process.exit(2);
}
const fixturePassword = String(process.env.FIXTURE_PASSWORD || '');
if (fixturePassword.length < 16 || fixturePassword.length > 72) {
  console.error('FIXTURE_PASSWORD must contain 16-72 characters.');
  process.exit(2);
}

async function loadFixtures() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    const counts = await client.query(`SELECT
      (SELECT COUNT(*) FROM users)::INTEGER AS users,
      (SELECT COUNT(*) FROM work_orders)::INTEGER AS work_orders,
      (SELECT COUNT(*) FROM service_appointments)::INTEGER AS appointments`);
    if (counts.rows[0].users || counts.rows[0].work_orders || counts.rows[0].appointments) {
      throw new Error('Fixture load requires empty users, work_orders, and service_appointments tables');
    }
    const passwordHash = await bcrypt.hash(fixturePassword, 12);
    await client.query(
      `INSERT INTO users(name,email,password_hash,role) VALUES
       ('Fixture Administrator','admin@example.test',$1,'admin'),
       ('Fixture Manager','manager@example.test',$1,'manager'),
       ('Fixture Viewer','viewer@example.test',$1,'viewer')`,
      [passwordHash]
    );
    await client.query(`INSERT INTO operating_hours(name,description,timezone,monday_start,monday_end,tuesday_start,tuesday_end,wednesday_start,wednesday_end,thursday_start,thursday_end,friday_start,friday_end,saturday_start,saturday_end,sunday_start,sunday_end,status)
      VALUES('Fixture Hours','Disposable verification hours','America/New_York','08:00','17:00','08:00','17:00','08:00','17:00','08:00','17:00','08:00','17:00','08:00','17:00','08:00','17:00','Active')`);
    await client.query(`INSERT INTO service_territories(name,operating_hours_name,city,state,country,is_active,status)
      VALUES('Fixture Territory','Fixture Hours','Example City','NY','US','true','Active')`);
    await client.query(`INSERT INTO skills(name,status) VALUES('Fixture Installation','Active')`);
    await client.query(`INSERT INTO service_resources(name,resource_type,email,phone,is_active,territory_name,efficiency_rating,status)
      VALUES('Fixture Installer','Technician','installer@example.test','555-0100','true','Fixture Territory','4.8','Active')`);
    await client.query(`INSERT INTO service_resource_skills(resource_name,skill_name,status) VALUES('Fixture Installer','Fixture Installation','Active')`);
    await client.query(`INSERT INTO territory_members(resource_name,territory_name,status) VALUES('Fixture Installer','Fixture Territory','Active')`);
    await client.query(`INSERT INTO work_types(name,description,estimated_duration_minutes,skill_requirement,block_time_before,block_time_after,status)
      VALUES('Fixture Work Type','Disposable verification work','60','Fixture Installation','15','15','Active')`);
    await client.query(`INSERT INTO work_orders(work_order_number,subject,description,account_name,contact_name,contact_phone,contact_email,budget,region,district,market,territory_name,work_type_name,priority,status,address,city,state)
      VALUES
      ('WO-FIXTURE-001','Fixture installation one','Disposable verification only','Fixture Account','Fixture Contact','555-0101','contact1@example.test','1000','Northeast','Test','Test','Fixture Territory','Fixture Work Type','High','Pending','1 Example Street','Example City','NY'),
      ('WO-FIXTURE-002','Fixture installation two','Disposable verification only','Fixture Account','Fixture Contact','555-0102','contact2@example.test','1200','Northeast','Test','Test','Fixture Territory','Fixture Work Type','Medium','Pending','2 Example Street','Example City','NY'),
      ('WO-FIXTURE-003','Fixture installation three','Disposable verification only','Fixture Account','Fixture Contact','555-0103','contact3@example.test','900','Northeast','Test','Test','Fixture Territory','Fixture Work Type','Low','Pending','3 Example Street','Example City','NY')`);
    await client.query('COMMIT');
    return { users: 3, workOrders: 3 };
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
  finally { client.release(); }
}

if (require.main === module) loadFixtures()
  .then((result) => console.log(`Fixture status: ${JSON.stringify(result)}`))
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());

module.exports = loadFixtures;
