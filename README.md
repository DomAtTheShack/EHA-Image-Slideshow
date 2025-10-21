Digital Signage CMS Project
This project contains the complete setup for a digital signage content management system. It's split into two main parts: a React frontend for the display and a Node.js/Express backend for content management.
Project Structure
.
├── backend/              # Node.js API
│   ├── models/
│   │   └── globalConfigModel.js # Mongoose schema for images
│   ├── routes/
│   │   └── apiRoutes.js # API routes for the display
│   ├── .env.example      # Example environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js         # Main API server file
│
├── frontend/             # React Display App
│   ├── public/
│   │   └── index.html    # HTML shell for the React app
│   ├── src/
│   │   ├── App.jsx       # Main React component (the display)
│   │   └── index.js      # React entry point
│   ├── .gitignore
│   └── package.json
│
└── README.md             # This file


## Getting Started
### Prerequisites
Node.js and npm (or yarn) installed
A MongoDB database (local or cloud-based like MongoDB Atlas)
A code editor (like VS Code)
Setup & Installation
Clone the repository (or create the files as provided).
Set up the Backend:
Navigate to the backend directory: cd backend
Install dependencies: npm install
Create a .env file by copying .env.example and fill in your details (especially your MONGO_URI).
Start the backend server: npm start
The API will be running on http://localhost:5001.
Set up the Frontend:
In a new terminal, navigate to the frontend directory: cd frontend
Install dependencies: npm install
Start the React development server: npm start
The frontend will open and run on http://localhost:3000.
You should now have both the frontend display and the backend API running locally.
