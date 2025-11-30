"""Add room_number and teacher to classroom

Revision ID: 94b76986b798
Revises: 002
Create Date: 2025-11-30 13:43:53.826841

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '94b76986b798'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands manually adjusted ###
    op.add_column('classrooms', sa.Column('room_number', sa.String(length=20), nullable=True))
    op.add_column('classrooms', sa.Column('teacher', sa.String(length=100), nullable=True))
    
    # Populate existing rows with defaults to satisfy non-null constraint
    op.execute("UPDATE classrooms SET room_number = 'TBD' WHERE room_number IS NULL")
    op.execute("UPDATE classrooms SET teacher = 'Unassigned' WHERE teacher IS NULL")
    
    # Make them not nullable using batch_alter_table for SQLite support
    with op.batch_alter_table('classrooms') as batch_op:
        batch_op.alter_column('room_number', existing_type=sa.String(length=20), nullable=False)
        batch_op.alter_column('teacher', existing_type=sa.String(length=100), nullable=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands manually adjusted ###
    with op.batch_alter_table('classrooms') as batch_op:
        batch_op.drop_column('teacher')
        batch_op.drop_column('room_number')
    # ### end Alembic commands ###
