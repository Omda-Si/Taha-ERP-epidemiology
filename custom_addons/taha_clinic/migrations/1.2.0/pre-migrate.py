"""Move epidemiology models from taha_epidemiology_sync into taha_clinic.

Do not drop taha.clinical.* / taha.epi.sync.queue tables. A normal Odoo
uninstall of the old module would delete patient data.
"""

TAKEOVER_XMLIDS = (
    "view_taha_clinical_patient_tree",
    "view_taha_clinical_patient_form",
    "view_taha_clinical_patient_search",
    "action_taha_clinical_patient",
    "view_taha_clinical_diagnosis_tree",
    "view_taha_clinical_diagnosis_form",
    "view_taha_clinical_diagnosis_search",
    "action_taha_clinical_diagnosis",
    "view_taha_epi_sync_queue_tree",
    "view_taha_epi_sync_queue_form",
    "view_taha_epi_sync_queue_search",
    "action_taha_epi_sync_queue",
    "ir_cron_taha_epi_flush_queue",
    "access_taha_clinical_patient_manager",
    "access_taha_clinical_diagnosis_manager",
    "access_taha_epi_sync_queue_manager",
)

META_MODELS = (
    "ir.model",
    "ir.model.fields",
    "ir.model.constraint",
    "ir.model.relation",
)


def _ids(rows, model):
    return tuple(res_id for _id, _name, row_model, res_id in rows if row_model == model and res_id)


def _table_exists(cr, table):
    cr.execute(
        """
        SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = %s
        """,
        (table,),
    )
    return bool(cr.fetchone())


def _delete_in(cr, table, column, ids):
    if ids and _table_exists(cr, table):
        cr.execute("DELETE FROM %s WHERE %s IN %%s" % (table, column), (ids,))


def migrate(cr, version):
    cr.execute(
        """
        SELECT 1 FROM ir_module_module
         WHERE name = 'taha_epidemiology_sync'
           AND state IN ('installed', 'to upgrade', 'to remove')
        """
    )
    if not cr.fetchone():
        return

    cr.execute(
        """
        UPDATE ir_model_data
           SET module = 'taha_clinic'
         WHERE module = 'taha_epidemiology_sync'
           AND name IN %s
           AND NOT EXISTS (
                SELECT 1 FROM ir_model_data existing
                 WHERE existing.module = 'taha_clinic'
                   AND existing.name = ir_model_data.name
           )
        """,
        (TAKEOVER_XMLIDS,),
    )

    cr.execute(
        """
        UPDATE ir_model_data
           SET module = 'taha_clinic'
         WHERE module = 'taha_epidemiology_sync'
           AND model IN %s
           AND NOT EXISTS (
                SELECT 1 FROM ir_model_data existing
                 WHERE existing.module = 'taha_clinic'
                   AND existing.name = ir_model_data.name
           )
        """,
        (META_MODELS,),
    )

    cr.execute(
        """
        SELECT id, name, model, res_id
          FROM ir_model_data
         WHERE module = 'taha_epidemiology_sync'
         ORDER BY id
        """
    )
    leftovers = cr.fetchall()

    menu_ids = _ids(leftovers, "ir.ui.menu")
    action_ids = _ids(leftovers, "ir.actions.act_window")
    view_ids = _ids(leftovers, "ir.ui.view")
    access_ids = _ids(leftovers, "ir.model.access")
    group_ids = _ids(leftovers, "res.groups")
    category_ids = _ids(leftovers, "ir.module.category")
    rule_ids = _ids(leftovers, "ir.rule")

    _delete_in(cr, "ir_model_access", "id", access_ids)
    _delete_in(cr, "ir_model_access", "group_id", group_ids)
    _delete_in(cr, "res_groups_users_rel", "gid", group_ids)
    if group_ids and _table_exists(cr, "res_groups_implied_rel"):
        cr.execute(
            "DELETE FROM res_groups_implied_rel WHERE gid IN %s OR hid IN %s",
            (group_ids, group_ids),
        )
    _delete_in(cr, "ir_ui_menu_group_rel", "menu_id", menu_ids)
    if menu_ids:
        cr.execute("UPDATE ir_ui_menu SET parent_id = NULL WHERE id IN %s", (menu_ids,))
        cr.execute("DELETE FROM ir_ui_menu WHERE id IN %s", (menu_ids,))
    _delete_in(cr, "ir_act_window_view", "act_window_id", action_ids)
    _delete_in(cr, "ir_act_window_group_rel", "act_id", action_ids)
    if action_ids:
        cr.execute("DELETE FROM ir_act_window WHERE id IN %s", (action_ids,))
    if view_ids:
        cr.execute("UPDATE ir_ui_view SET inherit_id = NULL WHERE inherit_id IN %s", (view_ids,))
        cr.execute("DELETE FROM ir_ui_view WHERE id IN %s", (view_ids,))
    _delete_in(cr, "ir_rule_group_rel", "rule_group_id", rule_ids)
    _delete_in(cr, "ir_rule", "id", rule_ids)
    _delete_in(cr, "res_groups", "id", group_ids)
    _delete_in(cr, "ir_module_category", "id", category_ids)

    cr.execute("DELETE FROM ir_model_data WHERE module = 'taha_epidemiology_sync'")

    cr.execute(
        """
        DELETE FROM ir_module_module_dependency
         WHERE name = 'taha_epidemiology_sync'
            OR module_id IN (
                SELECT id FROM ir_module_module WHERE name = 'taha_epidemiology_sync'
            )
        """
    )
    cr.execute(
        """
        UPDATE ir_module_module
           SET state = 'uninstalled'
         WHERE name = 'taha_epidemiology_sync'
        """
    )
