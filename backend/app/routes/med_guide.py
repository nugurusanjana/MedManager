from flask import Blueprint, request, jsonify, current_app
from app.auth_utils import login_required
from app import db
import base64
import requests
import json
from werkzeug.utils import secure_filename
from datetime import datetime

bp = Blueprint('med_guide', __name__, url_prefix='/medguide')

@bp.route('/analyze', methods=['POST'])
@login_required
def analyze_prescription(user):
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        if file.content_type and file.content_type.startswith('image/'):
            # File size limit 5MB
            file_content = file.read()
            if len(file_content) > 5 * 1024 * 1024:
                return jsonify({'error': 'File too large. Max 5MB.'}), 400
            
            allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
            if file.content_type not in allowed_types:
                return jsonify({'error': f'Unsupported format ({file.content_type}). Use JPG, PNG, WebP'}), 400
            
            # Read image as base64
            image_data = base64.b64encode(file_content).decode('utf-8')
            
            groq_api_key = current_app.config.get('GROQ_API_KEY')
            if not groq_api_key:
                return jsonify({'error': 'Groq API key not configured'}), 500
            
            # Groq vision API
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            
            prompt = """Analyze this prescription image. Extract all medicines with:
- name
- dosage (e.g. 1 tablet)
- frequency (e.g. twice daily)
- duration (if mentioned)

Output ONLY JSON array:
[
  {"name": "Paracetamol", "dosage": "500mg", "frequency": "1 tablet 3x daily", "duration": "5 days"},
  ...
]

If no medicines found, empty array []. Be precise with names."""

            data = {
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",  # ✅ vision capable,  # Working non-vision model; get vision access or change
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{file.content_type};base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.1
            }
            
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            content = response.json()['choices'][0]['message']['content']
            
            # Robust JSON extraction
            import re
            medicines = []
            try:
                # Extract JSON array from markdown or plain text using regex
                json_match = re.search(r'\[[\s\S]*?\]', content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    json_str = content.strip()
                
                medicines = json.loads(json_str)
                
                # Basic validation
                for med in medicines:
                    required = ['name']
                    for field in required:
                        if field not in med:
                            raise ValueError(f'Missing {field} in medicine')
                            
            except Exception as parse_err:
                return jsonify({'error': f'Failed to parse medicines: {str(parse_err)}', 'raw': content[:500]}), 500
            
            return jsonify({
                'medicines': medicines,
                'analyzed_at': datetime.utcnow().isoformat(),
                'image_size': len(image_data)
            })
        else:
            return jsonify({'error': 'Invalid image format'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
