from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class CelestialObject(Base):
    __tablename__ = "celestial_objects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    type: Mapped[str] = mapped_column(String(40))
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("celestial_objects.id", ondelete="SET NULL"),
        nullable=True,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    texture_path: Mapped[str | None] = mapped_column(String(255), nullable=True)

    parent = relationship("CelestialObject", remote_side=[id], back_populates="children")
    children = relationship("CelestialObject", back_populates="parent")
    shots = relationship("AstroShot", back_populates="object")
