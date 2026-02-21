import logging
import sys
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import or_

from jose import jwt, JWTError

import models, schemas, auth
from database import engine, get_db



logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

app = FastAPI(title="IdeaPlaner API")

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error, check logs"}
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to LovePlans API! Go to /docs for Swagger."}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# --- AUTH ROUTES ---

@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- IDEAS ROUTES ---

@app.post("/ideas", response_model=schemas.IdeaOut)
def create_idea(idea: schemas.IdeaCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_idea = models.Idea(
        **idea.dict(),
        author_id=current_user.id
    )
    db.add(db_idea)
    db.commit()
    db.refresh(db_idea)
    return db_idea

@app.get("/ideas", response_model=List[schemas.IdeaOut])
def get_ideas(
    idea_type: Optional[str] = None, 
    status: Optional[str] = None, 
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if limit > 100:
        limit = 100

    query = db.query(models.Idea)
    
    if idea_type:
        query = query.filter(models.Idea.idea_type == idea_type)
    if status:
        query = query.filter(models.Idea.status == status)
    if search:
        query = query.filter(
            or_(
                models.Idea.title.icontains(search),
                models.Idea.description.icontains(search)
            )
        )
    
    return query.order_by(models.Idea.created_at.desc()) \
                .offset(offset) \
                .limit(limit) \
                .all()

@app.get("/ideas/{idea_id}", response_model=schemas.IdeaOut)
def get_idea(idea_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    return db_idea

@app.put("/ideas/{idea_id}", response_model=schemas.IdeaOut)
def update_idea(idea_id: int, idea_update: schemas.IdeaUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    update_data = idea_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_idea, key, value)
    
    db.commit()
    db.refresh(db_idea)
    return db_idea

@app.patch("/ideas/{idea_id}/status", response_model=schemas.IdeaOut)
def update_status(idea_id: int, status_data: schemas.StatusUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    db_idea.status = status_data.status
    db.commit()
    db.refresh(db_idea)
    return db_idea

@app.delete("/ideas/{idea_id}")
def delete_idea(idea_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_idea = db.query(models.Idea).filter(models.Idea.id == idea_id).first()
    if not db_idea:
        raise HTTPException(status_code=404, detail="Идея не найдена")
    
    db.delete(db_idea)
    db.commit()
    return {"detail": "Идея успешно удалена"}

# --- HTML ROUTES ---

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})