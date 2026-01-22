
from app import app
from api.models import db

print("Initializing database...")
with app.app_context():
    db.create_all()
    print("Database tables created successfully.")
