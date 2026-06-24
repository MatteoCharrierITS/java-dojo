# Spring Boot Crash Course — Netflix Clone

Corso pratico di **una giornata** su Spring Boot. Costruiamo insieme un'API REST completa per un clone di Netflix, partendo da zero fino ad autenticazione JWT e gestione file.

---

## Programma del corso

| # | Argomento | File lezione | Cheatsheet |
|---|---|---|---|
| 0 | Setup & struttura progetto | [L0-setup](lesson/L0-setup.md) | [📄](cheatsheets/L0-setup.md) |
| 1 | Flyway & migrazioni DB | [L1-flyway](lesson/L1-flyway.md) | [📄](cheatsheets/L1-flyway.md) |
| 2 | Entity & Repository (JPA) | [L2-entity-repository](lesson/L2-entity-repository.md) | [📄](cheatsheets/L2-entity-repository.md) |
| 3 | DTO & Mapping | [L3-dto-mapping](lesson/L3-dto-mapping.md) | [📄](cheatsheets/L3-dto-mapping.md) |
| 4 | Controller & Service | [L4-controller-service](lesson/L4-controller-service.md) | [📄](cheatsheets/L4-controller-service.md) |
| 5 | File upload & download | [L5-file-upload-download](lesson/L5-file-upload-download.md) | [📄](cheatsheets/L5-file-upload-download.md) |
| 6 | Exception handling | [L6-exception-handling](lesson/L6-exception-handling.md) | [📄](cheatsheets/L6-exception-handling.md) |
| 7 | @PreAuthorize & sicurezza | [L7-preauthorize](lesson/L7-preauthorize.md) | [📄](cheatsheets/L7-preauthorize.md) |

**Riferimenti trasversali:**
- [API Reference](lesson/api-reference.md) — tutti gli endpoint del progetto
- [Git Workflow](lesson/git-workflow.md) — branch, commit, PR

---

## Struttura della cartella

```
spring-crash-course/
├── lesson/           ← note delle lezioni (da leggere durante il corso)
├── cheatsheets/      ← riferimento rapido per ogni lezione
├── netflixclone-be/  ← backend Spring Boot (punto di partenza)
└── netflixclone-fe/  ← frontend React (già funzionante, non si tocca)
```

---

## Prerequisiti

Prima del corso assicurati di avere installato:

- **Java 21** — [download](https://adoptium.net/)
- **Maven 3.9+** — solitamente incluso in IntelliJ
- **IntelliJ IDEA** (Community o Ultimate)
- **Docker Desktop** — per avviare PostgreSQL
- **Postman** (o Bruno) — per testare le API

---

## Setup iniziale

### 1. Avvia il database

```bash
cd netflixclone-be
docker compose up -d
```

Questo avvia PostgreSQL 16 su `localhost:5432` con il database `netflixclone`.

### 2. Avvia il backend

Apri `netflixclone-be` in IntelliJ e avvia `NetflixCloneApplication`.

Il server parte su `http://localhost:8080`. Verifica con:

```
GET http://localhost:8080/api/health
```

Risposta attesa: `OK`

### 3. (Opzionale) Avvia il frontend

```bash
cd netflixclone-fe
npm install
npm run dev
```

Il frontend gira su `http://localhost:5173`.

---

## Credenziali di default

All'avvio, l'app crea automaticamente due utenti:

| Username | Password | Ruolo |
|---|---|---|
| `admin` | `admin123` | `ADMIN` |
| `user` | `user123` | `USER` |

Usa `/api/auth/login` per ottenere il token JWT.

---

## Configurazione (`application.properties`)

Il file si trova in `netflixclone-be/src/main/resources/application.properties`.
I valori di default funzionano subito con il `docker-compose.yml` incluso.

| Proprietà | Valore default |
|---|---|
| DB host | `localhost:5432` |
| DB nome | `netflixclone` |
| DB utente | `postgres` |
| DB password | `postgres` |
| Server porta | `8080` |
| JWT scadenza | 24 ore |
| Upload max size | 10 MB |

---

## Durante il corso

Ogni lezione ha:
- una **nota** in `lesson/` con teoria, annotazioni e snippet pronti
- un **cheatsheet** in `cheatsheets/` da usare come riferimento rapido mentre scrivi codice

Il codice di partenza del backend ha già setup, sicurezza e autenticazione. Il tuo compito è costruire sopra: entities, repository, service, controller — lezione per lezione.
