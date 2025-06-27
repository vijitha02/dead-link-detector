from app import app, db
from flask import jsonify, render_template, session, redirect, url_for
from routes.scan import ScanResult
from sqlalchemy import func
from models.user import User

@app.route('/history')
def history():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login_page'))
    
    return render_template('history.html', user=user)

@app.route('/analytics')
def analytics():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    
    user = User.query.get(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return redirect(url_for('login_page'))
    
    return render_template('analytics.html', user=user)

@app.route('/api/history')
def get_history():
    # Get current user's ID from session
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    # Filter scans by user_id
    scans = ScanResult.query.filter_by(user_id=user_id).order_by(ScanResult.scan_date.desc()).all()
    return jsonify([{
        'id': scan.id,
        'url': scan.url,
        'total_links': scan.total_links,
        'broken_links': scan.broken_links,
        'internal_links': scan.internal_links,
        'external_links': scan.external_links,
        'avg_response_time': scan.avg_response_time,
        'scan_date': scan.scan_date.isoformat(),
        'scan_data': scan.scan_data
    } for scan in scans])

@app.route('/api/analytics')
def get_analytics():
    # Get current user's ID from session
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    # Get total scans count for this user
    total_scans = ScanResult.query.filter_by(user_id=user_id).count()

    # Get average broken links per scan for this user
    avg_broken_links = db.session.query(
        func.avg(ScanResult.broken_links)
    ).filter(ScanResult.user_id == user_id).scalar() or 0

    # Get most common error types for this user
    error_distribution = {}
    scans = ScanResult.query.filter_by(user_id=user_id).all()
    for scan in scans:
        if scan.scan_data and 'error_counts' in scan.scan_data:
            for error_code, count in scan.scan_data['error_counts'].items():
                error_distribution[error_code] = error_distribution.get(error_code, 0) + count

    # Get internal vs external links ratio for this user
    total_internal = db.session.query(func.sum(ScanResult.internal_links))\
        .filter(ScanResult.user_id == user_id).scalar() or 0
    total_external = db.session.query(func.sum(ScanResult.external_links))\
        .filter(ScanResult.user_id == user_id).scalar() or 0

    # Get average response time trend for this user
    response_times = db.session.query(
        ScanResult.scan_date,
        ScanResult.avg_response_time
    ).filter(ScanResult.user_id == user_id).order_by(ScanResult.scan_date.asc()).all()

    return jsonify({
        'total_scans': total_scans,
        'avg_broken_links': float(avg_broken_links),
        'error_distribution': error_distribution,
        'links_distribution': {
            'internal': int(total_internal),
            'external': int(total_external)
        },
        'response_time_trend': [{
            'date': rt[0].isoformat(),
            'avg_time': float(rt[1])
        } for rt in response_times]
    })