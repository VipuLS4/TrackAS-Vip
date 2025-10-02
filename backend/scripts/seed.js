import { query } from '../db.js';
import { hashPassword } from '../utils/auth.js';

(async () => {
  try {
    // Hash passwords
    const adminPassword = await hashPassword('admin123');
    const companyPassword = await hashPassword('company123');
    const driverPassword = await hashPassword('driver123');
    
    // Create admin user
    await query(`
      INSERT INTO users(id,email,password,role) 
      VALUES('00000000-0000-0000-0000-000000000001','admin@trackas.local',$1,'ADMIN') 
      ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password
    `, [adminPassword]);
    
    // Create company user
    await query(`
      INSERT INTO users(id,email,password,role) 
      VALUES('00000000-0000-0000-0000-000000000002','company1@trackas.local',$1,'COMPANY') 
      ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password
    `, [companyPassword]);
    
    // Create company
    await query(`
      INSERT INTO companies(user_id,name,email,address,status,tin,bank_account_number,bank_ifsc,bank_name,account_holder) 
      VALUES ('00000000-0000-0000-0000-000000000002','FastMove Logistics','company1@trackas.local','Delhi Warehouse','APPROVED','TIN123456789','1234567890123456','HDFC0001234','HDFC Bank','FastMove Logistics') 
      ON CONFLICT (user_id) DO NOTHING
    `);
    
    // Create driver user
    await query(`
      INSERT INTO users(id,email,password,role) 
      VALUES('00000000-0000-0000-0000-000000000003','driver1@trackas.local',$1,'OPERATOR') 
      ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password
    `, [driverPassword]);
    
    // Create operator
    await query(`
      INSERT INTO operators(user_id,name,license_no,online,status,mobile,bank_account_number,bank_ifsc,bank_name,account_holder) 
      VALUES ('00000000-0000-0000-0000-000000000003','Arjun Kumar','DL-XXXX-1234',false,'APPROVED','9899999999','9876543210987654','SBI0009876','State Bank of India','Arjun Kumar') 
      ON CONFLICT (user_id) DO NOTHING
    `);
    
    // Create vehicle
    await query(`
      INSERT INTO vehicles(id,company_id,type,reg_no,capacity_weight,capacity_volume,status,vcode) 
      SELECT gen_random_uuid(), id, 'Truck', 'DL01AB1234', 5000, 20, 'APPROVED', 'VCODE-TRK123' 
      FROM companies WHERE email='company1@trackas.local' LIMIT 1
      ON CONFLICT (reg_no) DO NOTHING
    `);
    
    // Create sample shipment
    const sres = await query(`
      INSERT INTO shipments(company_id,pickup,destination,length,width,height,weight,instructions,customer_name,customer_phone,customer_email,cost,commission_amount,status) 
      SELECT id,'Delhi Warehouse','Mumbai Store',2,1,1,300,'Fragile','Rahul Mehta','98xxxxxx','rahul@gmail.com',5000,250,'CREATED' 
      FROM companies WHERE email='company1@trackas.local' 
      RETURNING id
    `);
    
    // Create app settings
    await query(`
      INSERT INTO app_settings(key,value) VALUES('commission_pct','5') 
      ON CONFLICT (key) DO NOTHING
    `);
    
    // Create payout
    await query(`
      INSERT INTO payouts(shipment_id,operator_id,amount,status) 
      SELECT id, (SELECT id FROM operators LIMIT 1), cost, 'PENDING' 
      FROM shipments LIMIT 1
    `);
    
    console.log('Seed completed successfully');
    console.log('Sample shipment ID:', sres.rows[0]?.id);
    console.log('Test credentials:');
    console.log('Admin: admin@trackas.local / admin123');
    console.log('Company: company1@trackas.local / company123');
    console.log('Driver: driver1@trackas.local / driver123');
    process.exit(0);
  } catch(e) { 
    console.error('Seed error:', e); 
    process.exit(1); 
  }
})();
