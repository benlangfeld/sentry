# Generated by Django 5.0.2 on 2024-02-21 00:51

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models

import sentry.db.models.fields.bounded
import sentry.db.models.fields.foreignkey
import sentry.incidents.models.alert_rule
from sentry.new_migrations.migrations import CheckedMigration


class Migration(CheckedMigration):
    # This flag is used to mark that a migration shouldn't be automatically run in production. For
    # the most part, this should only be used for operations where it's safe to run the migration
    # after your code has deployed. So this should not be used for most operations that alter the
    # schema of a table.
    # Here are some things that make sense to mark as dangerous:
    # - Large data migrations. Typically we want these to be run manually by ops so that they can
    #   be monitored and not block the deploy for a long period of time while they run.
    # - Adding indexes to large tables. Since this can take a long time, we'd generally prefer to
    #   have ops run this and not block the deploy. Note that while adding an index is a schema
    #   change, it's completely safe to run the operation after the code has deployed.
    is_dangerous = False

    dependencies = [
        ("sentry", "0650_create_sentryshot"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    """
                    ALTER TABLE "sentry_alertrule" ADD COLUMN "monitor_type" integer NOT NULL DEFAULT 0;
                    """,
                    reverse_sql="""
                    ALTER TABLE "sentry_alertrule" DROP COLUMN "monitor_type";
                    """,
                    hints={"tables": ["sentry_alertrule"]},
                )
            ],
            state_operations=[
                migrations.AddField(
                    model_name="alertrule",
                    name="monitor_type",
                    field=models.IntegerField(
                        default=sentry.incidents.models.alert_rule.AlertRuleMonitorType.CONTINUOUS.value
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="querysubscription",
            name="query_extra",
            field=models.TextField(null=True),
        ),
        migrations.CreateModel(
            name="AlertRuleProjects",
            fields=[
                (
                    "id",
                    sentry.db.models.fields.bounded.BoundedBigAutoField(
                        primary_key=True, serialize=False
                    ),
                ),
                ("date_added", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "alert_rule",
                    sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                        db_index=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="sentry.alertrule",
                    ),
                ),
                (
                    "project",
                    sentry.db.models.fields.foreignkey.FlexibleForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="sentry.project"
                    ),
                ),
            ],
            options={
                "db_table": "sentry_alertruleprojects",
                "unique_together": {("alert_rule", "project")},
            },
        ),
        migrations.AddField(
            model_name="alertrule",
            name="projects",
            field=models.ManyToManyField(
                related_name="alert_rule_projects",
                through="sentry.AlertRuleProjects",
                to="sentry.project",
            ),
        ),
    ]
