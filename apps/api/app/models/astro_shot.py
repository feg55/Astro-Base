from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AstroShot(Base):
    __tablename__ = "astro_shots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(180))
    author_name: Mapped[str] = mapped_column(String(120))
    object_id: Mapped[int] = mapped_column(ForeignKey("celestial_objects.id", ondelete="RESTRICT"))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    image_url: Mapped[str] = mapped_column(String(255))
    image_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True, deferred=True)
    image_content_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    image_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    base_likes_count: Mapped[int] = mapped_column(Integer, default=0)
    telescope: Mapped[str] = mapped_column(String(120))
    camera: Mapped[str] = mapped_column(String(120))
    coordinates: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    object = relationship("CelestialObject", back_populates="shots")
    user = relationship("User", back_populates="shots")
    likes = relationship("ShotLike", back_populates="shot", cascade="all, delete-orphan")
