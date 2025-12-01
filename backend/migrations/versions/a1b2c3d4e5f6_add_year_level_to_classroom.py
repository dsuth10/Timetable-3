"""Add year level to classroom

Revision ID: a1b2c3d4e5f6
Revises: 0bde43b85900
Create Date: 2025-11-30 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '0bde43b85900'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('classrooms', schema=None) as batch_op:
        batch_op.add_column(sa.Column('year_level', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('is_composite', sa.Boolean(), server_default='0', nullable=False))
        batch_op.add_column(sa.Column('composite_year_levels', sa.String(length=50), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('classrooms', schema=None) as batch_op:
        batch_op.drop_column('composite_year_levels')
        batch_op.drop_column('is_composite')
        batch_op.drop_column('year_level')



