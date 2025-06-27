from flask import request, jsonify, render_template, session, redirect, url_for
from app import app, db
from models.user import User

@app.route('/login', methods=['GET'])
def login_page():
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/signup', methods=['GET'])
def signup_page():
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template('signup.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.check_password(data['password']):
        session.clear()  # Clear any existing session data
        session['user_id'] = user.id
        return jsonify(user.to_dict()), 200
    
    return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if not data or not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    
    try:
        db.session.add(user)
        db.session.commit()
        session['user_id'] = user.id
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error creating user'}), 500

@app.route('/api/logout')
def logout():
    session.clear()  # Clear all session data
    return redirect(url_for('logout_page'))

@app.route('/logout')
def logout_page():
    return render_template('logout.html')

@app.route('/api/user')
def get_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        session.clear()  # Clear all session data if user not found
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@app.route('/api/reset-data', methods=['POST'])
def reset_data():
    try:
        # Delete all data from tables
        tables = ['scan_history', 'analytics_data', 'user_settings', 'users']
        for table in tables:
            try:
                db.session.execute(f'DELETE FROM {table}')
                # Reset SQLite auto-increment counter
                db.session.execute(f'DELETE FROM sqlite_sequence WHERE name = "{table}"')
            except Exception as e:
                print(f'Error clearing table {table}: {str(e)}')
                continue
        
        # Commit all changes
        db.session.commit()
        
        # Clear all sessions
        session.clear()
        
        return jsonify({'message': 'All data has been reset successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error resetting data: {str(e)}'}), 500
        db.session.execute('ALTER TABLE user_settings AUTO_INCREMENT = 1')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Application has been reset successfully',
            'details': {
                'users_deleted': True,
                'scan_history_cleared': True,
                'analytics_reset': True,
                'settings_reset': True
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Error resetting application data',
            'details': str(e)
        }), 500