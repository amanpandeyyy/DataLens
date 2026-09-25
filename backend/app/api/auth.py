from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        email=clean_email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        role=(user_in.role or "Data Analyst").strip()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    clean_password = user_in.password.strip()
    user = db.query(User).filter(User.email == clean_email).first()

    # Self-heal demo user if logging in with demo credentials
    if not user and clean_email == "demo@datalens.ai" and clean_password == "datalens123":
        user = User(
            email="demo@datalens.ai",
            hashed_password=get_password_hash("datalens123"),
            full_name="Alex Mercer",
            role="Lead Data Analyst"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user or not verify_password(clean_password, user.hashed_password):
        if not user or not verify_password(user_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))

@router.post("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    demo_user = db.query(User).filter(User.email == "demo@datalens.ai").first()
    if not demo_user:
        demo_user = User(
            email="demo@datalens.ai",
            hashed_password=get_password_hash("datalens123"),
            full_name="Alex Mercer",
            role="Lead Data Analyst"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    token = create_access_token({"sub": str(demo_user.id), "email": demo_user.email})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(demo_user))

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

