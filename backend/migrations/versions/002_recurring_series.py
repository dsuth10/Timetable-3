"""Add recurring_series table and migrate existing recurring tasks

Revision ID: 002
Revises: 001
Create Date: 2025-11-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer, Text, Time, Date, DateTime

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create recurring_series table
    op.create_table(
        'recurring_series',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('aide_id', sa.Integer(), nullable=True),
        sa.Column('recurrence_rule', sa.Text(), nullable=False),
        sa.Column('expires_on', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('base_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['aide_id'], ['teacher_aides.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_recurring_series_task', 'recurring_series', ['task_id'])
    op.create_index('idx_recurring_series_aide', 'recurring_series', ['aide_id'])
    
    # Add recurring_series_id column to assignments table
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('assignments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('recurring_series_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_assignments_recurring_series',
            'recurring_series',
            ['recurring_series_id'], ['id'],
            ondelete='CASCADE'
        )
        batch_op.create_index('idx_assignments_recurring_series', ['recurring_series_id'])
    
    # Data Migration: Migrate existing recurring tasks
    # This is done in pure SQL to avoid dependency on ORM model changes
    
    # Get connection
    conn = op.get_bind()
    
    # Find all tasks with recurrence_rule set
    result = conn.execute(sa.text("""
        SELECT id, recurrence_rule, expires_on, start_time, end_time
        FROM tasks 
        WHERE recurrence_rule IS NOT NULL
    """))
    
    recurring_tasks = result.fetchall()
    
    # For each recurring task, group its assignments by aide_id
    for task_row in recurring_tasks:
        task_id = task_row[0]
        recurrence_rule = task_row[1]
        expires_on = task_row[2]
        start_time = task_row[3]
        end_time = task_row[4]
        
        # Find all assignments for this task, grouped by aide_id
        assignments_result = conn.execute(sa.text("""
            SELECT aide_id, MIN(date) as min_date, start_time, end_time
            FROM assignments 
            WHERE task_id = :task_id
            GROUP BY aide_id, start_time, end_time
            ORDER BY aide_id
        """), {'task_id': task_id})
        
        aide_groups = assignments_result.fetchall()
        
        # Create a recurring_series for each aide group
        for aide_group in aide_groups:
            aide_id = aide_group[0]
            base_date = aide_group[1]
            assignment_start_time = aide_group[2]
            assignment_end_time = aide_group[3]
            
            # Insert recurring_series
            series_result = conn.execute(sa.text("""
                INSERT INTO recurring_series 
                (task_id, aide_id, recurrence_rule, expires_on, start_time, end_time, base_date, created_at, updated_at)
                VALUES (:task_id, :aide_id, :recurrence_rule, :expires_on, :start_time, :end_time, :base_date, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """), {
                'task_id': task_id,
                'aide_id': aide_id,
                'recurrence_rule': recurrence_rule,
                'expires_on': expires_on,
                'start_time': assignment_start_time,
                'end_time': assignment_end_time,
                'base_date': base_date
            })
            
            # Get the series_id (last insert rowid)
            series_id = series_result.lastrowid
            
            # Update all assignments for this task/aide combination to link to the series
            conn.execute(sa.text("""
                UPDATE assignments 
                SET recurring_series_id = :series_id 
                WHERE task_id = :task_id 
                AND (aide_id = :aide_id OR (aide_id IS NULL AND :aide_id IS NULL))
                AND start_time = :start_time
                AND end_time = :end_time
            """), {
                'series_id': series_id,
                'task_id': task_id,
                'aide_id': aide_id,
                'start_time': assignment_start_time,
                'end_time': assignment_end_time
            })
    
    # Remove recurrence_rule and expires_on columns from tasks table
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.drop_column('expires_on')
        batch_op.drop_column('recurrence_rule')


def downgrade() -> None:
    # Re-add columns to tasks table
    op.add_column('tasks', sa.Column('recurrence_rule', sa.Text(), nullable=True))
    op.add_column('tasks', sa.Column('expires_on', sa.Date(), nullable=True))
    
    # Migrate data back: For each recurring_series, update the task with its recurrence settings
    # Note: This will only preserve one series per task (the first one found)
    conn = op.get_bind()
    
    result = conn.execute(sa.text("""
        SELECT DISTINCT task_id, recurrence_rule, expires_on
        FROM recurring_series
    """))
    
    series_data = result.fetchall()
    
    for row in series_data:
        task_id = row[0]
        recurrence_rule = row[1]
        expires_on = row[2]
        
        conn.execute(sa.text("""
            UPDATE tasks 
            SET recurrence_rule = :recurrence_rule, expires_on = :expires_on
            WHERE id = :task_id
        """), {
            'task_id': task_id,
            'recurrence_rule': recurrence_rule,
            'expires_on': expires_on
        })
    
    # Drop foreign key and index on assignments
    with op.batch_alter_table('assignments', schema=None) as batch_op:
        batch_op.drop_index('idx_assignments_recurring_series')
        batch_op.drop_constraint('fk_assignments_recurring_series', type_='foreignkey')
        batch_op.drop_column('recurring_series_id')
    
    # Drop recurring_series table
    op.drop_index('idx_recurring_series_aide', table_name='recurring_series')
    op.drop_index('idx_recurring_series_task', table_name='recurring_series')
    op.drop_table('recurring_series')

