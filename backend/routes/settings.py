from app import app, db, scheduler
from flask import jsonify, render_template, request
from datetime import datetime, time
from apscheduler.triggers.cron import CronTrigger
from routes.scan import ScanResult

class ScanSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    schedule_enabled = db.Column(db.Boolean, default=False)
    schedule_frequency = db.Column(db.String(20), default='weekly')
    schedule_time = db.Column(db.Time, default=time(0, 0))
    notification_email = db.Column(db.String(120))
    timeout = db.Column(db.Integer, default=5)
    max_depth = db.Column(db.Integer, default=3)
    concurrent_requests = db.Column(db.Integer, default=5)
    follow_redirects = db.Column(db.Boolean, default=True)
    check_images = db.Column(db.Boolean, default=True)
    check_scripts = db.Column(db.Boolean, default=True)
    check_styles = db.Column(db.Boolean, default=True)

def get_current_settings():
    settings = ScanSettings.query.first()
    if not settings:
        settings = ScanSettings()
        db.session.add(settings)
        db.session.commit()
    return settings

def update_scheduler(settings):
    # Remove existing scheduled jobs
    for job in scheduler.get_jobs():
        scheduler.remove_job(job.id)

    if settings.schedule_enabled:
        # Convert schedule frequency to cron expression
        if settings.schedule_frequency == 'daily':
            trigger = CronTrigger(
                hour=settings.schedule_time.hour,
                minute=settings.schedule_time.minute
            )
        elif settings.schedule_frequency == 'weekly':
            trigger = CronTrigger(
                day_of_week='mon',
                hour=settings.schedule_time.hour,
                minute=settings.schedule_time.minute
            )
        else:  # monthly
            trigger = CronTrigger(
                day='1',
                hour=settings.schedule_time.hour,
                minute=settings.schedule_time.minute
            )

        # Add new scheduled job
        scheduler.add_job(
            func=scheduled_scan,
            trigger=trigger,
            id='scheduled_scan',
            name='Scheduled Website Scan',
            replace_existing=True
        )

def scheduled_scan():
    # Get all unique URLs from previous scans
    urls = db.session.query(ScanResult.url).distinct().all()
    settings = get_current_settings()

    for url_tuple in urls:
        url = url_tuple[0]
        try:
            # Create new scan for each URL
            scan_result = ScanResult(
                url=url,
                email=settings.notification_email,
                scan_date=datetime.utcnow()
            )
            db.session.add(scan_result)
            db.session.commit()

            # TODO: Implement actual scan logic here
            # This should be similar to the scan route logic
            # Consider making the scan logic reusable

        except Exception as e:
            print(f"Error in scheduled scan for {url}: {str(e)}")

@app.route('/settings')
def settings_page():
    return render_template('settings.html')

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    if request.method == 'GET':
        settings = get_current_settings()
        return jsonify({
            'schedule': {
                'enabled': settings.schedule_enabled,
                'frequency': settings.schedule_frequency,
                'time': settings.schedule_time.strftime('%H:%M'),
                'email': settings.notification_email
            },
            'scan': {
                'timeout': settings.timeout,
                'maxDepth': settings.max_depth,
                'concurrentRequests': settings.concurrent_requests,
                'followRedirects': settings.follow_redirects,
                'checkImages': settings.check_images,
                'checkScripts': settings.check_scripts,
                'checkStyles': settings.check_styles
            }
        })

    elif request.method == 'POST':
        data = request.get_json()
        settings = get_current_settings()

        # Update schedule settings
        schedule_data = data.get('schedule', {})
        settings.schedule_enabled = schedule_data.get('enabled', False)
        settings.schedule_frequency = schedule_data.get('frequency', 'weekly')
        time_str = schedule_data.get('time', '00:00')
        settings.schedule_time = datetime.strptime(time_str, '%H:%M').time()
        settings.notification_email = schedule_data.get('email', '')

        # Update scan settings
        scan_data = data.get('scan', {})
        settings.timeout = scan_data.get('timeout', 5)
        settings.max_depth = scan_data.get('maxDepth', 3)
        settings.concurrent_requests = scan_data.get('concurrentRequests', 5)
        settings.follow_redirects = scan_data.get('followRedirects', True)
        settings.check_images = scan_data.get('checkImages', True)
        settings.check_scripts = scan_data.get('checkScripts', True)
        settings.check_styles = scan_data.get('checkStyles', True)

        try:
            db.session.commit()
            update_scheduler(settings)
            return jsonify({'message': 'Settings updated successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500