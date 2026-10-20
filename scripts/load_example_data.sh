#!/bin/bash
set -euo pipefail

ADDONS=/usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons
DB=odoo-db

echo "Starting Odoo containers..."
sudo docker start odoo-db odoo-server >/dev/null
sleep 4

echo "Loading example clinic and HQ records into ${DB}..."
sudo docker exec -i odoo-server odoo shell \
  -d "$DB" \
  --db_host=odoo-db --db_user=odoo --db_password=odoo \
  --addons-path="$ADDONS" \
  --no-http <<'PY'
from datetime import datetime

icp = env['ir.config_parameter'].sudo()
if not icp.get_param('taha_epidemiology_sync.api_url'):
    icp.set_param('taha_epidemiology_sync.api_url', 'http://127.0.0.1:8069')
if not icp.get_param('taha_epidemiology_sync.api_token'):
    icp.set_param('taha_epidemiology_sync.api_token', 'taha-clinic-token-1')
if not icp.get_param('taha_epidemiology_sync.hmac_secret'):
    icp.set_param('taha_epidemiology_sync.hmac_secret', 'taha-hmac-secret-1')
if not icp.get_param('taha_epidemiology_sync.facility_code'):
    icp.set_param('taha_epidemiology_sync.facility_code', 'CLN-KRT-001')
icp.set_param('taha_epidemiology_sync.sync_enabled', 'True')
if not icp.get_param('taha_epidemiology_dashboard.api_token'):
    icp.set_param('taha_epidemiology_dashboard.api_token', 'taha-clinic-token-1')
if not icp.get_param('taha_epidemiology_dashboard.hmac_secret'):
    icp.set_param('taha_epidemiology_dashboard.hmac_secret', 'taha-hmac-secret-1')

created_patients = 0
created_dx = 0
if 'taha.clinical.patient' in env:
    Patient = env['taha.clinical.patient']
    Diagnosis = env['taha.clinical.diagnosis']
    samples = [
        {'name': 'Ahmed Hassan', 'phone': '+249911000001', 'national_id': 'DEMO-1001', 'street': 'Al Amarat St 15', 'date_of_birth': '1985-03-12', 'occupation': 'Farmer', 'city': 'Khartoum', 'district': 'Khartoum', 'region': 'Khartoum', 'code': 'B50', 'disease': 'Malaria', 'when': '2026-10-18 08:15:00'},
        {'name': 'Fatima Ali', 'phone': '+249911000002', 'national_id': 'DEMO-1002', 'date_of_birth': '1992-07-21', 'occupation': 'Teacher', 'city': 'Omdurman', 'district': 'Karari', 'region': 'Khartoum', 'code': 'A00', 'disease': 'Cholera', 'when': '2026-10-18 11:40:00'},
        {'name': 'Mohamed Osman', 'phone': '+249911000003', 'national_id': 'DEMO-1003', 'date_of_birth': '2018-01-05', 'occupation': 'Child', 'city': 'Wad Madani', 'district': 'Greater Wad Madani', 'region': 'Gezira', 'code': 'B05', 'disease': 'Measles', 'when': '2026-10-19 09:05:00'},
        {'name': 'Amina Ibrahim', 'phone': '+249911000004', 'national_id': 'DEMO-1004', 'date_of_birth': '1978-11-30', 'occupation': 'Trader', 'city': 'Port Sudan', 'district': 'Port Sudan', 'region': 'Red Sea', 'code': 'A01', 'disease': 'Typhoid fever', 'when': '2026-10-19 14:20:00'},
        {'name': 'Khalid Musa', 'phone': '+249911000005', 'national_id': 'DEMO-1005', 'date_of_birth': '1960-04-18', 'occupation': 'Driver', 'city': 'Khartoum', 'district': 'East Nile', 'region': 'Khartoum', 'code': 'B50', 'disease': 'Malaria', 'when': '2026-10-20 07:50:00'},
        {'name': 'Sara Abdelrahman', 'phone': '+249911000006', 'national_id': 'DEMO-1006', 'date_of_birth': '1999-09-09', 'occupation': 'Student', 'city': 'Bahri', 'district': 'Khartoum Bahri', 'region': 'Khartoum', 'code': 'J11', 'disease': 'Influenza', 'when': '2026-10-20 10:10:00'},
        {'name': 'Hassan Salih', 'phone': '+249911000007', 'national_id': 'DEMO-1007', 'date_of_birth': '2015-06-02', 'occupation': 'Child', 'city': 'El-Obeid', 'district': 'Sheikan', 'region': 'North Kordofan', 'code': 'B05', 'disease': 'Measles', 'when': '2026-10-20 12:30:00'},
        {'name': 'Nour Eldein', 'phone': '+249911000008', 'national_id': 'DEMO-1008', 'date_of_birth': '1988-12-14', 'occupation': 'Nurse', 'city': 'Kassala', 'district': 'Kassala', 'region': 'Kassala', 'code': 'A90', 'disease': 'Dengue fever', 'when': '2026-10-20 13:45:00'},
    ]
    for row in samples:
        patient = Patient.search([('national_id', '=', row['national_id'])], limit=1)
        if not patient:
            patient = Patient.create({
                'name': row['name'],
                'phone': row.get('phone'),
                'national_id': row['national_id'],
                'street': row.get('street'),
                'date_of_birth': row['date_of_birth'],
                'occupation': row['occupation'],
                'city': row['city'],
                'district': row['district'],
                'region': row['region'],
            })
            created_patients += 1
        if not Diagnosis.search([('patient_id', '=', patient.id), ('diagnosis_code', '=', row['code'])], limit=1):
            Diagnosis.create({
                'patient_id': patient.id,
                'diagnosis_code': row['code'],
                'diagnosis_name': row['disease'],
                'clinical_notes': 'Demo record. Local notes stay in the clinic.',
                'diagnosed_at': datetime.strptime(row['when'], '%Y-%m-%d %H:%M:%S'),
            })
            created_dx += 1
    print('Clinic patients created:', created_patients, '| diagnoses created:', created_dx)
    print('Clinic patients total:', Patient.search_count([]), '| diagnoses total:', Diagnosis.search_count([]))
