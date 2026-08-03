import os
import shutil
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import engine, Base, get_db
from models import User, Book, Episode, Favorite, UserProgress
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    require_current_user,
    require_admin_user,
    seed_admin_user
)

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Seed admin account
db_session = next(get_db())
try:
    seed_admin_user(db_session)
finally:
    db_session.close()

app = FastAPI(title="Zuniobooks API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directories
UPLOADS_DIR = "uploads"
COVERS_DIR = os.path.join(UPLOADS_DIR, "covers")
AUDIO_DIR = os.path.join(UPLOADS_DIR, "audio")

os.makedirs(COVERS_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

app.mount("/uploads/covers", StaticFiles(directory=COVERS_DIR), name="covers")

# Audio Streaming with Byte Range support
@app.get("/uploads/audio/{filename}")
def stream_audio(filename: str, range_header: Optional[str] = Header(None, alias="Range")):
    file_path = os.path.join(AUDIO_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")

    file_size = os.path.getsize(file_path)
    
    if range_header:
        parts = range_header.replace("bytes=", "").split("-")
        start = int(parts[0])
        end = int(parts[1]) if parts[1] else file_size - 1
        chunk_size = end - start + 1

        def iterfile():
            with open(file_path, mode="rb") as f:
                f.seek(start)
                bytes_left = chunk_size
                while bytes_left > 0:
                    read_size = min(65536, bytes_left)
                    data = f.read(read_size)
                    if not data:
                        break
                    bytes_left -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(chunk_size),
            "Content-Type": "audio/mpeg",
        }
        return StreamingResponse(iterfile(), status_code=206, headers=headers)
    else:
        return FileResponse(file_path, media_type="audio/mpeg")

# Schemas
class RegisterSchema(BaseModel):
    username: str
    email: str
    password: str

class LoginSchema(BaseModel):
    username: str
    password: str

class ProgressSchema(BaseModel):
    episodeId: str
    bookId: str
    positionSeconds: float
    durationSeconds: float
    completed: bool = False

# Routes
@app.post("/api/auth/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username is already taken")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_user = User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"id": new_user.id, "username": new_user.username, "role": new_user.role})
    return {
        "token": token,
        "user": {"id": new_user.id, "username": new_user.username, "email": new_user.email, "role": new_user.role}
    }

@app.post("/api/auth/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter((User.username == data.username) | (User.email == data.username)).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"id": user.id, "username": user.username, "role": user.role})
    return {
        "token": token,
        "user": {"id": user.id, "username": user.username, "email": user.email, "role": user.role}
    }

@app.get("/api/auth/me")
def get_me(user: User = Depends(require_current_user)):
    return {"user": {"id": user.id, "username": user.username, "email": user.email, "role": user.role}}

@app.get("/api/books")
def get_books(q: Optional[str] = None, genre: Optional[str] = None, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user)):
    query = db.query(Book)
    if q:
        query = query.filter(
            (Book.title.ilike(f"%{q}%")) | (Book.author.ilike(f"%{q}%")) | (Book.description.ilike(f"%{q}%"))
        )
    if genre and genre.lower() != "all":
        query = query.filter(Book.genre.ilike(genre))

    books = query.order_by(Book.created_at.desc()).all()
    fav_book_ids = []
    if current_user:
        fav_book_ids = [f.book_id for f in db.query(Favorite).filter(Favorite.user_id == current_user.id).all()]

    result = []
    for b in books:
        episodes = db.query(Episode).filter(Episode.book_id == b.id).all()
        total_duration = sum(e.duration_seconds for e in episodes)
        result.append({
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "narrator": b.narrator,
            "genre": b.genre,
            "description": b.description,
            "coverUrl": b.cover_url,
            "createdAt": b.created_at.isoformat(),
            "updatedAt": b.updated_at.isoformat(),
            "episodesCount": len(episodes),
            "totalDurationSeconds": total_duration,
            "isFavorite": b.id in fav_book_ids,
        })
    return result

