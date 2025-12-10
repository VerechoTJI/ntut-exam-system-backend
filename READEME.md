# NTUT Exam System - Backend

# Base On

1. piston: a judge system for programming contests
2. postgresql: a powerful, open source object-relational database system

# How to set up piston server

```bash
git clone https://github.com/engineer-man/piston
# Start the API container
docker-compose up -d api

# Install all the dependencies for the cli
cd cli && npm i && cd -
cli/index.js ppman install python

```

# Docker Setup (For environment setup)

1. You need to install [Docker](https://www.docker.com/get-started/) first(with docker-compose).
2. run the follow

```
docker-compose up -d
```

# How to Run Backend Server

clone this repository and run the following commands:

```bash
npm install
npm run dev
```
