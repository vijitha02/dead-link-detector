from app import app, db
from flask import request, jsonify
from flask import session as flask_session
from bs4 import BeautifulSoup
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from datetime import datetime
import pandas as pd
from urllib.parse import urljoin, urlparse

class ScanResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), nullable=False)
    email = db.Column(db.String(120))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total_links = db.Column(db.Integer, default=0)
    broken_links = db.Column(db.Integer, default=0)
    internal_links = db.Column(db.Integer, default=0)
    external_links = db.Column(db.Integer, default=0)
    avg_response_time = db.Column(db.Float, default=0)
    scan_date = db.Column(db.DateTime, default=datetime.utcnow)
    scan_data = db.Column(db.JSON)

def is_valid_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def get_base_url(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"

def is_internal_link(base_url, link):
    return link.startswith('/') or link.startswith(base_url)

def create_session_with_retries():
    session = requests.Session()
    retries = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504],
        allowed_methods=['GET', 'HEAD']
    )
    session.mount('http://', HTTPAdapter(max_retries=retries))
    session.mount('https://', HTTPAdapter(max_retries=retries))
    return session

@app.route('/scan', methods=['POST'])
def scan():
    if 'user_id' not in flask_session:
        return jsonify({'error': 'Authentication required'}), 401
        
    data = request.get_json()
    url = data.get('url')
    email = data.get('email')
    check_external = data.get('external', False)

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    if not is_valid_url(url):
        return jsonify({'error': 'Invalid URL format'}), 400
        
    session = create_session_with_retries()

    base_url = get_base_url(url)
    broken_links = []
    all_links = set()
    internal_count = 0
    external_count = 0
    total_response_time = 0
    error_counts = {'404': 0, '500': 0, '503': 0, '0': 0}
    scan_result = ScanResult(url=url, email=email, user_id=flask_session['user_id'])

    try:
        response = session.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        links = soup.find_all(['a', 'link', 'script', 'img'])

        for link in links:
            href = link.get('href') or link.get('src')
            if not href or href.startswith(('#', 'mailto:', 'tel:', 'javascript:')):
                continue

            full_url = urljoin(base_url, href)
            if full_url in all_links:
                continue

            all_links.add(full_url)
            is_internal = is_internal_link(base_url, full_url)

            if is_internal:
                internal_count += 1
            else:
                external_count += 1
                if not check_external:
                    continue

            try:
                start_time = datetime.now()
                link_response = session.head(full_url, allow_redirects=True, timeout=5)
                response_time = (datetime.now() - start_time).total_seconds() * 1000
                total_response_time += response_time

                if link_response.status_code >= 400:
                    status_code = str(link_response.status_code)
                    error_counts[status_code] = error_counts.get(status_code, 0) + 1
                    broken_links.append({
                        'url': full_url,
                        'status': link_response.status_code,
                        'element_type': link.name
                    })
            except requests.RequestException as e:
                error_counts['0'] += 1
                broken_links.append({
                    'url': full_url,
                    'status': 0,
                    'element_type': link.name,
                    'error': str(e)
                })

        avg_response_time = total_response_time / len(all_links) if all_links else 0
        scan_data = {
            'broken_links': broken_links,
            'error_counts': error_counts,
            'response_time': avg_response_time
        }

        scan_result.total_links = len(all_links)
        scan_result.broken_links = len(broken_links)
        scan_result.internal_links = internal_count
        scan_result.external_links = external_count
        scan_result.avg_response_time = avg_response_time
        scan_result.scan_data = scan_data

        db.session.add(scan_result)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'total_links': len(all_links),
                'broken_links': broken_links,
                'internal_links': internal_count,
                'external_links': external_count,
                'avg_response_time': avg_response_time,
                'error_counts': error_counts
            }
        })

    except requests.RequestException as e:
        error_msg = str(e)
        if 'NewConnectionError' in error_msg and 'refused' in error_msg:
            app.logger.error(f"Connection refused while scanning {url}. Target server may be down or not accepting connections.")
            return jsonify({'error': 'Unable to connect to the target server. Please verify the server is running and accessible.'}), 500
        app.logger.error(f"Request error while scanning {url}: {error_msg}")
        return jsonify({'error': f"Failed to access URL: {error_msg}"}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error while scanning {url}: {str(e)}")
        db.session.rollback()  # Ensure database session is rolled back on error
        return jsonify({'error': 'An unexpected error occurred during scanning. Please try again.'}), 500