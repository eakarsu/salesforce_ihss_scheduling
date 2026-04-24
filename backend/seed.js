require('dotenv').config({ path: __dirname + '/../.env' });
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    // ─── DROP ALL TABLES ───────────────────────────────────────────────
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS scheduling_policies CASCADE;
      DROP TABLE IF EXISTS maintenance_plans CASCADE;
      DROP TABLE IF EXISTS assets CASCADE;
      DROP TABLE IF EXISTS service_crews CASCADE;
      DROP TABLE IF EXISTS shifts CASCADE;
      DROP TABLE IF EXISTS time_sheet_entries CASCADE;
      DROP TABLE IF EXISTS time_sheets CASCADE;
      DROP TABLE IF EXISTS resource_absences CASCADE;
      DROP TABLE IF EXISTS service_appointments CASCADE;
      DROP TABLE IF EXISTS work_order_line_items CASCADE;
      DROP TABLE IF EXISTS work_orders CASCADE;
      DROP TABLE IF EXISTS work_types CASCADE;
      DROP TABLE IF EXISTS territory_members CASCADE;
      DROP TABLE IF EXISTS service_resource_skills CASCADE;
      DROP TABLE IF EXISTS skills CASCADE;
      DROP TABLE IF EXISTS service_resources CASCADE;
      DROP TABLE IF EXISTS operating_hours CASCADE;
      DROP TABLE IF EXISTS service_territories CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // ─── CREATE ALL TABLES ─────────────────────────────────────────────
    console.log('Creating tables...');

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT
      );
    `);

    await client.query(`
      CREATE TABLE service_territories (
        id SERIAL PRIMARY KEY,
        name TEXT,
        type TEXT,
        parent_territory TEXT,
        operating_hours_name TEXT,
        description TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        latitude TEXT,
        longitude TEXT,
        is_active TEXT,
        status TEXT
      );
    `);

    await client.query(`
      CREATE TABLE operating_hours (
        id SERIAL PRIMARY KEY,
        name TEXT,
        description TEXT,
        timezone TEXT,
        monday_start TEXT,
        monday_end TEXT,
        tuesday_start TEXT,
        tuesday_end TEXT,
        wednesday_start TEXT,
        wednesday_end TEXT,
        thursday_start TEXT,
        thursday_end TEXT,
        friday_start TEXT,
        friday_end TEXT,
        saturday_start TEXT,
        saturday_end TEXT,
        sunday_start TEXT,
        sunday_end TEXT,
        status TEXT
      );
    `);

    await client.query(`
      CREATE TABLE service_resources (
        id SERIAL PRIMARY KEY,
        name TEXT,
        resource_type TEXT,
        email TEXT,
        phone TEXT,
        description TEXT,
        is_active TEXT,
        territory_name TEXT,
        home_address TEXT,
        efficiency_rating TEXT,
        travel_speed TEXT,
        max_travel_distance TEXT,
        status TEXT
      );
    `);

    await client.query(`
      CREATE TABLE skills (
        id SERIAL PRIMARY KEY,
        name TEXT,
        skill_type TEXT,
        description TEXT,
        is_active TEXT,
        status TEXT
      );
    `);

    await client.query(`
      CREATE TABLE service_resource_skills (
        id SERIAL PRIMARY KEY,
        resource_name TEXT,
        skill_name TEXT,
        skill_level TEXT,
        effective_start TEXT,
        effective_end TEXT,
        status TEXT
      );
    `);

    await client.query(`
      CREATE TABLE territory_members (
        id SERIAL PRIMARY KEY,
        resource_name TEXT,
        territory_name TEXT,
        membership_type TEXT,
        effective_start TEXT,
        effective_end TEXT,
        status TEXT
      );
    `);

    await client.query(`
      CREATE TABLE work_types (
        id SERIAL PRIMARY KEY,
        name TEXT,
        description TEXT,
        estimated_duration_minutes TEXT,
        duration_type TEXT,
        skill_requirement TEXT,
        block_time_before TEXT,
        block_time_after TEXT,
        auto_create_appointment TEXT,
        status TEXT
      );
    `);

    await client.query(`
      CREATE TABLE work_orders (
        id SERIAL PRIMARY KEY,
        work_order_number TEXT,
        subject TEXT,
        description TEXT,
        account_name TEXT,
        contact_name TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        budget TEXT,
        region TEXT,
        district TEXT,
        market TEXT,
        territory_name TEXT,
        work_type_name TEXT,
        priority TEXT,
        status TEXT,
        start_date TEXT,
        end_date TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        latitude TEXT,
        longitude TEXT
      );
    `);

    await client.query(`
      CREATE TABLE work_order_line_items (
        id SERIAL PRIMARY KEY,
        work_order_number TEXT,
        line_item_number TEXT,
        description TEXT,
        work_type_name TEXT,
        status TEXT,
        start_date TEXT,
        end_date TEXT,
        duration_minutes TEXT,
        asset_name TEXT,
        notes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE service_appointments (
        id SERIAL PRIMARY KEY,
        appointment_number TEXT,
        work_order_number TEXT,
        subject TEXT,
        status TEXT,
        scheduled_start TEXT,
        scheduled_end TEXT,
        actual_start TEXT,
        actual_end TEXT,
        duration_minutes TEXT,
        resource_name TEXT,
        territory_name TEXT,
        address TEXT,
        city TEXT,
        state TEXT
      );
    `);

    await client.query(`
      CREATE TABLE resource_absences (
        id SERIAL PRIMARY KEY,
        resource_name TEXT,
        type TEXT,
        start_time TEXT,
        end_time TEXT,
        description TEXT,
        approved_by TEXT,
        status TEXT
      );
    `);

    await client.query(`
      CREATE TABLE time_sheets (
        id SERIAL PRIMARY KEY,
        resource_name TEXT,
        start_date TEXT,
        end_date TEXT,
        total_hours TEXT,
        status TEXT,
        approved_by TEXT,
        notes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE time_sheet_entries (
        id SERIAL PRIMARY KEY,
        time_sheet_id TEXT,
        resource_name TEXT,
        work_order_number TEXT,
        type TEXT,
        start_time TEXT,
        end_time TEXT,
        duration_hours TEXT,
        description TEXT,
        status TEXT
      );
    `);

    await client.query(`
      CREATE TABLE shifts (
        id SERIAL PRIMARY KEY,
        territory_name TEXT,
        label TEXT,
        start_time TEXT,
        end_time TEXT,
        time_slot_type TEXT,
        resource_name TEXT,
        status TEXT,
        notes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE service_crews (
        id SERIAL PRIMARY KEY,
        name TEXT,
        description TEXT,
        crew_size TEXT,
        lead_name TEXT,
        territory_name TEXT,
        specialization TEXT,
        status TEXT
      );
    `);

    await client.query(`
      CREATE TABLE assets (
        id SERIAL PRIMARY KEY,
        name TEXT,
        serial_number TEXT,
        account_name TEXT,
        product_name TEXT,
        install_date TEXT,
        warranty_end TEXT,
        status TEXT,
        territory_name TEXT,
        address TEXT,
        last_service_date TEXT
      );
    `);

    await client.query(`
      CREATE TABLE maintenance_plans (
        id SERIAL PRIMARY KEY,
        title TEXT,
        description TEXT,
        work_type_name TEXT,
        account_name TEXT,
        asset_name TEXT,
        frequency TEXT,
        next_suggested_date TEXT,
        territory_name TEXT,
        status TEXT,
        notes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE scheduling_policies (
        id SERIAL PRIMARY KEY,
        name TEXT,
        description TEXT,
        policy_type TEXT,
        travel_time_optimization TEXT,
        skill_matching TEXT,
        priority_weight TEXT,
        territory_preference TEXT,
        max_travel_distance TEXT,
        same_day_policy TEXT,
        emergency_override TEXT,
        status TEXT
      );
    `);

    // ─── SEED USERS ────────────────────────────────────────────────────
    console.log('Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
      ['Admin User', 'admin@lowes.com', hashedPassword, 'admin']
    );

    // ─── SEED SERVICE_TERRITORIES ──────────────────────────────────────
    console.log('Seeding service_territories...');
    const serviceTerritories = [
      ['Southeast Region', 'Primary', null, 'Southeast Standard Hours', 'Lowe\'s Southeast region covering Carolinas, Georgia, Alabama, and Florida - headquartered in Charlotte', 'Charlotte', 'NC', 'US', '35.2271', '-80.8431', 'true', 'Active'],
      ['Northeast Region', 'Primary', null, 'Northeast Standard Hours', 'Lowe\'s Northeast region covering Tri-State, New England, and Mid-Atlantic areas', 'New York', 'NY', 'US', '40.7128', '-74.0060', 'true', 'Active'],
      ['Midwest Region', 'Primary', null, 'Midwest Standard Hours', 'Lowe\'s Midwest region covering Great Lakes and Plains states', 'Chicago', 'IL', 'US', '41.8781', '-87.6298', 'true', 'Active'],
      ['Southwest Region', 'Primary', null, 'Southwest Standard Hours', 'Lowe\'s Southwest region covering Texas and Desert Southwest', 'Dallas', 'TX', 'US', '32.7767', '-96.7970', 'true', 'Active'],
      ['West Coast Region', 'Primary', null, 'West Coast Standard Hours', 'Lowe\'s West Coast region covering California, Oregon, and Washington', 'Los Angeles', 'CA', 'US', '34.0522', '-118.2437', 'true', 'Active'],
      ['Store #0101 Charlotte', 'Secondary', 'Southeast Region', 'Southeast Standard Hours', 'Lowe\'s Store #0101 service zone - Charlotte Metro area installations', 'Charlotte', 'NC', 'US', '35.2271', '-80.8431', 'true', 'Active'],
      ['Store #0245 Raleigh', 'Secondary', 'Southeast Region', 'Southeast Standard Hours', 'Lowe\'s Store #0245 service zone - Raleigh-Durham area installations', 'Raleigh', 'NC', 'US', '35.7796', '-78.6382', 'true', 'Active'],
      ['Store #1502 Atlanta', 'Secondary', 'Southeast Region', 'Southeast Standard Hours', 'Lowe\'s Store #1502 service zone - Atlanta Metro area installations', 'Atlanta', 'GA', 'US', '33.7490', '-84.3880', 'true', 'Active'],
      ['Store #0678 Brooklyn', 'Secondary', 'Northeast Region', 'Northeast Standard Hours', 'Lowe\'s Store #0678 service zone - Brooklyn and surrounding areas', 'Brooklyn', 'NY', 'US', '40.6782', '-73.9442', 'true', 'Active'],
      ['Store #1234 Boston', 'Secondary', 'Northeast Region', 'Northeast Standard Hours', 'Lowe\'s Store #1234 service zone - Boston Metro area installations', 'Boston', 'MA', 'US', '42.3601', '-71.0589', 'true', 'Active'],
      ['Store #0892 Chicago', 'Secondary', 'Midwest Region', 'Midwest Standard Hours', 'Lowe\'s Store #0892 service zone - Chicago Metro area installations', 'Chicago', 'IL', 'US', '41.8781', '-87.6298', 'true', 'Active'],
      ['Store #1456 Detroit', 'Secondary', 'Midwest Region', 'Midwest Standard Hours', 'Lowe\'s Store #1456 service zone - Detroit Metro area installations', 'Detroit', 'MI', 'US', '42.3314', '-83.0458', 'true', 'Active'],
      ['Store #0543 Dallas', 'Secondary', 'Southwest Region', 'Southwest Standard Hours', 'Lowe\'s Store #0543 service zone - Dallas-Fort Worth area installations', 'Dallas', 'TX', 'US', '32.7767', '-96.7970', 'true', 'Active'],
      ['Store #0987 Phoenix', 'Secondary', 'Southwest Region', 'Southwest Standard Hours', 'Lowe\'s Store #0987 service zone - Phoenix Metro area installations', 'Phoenix', 'AZ', 'US', '33.4484', '-112.0740', 'true', 'Active'],
      ['Store #1678 Los Angeles', 'Secondary', 'West Coast Region', 'West Coast Standard Hours', 'Lowe\'s Store #1678 service zone - LA Metro area installations', 'Los Angeles', 'CA', 'US', '34.0522', '-118.2437', 'true', 'Active']
    ];
    for (const t of serviceTerritories) {
      await client.query(
        `INSERT INTO service_territories (name, type, parent_territory, operating_hours_name, description, city, state, country, latitude, longitude, is_active, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        t
      );
    }

    // ─── SEED OPERATING_HOURS ──────────────────────────────────────────
    console.log('Seeding operating_hours...');
    const operatingHours = [
      ['Southeast Standard Hours', 'Standard installation hours for the Southeast Region', 'America/New_York', '07:00', '18:00', '07:00', '18:00', '07:00', '18:00', '07:00', '18:00', '07:00', '18:00', '08:00', '16:00', null, null, 'Active'],
      ['Northeast Standard Hours', 'Standard installation hours for the Northeast Region', 'America/New_York', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '08:00', '15:00', null, null, 'Active'],
      ['Midwest Standard Hours', 'Standard installation hours for the Midwest Region', 'America/Chicago', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '08:00', '15:00', null, null, 'Active'],
      ['Southwest Standard Hours', 'Standard installation hours for the Southwest Region', 'America/Chicago', '06:30', '17:30', '06:30', '17:30', '06:30', '17:30', '06:30', '17:30', '06:30', '17:30', '07:00', '15:00', null, null, 'Active'],
      ['West Coast Standard Hours', 'Standard installation hours for the West Coast Region', 'America/Los_Angeles', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '08:00', '16:00', null, null, 'Active'],
      ['Charlotte Store Hours', 'Operating hours for Store #0101 Charlotte installations', 'America/New_York', '07:00', '18:00', '07:00', '18:00', '07:00', '18:00', '07:00', '18:00', '07:00', '18:00', '08:00', '16:00', null, null, 'Active'],
      ['Raleigh Store Hours', 'Operating hours for Store #0245 Raleigh installations', 'America/New_York', '07:00', '17:30', '07:00', '17:30', '07:00', '17:30', '07:00', '17:30', '07:00', '17:30', '08:00', '15:00', null, null, 'Active'],
      ['Atlanta Store Hours', 'Operating hours for Store #1502 Atlanta installations', 'America/New_York', '07:00', '18:00', '07:00', '18:00', '07:00', '18:00', '07:00', '18:00', '07:00', '18:00', '08:00', '16:00', null, null, 'Active'],
      ['Brooklyn Store Hours', 'Operating hours for Store #0678 Brooklyn installations', 'America/New_York', '08:00', '17:00', '08:00', '17:00', '08:00', '17:00', '08:00', '17:00', '08:00', '17:00', '09:00', '15:00', null, null, 'Active'],
      ['Boston Store Hours', 'Operating hours for Store #1234 Boston installations', 'America/New_York', '07:30', '17:00', '07:30', '17:00', '07:30', '17:00', '07:30', '17:00', '07:30', '17:00', '08:00', '15:00', null, null, 'Active'],
      ['Chicago Store Hours', 'Operating hours for Store #0892 Chicago installations', 'America/Chicago', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '08:00', '15:00', null, null, 'Active'],
      ['Detroit Store Hours', 'Operating hours for Store #1456 Detroit installations', 'America/Detroit', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '08:00', '14:00', null, null, 'Active'],
      ['Dallas Store Hours', 'Operating hours for Store #0543 Dallas installations', 'America/Chicago', '06:30', '17:30', '06:30', '17:30', '06:30', '17:30', '06:30', '17:30', '06:30', '17:30', '07:00', '15:00', null, null, 'Active'],
      ['Phoenix Store Hours', 'Operating hours for Store #0987 Phoenix installations', 'America/Phoenix', '06:00', '16:00', '06:00', '16:00', '06:00', '16:00', '06:00', '16:00', '06:00', '16:00', '06:00', '14:00', null, null, 'Active'],
      ['LA Store Hours', 'Operating hours for Store #1678 Los Angeles installations', 'America/Los_Angeles', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '07:00', '17:00', '08:00', '16:00', null, null, 'Active']
    ];
    for (const o of operatingHours) {
      await client.query(
        `INSERT INTO operating_hours (name, description, timezone, monday_start, monday_end, tuesday_start, tuesday_end, wednesday_start, wednesday_end, thursday_start, thursday_end, friday_start, friday_end, saturday_start, saturday_end, sunday_start, sunday_end, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        o
      );
    }

    // ─── SEED SERVICE_RESOURCES ────────────────────────────────────────
    console.log('Seeding service_resources...');
    const serviceResources = [
      ['Mike Patterson', 'Appliance Installer', 'mike.patterson@lowesinstall.com', '704-555-0101', 'Senior appliance installer with 10 years experience in all major brands', 'true', 'Store #0101 Charlotte', '3218 Providence Rd, Charlotte, NC 28211', '4.8', '40', '45', 'Active'],
      ['Carlos Rivera', 'Flooring Installer', 'carlos.rivera@lowesinstall.com', '919-555-0102', 'Certified flooring installer specializing in hardwood, LVP, and tile', 'true', 'Store #0245 Raleigh', '5410 Glenwood Ave, Raleigh, NC 27612', '4.9', '35', '40', 'Active'],
      ['Tamika Washington', 'Kitchen/Bath Installer', 'tamika.washington@lowesinstall.com', '404-555-0103', 'Kitchen and bathroom remodel specialist with cabinet and countertop expertise', 'true', 'Store #1502 Atlanta', '2185 Peachtree Rd NE, Atlanta, GA 30309', '4.7', '38', '50', 'Active'],
      ['Dmitri Volkov', 'Window/Door Installer', 'dmitri.volkov@lowesinstall.com', '718-555-0104', 'Licensed window and door installer, energy efficiency specialist', 'true', 'Store #0678 Brooklyn', '412 Atlantic Ave, Brooklyn, NY 11217', '4.6', '30', '35', 'Active'],
      ['Sean Murphy', 'General Installer', 'sean.murphy@lowesinstall.com', '617-555-0105', 'Multi-skilled installer covering appliances, plumbing, and general home improvement', 'true', 'Store #1234 Boston', '88 Beacon St, Boston, MA 02108', '4.5', '35', '40', 'Active'],
      ['Jorge Gutierrez', 'Roofing Contractor', 'jorge.gutierrez@lowesinstall.com', '312-555-0106', 'Licensed roofing contractor with shingle, metal, and flat roof experience', 'true', 'Store #0892 Chicago', '1540 N Wells St, Chicago, IL 60610', '4.4', '42', '55', 'Active'],
      ['Brandon Lee', 'Flooring Installer', 'brandon.lee@lowesinstall.com', '313-555-0107', 'Flooring specialist certified in Pergo, Shaw, and SmartCore installation', 'true', 'Store #1456 Detroit', '2901 Grand River Ave, Detroit, MI 48201', '4.3', '38', '45', 'Active'],
      ['Maria Santos', 'Kitchen/Bath Installer', 'maria.santos@lowesinstall.com', '214-555-0108', 'Kitchen remodel expert specializing in cabinets, countertops, and backsplash', 'true', 'Store #0543 Dallas', '4807 Bryan St, Dallas, TX 75204', '4.8', '45', '60', 'Active'],
      ['Tyler Brooks', 'HVAC Installer', 'tyler.brooks@lowesinstall.com', '602-555-0109', 'Licensed HVAC installer specializing in residential systems and ductwork', 'true', 'Store #0987 Phoenix', '3340 E Indian School Rd, Phoenix, AZ 85018', '4.7', '48', '65', 'Active'],
      ['Jessica Nguyen', 'Appliance Installer', 'jessica.nguyen@lowesinstall.com', '323-555-0110', 'Senior appliance installer with Samsung and LG certification', 'true', 'Store #1678 Los Angeles', '1250 Vine St, Los Angeles, CA 90038', '4.9', '35', '40', 'Active'],
      ['Derek Johnson', 'Fencing/Deck Installer', 'derek.johnson@lowesinstall.com', '704-555-0111', 'Outdoor living specialist covering fencing, decking, and pergola construction', 'true', 'Southeast Region', '5100 South Blvd, Charlotte, NC 28217', '4.6', '40', '50', 'Active'],
      ['Amy Chen', 'Installation Coordinator', 'amy.chen@lowesinstall.com', '704-555-0112', 'Installation coordinator managing Southeast Region scheduling and dispatch', 'true', 'Southeast Region', '1000 Lowes Blvd, Mooresville, NC 28117', '4.8', '40', '30', 'Active'],
      ['Robert Kowalski', 'Plumbing Installer', 'robert.kowalski@lowesinstall.com', '312-555-0113', 'Licensed plumber specializing in water heater installation and fixture replacement', 'true', 'Midwest Region', '2200 N Clybourn Ave, Chicago, IL 60614', '4.5', '38', '45', 'Active'],
      ['Lisa Tran', 'Electrical Installer', 'lisa.tran@lowesinstall.com', '214-555-0114', 'Licensed electrician for ceiling fan, lighting, and panel installations', 'true', 'Southwest Region', '6910 Greenville Ave, Dallas, TX 75231', '4.7', '42', '50', 'Active'],
      ['Nathan Price', 'General Installer', 'nathan.price@lowesinstall.com', '206-555-0115', 'Multi-trade installer covering windows, doors, and general carpentry', 'false', 'West Coast Region', '4520 University Way NE, Seattle, WA 98105', '4.2', '40', '55', 'Inactive']
    ];
    for (const r of serviceResources) {
      await client.query(
        `INSERT INTO service_resources (name, resource_type, email, phone, description, is_active, territory_name, home_address, efficiency_rating, travel_speed, max_travel_distance, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        r
      );
    }

    // ─── SEED SKILLS ───────────────────────────────────────────────────
    console.log('Seeding skills...');
    const skills = [
      ['Appliance Installation', 'Technical', 'Installation and hookup of major home appliances including refrigerators, washers, dryers, and dishwashers', 'true', 'Active'],
      ['Flooring Installation', 'Technical', 'Installation of hardwood, laminate, luxury vinyl plank, and engineered flooring', 'true', 'Active'],
      ['Tile & Backsplash', 'Technical', 'Tile cutting, layout, and installation for floors, walls, and backsplashes', 'true', 'Active'],
      ['Countertop Fabrication', 'Technical', 'Measurement, templating, and installation of granite, quartz, and laminate countertops', 'true', 'Active'],
      ['Cabinet Installation', 'Technical', 'Kitchen and bathroom cabinet assembly, leveling, and installation', 'true', 'Active'],
      ['Kitchen Remodeling', 'Certification', 'Full kitchen remodel coordination including cabinets, countertops, plumbing, and electrical', 'true', 'Active'],
      ['Bathroom Remodeling', 'Certification', 'Full bathroom remodel including vanity, shower/tub, tile, and fixture installation', 'true', 'Active'],
      ['Window & Door Installation', 'Technical', 'Removal of existing and installation of new windows and exterior/interior doors', 'true', 'Active'],
      ['Roofing', 'Certification', 'Roof tear-off, underlayment, and shingle/metal roof installation', 'true', 'Active'],
      ['Fencing & Decking', 'Technical', 'Wood, vinyl, and composite fence and deck construction and installation', 'true', 'Active'],
      ['Plumbing', 'Technical', 'Pipe fitting, water heater installation, fixture replacement, and drain repair', 'true', 'Active'],
      ['Electrical', 'Certification', 'Residential electrical work including panel upgrades, outlet installation, and lighting', 'true', 'Active'],
      ['HVAC Installation', 'Certification', 'Residential heating and cooling system installation, ductwork, and mini-splits', 'true', 'Active'],
      ['Carpentry', 'Technical', 'Trim work, framing, shelving, and general carpentry for home improvement projects', 'true', 'Active'],
      ['Customer Service', 'Soft Skill', 'Homeowner communication, project walkthroughs, and satisfaction follow-up', 'true', 'Active']
    ];
    for (const s of skills) {
      await client.query(
        `INSERT INTO skills (name, skill_type, description, is_active, status)
         VALUES ($1,$2,$3,$4,$5)`,
        s
      );
    }

    // ─── SEED SERVICE_RESOURCE_SKILLS ──────────────────────────────────
    console.log('Seeding service_resource_skills...');
    const serviceResourceSkills = [
      ['Mike Patterson', 'Appliance Installation', 'Expert', '2020-01-15', '2027-01-15', 'Active'],
      ['Mike Patterson', 'Plumbing', 'Intermediate', '2020-01-15', '2027-01-15', 'Active'],
      ['Carlos Rivera', 'Flooring Installation', 'Expert', '2019-06-01', '2026-12-31', 'Active'],
      ['Carlos Rivera', 'Tile & Backsplash', 'Advanced', '2020-03-01', '2026-12-31', 'Active'],
      ['Tamika Washington', 'Kitchen Remodeling', 'Expert', '2018-09-01', '2026-09-01', 'Active'],
      ['Tamika Washington', 'Cabinet Installation', 'Expert', '2018-09-01', '2026-09-01', 'Active'],
      ['Dmitri Volkov', 'Window & Door Installation', 'Expert', '2020-04-01', '2027-04-01', 'Active'],
      ['Dmitri Volkov', 'Carpentry', 'Advanced', '2020-04-01', '2027-04-01', 'Active'],
      ['Sean Murphy', 'Appliance Installation', 'Advanced', '2021-01-01', '2026-12-31', 'Active'],
      ['Sean Murphy', 'Plumbing', 'Intermediate', '2021-01-01', '2026-12-31', 'Active'],
      ['Jorge Gutierrez', 'Roofing', 'Expert', '2019-05-01', '2026-05-01', 'Active'],
      ['Maria Santos', 'Countertop Fabrication', 'Expert', '2020-08-01', '2027-08-01', 'Active'],
      ['Tyler Brooks', 'HVAC Installation', 'Expert', '2019-03-01', '2026-12-31', 'Active'],
      ['Jessica Nguyen', 'Appliance Installation', 'Expert', '2020-11-01', '2027-11-01', 'Active'],
      ['Derek Johnson', 'Fencing & Decking', 'Expert', '2019-07-01', '2026-07-01', 'Active']
    ];
    for (const srs of serviceResourceSkills) {
      await client.query(
        `INSERT INTO service_resource_skills (resource_name, skill_name, skill_level, effective_start, effective_end, status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        srs
      );
    }

    // ─── SEED TERRITORY_MEMBERS ────────────────────────────────────────
    console.log('Seeding territory_members...');
    const territoryMembers = [
      ['Mike Patterson', 'Store #0101 Charlotte', 'Primary', '2020-01-15', '2027-01-15', 'Active'],
      ['Carlos Rivera', 'Store #0245 Raleigh', 'Primary', '2019-06-01', '2026-12-31', 'Active'],
      ['Tamika Washington', 'Store #1502 Atlanta', 'Primary', '2018-09-01', '2026-09-01', 'Active'],
      ['Dmitri Volkov', 'Store #0678 Brooklyn', 'Primary', '2020-04-01', '2027-04-01', 'Active'],
      ['Sean Murphy', 'Store #1234 Boston', 'Primary', '2021-01-01', '2026-12-31', 'Active'],
      ['Jorge Gutierrez', 'Store #0892 Chicago', 'Primary', '2019-05-01', '2026-05-01', 'Active'],
      ['Brandon Lee', 'Store #1456 Detroit', 'Primary', '2020-02-01', '2026-12-31', 'Active'],
      ['Maria Santos', 'Store #0543 Dallas', 'Primary', '2020-08-01', '2027-08-01', 'Active'],
      ['Tyler Brooks', 'Store #0987 Phoenix', 'Primary', '2019-03-01', '2026-12-31', 'Active'],
      ['Jessica Nguyen', 'Store #1678 Los Angeles', 'Primary', '2020-11-01', '2027-11-01', 'Active'],
      ['Derek Johnson', 'Southeast Region', 'Primary', '2019-07-01', '2026-07-01', 'Active'],
      ['Amy Chen', 'Southeast Region', 'Primary', '2021-06-01', '2027-06-01', 'Active'],
      ['Robert Kowalski', 'Midwest Region', 'Primary', '2020-09-01', '2026-09-01', 'Active'],
      ['Lisa Tran', 'Southwest Region', 'Primary', '2021-04-01', '2027-04-01', 'Active'],
      ['Nathan Price', 'West Coast Region', 'Secondary', '2022-01-01', '2026-12-31', 'Inactive']
    ];
    for (const tm of territoryMembers) {
      await client.query(
        `INSERT INTO territory_members (resource_name, territory_name, membership_type, effective_start, effective_end, status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        tm
      );
    }

    // ─── SEED WORK_TYPES ───────────────────────────────────────────────
    console.log('Seeding work_types...');
    const workTypes = [
      ['Appliance Delivery & Install', 'Delivery and installation of purchased major appliances including hookup and testing', '120', 'Fixed', 'Appliance Installation', '15', '15', 'true', 'Active'],
      ['Flooring Installation', 'Measurement and installation of flooring including hardwood, LVP, laminate, or tile', '360', 'Fixed', 'Flooring Installation', '30', '30', 'true', 'Active'],
      ['Kitchen Cabinet Install', 'Removal of old cabinets and installation of new kitchen cabinet system', '480', 'Fixed', 'Cabinet Installation', '30', '30', 'true', 'Active'],
      ['Countertop Measure & Install', 'Template measurement and fabrication/installation of countertops', '240', 'Fixed', 'Countertop Fabrication', '15', '15', 'true', 'Active'],
      ['Window Replacement', 'Removal of existing windows and installation of new energy-efficient replacement windows', '180', 'Fixed', 'Window & Door Installation', '15', '15', 'true', 'Active'],
      ['Door Installation', 'Installation of interior or exterior doors including frame and hardware', '120', 'Fixed', 'Window & Door Installation', '10', '10', 'true', 'Active'],
      ['Roofing Project', 'Full or partial roof replacement including tear-off, underlayment, and new shingles', '960', 'Estimated', 'Roofing', '30', '30', 'true', 'Active'],
      ['Fence Installation', 'Post setting, panel assembly, and installation of wood, vinyl, or composite fencing', '480', 'Fixed', 'Fencing & Decking', '20', '20', 'true', 'Active'],
      ['Deck Build', 'Construction of new deck or replacement of existing deck boards and railing', '960', 'Estimated', 'Fencing & Decking', '30', '30', 'true', 'Active'],
      ['Bathroom Remodel', 'Full bathroom renovation including fixtures, tile, vanity, and plumbing', '960', 'Estimated', 'Bathroom Remodeling', '30', '30', 'true', 'Active'],
      ['HVAC System Install', 'Installation of new residential HVAC system including ductwork modifications', '480', 'Fixed', 'HVAC Installation', '30', '30', 'true', 'Active'],
      ['Water Heater Install', 'Removal of old water heater and installation of new tank or tankless unit', '180', 'Fixed', 'Plumbing', '15', '15', 'true', 'Active'],
      ['Dishwasher Install', 'Removal of old dishwasher and installation of new unit with water/drain connections', '90', 'Fixed', 'Appliance Installation', '10', '10', 'true', 'Active'],
      ['Washer/Dryer Hookup', 'Installation and hookup of washer and/or dryer including connections and venting', '90', 'Fixed', 'Appliance Installation', '10', '10', 'true', 'Active'],
      ['Warranty Service Call', 'Service call for warranty-covered product repair or replacement', '120', 'Estimated', null, '10', '10', 'true', 'Active']
    ];
    for (const wt of workTypes) {
      await client.query(
        `INSERT INTO work_types (name, description, estimated_duration_minutes, duration_type, skill_requirement, block_time_before, block_time_after, auto_create_appointment, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        wt
      );
    }

    // ─── SEED WORK_ORDERS ──────────────────────────────────────────────
    console.log('Seeding work_orders...');
    const workOrders = [
      ['WO-001', 'Kitchen Cabinet Installation - Johnson Residence', 'Full kitchen cabinet replacement with Allen+Roth shaker-style cabinets, 14 units total including upper and lower', 'Johnson Residence', 'Mark Johnson', '704-555-1001', 'mark.johnson@gmail.com', '8500', 'Southeast', 'Carolinas', 'Charlotte Metro', 'Store #0101 Charlotte', 'Kitchen Cabinet Install', 'High', 'In Progress', '2024-11-01', '2024-11-03', '4215 Sharon Rd', 'Charlotte', 'NC', '35.1740', '-80.8506'],
      ['WO-002', 'Dishwasher Replacement - 742 Evergreen Terrace', 'Remove old GE dishwasher and install new Samsung StormWash dishwasher purchased in-store', 'Simpson Residence', 'Homer Simpson', '919-555-2002', 'homer.s@springfield.net', '450', 'Southeast', 'Carolinas', 'Raleigh-Durham', 'Store #0245 Raleigh', 'Dishwasher Install', 'Medium', 'Scheduled', '2024-11-15', '2024-11-15', '742 Evergreen Terrace', 'Raleigh', 'NC', '35.7796', '-78.6382'],
      ['WO-003', 'Hardwood Flooring - Martinez Living Room', 'Installation of 800 sq ft Pergo TimberCraft hardwood flooring in living room and hallway', 'Martinez Residence', 'Elena Martinez', '404-555-3003', 'elena.m@outlook.com', '6200', 'Southeast', 'Georgia/Alabama', 'Atlanta Metro', 'Store #1502 Atlanta', 'Flooring Installation', 'Medium', 'Pending', '2024-12-01', '2024-12-02', '1847 Ponce De Leon Ave', 'Atlanta', 'GA', '33.7673', '-84.3566'],
      ['WO-004', 'Window Replacement - Park Slope Brownstone', 'Replace 8 double-hung windows with Pella 250 Series vinyl windows in historic brownstone', 'Williams Residence', 'David Williams', '718-555-4004', 'dwilliams@gmail.com', '12000', 'Northeast', 'Tri-State', 'Brooklyn', 'Store #0678 Brooklyn', 'Window Replacement', 'High', 'Scheduled', '2024-11-18', '2024-11-19', '312 7th Ave', 'Brooklyn', 'NY', '40.6680', '-73.9806'],
      ['WO-005', 'Samsung French Door Fridge Install - Cooper Home', 'Delivery and installation of Samsung 28 cu ft French Door refrigerator with water line hookup', 'Cooper Residence', 'Sarah Cooper', '617-555-5005', 'sarah.cooper@icloud.com', '2800', 'Northeast', 'New England', 'Boston Metro', 'Store #1234 Boston', 'Appliance Delivery & Install', 'Medium', 'Completed', '2024-10-20', '2024-10-20', '156 Commonwealth Ave', 'Boston', 'MA', '42.3520', '-71.0770'],
      ['WO-006', 'Roof Replacement - Thompson House', 'Full tear-off and replacement with GAF Timberline HDZ shingles, 2200 sq ft roof', 'Thompson Residence', 'Robert Thompson', '312-555-6006', 'rthompson@yahoo.com', '15000', 'Midwest', 'Great Lakes', 'Chicago Metro', 'Store #0892 Chicago', 'Roofing Project', 'High', 'In Progress', '2024-11-10', '2024-11-13', '4521 N Damen Ave', 'Chicago', 'IL', '41.9192', '-87.6795'],
      ['WO-007', 'LVP Flooring - Garcia Basement', 'Installation of 600 sq ft SmartCore Ultra LVP flooring in finished basement', 'Garcia Residence', 'Ana Garcia', '313-555-7007', 'ana.garcia@hotmail.com', '3800', 'Midwest', 'Great Lakes', 'Detroit Metro', 'Store #1456 Detroit', 'Flooring Installation', 'Low', 'Pending', '2024-12-10', '2024-12-11', '8901 Woodward Ave', 'Detroit', 'MI', '42.3726', '-83.0753'],
      ['WO-008', 'Countertop Install - Davis Kitchen', 'Measure, template, and install 45 sq ft of quartz countertops with undermount sink cutout', 'Davis Residence', 'Michelle Davis', '214-555-8008', 'mdavis@outlook.com', '5500', 'Southwest', 'Texas', 'Dallas-Fort Worth', 'Store #0543 Dallas', 'Countertop Measure & Install', 'Medium', 'Scheduled', '2024-11-25', '2024-11-26', '3720 Oak Lawn Ave', 'Dallas', 'TX', '32.8110', '-96.8066'],
      ['WO-009', 'HVAC System - Patel Residence', 'Install new Carrier 3-ton split system AC with gas furnace, replacing 15-year-old unit', 'Patel Residence', 'Raj Patel', '602-555-9009', 'raj.patel@gmail.com', '8500', 'Southwest', 'Desert', 'Phoenix Metro', 'Store #0987 Phoenix', 'HVAC System Install', 'Critical', 'In Progress', '2024-11-05', '2024-11-06', '5678 E Camelback Rd', 'Phoenix', 'AZ', '33.5092', '-111.9502'],
      ['WO-010', 'Washer/Dryer Setup - Kim Apartment', 'Install LG Front-Load washer and dryer set in laundry closet with stacking kit', 'Kim Residence', 'Jenny Kim', '323-555-1010', 'jenny.kim@gmail.com', '1800', 'West Coast', 'Southern California', 'LA Metro', 'Store #1678 Los Angeles', 'Washer/Dryer Hookup', 'Medium', 'Scheduled', '2024-11-20', '2024-11-20', '925 S Broadway', 'Los Angeles', 'CA', '34.0387', '-118.2566'],
      ['WO-011', 'Fence Installation - Baker Property', 'Install 150 linear ft of 6-ft privacy fence with Freedom vinyl fencing panels and gate', 'Baker Residence', 'Tom Baker', '704-555-1111', 'tom.baker@aol.com', '7200', 'Southeast', 'Carolinas', 'Charlotte Metro', 'Store #0101 Charlotte', 'Fence Installation', 'Low', 'Pending', '2024-12-15', '2024-12-17', '8900 Rea Rd', 'Charlotte', 'NC', '35.1004', '-80.8120'],
      ['WO-012', 'Water Heater Replacement - Nguyen Home', 'Remove 40-gal tank water heater and install A.O. Smith 50-gal hybrid electric unit', 'Nguyen Residence', 'Tuan Nguyen', '312-555-1212', 'tuan.nguyen@gmail.com', '2200', 'Midwest', 'Great Lakes', 'Chicago Metro', 'Store #0892 Chicago', 'Water Heater Install', 'High', 'Completed', '2024-10-28', '2024-10-28', '2345 W Armitage Ave', 'Chicago', 'IL', '41.9173', '-87.6853'],
      ['WO-013', 'Bathroom Remodel - Anderson Master Bath', 'Full master bathroom renovation: new vanity, walk-in shower, tile floor, and lighting', 'Anderson Residence', 'Craig Anderson', '214-555-1313', 'canderson@protonmail.com', '18000', 'Southwest', 'Texas', 'Dallas-Fort Worth', 'Store #0543 Dallas', 'Bathroom Remodel', 'Medium', 'Scheduled', '2024-12-01', '2024-12-05', '6100 Hillcrest Ave', 'Dallas', 'TX', '32.8493', '-96.7860'],
      ['WO-014', 'Deck Build - Phillips Backyard', 'Build new 400 sq ft composite deck with Trex Enhance boards and aluminum railing', 'Phillips Residence', 'Laura Phillips', '704-555-1414', 'laura.phillips@yahoo.com', '14000', 'Southeast', 'Carolinas', 'Charlotte Metro', 'Store #0101 Charlotte', 'Deck Build', 'Low', 'Pending', '2025-03-01', '2025-03-05', '10200 Sardis Rd', 'Charlotte', 'NC', '35.1098', '-80.7871'],
      ['WO-015', 'Door Installation - Warranty Callback', 'Warranty replacement of Reliabilt entry door - original install had alignment issue', 'Chang Residence', 'William Chang', '602-555-1515', 'wchang@gmail.com', '0', 'Southwest', 'Desert', 'Phoenix Metro', 'Store #0987 Phoenix', 'Warranty Service Call', 'High', 'In Progress', '2024-11-12', '2024-11-12', '2210 W Glendale Ave', 'Phoenix', 'AZ', '33.5384', '-112.0868']
    ];
    for (const wo of workOrders) {
      await client.query(
        `INSERT INTO work_orders (work_order_number, subject, description, account_name, contact_name, contact_phone, contact_email, budget, region, district, market, territory_name, work_type_name, priority, status, start_date, end_date, address, city, state, latitude, longitude)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        wo
      );
    }

    // ─── SEED WORK_ORDER_LINE_ITEMS ────────────────────────────────────
    console.log('Seeding work_order_line_items...');
    const workOrderLineItems = [
      ['WO-001', 'LI-001', 'Remove existing kitchen cabinets and prep walls', 'Kitchen Cabinet Install', 'Completed', '2024-11-01', '2024-11-01', '180', null, 'Walls patched where needed before new install'],
      ['WO-001', 'LI-002', 'Install 14 Allen+Roth shaker cabinets (uppers and lowers)', 'Kitchen Cabinet Install', 'In Progress', '2024-11-02', '2024-11-03', '480', 'Allen+Roth Shaker Cabinets (14-pc)', 'Includes soft-close hinges and drawer glides'],
      ['WO-002', 'LI-003', 'Disconnect and remove old GE dishwasher', 'Dishwasher Install', 'Scheduled', '2024-11-15', '2024-11-15', '30', null, 'Check water supply valve condition'],
      ['WO-002', 'LI-004', 'Install Samsung StormWash dishwasher and test cycles', 'Dishwasher Install', 'Scheduled', '2024-11-15', '2024-11-15', '60', 'Samsung DW80R9950US StormWash', 'Run test cycle and check for leaks'],
      ['WO-003', 'LI-005', 'Remove existing carpet and prep subfloor', 'Flooring Installation', 'Pending', '2024-12-01', '2024-12-01', '120', null, 'Level subfloor if variance exceeds 3/16 inch'],
      ['WO-003', 'LI-006', 'Install 800 sq ft Pergo TimberCraft with underlayment', 'Flooring Installation', 'Pending', '2024-12-01', '2024-12-02', '360', 'Pergo TimberCraft Hardwood', 'Include transitions and quarter round'],
      ['WO-004', 'LI-007', 'Remove 8 existing double-hung windows', 'Window Replacement', 'Scheduled', '2024-11-18', '2024-11-18', '240', null, 'Careful removal - historic brownstone trim'],
      ['WO-004', 'LI-008', 'Install 8 Pella 250 Series vinyl windows with trim', 'Window Replacement', 'Scheduled', '2024-11-18', '2024-11-19', '360', 'Pella 250 Series Windows (8)', 'Foam insulate gaps and install interior trim'],
      ['WO-005', 'LI-009', 'Deliver and install Samsung French Door refrigerator', 'Appliance Delivery & Install', 'Completed', '2024-10-20', '2024-10-20', '90', 'Samsung RF28T5001SR Refrigerator', 'Connected water line for ice maker'],
      ['WO-006', 'LI-010', 'Tear off existing shingles and inspect decking', 'Roofing Project', 'In Progress', '2024-11-10', '2024-11-11', '480', null, 'Replace any rotted decking boards found'],
      ['WO-007', 'LI-011', 'Prep basement subfloor and install moisture barrier', 'Flooring Installation', 'Pending', '2024-12-10', '2024-12-10', '120', null, 'Moisture test required before LVP install'],
      ['WO-008', 'LI-012', 'Template and measure for quartz countertop fabrication', 'Countertop Measure & Install', 'Scheduled', '2024-11-25', '2024-11-25', '60', 'Allen+Roth Quartz Countertop', 'Undermount sink cutout dimensions confirmed'],
      ['WO-009', 'LI-013', 'Remove old HVAC system and prep for new install', 'HVAC System Install', 'In Progress', '2024-11-05', '2024-11-05', '240', null, 'Dispose of old refrigerant per EPA regs'],
      ['WO-010', 'LI-014', 'Install LG washer/dryer with stacking kit', 'Washer/Dryer Hookup', 'Scheduled', '2024-11-20', '2024-11-20', '90', 'LG WM4000HWA / DLEX4000W Set', 'Verify dryer vent and water connections'],
      ['WO-012', 'LI-015', 'Remove old tank water heater and install A.O. Smith hybrid', 'Water Heater Install', 'Completed', '2024-10-28', '2024-10-28', '180', 'A.O. Smith SHPT-50 Hybrid', 'Upgraded to 240V outlet for hybrid unit']
    ];
    for (const li of workOrderLineItems) {
      await client.query(
        `INSERT INTO work_order_line_items (work_order_number, line_item_number, description, work_type_name, status, start_date, end_date, duration_minutes, asset_name, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        li
      );
    }

    // ─── SEED SERVICE_APPOINTMENTS ─────────────────────────────────────
    console.log('Seeding service_appointments...');
    const serviceAppointments = [
      ['SA-001', 'WO-001', 'Cabinet Install - Johnson Residence', 'In Progress', '2024-11-01 08:00', '2024-11-03 16:00', '2024-11-01 08:15', null, '480', 'Tamika Washington', 'Store #1502 Atlanta', '4215 Sharon Rd', 'Charlotte', 'NC'],
      ['SA-002', 'WO-002', 'Dishwasher Install - 742 Evergreen Terrace', 'Scheduled', '2024-11-15 09:00', '2024-11-15 10:30', null, null, '90', 'Carlos Rivera', 'Store #0245 Raleigh', '742 Evergreen Terrace', 'Raleigh', 'NC'],
      ['SA-003', 'WO-003', 'Flooring Install - Martinez Living Room', 'Scheduled', '2024-12-01 07:00', '2024-12-02 15:00', null, null, '360', 'Carlos Rivera', 'Store #0245 Raleigh', '1847 Ponce De Leon Ave', 'Atlanta', 'GA'],
      ['SA-004', 'WO-004', 'Window Replacement - Park Slope Brownstone', 'Scheduled', '2024-11-18 08:00', '2024-11-19 16:00', null, null, '360', 'Dmitri Volkov', 'Store #0678 Brooklyn', '312 7th Ave', 'Brooklyn', 'NY'],
      ['SA-005', 'WO-005', 'Fridge Install - Cooper Home', 'Completed', '2024-10-20 10:00', '2024-10-20 12:00', '2024-10-20 10:10', '2024-10-20 11:45', '120', 'Sean Murphy', 'Store #1234 Boston', '156 Commonwealth Ave', 'Boston', 'MA'],
      ['SA-006', 'WO-006', 'Roof Replacement - Thompson House', 'In Progress', '2024-11-10 07:00', '2024-11-13 16:00', '2024-11-10 07:15', null, '960', 'Jorge Gutierrez', 'Store #0892 Chicago', '4521 N Damen Ave', 'Chicago', 'IL'],
      ['SA-007', 'WO-007', 'LVP Flooring - Garcia Basement', 'Scheduled', '2024-12-10 08:00', '2024-12-11 14:00', null, null, '360', 'Brandon Lee', 'Store #1456 Detroit', '8901 Woodward Ave', 'Detroit', 'MI'],
      ['SA-008', 'WO-008', 'Countertop Install - Davis Kitchen', 'Scheduled', '2024-11-25 09:00', '2024-11-26 13:00', null, null, '240', 'Maria Santos', 'Store #0543 Dallas', '3720 Oak Lawn Ave', 'Dallas', 'TX'],
      ['SA-009', 'WO-009', 'HVAC Install - Patel Residence', 'In Progress', '2024-11-05 07:00', '2024-11-06 15:00', '2024-11-05 07:10', null, '480', 'Tyler Brooks', 'Store #0987 Phoenix', '5678 E Camelback Rd', 'Phoenix', 'AZ'],
      ['SA-010', 'WO-010', 'Washer/Dryer Hookup - Kim Apartment', 'Scheduled', '2024-11-20 10:00', '2024-11-20 11:30', null, null, '90', 'Jessica Nguyen', 'Store #1678 Los Angeles', '925 S Broadway', 'Los Angeles', 'CA'],
      ['SA-011', 'WO-011', 'Fence Install - Baker Property', 'Scheduled', '2024-12-15 07:00', '2024-12-17 15:00', null, null, '480', 'Derek Johnson', 'Southeast Region', '8900 Rea Rd', 'Charlotte', 'NC'],
      ['SA-012', 'WO-012', 'Water Heater Replace - Nguyen Home', 'Completed', '2024-10-28 08:00', '2024-10-28 11:00', '2024-10-28 08:15', '2024-10-28 10:50', '180', 'Robert Kowalski', 'Midwest Region', '2345 W Armitage Ave', 'Chicago', 'IL'],
      ['SA-013', 'WO-013', 'Bathroom Remodel - Anderson Master Bath', 'Scheduled', '2024-12-01 07:00', '2024-12-05 16:00', null, null, '960', 'Maria Santos', 'Store #0543 Dallas', '6100 Hillcrest Ave', 'Dallas', 'TX'],
      ['SA-014', 'WO-014', 'Deck Build - Phillips Backyard', 'Scheduled', '2025-03-01 07:00', '2025-03-05 16:00', null, null, '960', 'Derek Johnson', 'Southeast Region', '10200 Sardis Rd', 'Charlotte', 'NC'],
      ['SA-015', 'WO-015', 'Warranty Door Fix - Chang Residence', 'In Progress', '2024-11-12 09:00', '2024-11-12 11:00', '2024-11-12 09:15', null, '120', 'Tyler Brooks', 'Store #0987 Phoenix', '2210 W Glendale Ave', 'Phoenix', 'AZ']
    ];
    for (const sa of serviceAppointments) {
      await client.query(
        `INSERT INTO service_appointments (appointment_number, work_order_number, subject, status, scheduled_start, scheduled_end, actual_start, actual_end, duration_minutes, resource_name, territory_name, address, city, state)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        sa
      );
    }

    // ─── SEED RESOURCE_ABSENCES ────────────────────────────────────────
    console.log('Seeding resource_absences...');
    const resourceAbsences = [
      ['Mike Patterson', 'Vacation', '2024-12-23 00:00', '2024-12-27 23:59', 'Holiday vacation - Christmas week', 'Amy Chen', 'Approved'],
      ['Carlos Rivera', 'Training', '2024-11-18 08:00', '2024-11-19 17:00', 'Pergo advanced flooring certification training', 'Amy Chen', 'Approved'],
      ['Tamika Washington', 'Vacation', '2024-12-20 00:00', '2025-01-02 23:59', 'End of year holiday vacation', 'Amy Chen', 'Approved'],
      ['Dmitri Volkov', 'Training', '2024-11-25 08:00', '2024-11-26 17:00', 'Pella window installation certification workshop', 'Amy Chen', 'Approved'],
      ['Sean Murphy', 'Sick Leave', '2024-10-14 00:00', '2024-10-15 23:59', 'Flu - called in sick', 'Amy Chen', 'Approved'],
      ['Jorge Gutierrez', 'Medical', '2024-11-04 00:00', '2024-11-08 23:59', 'Scheduled medical procedure and recovery', 'Amy Chen', 'Approved'],
      ['Brandon Lee', 'Vacation', '2024-11-28 00:00', '2024-11-29 23:59', 'Thanksgiving holiday', 'Amy Chen', 'Approved'],
      ['Maria Santos', 'Training', '2024-12-02 08:00', '2024-12-03 17:00', 'Kitchen remodel project management certification', 'Amy Chen', 'Approved'],
      ['Tyler Brooks', 'Vacation', '2024-12-16 00:00', '2024-12-20 23:59', 'Pre-holiday vacation week', 'Amy Chen', 'Approved'],
      ['Jessica Nguyen', 'Jury Duty', '2024-11-11 08:00', '2024-11-15 17:00', 'Summoned for jury duty - Los Angeles County', 'Amy Chen', 'Approved'],
      ['Derek Johnson', 'Sick Leave', '2024-10-22 00:00', '2024-10-23 23:59', 'Back injury - 2 day absence', 'Amy Chen', 'Approved'],
      ['Robert Kowalski', 'Training', '2024-12-09 08:00', '2024-12-10 17:00', 'Water heater tankless installation certification', 'Amy Chen', 'Pending'],
      ['Lisa Tran', 'Vacation', '2025-01-06 00:00', '2025-01-10 23:59', 'Winter vacation - first week of January', 'Amy Chen', 'Pending'],
      ['Nathan Price', 'Personal', '2024-11-22 00:00', '2024-11-22 23:59', 'Personal day', 'Amy Chen', 'Approved'],
      ['Amy Chen', 'Vacation', '2024-12-30 00:00', '2025-01-01 23:59', 'New Year holiday', 'Admin User', 'Approved']
    ];
    for (const ra of resourceAbsences) {
      await client.query(
        `INSERT INTO resource_absences (resource_name, type, start_time, end_time, description, approved_by, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        ra
      );
    }

    // ─── SEED TIME_SHEETS ──────────────────────────────────────────────
    console.log('Seeding time_sheets...');
    const timeSheets = [
      ['Mike Patterson', '2024-10-28', '2024-11-01', '40', 'Approved', 'Amy Chen', 'Standard work week - 3 appliance installs'],
      ['Carlos Rivera', '2024-10-28', '2024-11-01', '44', 'Approved', 'Amy Chen', 'Overtime on large flooring job'],
      ['Tamika Washington', '2024-10-28', '2024-11-01', '42', 'Approved', 'Amy Chen', 'Kitchen cabinet install ran long'],
      ['Dmitri Volkov', '2024-10-28', '2024-11-01', '40', 'Approved', 'Amy Chen', 'Full standard week - window installs'],
      ['Sean Murphy', '2024-10-28', '2024-11-01', '38', 'Approved', 'Amy Chen', 'Left early Friday for appointment'],
      ['Jorge Gutierrez', '2024-11-04', '2024-11-08', '0', 'Approved', 'Amy Chen', 'Medical absence - full week'],
      ['Brandon Lee', '2024-10-28', '2024-11-01', '40', 'Approved', 'Amy Chen', 'Standard work week - flooring installs'],
      ['Maria Santos', '2024-10-28', '2024-11-01', '45', 'Approved', 'Amy Chen', 'Kitchen remodel project overtime'],
      ['Tyler Brooks', '2024-10-28', '2024-11-01', '43', 'Approved', 'Amy Chen', 'HVAC emergency install - 3 hours OT'],
      ['Jessica Nguyen', '2024-10-28', '2024-11-01', '40', 'Approved', 'Amy Chen', 'Standard work week - appliance installs'],
      ['Derek Johnson', '2024-10-28', '2024-11-01', '41', 'Approved', 'Amy Chen', 'Fence install with 1hr overtime'],
      ['Amy Chen', '2024-10-28', '2024-11-01', '45', 'Approved', 'Admin User', 'Dispatch coverage plus scheduling coordination'],
      ['Robert Kowalski', '2024-11-04', '2024-11-08', '40', 'Submitted', 'Amy Chen', 'Pending manager review'],
      ['Lisa Tran', '2024-11-04', '2024-11-08', '40', 'Submitted', 'Amy Chen', 'Pending manager review'],
      ['Nathan Price', '2024-11-04', '2024-11-08', '32', 'Draft', null, 'Incomplete - missing Friday hours']
    ];
    for (const ts of timeSheets) {
      await client.query(
        `INSERT INTO time_sheets (resource_name, start_date, end_date, total_hours, status, approved_by, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        ts
      );
    }

    // ─── SEED TIME_SHEET_ENTRIES ────────────────────────────────────────
    console.log('Seeding time_sheet_entries...');
    const timeSheetEntries = [
      ['1', 'Mike Patterson', 'WO-005', 'Work', '2024-10-29 08:00', '2024-10-29 12:00', '4', 'Samsung refrigerator delivery and install - Cooper Home', 'Approved'],
      ['1', 'Mike Patterson', null, 'Work', '2024-10-29 13:00', '2024-10-29 17:00', '4', 'Dishwasher install at another residence', 'Approved'],
      ['2', 'Carlos Rivera', 'WO-003', 'Work', '2024-10-30 07:00', '2024-10-30 15:00', '8', 'Flooring subfloor prep for Martinez project', 'Approved'],
      ['2', 'Carlos Rivera', null, 'Travel', '2024-10-30 15:00', '2024-10-30 16:00', '1', 'Travel back from Atlanta job site', 'Approved'],
      ['3', 'Tamika Washington', 'WO-001', 'Work', '2024-10-28 07:00', '2024-10-28 15:30', '8.5', 'Cabinet measurements and wall prep - Johnson Residence', 'Approved'],
      ['3', 'Tamika Washington', null, 'Break', '2024-10-28 11:30', '2024-10-28 12:00', '0.5', 'Lunch break', 'Approved'],
      ['4', 'Dmitri Volkov', null, 'Work', '2024-10-28 08:00', '2024-10-28 16:00', '8', 'Window measurements for Park Slope brownstone', 'Approved'],
      ['5', 'Sean Murphy', 'WO-005', 'Work', '2024-10-20 10:00', '2024-10-20 12:00', '2', 'Samsung fridge install and water line connection', 'Approved'],
      ['7', 'Brandon Lee', null, 'Work', '2024-10-28 08:00', '2024-10-28 16:00', '8', 'LVP flooring install - residential job in Farmington Hills', 'Approved'],
      ['8', 'Maria Santos', 'WO-008', 'Work', '2024-10-30 08:00', '2024-10-30 16:00', '8', 'Countertop template measurement - Davis Kitchen', 'Approved'],
      ['9', 'Tyler Brooks', 'WO-009', 'Work', '2024-10-29 07:00', '2024-10-29 16:00', '9', 'Old HVAC removal and new system prep - Patel Residence', 'Approved'],
      ['10', 'Jessica Nguyen', null, 'Work', '2024-10-28 08:00', '2024-10-28 15:00', '7', 'Two appliance deliveries and installs in LA Metro', 'Approved'],
      ['11', 'Derek Johnson', 'WO-011', 'Work', '2024-10-30 07:00', '2024-10-30 15:00', '8', 'Fence post hole digging and setting - Baker Property', 'Approved'],
      ['13', 'Robert Kowalski', 'WO-012', 'Work', '2024-10-28 08:00', '2024-10-28 11:00', '3', 'Water heater removal and hybrid unit install - Nguyen Home', 'Submitted'],
      ['14', 'Lisa Tran', null, 'Work', '2024-11-04 08:00', '2024-11-04 16:00', '8', 'Ceiling fan installations at two Dallas residences', 'Submitted']
    ];
    for (const tse of timeSheetEntries) {
      await client.query(
        `INSERT INTO time_sheet_entries (time_sheet_id, resource_name, work_order_number, type, start_time, end_time, duration_hours, description, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        tse
      );
    }

    // ─── SEED SHIFTS ───────────────────────────────────────────────────
    console.log('Seeding shifts...');
    const shifts = [
      ['Store #0101 Charlotte', 'Morning Shift - Charlotte', '2024-11-18 07:00', '2024-11-18 15:00', 'Regular', 'Mike Patterson', 'Active', 'Standard installer morning shift'],
      ['Store #0245 Raleigh', 'Day Shift - Raleigh', '2024-11-18 07:00', '2024-11-18 16:00', 'Regular', 'Carlos Rivera', 'Active', 'Standard flooring installer shift'],
      ['Store #1502 Atlanta', 'Day Shift - Atlanta', '2024-11-18 07:00', '2024-11-18 16:00', 'Regular', 'Tamika Washington', 'Active', 'Kitchen/bath installer shift'],
      ['Store #0678 Brooklyn', 'Day Shift - Brooklyn', '2024-11-18 08:00', '2024-11-18 16:00', 'Regular', 'Dmitri Volkov', 'Active', 'Window/door installer shift'],
      ['Store #1234 Boston', 'Day Shift - Boston', '2024-11-18 07:30', '2024-11-18 16:00', 'Regular', 'Sean Murphy', 'Active', 'General installer shift'],
      ['Store #0892 Chicago', 'Day Shift - Chicago', '2024-11-18 07:00', '2024-11-18 15:00', 'Regular', 'Jorge Gutierrez', 'Active', 'Roofing crew lead shift'],
      ['Store #1456 Detroit', 'Day Shift - Detroit', '2024-11-18 07:00', '2024-11-18 15:30', 'Regular', 'Brandon Lee', 'Active', 'Flooring installer shift'],
      ['Store #0543 Dallas', 'Day Shift - Dallas', '2024-11-18 06:30', '2024-11-18 15:00', 'Regular', 'Maria Santos', 'Active', 'Kitchen/bath installer shift'],
      ['Store #0987 Phoenix', 'Early Shift - Phoenix', '2024-11-18 06:00', '2024-11-18 14:00', 'Regular', 'Tyler Brooks', 'Active', 'Early shift due to heat considerations'],
      ['Store #1678 Los Angeles', 'Day Shift - LA', '2024-11-18 07:00', '2024-11-18 15:30', 'Regular', 'Jessica Nguyen', 'Active', 'Appliance installer shift'],
      ['Southeast Region', 'Day Shift - SE Outdoor', '2024-11-18 07:00', '2024-11-18 15:00', 'Regular', 'Derek Johnson', 'Active', 'Fencing and decking installer shift'],
      ['Southeast Region', 'Coordinator Shift', '2024-11-18 07:00', '2024-11-18 17:00', 'Regular', 'Amy Chen', 'Active', 'Dispatch and scheduling coordination'],
      ['Midwest Region', 'Day Shift - Midwest Plumbing', '2024-11-18 07:00', '2024-11-18 15:00', 'Regular', 'Robert Kowalski', 'Active', 'Plumbing installer shift'],
      ['Southwest Region', 'Day Shift - SW Electrical', '2024-11-18 07:00', '2024-11-18 15:30', 'Regular', 'Lisa Tran', 'Active', 'Electrical installer shift'],
      ['Store #0101 Charlotte', 'Saturday Shift - Charlotte', '2024-11-23 08:00', '2024-11-23 16:00', 'Weekend', 'Mike Patterson', 'Active', 'Saturday installation coverage']
    ];
    for (const sh of shifts) {
      await client.query(
        `INSERT INTO shifts (territory_name, label, start_time, end_time, time_slot_type, resource_name, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        sh
      );
    }

    // ─── SEED SERVICE_CREWS ────────────────────────────────────────────
    console.log('Seeding service_crews...');
    const serviceCrews = [
      ['Charlotte Flooring Team', 'Flooring installation crew serving Charlotte metro area', '3', 'Carlos Rivera', 'Store #0101 Charlotte', 'Flooring Installation', 'Active'],
      ['Northeast Appliance Crew', 'Appliance delivery and installation crew for Northeast stores', '4', 'Sean Murphy', 'Northeast Region', 'Appliance Installation', 'Active'],
      ['Atlanta Kitchen Team', 'Kitchen remodeling crew serving Atlanta metro area', '3', 'Tamika Washington', 'Store #1502 Atlanta', 'Kitchen Remodeling', 'Active'],
      ['Brooklyn Window Crew', 'Window and door installation crew for Brooklyn/NYC area', '3', 'Dmitri Volkov', 'Store #0678 Brooklyn', 'Window & Door Installation', 'Active'],
      ['Chicago Roofing Team', 'Roofing project crew serving Chicago metro and suburbs', '5', 'Jorge Gutierrez', 'Store #0892 Chicago', 'Roofing', 'Active'],
      ['Detroit Flooring Crew', 'Flooring installation crew for Detroit metro area', '3', 'Brandon Lee', 'Store #1456 Detroit', 'Flooring Installation', 'Active'],
      ['Dallas Kitchen/Bath Team', 'Kitchen and bath remodel crew for DFW metroplex', '4', 'Maria Santos', 'Store #0543 Dallas', 'Kitchen Remodeling', 'Active'],
      ['Phoenix HVAC Team', 'HVAC installation crew for Phoenix metro desert region', '3', 'Tyler Brooks', 'Store #0987 Phoenix', 'HVAC Installation', 'Active'],
      ['LA Appliance Crew', 'Appliance delivery and install crew for LA metro area', '4', 'Jessica Nguyen', 'Store #1678 Los Angeles', 'Appliance Installation', 'Active'],
      ['Charlotte Outdoor Living Team', 'Fencing, decking, and outdoor project crew', '4', 'Derek Johnson', 'Southeast Region', 'Fencing & Decking', 'Active'],
      ['SE Dispatch Team', 'Scheduling and dispatch coordination for Southeast Region', '2', 'Amy Chen', 'Southeast Region', 'Customer Service', 'Active'],
      ['Midwest Plumbing Crew', 'Plumbing and water heater installation crew for Midwest', '3', 'Robert Kowalski', 'Midwest Region', 'Plumbing', 'Active'],
      ['SW Electrical Team', 'Electrical installation crew for Southwest Region', '3', 'Lisa Tran', 'Southwest Region', 'Electrical', 'Active'],
      ['Charlotte Appliance Crew', 'Appliance delivery and installation crew for Charlotte', '3', 'Mike Patterson', 'Store #0101 Charlotte', 'Appliance Installation', 'Active'],
      ['West Coast General Crew', 'Multi-trade installation crew for West Coast overflow', '2', 'Nathan Price', 'West Coast Region', 'Carpentry', 'Inactive']
    ];
    for (const sc of serviceCrews) {
      await client.query(
        `INSERT INTO service_crews (name, description, crew_size, lead_name, territory_name, specialization, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        sc
      );
    }

    // ─── SEED ASSETS ───────────────────────────────────────────────────
    console.log('Seeding assets...');
    const assets = [
      ['Allen+Roth Shaker Cabinets (14-pc)', 'CAB-2024-0445', 'Johnson Residence', 'Allen+Roth Stonthorn Shaker Cabinet Set', '2024-11-02', '2029-11-02', 'Active', 'Store #0101 Charlotte', '4215 Sharon Rd, Charlotte, NC 28211', '2024-11-02'],
      ['Samsung DW80R9950US StormWash', 'DW-2024-1122', 'Simpson Residence', 'Samsung StormWash 48dBA Dishwasher', '2024-11-15', '2026-11-15', 'Pending Install', 'Store #0245 Raleigh', '742 Evergreen Terrace, Raleigh, NC 27612', null],
      ['Pergo TimberCraft Hardwood', 'FLR-2024-0087', 'Martinez Residence', 'Pergo TimberCraft + WetProtect Hardwood 800sqft', '2024-12-02', '2049-12-02', 'Pending Install', 'Store #1502 Atlanta', '1847 Ponce De Leon Ave, Atlanta, GA 30306', null],
      ['Pella 250 Series Windows (8)', 'WIN-2024-0334', 'Williams Residence', 'Pella 250 Series Double-Hung Vinyl Window', '2024-11-19', '2044-11-19', 'Pending Install', 'Store #0678 Brooklyn', '312 7th Ave, Brooklyn, NY 11215', null],
      ['Samsung RF28T5001SR Refrigerator', 'REF-2024-0612', 'Cooper Residence', 'Samsung 28 cu ft French Door Refrigerator', '2024-10-20', '2026-10-20', 'Active', 'Store #1234 Boston', '156 Commonwealth Ave, Boston, MA 02116', '2024-10-20'],
      ['GAF Timberline HDZ Shingles', 'ROOF-2024-0189', 'Thompson Residence', 'GAF Timberline HDZ Architectural Shingles 2200sqft', '2024-11-13', '2049-11-13', 'Active', 'Store #0892 Chicago', '4521 N Damen Ave, Chicago, IL 60625', '2024-11-10'],
      ['SmartCore Ultra LVP 600sqft', 'FLR-2024-0556', 'Garcia Residence', 'SmartCore Ultra Waterproof LVP Flooring', '2024-12-11', '2049-12-11', 'Pending Install', 'Store #1456 Detroit', '8901 Woodward Ave, Detroit, MI 48202', null],
      ['Allen+Roth Quartz Countertop', 'CTR-2024-0223', 'Davis Residence', 'Allen+Roth Cosmic Dust Quartz 45sqft', '2024-11-26', '2039-11-26', 'Pending Install', 'Store #0543 Dallas', '3720 Oak Lawn Ave, Dallas, TX 75219', null],
      ['Carrier 3-Ton Split System', 'HVAC-2024-0078', 'Patel Residence', 'Carrier Comfort 3-Ton 16 SEER2 Split System', '2024-11-06', '2034-11-06', 'Active', 'Store #0987 Phoenix', '5678 E Camelback Rd, Phoenix, AZ 85018', '2024-11-05'],
      ['LG WM4000HWA / DLEX4000W Set', 'WD-2024-0331', 'Kim Residence', 'LG Front-Load Washer & Dryer Pair', '2024-11-20', '2026-11-20', 'Pending Install', 'Store #1678 Los Angeles', '925 S Broadway, Los Angeles, CA 90015', null],
      ['Freedom Vinyl Fence 150LF', 'FNC-2024-0145', 'Baker Residence', 'Freedom 6-ft White Vinyl Privacy Fence 150LF', '2024-12-17', '2044-12-17', 'Pending Install', 'Southeast Region', '8900 Rea Rd, Charlotte, NC 28277', null],
      ['A.O. Smith SHPT-50 Hybrid', 'WH-2024-0889', 'Nguyen Residence', 'A.O. Smith 50-gal Hybrid Electric Water Heater', '2024-10-28', '2034-10-28', 'Active', 'Midwest Region', '2345 W Armitage Ave, Chicago, IL 60647', '2024-10-28'],
      ['Delta Shower System + Vanity', 'BATH-2024-0901', 'Anderson Residence', 'Delta Linden Shower System + Allen+Roth 48in Vanity', '2024-12-05', '2029-12-05', 'Pending Install', 'Store #0543 Dallas', '6100 Hillcrest Ave, Dallas, TX 75205', null],
      ['Trex Enhance Composite Deck', 'DECK-2025-0445', 'Phillips Residence', 'Trex Enhance Naturals 400sqft Composite Decking', '2025-03-05', '2050-03-05', 'Pending Install', 'Southeast Region', '10200 Sardis Rd, Charlotte, NC 28270', null],
      ['Reliabilt Entry Door (Warranty)', 'DOOR-2024-0112', 'Chang Residence', 'Reliabilt Steel Entry Door with Sidelites', '2024-06-15', '2044-06-15', 'Under Warranty', 'Store #0987 Phoenix', '2210 W Glendale Ave, Phoenix, AZ 85021', '2024-11-12']
    ];
    for (const a of assets) {
      await client.query(
        `INSERT INTO assets (name, serial_number, account_name, product_name, install_date, warranty_end, status, territory_name, address, last_service_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        a
      );
    }

    // ─── SEED MAINTENANCE_PLANS ────────────────────────────────────────
    console.log('Seeding maintenance_plans...');
    const maintenancePlans = [
      ['Annual HVAC Filter Service - Patel Residence', 'Annual HVAC filter replacement and system tune-up for Carrier split system', 'HVAC System Install', 'Patel Residence', 'Carrier 3-Ton Split System', 'Annually', '2025-11-05', 'Store #0987 Phoenix', 'Active', 'Desert climate requires annual filter changes and coil cleaning'],
      ['Samsung Fridge Annual Checkup - Cooper', 'Annual refrigerator maintenance including coil cleaning and water filter replacement', 'Warranty Service Call', 'Cooper Residence', 'Samsung RF28T5001SR Refrigerator', 'Annually', '2025-10-20', 'Store #1234 Boston', 'Active', 'Replace water filter every 6 months'],
      ['Roof Warranty Inspection - Thompson', 'Annual roof inspection required to maintain GAF warranty coverage', 'Warranty Service Call', 'Thompson Residence', 'GAF Timberline HDZ Shingles', 'Annually', '2025-11-13', 'Store #0892 Chicago', 'Active', 'Inspect flashing, gutters, and shingle condition'],
      ['Water Heater Annual Service - Nguyen', 'Annual water heater maintenance including anode rod check and flush', 'Water Heater Install', 'Nguyen Residence', 'A.O. Smith SHPT-50 Hybrid', 'Annually', '2025-10-28', 'Midwest Region', 'Active', 'Check anode rod and flush sediment annually'],
      ['A.O. Smith Warranty Check - Nguyen', 'Semi-annual warranty maintenance for hybrid water heater', 'Warranty Service Call', 'Nguyen Residence', 'A.O. Smith SHPT-50 Hybrid', 'Semi-Annually', '2025-04-28', 'Midwest Region', 'Active', 'Warranty requires documented maintenance'],
      ['Deck Annual Seal & Inspect - Phillips', 'Annual composite deck inspection and cleaning', 'Warranty Service Call', 'Phillips Residence', 'Trex Enhance Composite Deck', 'Annually', '2026-03-05', 'Southeast Region', 'Active', 'Clean and inspect deck boards, railing, and fasteners'],
      ['HVAC Seasonal Tune-Up - Patel Spring', 'Spring AC tune-up before Arizona summer heat', 'HVAC System Install', 'Patel Residence', 'Carrier 3-Ton Split System', 'Semi-Annually', '2025-04-01', 'Store #0987 Phoenix', 'Active', 'Refrigerant level check and evaporator coil cleaning'],
      ['Cabinet Hardware Check - Johnson', 'Annual cabinet inspection for soft-close mechanism adjustment', 'Warranty Service Call', 'Johnson Residence', 'Allen+Roth Shaker Cabinets (14-pc)', 'Annually', '2025-11-02', 'Store #0101 Charlotte', 'Active', 'Adjust hinges and drawer glides as needed'],
      ['Vinyl Fence Annual Inspection - Baker', 'Annual vinyl fence inspection for warranty compliance', 'Warranty Service Call', 'Baker Residence', 'Freedom Vinyl Fence 150LF', 'Annually', '2025-12-17', 'Southeast Region', 'Active', 'Inspect posts, panels, and gate hardware'],
      ['Countertop Seal Check - Davis', 'Annual quartz countertop inspection and seam check', 'Warranty Service Call', 'Davis Residence', 'Allen+Roth Quartz Countertop', 'Annually', '2025-11-26', 'Store #0543 Dallas', 'Active', 'Check seams and undermount sink seal'],
      ['Window Annual Inspection - Williams', 'Annual window inspection for seal integrity and operation', 'Warranty Service Call', 'Williams Residence', 'Pella 250 Series Windows (8)', 'Annually', '2025-11-19', 'Store #0678 Brooklyn', 'Active', 'Check weatherstripping and hardware operation'],
      ['Washer/Dryer Annual Service - Kim', 'Annual appliance maintenance including lint trap deep clean and hose inspection', 'Warranty Service Call', 'Kim Residence', 'LG WM4000HWA / DLEX4000W Set', 'Annually', '2025-11-20', 'Store #1678 Los Angeles', 'Active', 'Clean lint trap, inspect hoses and vent'],
      ['Flooring Warranty Check - Martinez', 'Annual flooring inspection for warranty compliance', 'Warranty Service Call', 'Martinez Residence', 'Pergo TimberCraft Hardwood', 'Annually', '2025-12-02', 'Store #1502 Atlanta', 'Active', 'Check for gaps, buckling, or moisture damage'],
      ['Door Warranty Follow-Up - Chang', 'Quarterly check on warranty-replaced entry door for alignment', 'Warranty Service Call', 'Chang Residence', 'Reliabilt Entry Door (Warranty)', 'Quarterly', '2025-02-12', 'Store #0987 Phoenix', 'Active', 'Monitor door alignment after warranty fix'],
      ['LVP Flooring Check - Garcia', 'Annual flooring inspection for moisture and wear issues', 'Warranty Service Call', 'Garcia Residence', 'SmartCore Ultra LVP 600sqft', 'Annually', '2025-12-11', 'Store #1456 Detroit', 'Active', 'Check basement moisture levels and floor condition']
    ];
    for (const mp of maintenancePlans) {
      await client.query(
        `INSERT INTO maintenance_plans (title, description, work_type_name, account_name, asset_name, frequency, next_suggested_date, territory_name, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        mp
      );
    }

    // ─── SEED SCHEDULING_POLICIES ──────────────────────────────────────
    console.log('Seeding scheduling_policies...');
    const schedulingPolicies = [
      ['Default Installation', 'Standard scheduling policy balancing travel time and installer skill matching for home improvement jobs', 'Standard', 'Enabled', 'Enabled', '50', 'Strong', '50', 'Allowed', 'false', 'Active'],
      ['Emergency Service', 'Policy for urgent installation issues like broken water heaters, HVAC failures, or warranty emergencies', 'Emergency', 'Disabled', 'Required', '100', 'Flexible', '100', 'Required', 'true', 'Active'],
      ['Travel Minimization', 'Optimizes installer routes to minimize drive time between residential job sites', 'Optimization', 'Strict', 'Enabled', '30', 'Strong', '25', 'Preferred', 'false', 'Active'],
      ['Skill-First Assignment', 'Prioritizes installer skill match quality over travel time for specialized installations', 'Assignment', 'Relaxed', 'Strict', '70', 'Moderate', '75', 'Allowed', 'false', 'Active'],
      ['Same-Day Install', 'Policy for same-day appliance delivery and installation requests', 'Urgent', 'Enabled', 'Enabled', '80', 'Flexible', '60', 'Required', 'true', 'Active'],
      ['Weekend Coverage', 'Scheduling rules for Saturday installation appointments and emergency callbacks', 'Weekend', 'Enabled', 'Enabled', '60', 'Strong', '40', 'Allowed', 'true', 'Active'],
      ['Preventive Maintenance', 'Low-priority scheduling for annual warranty checks and maintenance visits', 'Maintenance', 'Strict', 'Enabled', '20', 'Strong', '50', 'Preferred', 'false', 'Active'],
      ['Premium Customer', 'Priority scheduling for high-value remodel projects ($10,000+) with dedicated installer assignment', 'Premium', 'Enabled', 'Required', '90', 'Flexible', '80', 'Allowed', 'true', 'Active'],
      ['Territory Balanced', 'Ensures equal workload distribution across store territory installers', 'Balancing', 'Enabled', 'Enabled', '40', 'Strict', '50', 'Preferred', 'false', 'Active'],
      ['New Installer', 'Reduced workload policy for new or training installation professionals', 'Training', 'Relaxed', 'Relaxed', '30', 'Moderate', '30', 'Preferred', 'false', 'Active'],
      ['Multi-Day Project', 'Policy for large installation projects spanning multiple days (roofing, remodels, decks)', 'Project', 'Enabled', 'Required', '50', 'Strong', '50', 'Preferred', 'false', 'Active'],
      ['Contractor Assignment', 'Policy for routing overflow work to independent installation contractors', 'Contractor', 'Disabled', 'Enabled', '40', 'Flexible', '100', 'Allowed', 'false', 'Active'],
      ['Crew Scheduling', 'Policy for scheduling multi-installer crew assignments on large projects', 'Crew', 'Enabled', 'Required', '60', 'Strong', '60', 'Required', 'false', 'Active'],
      ['After-Hours Callback', 'Policy for after-hours emergency callbacks with overtime authorization', 'Emergency', 'Disabled', 'Enabled', '100', 'Flexible', '100', 'Required', 'true', 'Active'],
      ['Seasonal Peak', 'Adjusted policy for spring/summer peak season with increased installation demand', 'Seasonal', 'Strict', 'Enabled', '70', 'Moderate', '40', 'Preferred', 'true', 'Active']
    ];
    for (const sp of schedulingPolicies) {
      await client.query(
        `INSERT INTO scheduling_policies (name, description, policy_type, travel_time_optimization, skill_matching, priority_weight, territory_preference, max_travel_distance, same_day_policy, emergency_override, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        sp
      );
    }

    // ─── PRINT COUNTS ──────────────────────────────────────────────────
    console.log('\n--- Seed Complete: Table Counts ---');
    const tables = [
      'users',
      'service_territories',
      'operating_hours',
      'service_resources',
      'skills',
      'service_resource_skills',
      'territory_members',
      'work_types',
      'work_orders',
      'work_order_line_items',
      'service_appointments',
      'resource_absences',
      'time_sheets',
      'time_sheet_entries',
      'shifts',
      'service_crews',
      'assets',
      'maintenance_plans',
      'scheduling_policies'
    ];
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`  ${table}: ${result.rows[0].count} rows`);
    }

  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
    console.log('\nPool closed. Seeding finished.');
  }
}

seed();
