"""Initial schema with all tables

Revision ID: 001
Revises: 
Create Date: 2025-10-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create teacher_aides table
    op.create_table(
        'teacher_aides',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('qualifications', sa.Text(), nullable=True),
        sa.Column('colour_hex', sa.String(length=7), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_teacher_aides_name', 'teacher_aides', ['name'])

    # Create availability table
    op.create_table(
        'availability',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('aide_id', sa.Integer(), nullable=False),
        sa.Column('weekday', sa.String(length=2), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.ForeignKeyConstraint(['aide_id'], ['teacher_aides.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('aide_id', 'weekday', 'start_time', name='uix_aide_weekday_time')
    )
    op.create_index('ix_availability_aide_weekday', 'availability', ['aide_id', 'weekday'])

    # Create classrooms table
    op.create_table(
        'classrooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create tasks table
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('category', sa.String(length=20), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('recurrence_rule', sa.Text(), nullable=True),
        sa.Column('expires_on', sa.Date(), nullable=True),
        sa.Column('classroom_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='UNASSIGNED'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tasks_category', 'tasks', ['category'])
    op.create_index('ix_tasks_status', 'tasks', ['status'])

    # Create assignments table
    op.create_table(
        'assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('aide_id', sa.Integer(), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='UNASSIGNED'),
        sa.Column('version', sa.Integer(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['aide_id'], ['teacher_aides.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_assignments_collision', 'assignments', ['aide_id', 'date', 'start_time'])
    op.create_index('ix_assignments_task', 'assignments', ['task_id'])
    op.create_index('ix_assignments_date', 'assignments', ['date'])

    # Create absences table
    op.create_table(
        'absences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('aide_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['aide_id'], ['teacher_aides.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('aide_id', 'date', name='uix_aide_date')
    )
    op.create_index('ix_absences_date', 'absences', ['date'])

    # Create requests table
    op.create_table(
        'requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('requesting_teacher', sa.String(length=100), nullable=False),
        sa.Column('task_title', sa.String(length=200), nullable=False),
        sa.Column('task_category', sa.String(length=20), nullable=False),
        sa.Column('preferred_date', sa.Date(), nullable=False),
        sa.Column('preferred_time', sa.Time(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_requests_status', 'requests', ['status'])
    op.create_index('ix_requests_created', 'requests', ['created_at'])


def downgrade() -> None:
    op.drop_table('requests')
    op.drop_table('absences')
    op.drop_table('assignments')
    op.drop_table('tasks')
    op.drop_table('classrooms')
    op.drop_table('availability')
    op.drop_table('teacher_aides')

