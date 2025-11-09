# AlphaInsure API Documentation

## Overview

The AlphaInsure API provides comprehensive endpoints for AI-powered insurance risk assessment, claims processing, satellite data integration, and real-time monitoring.

**Base URL**: `http://localhost:3001/api`

## Authentication

All endpoints except authentication require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Demo Credentials

- **User**: demo@alphainsure.com / any password
- **Admin**: admin@alphainsure.com / any password

## API Endpoints

### Authentication (`/api/auth`)

#### POST /api/auth/login

Login to the system.

**Request Body**:

```json
{
  "email": "demo@alphainsure.com",
  "password": "any_password"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "demo@alphainsure.com",
      "name": "Demo User",
      "roles": ["user"],
      "company": "AlphaInsure Demo"
    },
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}
```

#### GET /api/auth/me

Get current user information.

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "1",
    "email": "demo@alphainsure.com",
    "name": "Demo User",
    "roles": ["user"],
    "company": "AlphaInsure Demo"
  }
}
```

### Risk Assessment (`/api/risk`)

#### GET /api/risk/property/:propertyId

Get current risk assessment for a property.

**Parameters**:

- `propertyId` (string): Property identifier

**Response**:

```json
{
  "success": true,
  "data": {
    "property": {
      "propertyId": "PROP_12345",
      "address": {
        "street": "123 Main St",
        "city": "Miami",
        "state": "FL",
        "zipCode": "33101"
      },
      "coordinates": {
        "latitude": 25.7617,
        "longitude": -80.1918
      }
    },
    "riskAssessment": {
      "riskScores": {
        "overall": {
          "score": 75,
          "level": "high",
          "confidence": 87
        },
        "flood": {
          "score": 85,
          "level": "very_high",
          "factors": ["High risk flood zone", "Low elevation"]
        },
        "wildfire": {
          "score": 25,
          "level": "low",
          "factors": []
        }
      }
    }
  }
}
```

#### POST /api/risk/assess

Perform risk assessment for coordinates or property.

**Request Body**:

```json
{
  "coordinates": {
    "lat": 25.7617,
    "lng": -80.1918
  },
  "assessmentType": "on_demand",
  "forceRefresh": false
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "assessmentId": "risk_temp_1699401234567_1699401234567",
    "riskScores": {
      "overall": {
        "score": 68,
        "level": "high",
        "confidence": 85
      },
      "flood": {
        "score": 75,
        "level": "high",
        "factors": ["High historical precipitation", "Low elevation"]
      },
      "wildfire": {
        "score": 45,
        "level": "medium",
        "factors": ["Dense vegetation", "Hot and dry conditions"]
      }
    }
  }
}
```

#### GET /api/risk/heatmap

Get risk heatmap data for a geographic area.

**Query Parameters**:

- `bounds` (string): JSON object with north, south, east, west coordinates
- `riskType` (string): Type of risk (overall, flood, wildfire, etc.)
- `gridSize` (number): Grid resolution in degrees

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "lat": 25.5,
      "lng": -80.5,
      "intensity": 75.5,
      "level": "high"
    }
  ]
}
```

### Claims Processing (`/api/claims`)

#### POST /api/claims/submit

Submit a new insurance claim.

**Request** (multipart/form-data):

```
propertyId: PROP_12345
claimType: hurricane
incidentDate: 2024-11-01T12:00:00Z
claimAmount: 50000
description: Hurricane damage to roof and windows
documents: [file1.jpg, file2.pdf]
```

**Response**:

```json
{
  "success": true,
  "data": {
    "claim": {
      "claimId": "CLM_1699401234567_PROP_12345",
      "propertyId": "PROP_12345",
      "claimType": "hurricane",
      "incidentDate": "2024-11-01T12:00:00Z",
      "claimAmount": 50000,
      "status": "submitted"
    },
    "automation": {
      "automated": true,
      "confidence": 92,
      "decision": "approved"
    }
  }
}
```

#### GET /api/claims/:claimId

Get claim details.

**Response**:

```json
{
  "success": true,
  "data": {
    "claimId": "CLM_1699401234567_PROP_12345",
    "propertyId": "PROP_12345",
    "claimType": "hurricane",
    "status": "approved",
    "automation": {
      "isAutomated": true,
      "confidenceScore": 92,
      "automationReason": "High confidence automated assessment"
    },
    "satelliteEvidence": {
      "damageAnalysis": {
        "damagePercentage": 35,
        "damageType": ["roof_damage", "structural"],
        "analysisConfidence": 89
      }
    }
  }
}
```

#### POST /api/claims/:claimId/automate

Trigger automated claim processing.

**Response**:

```json
{
  "success": true,
  "data": {
    "automation": {
      "automated": true,
      "confidence": 88,
      "damageDetected": true,
      "fraudRisk": "low",
      "decision": "approved"
    }
  }
}
```

### Satellite Data (`/api/satellite`)

#### GET /api/satellite/imagery/:lat/:lng

Get satellite imagery for coordinates.

**Query Parameters**:

- `date` (string): ISO date for imagery
- `source` (string): sentinel, landsat, modis

