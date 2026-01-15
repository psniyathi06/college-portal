# College Portal – Dockerized Full Stack Project

This is a Dockerized College Portal project built using multiple technologies.
The entire project can be run on any laptop using only Docker and Docker Compose.

---

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js (Express)
- Database: MongoDB
- Cache: Redis
- Messaging Queue: RabbitMQ
- ML Service: Python Flask
- Containerization: Docker & Docker Compose

---

## Project Structure

college-portal/
├── backend-node/     → Node.js backend (API, Auth, DB)
├── frontend/         → Frontend HTML/CSS/JS
├── ml-flask/         → ML Flask service + worker
├── docker-compose.yml
└── README.md

---

## Prerequisites

- Docker
- Docker Compose

(No need to install Node.js, Python, MongoDB, Redis locally)

---

## How to Run the Project

1. Clone the repository:
   git clone https://github.com/psniyathi06/college-portal.git

2. Go into the project folder:
   cd college-portal

3. Start all services:
   docker compose up --build

---

## Access the Application

- Backend API: http://localhost:5000
- ML Flask API: http://localhost:8000
- RabbitMQ Dashboard: http://localhost:15672  
  Username: guest  
  Password: guest

- Frontend:
  Open `frontend/index.html` using Live Server or browser

---

## Sample Login Credentials

Password for all users:
kmit123

Student:
- Roll No: 101 to 120

Teacher:
- Email: teacherA@example.com
- Email: teacherB@example.com

---

## Notes

- `node_modules` is intentionally removed
- All dependencies are installed inside Docker containers
- Works on any system with Docker installed

---

## Author

Sai Niyathi Poluri
