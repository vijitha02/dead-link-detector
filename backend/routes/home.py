from flask import render_template, session, redirect, url_for
from app import app
from models.user import User

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login_page'))
    
    return render_template('index.html', user=user)
