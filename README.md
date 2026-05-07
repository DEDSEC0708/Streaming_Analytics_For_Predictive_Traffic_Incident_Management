# Streaming Analytics for Predictive Traffic Incident Management

## Overview

This project is a real-time traffic monitoring and predictive analytics platform that uses machine learning to forecast potential traffic incidents before they occur. By analyzing various traffic-related data streams, the system predicts risks using an XGBoost model and presents actionable insights through an interactive dashboard.

The goal is to support smarter traffic management, reduce congestion, and help prevent accidents — making roads safer for everyone.

## Architecture

The system follows a straightforward pipeline:

**Traffic Data → Backend API → XGBoost Prediction Engine → Risk Assessment → Interactive Dashboard**

The backend handles data processing and model inference, while the frontend delivers clean, real-time visualizations for monitoring and decision-making.

## Tech Stack

- **Backend**: Python + Flask
- **Frontend**: React.js
- **Machine Learning**: XGBoost, Scikit-learn
- **Data Processing**: Pandas, NumPy
- **Other**: HTML/CSS/JavaScript, Git & GitHub

## Key Features

- Real-time traffic incident risk prediction
- Interactive analytics dashboard
- Feature importance visualization
- Weather impact analysis on traffic
- Historical prediction trends
- Fully responsive design
- RESTful API integration

## Machine Learning Workflow

1. Data Collection
2. Data Cleaning & Preprocessing
3. Feature Engineering
4. Model Training (XGBoost)
5. Real-time Prediction
6. Risk Classification
7. Dashboard Visualization

## How to Run

### Prerequisites
- Python 3.x
- Node.js & npm
- Git

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python server.py
```

## Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Output
<img width="1913" height="1197" alt="Screenshot 2026-05-08 003534" src="https://github.com/user-attachments/assets/22fb9c2d-2bc8-4034-81af-b7d3fd6f2655" />
Dashboard

---

<img width="1917" height="1198" alt="Screenshot 2026-05-08 003558" src="https://github.com/user-attachments/assets/4f8867aa-f47a-4d1c-9ea8-fb5e9cc0ea6b" />
Prediction

## Applications
Smart City Traffic Management
Intelligent Transportation Systems (ITS)
Accident Prevention Platforms
Urban Mobility Analytics

## Future Enhancements
Integration with live traffic cameras and APIs
Real-time notification and alert system
Mobile app for field teams
Advanced deep learning models