@app.get("/api/books/{book_id}")
def get_book_by_id(book_id: str, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    episodes = db.query(Episode).filter(Episode.book_id == book_id).order_by(Episode.track_number.asc()).all()
    fav = False
    if current_user:
        fav = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.book_id == book_id).first() is not None

    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "narrator": book.narrator,
        "genre": book.genre,
        "description": book.description,
        "coverUrl": book.cover_url,
        "createdAt": book.created_at.isoformat(),
        "updatedAt": book.updated_at.isoformat(),
        "episodesCount": len(episodes),
        "totalDurationSeconds": sum(e.duration_seconds for e in episodes),
        "isFavorite": fav,
        "episodes": [
            {
                "id": e.id,
                "bookId": e.book_id,
                "title": e.title,
                "audioUrl": e.audio_url,
                "durationSeconds": e.duration_seconds,
                "trackNumber": e.track_number,
                "createdAt": e.created_at.isoformat(),
            }
            for e in episodes
        ]
    }

@app.post("/api/books")
def create_book(
    title: str = Form(...),
    author: str = Form(...),
    narrator: str = Form("Unknown Narrator"),
    genre: str = Form("Audiobook"),
    description: str = Form(""),
    coverUrl: Optional[str] = Form(None),
    cover: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user)
):
    final_cover_url = coverUrl or "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop"
    if cover:
        file_filename = f"{int(datetime.utcnow().timestamp())}_{cover.filename}"
        file_path = os.path.join(COVERS_DIR, file_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(cover.file, buffer)
        final_cover_url = f"/uploads/covers/{file_filename}"

    new_book = Book(
        title=title,
        author=author,
        narrator=narrator,
        genre=genre,
        description=description,
        cover_url=final_cover_url
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@app.post("/api/books/{book_id}/episodes")
def create_episode(
    book_id: str,
    title: Optional[str] = Form(None),
    durationSeconds: Optional[float] = Form(300.0),
    trackNumber: Optional[int] = Form(None),
    audioUrl: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    final_audio_url = audioUrl
    if audio:
        file_filename = f"{int(datetime.utcnow().timestamp())}_{audio.filename}"
        file_path = os.path.join(AUDIO_DIR, file_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        final_audio_url = f"/uploads/audio/{file_filename}"

    if not final_audio_url:
        raise HTTPException(status_code=400, detail="Audio file or audioUrl required")

    existing_count = db.query(Episode).filter(Episode.book_id == book_id).count()
    t_num = trackNumber if trackNumber else existing_count + 1

    new_episode = Episode(
        book_id=book_id,
        title=title or f"Chapter {t_num}",
        audio_url=final_audio_url,
        duration_seconds=durationSeconds,
        track_number=t_num
    )
    db.add(new_episode)
    db.commit()
    db.refresh(new_episode)
    return new_episode

@app.post("/api/favorites/{book_id}")
def toggle_favorite(book_id: str, db: Session = Depends(get_db), user: User = Depends(require_current_user)):
    fav = db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.book_id == book_id).first()
    if fav:
        db.delete(fav)
        db.commit()
        return {"bookId": book_id, "isFavorite": False}
    else:
        new_fav = Favorite(user_id=user.id, book_id=book_id)
        db.add(new_fav)
        db.commit()
        return {"bookId": book_id, "isFavorite": True}

@app.post("/api/progress")
def save_progress(data: ProgressSchema, db: Session = Depends(get_db), user: User = Depends(require_current_user)):
    prog = db.query(UserProgress).filter(UserProgress.user_id == user.id, UserProgress.episode_id == data.episodeId).first()
    if prog:
        prog.position_seconds = data.positionSeconds
        prog.duration_seconds = data.durationSeconds
        prog.completed = data.completed
    else:
        prog = UserProgress(
            user_id=user.id,
            episode_id=data.episodeId,
            book_id=data.bookId,
            position_seconds=data.positionSeconds,
            duration_seconds=data.durationSeconds,
            completed=data.completed
        )
        db.add(prog)
    db.commit()
    return {"status": "ok"}
