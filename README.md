# MusicHub - Documentation Technique

---

## Table des matières

1. Contexte et objectifs
2. Guide d'installation du projet
3. Architecture applicative 
4. Modèle de données
5. Architecture d'infrastructure
6. Exigences techniques et sécurité
7. Annexes

---

## 1) Contexte et objectifs

MusicHub est une application permettant de rechercher et noter des albums et visualiser des notations des autres utilisateurs de la communauté.

Objectifs techniques :

- Fournir une interface web réactivwe et responsive
- Centraliser la logique métier dans des routes serveur Nuxt (Nitro)
- Persister les donnees utilisateurs et métadonnées dans Supabase
- Récuperer les métadonnées albums et covers via l'API Discogs
- maintenir des statistiques de notation agrégés par album.

---

## 2) Guide d'installation du projet

### 2.1 Prérequis

- Node.js >= 20
- pnpm >= 10
- Compte Supabase (URL + clés)
- Token Discogs (nécessaire pour la récupération des images)

### 2.2 Configuration environnement

Créer ou compléter le fichier `.env` à la racine :

```bash
DISCOGS_TOKEN=your_discogs_token

SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SECRET_KEY=...
```

### 2.3 Installation et exécution

```bash
pnpm install
pnpm dev
```

Application locale : `http://localhost:3000`

### 2.4 Migrations base de données

Les migrations SQL sont situées dans `supabase/migrations` :

- `20260227143902_init_schema.sql` : schema initial
- `20260301120000_auth_profile_trigger.sql` : trigger profil auto
- `20260316000000_fix_ratings_float_and_schema.sql` : ratings en decimal

---

## 3) Architecture applicative

### 3.1 Vue logique

Le système suit une architecture 3 couches :

- **Présentation** : pages Vue/Nuxt (`app/pages`)
- **Application/API** : routes Nitro (`server/api`)
- **Données** : Supabase PostgreSQL + Auth

La source externe pour le catalogue albums est l'API de Discogs.

### 3.2 Diagramme d'architecture logicielle

```mermaid
flowchart LR
    U[Utilisateur] --> FE[Nuxt Frontend]

    FE --> A1[/GET /api/discogs/albums/]
    FE --> A2[/POST /api/discogs/album/]
    FE --> A3[/GET /api/album/:id/]
    FE --> A4[/POST /api/rating/]
    FE --> A5[/GET /api/latest-ratings/]
    FE --> A6[/POST /api/auth/login-username/]
    FE --> A7[/POST /api/auth/register/]

    A1 --> D[Discogs API]
    A3 --> D

    A2 --> S[(Supabase DB)]
    A3 --> S
    A4 --> S
    A5 --> S
    A6 --> S
    A7 --> S

    A6 --> SA[Supabase Auth]
    A7 --> SA
```



### 3.3 Flux de données principal

```mermaid
sequenceDiagram
    participant C as Client
    participant N as Nuxt/Nitro
    participant DG as Discogs
    participant DB as Supabase DB

    C->>N: Recherche album (q)
    N->>DG: /database/search?type=master
    DG-->>N: Albums + covers
    N-->>C: Resultats recherche

    C->>N: POST /api/discogs/album (cache)
    N->>DB: upsert album
    DB-->>N: ok

    C->>N: GET /api/album/:id
    N->>DB: lecture album + stats
    alt album absent
        N->>DG: /masters/:id
        DG-->>N: details album + images
    end
    N-->>C: fiche album

    C->>N: POST /api/rating
    N->>DB: upsert rating
    N->>DB: recompute album_rating_stats
    N-->>C: confirmation
```



---

## 4) Modèle de données

### 4.1 Entités

- `profiles`
- `albums`
- `ratings`
- `reviews`
- `album_rating_stats`

### 4.2 Diagramme UML

```mermaid
classDiagram
    class profiles {
      +uuid user_id PK
      +text username UNIQUE
    }

    class albums {
      +uuid id PK
      +text source
      +uuid source_id
      +text title
      +text primary_artist_name
      +text artist
      +date first_release_date
      +text cover_url
      +jsonb raw
      +timestamptz created_at
    }

    class ratings {
      +uuid id PK
      +uuid user_id FK
      +uuid album_id FK
      +float8 rating [0.5..5]
      +timestamptz created_at
      +timestamptz updated_at
      +UNIQUE(user_id, album_id)
    }

    class reviews {
      +uuid id PK
      +uuid rating_id FK
      +uuid user_id FK
      +uuid album_id FK
      +text context
      +timestamptz created_at
      +timestamptz updated_at
    }

    class album_rating_stats {
      +uuid album_id PK/FK
      +int rating_count
      +float8 rating_sum
      +float8 rating_avg
      +timestamptz updated_at
    }

    profiles "1" --> "0..*" ratings : user_id
    albums "1" --> "0..*" ratings : album_id
    ratings "1" --> "0..*" reviews : rating_id
    profiles "1" --> "0..*" reviews : user_id
    albums "1" --> "0..*" reviews : album_id
    albums "1" --> "1" album_rating_stats : album_id
```



---

## 5) Architecture d'infrastructure

### 5.1 Composants d'infrastructure

- Navigateur utilisateur
- Runtime Node.js (Nuxt/Nitro)
- Supabase (Auth + PostgreSQL)
- Discogs API (service externe)
- Variables d'environnement serveur (`DISCOGS_TOKEN`, `SUPABASE_*`)

### 5.2 Diagramme d'infrastructure

```mermaid
flowchart TB
    subgraph Client
      B[Browser]
    end

    subgraph Runtime[Nuxt/Nitro Runtime]
      N[Node.js Server]
      E[Env Vars]
    end

    subgraph Supabase
      AUTH[Auth]
      PG[(PostgreSQL)]
    end

    subgraph Externe
      DG[Discogs API]
    end

    B <--> N
    E --> N
    N <--> AUTH
    N <--> PG
    N <--> DG
```



---

## 6) Exigences techniques et sécurité

### 6.1 Exigences fonctionnelles

- recherche d'albums ;
- consultation de détails album ;
- notation utilisateur (0.5 à 5) ;
- affichage des notations récentes ;
- consultation de profil public.

### 6.2 Exigences non fonctionnelles

- réactivite UI (Nuxt + SSR/hydratation) ;
- maintenabilité (TypeScript + séparation `app/` et `server/`) ;
- cohérence des données via contraintes SQL et upsert ;
- performance correcte via cache en base de données des albums.

### 6.3 Sécurité

- secrets uniquement cote serveur (`SUPABASE_SECRET_KEY`, `DISCOGS_TOKEN`) ;
- routes sensibles protegées par vérification utilisateur (`serverSupabaseUser`) ;
- service rôle utilisé côté serveur pour opérations admin ;
- contrôle de validation d'entrées sur les payloads API.

---

## 7) Annexes

### 7.1 Endpoints internes principaux

- `GET /api/discogs/albums`
- `POST /api/discogs/album`
- `GET /api/album/:id`
- `POST /api/rating`
- `GET /api/latest-ratings`
- `POST /api/auth/login-username`
- `POST /api/auth/register`
- `GET /api/profile/:username`

### 7.2 Structure de projet

```text
app/
  pages/
  components/
server/
  api/
  utils/
supabase/
  migrations/
docs/
```

