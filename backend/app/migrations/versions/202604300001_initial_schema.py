"""initial schema

Revision ID: 202604300001
Revises:
Create Date: 2026-04-30 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "202604300001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), sa.Identity(always=False), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("reputation", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "celestial_objects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("texture_path", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["parent_id"], ["celestial_objects.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_celestial_objects_slug"), "celestial_objects", ["slug"], unique=True)

    op.create_table(
        "astro_shots",
        sa.Column("id", sa.Integer(), sa.Identity(always=False), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("author_name", sa.String(length=120), nullable=False),
        sa.Column("object_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("image_url", sa.String(length=255), nullable=False),
        sa.Column("base_likes_count", sa.Integer(), nullable=False),
        sa.Column("telescope", sa.String(length=120), nullable=False),
        sa.Column("camera", sa.String(length=120), nullable=False),
        sa.Column("coordinates", sa.String(length=120), nullable=False),
        sa.Column("location", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["object_id"], ["celestial_objects.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_astro_shots_object_id", "astro_shots", ["object_id"])
    op.create_index("ix_astro_shots_created_at", "astro_shots", ["created_at"])

    op.create_table(
        "shot_likes",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("shot_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["shot_id"], ["astro_shots.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "shot_id"),
    )


def downgrade() -> None:
    op.drop_table("shot_likes")
    op.drop_index("ix_astro_shots_created_at", table_name="astro_shots")
    op.drop_index("ix_astro_shots_object_id", table_name="astro_shots")
    op.drop_table("astro_shots")
    op.drop_index(op.f("ix_celestial_objects_slug"), table_name="celestial_objects")
    op.drop_table("celestial_objects")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
