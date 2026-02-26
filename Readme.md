# 🧠 Bitespeed Backend Task – Identity Reconciliation

This project implements the **Identity Reconciliation** backend task for Bitespeed.

The service consolidates customer contact information (email and phone number) across multiple purchases and maintains a unified identity using primary and secondary contact linking.

---

## 🚀 Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma ORM

---

## 📌 Problem Overview

Customers may use different emails or phone numbers while placing orders.

The goal of this service is to:

- Identify if incoming contact details belong to an existing customer
- Link related contacts together
- Maintain exactly one **primary contact**
- Mark additional linked contacts as **secondary**
- Return a consolidated identity response

---

## 📂 Project Structure

```

Bitespeed/
├── .gitignore
├── package-lock.json
├── package.json
├── prisma.config.ts
├── prisma/
│   ├── migrations/
│   │   ├── 20260226174128_init/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── prisma.config.ts
│   └── schema.prisma
├── src/
│   ├── app.ts
│   ├── db/
│   │   └── index.ts
│   ├── index.ts
│   ├── models/
│   │   └── Contact.ts
│   └── routes/
│       └── identify.ts
└── tsconfig.json

````

---

## 🗄 Database Schema

### Contact Table

| Field | Type | Description |
|-------|------|------------|
| id | Int | Primary key |
| email | String? | Email address |
| phoneNumber | String? | Phone number |
| linkedId | Int? | Points to primary contact |
| linkPrecedence | String | "primary" or "secondary" |
| createdAt | DateTime | Created timestamp |
| updatedAt | DateTime | Updated timestamp |
| deletedAt | DateTime? | Soft delete field |

---

## 🔗 API Endpoint

### POST `/identify`

### Request Body

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
````

At least one field must be provided.

---

## ✅ Response Format

```json
{
  "contact": {
    "primaryContatctId": number,
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": [number]
  }
}
```

---

## 🧠 Business Rules Implemented

* If no existing contact → create new primary
* If matching contact exists → merge identities
* Oldest contact always remains primary
* New information creates secondary contact
* Multiple primaries are merged into one
* No secondary links to another secondary
* One identity group always has exactly one primary

---

## ⚙️ Local Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone <your-repo-url>
cd bitespeed-identity-reconciliation
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

---

### 3️⃣ Setup environment variables

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/bitespeed"
```

⚠️ Do NOT commit `.env` to GitHub.

---

### 4️⃣ Run Prisma Migration

```bash
npx prisma migrate dev --name init
```

---

### 5️⃣ Start the server

```bash
npm run dev
```

Server will start at:

```
http://localhost:3000
```

---

## 🧪 Example Request

```bash
POST http://localhost:3000/identify
```

```json
{
  "email": "kshitij.singh@example.com",
  "phoneNumber": "9876543210"
}
```

---

## 🧩 Example Response (First Time – New Contact)

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": [
      "kshitij.singh@example.com"
    ],
    "phoneNumbers": [
      "9876543210"
    ],
    "secondaryContactIds": []
  }
}
```

---

## 🧪 Example Request (Same Person, New Email)

```json
{
  "email": "kshitij.dev@example.com",
  "phoneNumber": "9876543210"
}
```

---

## 🧩 Example Response (Linked Identity)

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": [
      "kshitij.singh@example.com",
      "kshitij.dev@example.com"
    ],
    "phoneNumbers": [
      "9876543210"
    ],
    "secondaryContactIds": [2]
  }
}
```

---

This example clearly demonstrates:

* New primary creation
* Secondary creation when new info appears
* Consolidated identity response

