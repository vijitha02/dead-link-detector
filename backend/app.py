from flask import Flask, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
import os
import secrets
import logging
from logging.handlers import RotatingFileHandler

# Configure logging
if not os.path.exists('logs'):
    os.makedirs('logs')
logging.basicConfig(level=logging.INFO)
handler = RotatingFileHandler('logs/app.log', maxBytes=10000, backupCount=3)
handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
handler.setLevel(logging.INFO)

app = Flask(__name__, template_folder="../frontend/templates", static_folder="../frontend/static")

# Configure logging
app.logger.addHandler(handler)

# Configure CORS
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://127.0.0.1:5000"}}, allow_headers=["Content-Type"])

@app.errorhandler(500)
def internal_error(error):
    app.logger.error('Server Error: %s', error)
    db.session.rollback()
    return jsonify({'error': 'An internal server error occurred. Please try again later.'}), 500

@app.errorhandler(404)
def not_found_error(error):
    app.logger.error('Not Found: %s', error)
    return jsonify({'error': 'Resource not found'}), 404

# Configure session
app.secret_key = secrets.token_hex(16)
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Get absolute path for database directory
db_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database'))
os.makedirs(db_dir, exist_ok=True)

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(db_dir, "scan_data.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Configure APScheduler with SQLite job store
jobstores = {
    'default': SQLAlchemyJobStore(url=f'sqlite:///{os.path.join(db_dir, "jobs.db")}')
}

scheduler = BackgroundScheduler(jobstores=jobstores)
scheduler.start()

# Import routes after app initialization

from routes.home import *
from routes.scan import *
from routes.history import *
from routes.settings import *
from routes.auth import *

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
