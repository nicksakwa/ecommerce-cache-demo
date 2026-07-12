import time
from typing import Generator, Dict, Any
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db() -> Generator[Dict[int, Dict[str, Any]], None, None]:
    mock_postgres_db ={
        1: {"id": 1, "name": "Wireless Headphones", "price": 99.99, "category": "Electronics"},
        2: {"id": 2, "name": "Running Shoes", "price": 120.00, "category": "Apparel"},
        3: {"id": 3, "name": "Smart Watch", "price": 199.99, "category": "Electronics"},
        4: {"id": 4, "name": "Leather Wallet", "price": 45.00, "category": "Accessories"},
    }
    yield mock_postgres_db

class MockRedis:
    def __init__(self):
        self.store: Dict[str, Any] = {}
        self.ttl: Dict[str, float] = {}

    def get(self, key: str) -> Any:
        if key in self.store:
            if time.time() - self.ttl[key] > 10:
                del self.store[key]
                del self.ttl[key]
                return None
            return self.store[key]
        return None
    
    def set(self, key:str, value:Any):
        self.store[key] = value
        self.ttl[key] = time.time()
    
redis_instance = MockRedis()

def get_redis() -> MockRedis:
    return redis_instance