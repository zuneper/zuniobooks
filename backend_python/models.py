import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user") # 'admin' or 'user'
    created_at = Column(DateTime, default=datetime.utcnow)

class Book(Base):
    __tablename__ = "books"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    narrator = Column(String, default="Unknown Narrator")
    genre = Column(String, default="Audiobook")
    description = Column(Text, default="")
    cover_url = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    episodes = relationship("Episode", back_populates="book", cascade="all, delete-orphan")

class Episode(Base):
    __tablename__ = "episodes"

    id = Column(String, primary_key=True, default=generate_uuid)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    audio_url = Column(String, nullable=False)
    duration_seconds = Column(Float, default=300.0)
    track_number = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    book = relationship("Book", back_populates="episodes")

class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserProgress(Base):
    __tablename__ = "user_progress"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    episode_id = Column(String, ForeignKey("episodes.id", ondelete="CASCADE"), primary_key=True)
    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"))
    position_seconds = Column(Float, default=0.0)
    duration_seconds = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)
    last_played_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
