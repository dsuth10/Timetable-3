"""Rename qualifications to details in teacher_aides

Revision ID: 004_rename_qualifications_to_details
Revises: 003_add_relief_pool_support
Create Date: 2025-12-08

Renames the qualifications column to details in the teacher_aides table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_rename_qualifications_to_details'
down_revision: Union[str, None] = '003_add_relief_pool_support'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite 3.25.0+ supports RENAME COLUMN
    op.execute('ALTER TABLE teacher_aides RENAME COLUMN qualifications TO details')


def downgrade() -> None:
    # Rename back to qualifications
    op.execute('ALTER TABLE teacher_aides RENAME COLUMN details TO qualifications')

