#!/bin/bash
set -euo pipefail

ADDONS=/usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons
DB=odoo-db

echo "Starting Odoo containers..."
sudo docker start odoo-db odoo-server >/dev/null
sleep 5

echo "Installing Taha Epidemiology Dashboard on database ${DB}..."
sudo docker exec -i odoo-server odoo shell \
  -d "$DB" \
  --db_host=odoo-db --db_user=odoo --db_password=odoo \
  --addons-path="$ADDONS" \
  --no-http <<'PY'
env['ir.module.module'].update_list()
for name in ('board', 'taha_epidemiology_dashboard'):
    mod = env['ir.module.module'].search([('name', '=', name)], limit=1)
    print(name, 'found' if mod else 'MISSING', mod.state if mod else '')
    if mod and mod.state != 'installed':
        mod.button_immediate_install()
        print('installed', name)

admin = env['res.users'].browse(2)
admin.password = 'admin'
print('HQ login:', admin.login, '/ password: admin')
env.cr.commit()
PY

echo
echo "Done. Open http://127.0.0.1:8069"
echo "Login: admin   Password: admin"
echo "Then open the app grid → Taha HQ Epidemiology"