else:
    print('Taha Clinic models not loaded. Upgrade Taha Clinic first.')

if 'taha.clinic.doctor' in env and not env['taha.clinic.doctor'].search([], limit=1):
    Dept = env['taha.clinic.department']
    general = Dept.search([('code', '=', 'GM')], limit=1)
    env['taha.clinic.doctor'].create({
        'name': 'Dr. Lina Osman',
        'department_id': general.id if general else False,
        'specialty': 'General medicine',
        'consultation_fee': 50.0,
    })
    print('Created example doctor')

hq_created = 0
if 'taha.epidemiology.report' in env:
    Report = env['taha.epidemiology.report']
    hq_rows = [
        {'event_id': 'demo-hq-001', 'diagnosis_code': 'B50', 'diagnosis_name': 'Malaria', 'age_bracket': '40-49', 'occupation': 'Farmer', 'city': 'Khartoum', 'district': 'Khartoum', 'region': 'Khartoum', 'diagnosed_at': '2026-10-18 08:15:00'},
        {'event_id': 'demo-hq-002', 'diagnosis_code': 'A00', 'diagnosis_name': 'Cholera', 'age_bracket': '30-39', 'occupation': 'Teacher', 'city': 'Omdurman', 'district': 'Karari', 'region': 'Khartoum', 'diagnosed_at': '2026-10-18 11:40:00'},
        {'event_id': 'demo-hq-003', 'diagnosis_code': 'B05', 'diagnosis_name': 'Measles', 'age_bracket': '0-9', 'occupation': 'Child', 'city': 'Wad Madani', 'district': 'Greater Wad Madani', 'region': 'Gezira', 'diagnosed_at': '2026-10-19 09:05:00'},
        {'event_id': 'demo-hq-004', 'diagnosis_code': 'A01', 'diagnosis_name': 'Typhoid fever', 'age_bracket': '40-49', 'occupation': 'Trader', 'city': 'Port Sudan', 'district': 'Port Sudan', 'region': 'Red Sea', 'diagnosed_at': '2026-10-19 14:20:00'},
        {'event_id': 'demo-hq-005', 'diagnosis_code': 'B50', 'diagnosis_name': 'Malaria', 'age_bracket': '60-69', 'occupation': 'Driver', 'city': 'Khartoum', 'district': 'East Nile', 'region': 'Khartoum', 'diagnosed_at': '2026-10-20 07:50:00'},
        {'event_id': 'demo-hq-006', 'diagnosis_code': 'J11', 'diagnosis_name': 'Influenza', 'age_bracket': '20-29', 'occupation': 'Student', 'city': 'Bahri', 'district': 'Khartoum Bahri', 'region': 'Khartoum', 'diagnosed_at': '2026-10-20 10:10:00'},
        {'event_id': 'demo-hq-007', 'diagnosis_code': 'B05', 'diagnosis_name': 'Measles', 'age_bracket': '10-19', 'occupation': 'Child', 'city': 'El-Obeid', 'district': 'Sheikan', 'region': 'North Kordofan', 'diagnosed_at': '2026-10-20 12:30:00'},
        {'event_id': 'demo-hq-008', 'diagnosis_code': 'A90', 'diagnosis_name': 'Dengue fever', 'age_bracket': '30-39', 'occupation': 'Nurse', 'city': 'Kassala', 'district': 'Kassala', 'region': 'Kassala', 'diagnosed_at': '2026-10-20 13:45:00'},
    ]
    for row in hq_rows:
        if Report.search([('event_id', '=', row['event_id'])], limit=1):
            continue
        Report.create({
            'event_id': row['event_id'],
            'facility_code': 'CLN-KRT-001',
            'diagnosis_code': row['diagnosis_code'],
            'diagnosis_name': row['diagnosis_name'],
            'age_bracket': row['age_bracket'],
            'occupation': row['occupation'],
            'city': row['city'],
            'district': row['district'],
            'region': row['region'],
            'diagnosed_at': datetime.strptime(row['diagnosed_at'], '%Y-%m-%d %H:%M:%S'),
            'case_count': 1,
        })
        hq_created += 1
    print('HQ reports created:', hq_created, '| HQ reports total:', Report.search_count([]))
else:
    print('Taha HQ Epidemiology is not installed.')

if 'taha.epi.sync.queue' in env:
    env['taha.epi.sync.queue'].cron_flush_queue()
    pending = env['taha.epi.sync.queue'].search_count([('status', 'in', ['pending', 'failed'])])
    synced = env['taha.epi.sync.queue'].search_count([('status', '=', 'synced')])
    print('Sync queue pending/failed:', pending, '| synced:', synced)

env.cr.commit()
print('Done.')
PY

echo
echo "Open http://127.0.0.1:8069"
echo "Taha Clinic → Patients / Diagnoses"
echo "Taha HQ Epidemiology → dashboard graphs (no patient names)"
