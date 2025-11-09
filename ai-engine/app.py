from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import sys
from datetime import datetime

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_service import get_ai_engine

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('alphainsure-ai-api')

# Initialize AI engine
ai_engine = get_ai_engine()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'alphainsure-ai-engine'
    })

@app.route('/api/ai/analyze-risk', methods=['POST'])
def analyze_risk():
    """Analyze risk for a property"""
    try:
        data = request.get_json()
        property_data = data.get('property', {})
        
        if not property_data:
            return jsonify({
                'success': False,
                'error': 'Property data required'
            }), 400
        
        result = ai_engine.analyze_risk(property_data)
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in risk analysis: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/analyze-damage', methods=['POST'])
def analyze_damage():
    """Analyze damage from satellite imagery"""
    try:
        data = request.get_json()
        pre_image = data.get('preDisasterImagery', {})
        post_image = data.get('postDisasterImagery', {})
        
        if not pre_image or not post_image:
            return jsonify({
                'success': False,
                'error': 'Both pre and post disaster imagery required'
            }), 400
        
        result = ai_engine.analyze_damage(
            pre_image.get('imageUrl'),
            post_image.get('imageUrl')
        )
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in damage analysis: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/detect-fraud', methods=['POST'])
def detect_fraud():
    """Detect fraud in insurance claim"""
    try:
        data = request.get_json()
        claim_data = data.get('claim', {})
        
        if not claim_data:
            return jsonify({
                'success': False,
                'error': 'Claim data required'
            }), 400
        
        result = ai_engine.detect_fraud(claim_data)
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in fraud detection: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/batch-process', methods=['POST'])
def batch_process():
    """Process multiple AI requests in batch"""
    try:
        data = request.get_json()
        requests_batch = data.get('requests', [])
        
        if not requests_batch:
            return jsonify({
                'success': False,
                'error': 'Batch requests required'
            }), 400
        
        results = []
        for req in requests_batch:
            req_type = req.get('type')
            req_data = req.get('data', {})
            
            try:
                if req_type == 'risk_analysis':
                    result = ai_engine.analyze_risk(req_data)
                elif req_type == 'damage_analysis':
                    result = ai_engine.analyze_damage(
                        req_data.get('preImageUrl'),
                        req_data.get('postImageUrl')
                    )
                elif req_type == 'fraud_detection':
                    result = ai_engine.detect_fraud(req_data)
                else:
                    result = {'error': f'Unknown request type: {req_type}'}
                
                results.append({
                    'id': req.get('id'),
                    'type': req_type,
                    'success': 'error' not in result,
                    'result': result
                })
                
            except Exception as e:
                results.append({
                    'id': req.get('id'),
                    'type': req_type,
                    'success': False,
                    'result': {'error': str(e)}
                })
        
        return jsonify({
            'success': True,
            'data': {
                'results': results,
                'processed': len(results),
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error in batch processing: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai/model-info', methods=['GET'])
def model_info():
    """Get information about loaded AI models"""
    try:
        return jsonify({
            'success': True,
            'data': {
                'models': {
                    'damage_detection': {
                        'version': '1.0.0',
                        'type': 'CNN (ResNet50)',
                        'status': 'loaded'
                    },
                    'risk_scoring': {
                        'version': '1.0.0',
                        'type': 'Random Forest',
                        'status': 'loaded'
                    },
                    'fraud_detection': {
                        'version': '1.0.0',
                        'type': 'Gradient Boosting',
                        'status': 'loaded'
                    }
                },
                'capabilities': [
                    'damage_detection_from_satellite_imagery',
                    'multi_factor_risk_scoring',
                    'insurance_fraud_detection',
                    'batch_processing',
                    'real_time_analysis'
                ]
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting AlphaInsure AI Engine on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)