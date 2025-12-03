"""Add Relief Pool support to Assignment model

Revision ID: 003_add_relief_pool_support
Revises: a1b2c3d4e5f6
Create Date: 2025-12-03

Adds:
- original_aide_id column to store the original aide when task enters Relief Pool
- Index for efficient Relief Pool queries
- Index for restoration queries
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_relief_pool_support'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('assignments', schema=None) as batch_op:
        # Add original_aide_id column to track original aide when task enters Relief Pool
        batch_op.add_column(sa.Column(
            'original_aide_id',
            sa.Integer(),
            nullable=True
        ))
        
        # Add foreign key constraint
        batch_op.create_foreign_key(
            'fk_assignments_original_aide_id',
            'teacher_aides',
            ['original_aide_id'],
            ['id'],
            ondelete='SET NULL'
        )
    
    # Add index for efficient Relief Pool queries (status + date)
    op.create_index(
        'idx_assignments_relief_pool',
        'assignments',
        ['status', 'date']
    )
    
    # Add index for restoration queries (original_aide_id)
    op.create_index(
        'idx_assignments_original_aide',
        'assignments',
        ['original_aide_id']
    )


def downgrade():
    # Drop indexes first
    op.drop_index('idx_assignments_original_aide', 'assignments')
    op.drop_index('idx_assignments_relief_pool', 'assignments')
    
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('assignments', schema=None) as batch_op:
        # Drop foreign key constraint
        batch_op.drop_constraint('fk_assignments_original_aide_id', type_='foreignkey')
        
        # Drop column
        batch_op.drop_column('original_aide_id')
