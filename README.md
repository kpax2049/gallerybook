# Full-Stack Web Application

This project is a full-stack web application built with React (v19) for the frontend and NestJS for the backend. The database used is PostgreSQL, and the ORM is Prisma. The project includes authentication using JSON Web Tokens (JWT).

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v16 or later)
- **npm** (or Yarn)
- **Docker**
- **Docker Compose**

## Project Structure

## DB Schema

%%{init: { "theme": "dark" }}%%
graph LR
subgraph Users
U[User]
P[Profile]
end
subgraph Galleries
G[Gallery]
GT[GalleryTag]
T[Tag]
GR[GalleryReaction]
end
subgraph Comments
C[Comment]
R[Reaction]
AC[ActionCount]
end
F[Follow]

U -->|1:1| P
U -->|1:M| G
U -->|1:M| C
U -->|1:M| GR
U -->|1:M (follower)| F
U <-->|1:M (following)| F

G -->|1:M| C
G -->|1:M| GR
G -->|1:M| GT
T -->|1:M| GT

C -->|1:M replies| C
C -->|1:M selectedActions| R
C -->|1:1 actions| AC

classDef blue fill:#0ea5e9,stroke:#38bdf8,stroke-width:2px,color:#0b1220;
classDef purple fill:#3b0764,stroke:#8b5cf6,stroke-width:2px,color:#e5e7eb;
classDef green fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#e5e7eb;
classDef grey fill:#111827,stroke:#475569,stroke-width:1.5px,color:#e5e7eb;
class U,P blue;
class G,GT,T purple;
class C,R,AC green;
class GR,F grey;

## How to Install and Launch the Project

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/full-stack-app.git
cd full-stack-app
2. Set Up Backend
Navigate to the backend directory and install dependencies:

cd backend
npm install
Copy the .env.example file to .env and configure your environment variables:

cp .env.example .env
# Edit .env file as needed
3. Set Up Frontend
Navigate to the frontend directory and install dependencies:

cd ../frontend
npm install
Copy the .env.example file to .env and configure your environment variables if necessary:

cp .env.example .env
# Edit .env file as needed
4. Docker Compose
Navigate back to the root directory and use Docker Compose to start the application:

cd ..
docker-compose up --build
This command will build and start the Docker containers for both the backend and frontend, along with the PostgreSQL database.

5. Access the Application
Backend API: The NestJS backend will be available at http://localhost:3000.
Frontend Web App: The React frontend will be available at http://localhost:3001.
Technologies Used
Frontend
React (v19): A JavaScript library for building user interfaces.
TypeScript: A statically typed language that builds on JavaScript.
ESLint: A tool to identify and report on patterns found in ECMAScript/JavaScript code, using those defined by you or others.
TSLint: A linter for TypeScript code. (Note: TSLint is deprecated and can be replaced with ESLint for TypeScript.)
Backend
NestJS: A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
Prisma: An ORM that makes it easy to work with databases in a type-safe way.
PostgreSQL: A powerful open-source object-relational database system.
Docker
Docker: A platform for developing, shipping, and running applications inside containers.
Docker Compose: A tool for defining and running multi-container Docker applications.
Configuration Files
Backend:

.env: Environment variables for the backend.
docker-compose.yml: Docker configuration for the backend service.
Dockerfile: Instructions for building the backend Docker image.
Frontend:

.env: Environment variables for the frontend.
docker-compose.yml: Docker configuration for the frontend service.
Dockerfile: Instructions for building the frontend Docker image.
Root Directory:

docker-compose.yml: Combined Docker configuration for both the backend and frontend services.
Contributing
Contributions are welcome! Please open an issue or a pull request to propose changes or improvements.

License
This project is licensed under the MIT License. See the

 file for details.
```
