# Front-End Angular Application

This is the front-end part of the application built with Angular. It includes a multi-step registration process and a profile page.

## 📦 Prerequisites

Before running this front-end, make sure the **back-end server is already up and running** .

## 🚀 How to Run

1. Install dependencies:

```bash
npm install
ng serve --o
```
## 🧭 Available Routes 
⚠️ **Important:** Before testing the front-end 'display-map', make sure your database is populated with at least some user data from the first two urls registration.

| Route         | Component                | Description                 |
|---------------|--------------------------|-----------------------------|
| `/`           | RegisterStep1Component   | First step of registration  |
| `/step2`      | RegisterStep2Component   | Second step of registration |
| `/profile`    | ProfileComponent         | User profile page           |
| `/display-map`| DisplayMapComponent      | Map display page            |
