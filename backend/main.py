import time
from typing import Generator, Dict, Any
from fastapi import FASTAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

app = FASTAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