**Response**:

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://via.placeholder.com/512x512/0066cc/ffffff?text=SENTINEL+img_123",
    "imageId": "img_123",
    "source": "sentinel",
    "captureDate": "2024-11-08T12:00:00Z",
    "resolution": "10m",
    "cloudCover": 15
  }
}
```

#### GET /api/satellite/property-data/:lat/:lng

Get comprehensive satellite data for property.

**Response**:

```json
{
  "success": true,
  "data": {
    "imagery": {
      "imageUrl": "...",
      "captureDate": "2024-11-08T12:00:00Z"
    },
    "indices": {
      "ndvi": 0.68,
      "ndwi": 0.15,
      "nbr": 0.42,
      "moisture": 0.35,
      "temperature": 24.5
    }
  }
}
```

### Monitoring (`/api/monitoring`)

#### GET /api/monitoring/alerts

Get all active alerts.

**Query Parameters**:

- `lat`, `lng` (numbers): Coordinates for location-specific alerts
- `radius` (number): Search radius in kilometers
- `severity` (string): Filter by severity level

**Response**:

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert_1699401234567_wildfire",
        "type": "wildfire",
        "severity": "high",
        "title": "Wildfire Warning",
        "description": "Active wildfire detected within 25km",
        "location": {
          "latitude": 34.0522,
          "longitude": -118.2437
        },
        "issuedAt": "2024-11-08T10:30:00Z",
        "actionRequired": true
      }
    ],
    "count": 1
  }
}
```

#### GET /api/monitoring/dashboard

Get monitoring dashboard data.

**Response**:

```json
{
  "success": true,
  "data": {
    "activeAlerts": 5,
    "monitoredProperties": 15420,
    "highRiskProperties": 234,
    "automatedResponses": 45,
    "alertBreakdown": {
      "critical": 1,
      "high": 2,
      "medium": 2,
      "low": 0
    },
    "systemStatus": {
      "satelliteFeeds": "operational",
      "weatherServices": "operational",
      "aiModels": "operational",
      "alertSystem": "operational"
    }
  }
}
```

## AI Engine API (`http://localhost:5000`)

### POST /api/ai/analyze-risk

Analyze risk for a property using AI models.

**Request**:

```json
{
  "property": {
    "propertyId": "PROP_12345",
    "coordinates": {
      "latitude": 25.7617,
      "longitude": -80.1918
    },
    "riskFactors": {
      "floodZone": "AE",
      "elevation": 5
    }
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "overallRiskScore": 72,
    "confidence": 87,
    "topRiskFactors": [
      {
        "factor": "flood_zone",
        "importance": 0.8,
        "value": 1.0
      }
    ]
  }
}
```

### POST /api/ai/analyze-damage

Analyze damage from satellite imagery.

**Request**:

```json
{
  "preDisasterImagery": {
    "imageUrl": "url_to_before_image",
    "captureDate": "2024-10-01T12:00:00Z"
  },
  "postDisasterImagery": {
    "imageUrl": "url_to_after_image",
    "captureDate": "2024-11-01T12:00:00Z"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "damagePercentage": 35.5,
    "damageType": ["roof_damage", "structural"],
    "analysisConfidence": 89.2,
    "estimatedLoss": 45000
  }
}
```

### POST /api/ai/detect-fraud

Detect fraud in insurance claim.

**Request**:

```json
{
  "claim": {
    "claimId": "CLM_12345",
    "incidentDate": "2024-11-01T12:00:00Z",
    "reportedDate": "2024-11-08T12:00:00Z",
    "claimAmount": 50000,
    "claimType": "flood"
  }
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "riskLevel": "low",
    "fraudProbability": 0.12,
    "riskFactors": [],
    "flaggedForReview": false
  }
}
```

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-11-08T12:00:00Z",
  "path": "/api/risk/assess",
  "method": "POST"
}
```

### Common Error Codes

- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Authenticated**: 1000 requests per 15 minutes per user
- **AI endpoints**: 50 requests per minute (compute-intensive)

## WebSocket Events

Connect to `ws://localhost:3001` for real-time updates:

### Events

- `newClaim`: New claim submitted
- `claimUpdate`: Claim status changed
- `newAlert`: New risk alert issued
- `riskUpdate`: Risk score updated
- `systemStatus`: System health changed

### Example Usage

```javascript
const socket = io("http://localhost:3001");

socket.on("newAlert", (alert) => {
  console.log("New alert:", alert);
});

socket.emit("joinRoom", "alerts");
```

## Example Workflows

### 1. Complete Risk Assessment

```javascript
// 1. Login
const auth = await fetch("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email: "demo@alphainsure.com", password: "demo" }),
});

// 2. Assess risk for coordinates
const risk = await fetch("/api/risk/assess", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    coordinates: { lat: 25.7617, lng: -80.1918 },
  }),
});
```

### 2. Submit and Process Claim

```javascript
// 1. Submit claim with documents
const formData = new FormData();
formData.append("propertyId", "PROP_12345");
formData.append("claimType", "hurricane");
formData.append("claimAmount", "50000");
formData.append("documents", file);

const claim = await fetch("/api/claims/submit", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

// 2. Trigger automation
const automation = await fetch(`/api/claims/${claimId}/automate`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
});
```

This API enables comprehensive integration with the AlphaInsure AI-powered insurance system, providing real-time risk assessment, automated claims processing, and intelligent monitoring capabilities.
