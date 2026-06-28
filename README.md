# LockMatch

LockMatch is a mobile social networking application designed to connect individuals based on the **MBTI (16 Personalities)** framework. By leveraging psychological compatibility and data-driven matching, LockMatch helps users find the most compatible partners, friends, or collaborators.

## 🌟 Key Features

* **MBTI-Based Matching**: An intelligent algorithm that suggests connections based on personality types (e.g., INFP, ENTJ) and compatibility scores.
* **Intuitive User Profiles**: Visualized personality analysis helping users understand themselves and their potential matches better.
* **Real-time Interaction**: Seamless social connectivity designed for quick engagement.
* **Secure Infrastructure**: Implementation of secure registration systems to ensure user privacy and data integrity.

## 🛠️ Technology Stack

The project utilizes a modern full-stack architecture for cross-platform performance and scalability:

* **Frontend (Mobile)**: 
    * [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/): Building high-performance Android and iOS applications.
    * **React Navigation**: For smooth and native-feeling transitions.
* **Backend**:
    * [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/): Building the RESTful API services.
* **Database**:
    * [MySQL](https://www.mysql.com/): Structured data storage for user profiles and matching logs.
* **DevOps & Tools**:
    * [Docker](https://www.docker.com/): Containerized development environment for services like phpMyAdmin and MySQL.
    * **EAS Build**: Used for cloud-based Android build optimization and deployment.

## 🚀 Getting Started

### Prerequisites

* Node.js (v16 or higher)
* npm or yarn
* Docker Desktop (Recommended for database management)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/LEWCHUNHONG/LockMatch.git](https://github.com/LEWCHUNHONG/LockMatch.git)
    cd LockMatch
    ```

2.  **Install Dependencies**
    ```bash
    # Install frontend/backend packages
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the frontend and backend directory and configure your API endpoints and database credentials:

    Frontend .env
    ``` frontend env
    EXPO_PUBLIC_API_URL=your_api_url
    EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=
    ```

    Backend .env
    ``` backend env
    DB_HOST=
    DB_PORT=
    DB_USER=
    DB_PASS=
    DB_NAME=
    JWT_SECRET=
    BASE_URL=
    AZURE_TEXT_ANALYTICS_ENDPOINT=
    AZURE_TEXT_ANALYTICS_API_KEY=

    AZURE_OPENAI_ENDPOINT=
    AZURE_OPENAI_DEPLOYMENT=
    AZURE_OPENAI_API_KEY=
    AZURE_OPENAI_API_VERSION=
    ```
    
5.  **Run Development Server**

   Frontend:
    ```
    npx expo start
    ```

   Backend:
    ```
    node app.js
    ```

## 📂 Project Structure

```text
LockMatch/
├── frontend/          # React Native frontend
├── backend/           # Node js backend
├── database/          # Lockmatch Database
