"""add shot image blob

Revision ID: 202604300002
Revises: 202604300001
Create Date: 2026-04-30 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "202604300002"
down_revision = "202604300001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("astro_shots", sa.Column("image_data", sa.LargeBinary(), nullable=True))
    op.add_column("astro_shots", sa.Column("image_content_type", sa.String(length=120), nullable=True))
    op.add_column("astro_shots", sa.Column("image_filename", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("astro_shots", "image_filename")
    op.drop_column("astro_shots", "image_content_type")
    op.drop_column("astro_shots", "image_data")
