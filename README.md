Web Preview

![Preview 1](public/image/web_preview1.png)
![Preview 2](public/image/web_preview2.png)
![Preview 3](public/image/web_preview3.png)
![Preview 4](public/image/web_preview4.png)

-TRIPVALER-

tripvaler Full-Stack Application for Tech Challenge

    - This is a full-stack version of the application, featuring:
        - AI (GEMINI) Integration, 
        - Map Destination, 
        - Password encryption,
        - User Token, and
        - Trip Reviews functionality.


        
    - a Next.js frontend and a Node.js/Express/PostgreSQL backend.

-----------------------------------------------

Project Structure

    - `/`: Contains the Next.js frontend application.
    - `/server`: Contains the Node.js Express backend application.

-----------------------------------------------
Getting Started

Follow these steps to set up and run the project locally.

-----------------------------------------------
1. Prerequisites
    - [Node.js](https://nodejs.org/) (v18 or later recommended)
    - [npm](https://www.npmjs.com/)
    - [PostgreSQL](https://www.postgresql.org/download/)

-----------------------------------------------
2. Database Setup

    1.  Make sure your PostgreSQL server is running.
    2.  Create a new database for the application. You can use a tool like `psql` or a GUI like pgAdmin.
        *using psql:
            -open cmd
            -type: psql (then open psql)
            -hit enter-enter until password then type your postgre password (it will invinsible when typing)
            -type: CREATE DATABASE tripvaler;

-----------------------------------------------
3. Project File Setup
    - create any folder
    - open VScode app
    - click file (top left) - open the folder (choose created folder)
    - click terminal (top left) - new terminal
    - navigate terminal (below)
    - type: git clone https://github.com/wetdino21/BACALSO-TC82625.git

-----------------------------------------------
3. Backend Setup

    1.  Navigate to the `server` directory:
        - type in terminal: cd server

    2.  Install the backend dependencies:
        - type terminal: npm install
        
    3.  Edit the `.env` file and fill in your PostgreSQL connection details.

        -path: /server/.env
            # PostgreSQL connection settings
            PGHOST=localhost
            PGPORT=5432
            PGUSER=your_postgres_user
            PGPASSWORD=your_postgres_password
            PGDATABASE=tripvaler

            # JWT Secret for signing authentication tokens (use this or edit any for security)
            JWT_SECRET=a-very-strong-and-secret-key-for-jwt
    

-----------------------------------------------
4. Frontend Setup

    1.  From the project root directory, install the frontend dependencies:
        - in terminal (if the current path is in the /server then type: cd .. )
        - if in root path terminal: npm install
        
    2.  Create a local environment file or using the existing .env:
        - path: /.env
        - type: GEMINI_API_KEY=your-api-key-google-gemini 
            - or GEMINI_API_KEY=AIzaSyBZgwkASCmWJ445nVV3tykjrkiSk5oqbC4 (just use my testing key which is working)


        The default settings in this file should work for local development, as it's configured to communicate with the backend server running on port 3001.


-----------------------------------------------
5. Running the Application

    1.  From the **root directory**, run the development script:
        -terminal
            npm run dev
    
        This command will start both the backend server (on `http://localhost:3001`) and the Next.js frontend (on `http://localhost:3000`) concurrently.

    2.  Open your browser and navigate to `http://localhost:3000`.

    When the backend server starts for the first time, it will automatically create the required tables (`users`, `trips`, `reviews`, `trip_participants`) in your database.


-----------------------------------------------
6. Register an account
    - click register



-----------------------------------------------
 That's IT you are good to Go! CONTACT me if any concerns and untintended errors may experience.

Note: any .env is for easy testing purposes. Will hide in production setting.

