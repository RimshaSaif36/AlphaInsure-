import os
import sys
import numpy as np
import cv2
import tensorflow as tf
from tensorflow import keras
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import requests
import json
from datetime import datetime, timedelta
import logging
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('alphainsure-ai')

class DamageDetectionModel:
    """Computer vision model for detecting disaster damage from satellite imagery"""
    
    def __init__(self, model_path='models/damage_detection.h5'):
        self.model_path = model_path
        self.model = None
        self.input_shape = (224, 224, 3)
        self.damage_classes = [
            'no_damage', 'minor_damage', 'moderate_damage', 
            'severe_damage', 'destroyed'
        ]
        self.load_or_create_model()
    
    def load_or_create_model(self):
        """Load existing model or create a new one"""
        try:
            if os.path.exists(self.model_path):
                self.model = keras.models.load_model(self.model_path)
                logger.info(f"Loaded damage detection model from {self.model_path}")
            else:
                self.model = self.create_model()
                logger.info("Created new damage detection model")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model = self.create_model()
    
    def create_model(self):
        """Create a new CNN model for damage detection"""
        base_model = keras.applications.ResNet50(
            input_shape=self.input_shape,
            include_top=False,
            weights='imagenet'
        )
        
        # Freeze base model layers
        base_model.trainable = False
        
        model = keras.Sequential([
            base_model,
            keras.layers.GlobalAveragePooling2D(),
            keras.layers.Dense(256, activation='relu'),
            keras.layers.Dropout(0.5),
            keras.layers.Dense(128, activation='relu'),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(len(self.damage_classes), activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def preprocess_image(self, image_path_or_array):
        """Preprocess image for model input"""
        try:
            if isinstance(image_path_or_array, str):
                # Load image from path
                image = cv2.imread(image_path_or_array)
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                # Assume it's already an array
                image = image_path_or_array
            
            # Resize to model input size
            image = cv2.resize(image, self.input_shape[:2])
            
            # Normalize pixel values
            image = image.astype(np.float32) / 255.0
            
            return image
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return None
    
    def detect_damage(self, pre_image, post_image):
        """Compare pre and post disaster images to detect damage"""
        try:
            # Preprocess images
            pre_processed = self.preprocess_image(pre_image)
            post_processed = self.preprocess_image(post_image)
            
            if pre_processed is None or post_processed is None:
                return self.get_default_result()
            
            # Create difference image
            diff_image = np.abs(post_processed - pre_processed)
            
            # Prepare for model prediction
            images = np.array([pre_processed, post_processed, diff_image])
            
            # Get predictions
            predictions = self.model.predict(images, verbose=0)
            
            # Analyze results
            pre_damage = np.argmax(predictions[0])
            post_damage = np.argmax(predictions[1])
            diff_confidence = np.max(predictions[2])
            
            # Calculate damage percentage
            damage_increase = post_damage - pre_damage
            damage_percentage = max(0, (damage_increase / len(self.damage_classes)) * 100)
            
            # Determine damage type
            damage_types = []
            if damage_percentage > 20:
                damage_types.append('structural')
            if diff_confidence > 0.7:
                damage_types.append('visible_change')
            
            # Calculate confidence
            confidence = (diff_confidence + predictions[1][post_damage]) / 2 * 100
            
            result = {
                'damagePercentage': round(damage_percentage, 2),
                'damageType': damage_types,
                'analysisConfidence': round(confidence, 2),
                'aiModelVersion': 'DamageDetection_v1.0',
                'preDisasterClass': self.damage_classes[pre_damage],
                'postDisasterClass': self.damage_classes[post_damage],
                'estimatedLoss': self.calculate_estimated_loss(damage_percentage)
            }
            
            logger.info(f"Damage detection result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error in damage detection: {e}")
            return self.get_default_result()
    
    def get_default_result(self):
        """Return default result when analysis fails"""
        return {
            'damagePercentage': 0,
            'damageType': ['analysis_failed'],
            'analysisConfidence': 0,
            'aiModelVersion': 'DamageDetection_v1.0',
            'preDisasterClass': 'unknown',
            'postDisasterClass': 'unknown',
            'estimatedLoss': 0
        }
    
    def calculate_estimated_loss(self, damage_percentage):
        """Calculate estimated financial loss based on damage percentage"""
        # This would use property value and damage assessment
        # For demo, using simplified calculation
        base_property_value = 300000  # Average property value
        return round(base_property_value * (damage_percentage / 100), 2)

class RiskScoringModel:
    """Machine learning model for calculating risk scores"""
    
    def __init__(self, model_path='models/risk_scoring.joblib'):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.load_or_create_model()
    
    def load_or_create_model(self):
        """Load existing model or create a new one"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info(f"Loaded risk scoring model from {self.model_path}")
            else:
                self.model = self.create_model()
                logger.info("Created new risk scoring model")
        except Exception as e:
            logger.error(f"Error loading risk model: {e}")
            self.model = self.create_model()
    
    def create_model(self):
        """Create a new random forest model for risk scoring"""
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        
        # Train with synthetic data for demo
        self.train_with_synthetic_data(model)
        
        return model
    
    def train_with_synthetic_data(self, model):
        """Train model with synthetic training data"""
        # Generate synthetic training data
        n_samples = 10000
        features = np.random.rand(n_samples, 15)  # 15 features
        
        # Simulate risk factors
        # Features: elevation, proximity_to_water, vegetation_index, temperature, 
        # humidity, wind_speed, soil_moisture, historical_events, etc.
        
        # Create synthetic risk scores based on feature combinations
        risk_scores = (
            features[:, 0] * 20 +  # elevation factor
            features[:, 1] * 30 +  # water proximity
            features[:, 2] * 25 +  # vegetation
            features[:, 3] * 15 +  # temperature
            features[:, 4] * 10 +  # humidity
            np.random.normal(0, 5, n_samples)  # noise
        )
        
        risk_scores = np.clip(risk_scores, 0, 100)
        
        # Fit scaler and model
        features_scaled = self.scaler.fit_transform(features)
        model.fit(features_scaled, risk_scores)
        
        logger.info("Model trained with synthetic data")
    
    def calculate_risk_score(self, property_data, satellite_data, weather_data):
        """Calculate risk score for a property"""
        try:
            # Extract features
            features = self.extract_features(property_data, satellite_data, weather_data)
            
            # Scale features
            features_scaled = self.scaler.transform([features])
            
            # Predict risk score
            risk_score = self.model.predict(features_scaled)[0]
            
            # Ensure score is within bounds
            risk_score = max(0, min(100, risk_score))
            
            # Get feature importance
            importance = self.model.feature_importances_
            top_factors = self.get_top_risk_factors(features, importance)
            
            result = {
                'overallRiskScore': round(risk_score, 2),
                'confidence': 85,  # Model confidence
                'topRiskFactors': top_factors,
                'modelVersion': 'RiskScoring_v1.0'
            }
            
            logger.info(f"Risk score calculated: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error calculating risk score: {e}")
            return {
                'overallRiskScore': 50,
                'confidence': 0,
                'topRiskFactors': [],
                'modelVersion': 'RiskScoring_v1.0'
            }
    
    def extract_features(self, property_data, satellite_data, weather_data):
        """Extract numerical features from input data"""
        features = []
        
        # Property features
        features.append(property_data.get('elevation', 0) / 1000)  # Normalize elevation
        features.append(property_data.get('proximityToWater', 0) / 10000)  # Normalize distance
        features.append(1 if property_data.get('floodZone') == 'AE' else 0)  # Flood zone
        features.append(property_data.get('yearBuilt', 2000) / 2024)  # Normalize year
        
        # Satellite features
        features.append(satellite_data.get('indices', {}).get('ndvi', 0.5))  # Vegetation
        features.append(satellite_data.get('indices', {}).get('moisture', 0.5))  # Moisture
        features.append(satellite_data.get('indices', {}).get('nbr', 0.5))  # Burn ratio
        
        # Weather features
        features.append(weather_data.get('current', {}).get('temperature', 20) / 50)  # Normalize temp
        features.append(weather_data.get('current', {}).get('humidity', 50) / 100)  # Humidity
        features.append(weather_data.get('current', {}).get('windSpeed', 0) / 100)  # Wind speed
        features.append(weather_data.get('forecast', {}).get('precipitationRisk', 0.5))
        features.append(weather_data.get('forecast', {}).get('stormProbability', 0.5))
        
        # Historical features
        features.append(len(weather_data.get('historical', {}).get('extremeEvents', [])) / 10)
        features.append(weather_data.get('historical', {}).get('avgPrecipitation', 50) / 200)
        features.append(weather_data.get('historical', {}).get('avgTemperature', 20) / 50)
        
        return features
    
    def get_top_risk_factors(self, features, importance):
        """Get top contributing risk factors"""
        feature_names = [
            'elevation', 'water_proximity', 'flood_zone', 'building_age',
            'vegetation_density', 'soil_moisture', 'fire_risk', 'temperature',
            'humidity', 'wind_speed', 'precipitation_risk', 'storm_probability',
            'historical_events', 'avg_precipitation', 'avg_temperature'
        ]
        
        # Get top 5 factors
        top_indices = np.argsort(importance)[-5:][::-1]
        
        top_factors = []
        for idx in top_indices:
            if idx < len(feature_names):
                factor_value = features[idx] if idx < len(features) else 0
                top_factors.append({
                    'factor': feature_names[idx],
                    'importance': round(importance[idx], 3),
                    'value': round(factor_value, 3)
                })
        
        return top_factors

class FraudDetectionModel:
    """Machine learning model for detecting insurance fraud"""
    
    def __init__(self, model_path='models/fraud_detection.joblib'):
        self.model_path = model_path
        self.model = None
        self.load_or_create_model()
    
    def load_or_create_model(self):
        """Load existing model or create a new one"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info(f"Loaded fraud detection model from {self.model_path}")
            else:
                self.model = self.create_model()
                logger.info("Created new fraud detection model")
        except Exception as e:
            logger.error(f"Error loading fraud model: {e}")
            self.model = self.create_model()
    
    def create_model(self):
        """Create a new gradient boosting model for fraud detection"""
        model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        
        # Train with synthetic data
        self.train_with_synthetic_data(model)
        
        return model
    
    def train_with_synthetic_data(self, model):
        """Train model with synthetic training data"""
        # Generate synthetic training data
        n_samples = 5000
        features = np.random.rand(n_samples, 12)
        
        # Create synthetic fraud labels (0: legitimate, 1: fraud)
        fraud_probability = (
            features[:, 0] * 0.3 +  # timing factor
            features[:, 1] * 0.2 +  # amount factor
            features[:, 2] * 0.2 +  # documentation factor
            features[:, 3] * 0.3    # behavioral factor
        )
        
        labels = (fraud_probability > 0.7).astype(int)
        
        model.fit(features, labels)
        logger.info("Fraud detection model trained with synthetic data")
    
    def detect_fraud(self, claim_data):
        """Detect potential fraud in an insurance claim"""
        try:
            # Extract features from claim
            features = self.extract_fraud_features(claim_data)
            
            # Get fraud probability
            fraud_prob = self.model.predict_proba([features])[0][1]
            
            # Determine risk level
            if fraud_prob > 0.7:
                risk_level = 'high'
            elif fraud_prob > 0.4:
                risk_level = 'medium'
            else:
                risk_level = 'low'
            
            # Identify risk factors
            risk_factors = self.identify_risk_factors(claim_data, features)
            
            result = {
                'riskLevel': risk_level,
                'fraudProbability': round(fraud_prob, 3),
                'riskFactors': risk_factors,
                'flaggedForReview': risk_level == 'high'
            }
            
            logger.info(f"Fraud detection result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error in fraud detection: {e}")
            return {
                'riskLevel': 'medium',
                'fraudProbability': 0.5,
                'riskFactors': ['analysis_error'],
                'flaggedForReview': True
            }
    
    def extract_fraud_features(self, claim_data):
        """Extract features for fraud detection"""
        features = []
        
        # Timing features
        incident_date = datetime.fromisoformat(claim_data.get('incidentDate', '').replace('Z', '+00:00'))
        report_date = datetime.fromisoformat(claim_data.get('reportedDate', '').replace('Z', '+00:00'))
        reporting_delay = (report_date - incident_date).days
        features.append(min(reporting_delay / 30, 1))  # Normalize to 0-1
        
        # Amount features
        claim_amount = claim_data.get('claimAmount', 0)
        features.append(min(claim_amount / 100000, 1))  # Normalize amount
        
        # Documentation features
        doc_count = len(claim_data.get('documents', []))
        features.append(min(doc_count / 10, 1))  # Normalize doc count
        
        # Claim type features
        claim_type = claim_data.get('claimType', 'other')
        high_fraud_types = ['flood', 'other']
        features.append(1 if claim_type in high_fraud_types else 0)
        
        # Satellite evidence features
        has_satellite_evidence = bool(claim_data.get('satelliteEvidence', {}).get('preDisasterImagery'))
        features.append(1 if has_satellite_evidence else 0)
        
        # Weather correlation (simplified)
        features.append(0.5)  # Would check weather data correlation
        
        # Behavioral features (simplified for demo)
        features.extend([0.3, 0.4, 0.2, 0.6, 0.1, 0.7])  # Placeholder features
        
        return features
    
    def identify_risk_factors(self, claim_data, features):
        """Identify specific risk factors in the claim"""
        risk_factors = []
        
        # Check reporting delay
        if features[0] > 0.5:  # More than 15 days delay
            risk_factors.append('delayed_reporting')
        
        # Check claim amount
        if features[1] > 0.8:  # Very high claim amount
            risk_factors.append('high_claim_amount')
        
        # Check documentation
        if features[2] < 0.2:  # Very few documents
            risk_factors.append('insufficient_documentation')
        
        # Check satellite evidence
        if features[4] == 0:  # No satellite evidence
            risk_factors.append('no_satellite_evidence')
        
        return risk_factors

class AIServiceEngine:
    """Main AI service engine that orchestrates all models"""
    
    def __init__(self):
        self.damage_model = DamageDetectionModel()
        self.risk_model = RiskScoringModel()
        self.fraud_model = FraudDetectionModel()
        
        # Ensure models directory exists
        os.makedirs('models', exist_ok=True)
        
        logger.info("AI Service Engine initialized successfully")
    
    def analyze_risk(self, property_data):
        """Analyze risk for a property"""
        try:
            # Mock satellite and weather data for demo
            satellite_data = {
                'indices': {
                    'ndvi': 0.7,
                    'moisture': 0.4,
                    'nbr': 0.6
                }
            }
            
            weather_data = {
                'current': {
                    'temperature': 25,
                    'humidity': 60,
                    'windSpeed': 15
                },
                'forecast': {
                    'precipitationRisk': 0.3,
                    'stormProbability': 0.2
                },
                'historical': {
                    'extremeEvents': ['hurricane_2019', 'flood_2020'],
                    'avgPrecipitation': 80,
                    'avgTemperature': 22
                }
            }
            
            result = self.risk_model.calculate_risk_score(
                property_data, satellite_data, weather_data
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error in risk analysis: {e}")
            return {'error': str(e)}
    
    def analyze_damage(self, pre_image_url, post_image_url):
        """Analyze damage from satellite imagery"""
        try:
            # For demo, return simulated results
            # In production, would download and process actual images
            
            result = {
                'damagePercentage': np.random.uniform(10, 80),
                'damageType': ['roof_damage', 'structural'],
                'analysisConfidence': np.random.uniform(75, 95),
                'aiModelVersion': 'DamageDetection_v1.0',
                'estimatedLoss': np.random.uniform(10000, 150000)
            }
            
            logger.info(f"Damage analysis result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error in damage analysis: {e}")
            return {'error': str(e)}
    
    def detect_fraud(self, claim_data):
        """Detect fraud in a claim"""
        try:
            result = self.fraud_model.detect_fraud(claim_data)
            return result
        except Exception as e:
            logger.error(f"Error in fraud detection: {e}")
            return {'error': str(e)}

# Global AI engine instance
ai_engine = AIServiceEngine()

def get_ai_engine():
    """Get the global AI engine instance"""
    return ai_engine

if __name__ == "__main__":
    # Test the AI engine
    logger.info("Testing AI Service Engine...")
    
    engine = get_ai_engine()
    
    # Test risk analysis
    test_property = {
        'elevation': 15,
        'proximityToWater': 500,
        'floodZone': 'AE',
        'yearBuilt': 1995
    }
    
    risk_result = engine.analyze_risk(test_property)
    print("Risk Analysis Result:", risk_result)
    
    # Test fraud detection
    test_claim = {
        'incidentDate': '2024-11-01T12:00:00Z',
        'reportedDate': '2024-11-08T12:00:00Z',
        'claimAmount': 50000,
        'claimType': 'flood',
        'documents': [{'fileName': 'damage1.jpg'}],
        'satelliteEvidence': {'preDisasterImagery': {'imageUrl': 'test.jpg'}}
    }
    
    fraud_result = engine.detect_fraud(test_claim)
    print("Fraud Detection Result:", fraud_result)
    
    logger.info("AI Service Engine testing completed")