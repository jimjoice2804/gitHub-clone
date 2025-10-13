# Database Schema Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GITHUB CLONE DATABASE SCHEMA                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│      USER        │◄───────►│     FOLLOW       │         │  ORGANIZATION    │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ followerId (FK)  │         │ id (PK)          │
│ username (UQ)    │         │ followingId (FK) │         │ name (UQ)        │
│ email (UQ)       │         └──────────────────┘         │ ownerId (FK) ────┼─┐
│ password         │                                       └──────────────────┘ │
│ name             │                                                 │          │
│ bio              │                                                 │          │
│ avatarUrl        │                                                 ▼          │
│ isVerified       │         ┌──────────────────┐         ┌──────────────────┐│
│ createdAt        │         │ ORGANIZATION     │         │ ORG_MEMBER       ││
└────┬─────────────┘         │    MEMBER        │         ├──────────────────┤│
     │                       ├──────────────────┤         │ orgId (FK)       ││
     │                       │ organizationId   │◄────────┤ userId (FK)      ││
     │                       │ userId (FK) ─────┼─────────┤ role (ENUM)      ││
     │                       │ role (ENUM)      │         └──────────────────┘│
     │                       └──────────────────┘                             │
     │                                                                         │
     │          ┌─────────────────────────────────────────────────────────────┘
     │          │
     │          ▼
     │    ┌──────────────────┐         ┌──────────────────┐
     │    │   REPOSITORY     │◄────────│  COLLABORATOR    │
     │    ├──────────────────┤         ├──────────────────┤
     ├───►│ id (PK)          │         │ repositoryId (FK)│
     │    │ name (UQ)        │         │ userId (FK) ─────┼────┐
     │    │ ownerId (FK)     │         │ permission       │    │
     │    │ forkedFromId(FK) │─┐       └──────────────────┘    │
     │    │ organizationId   │ │                               │
     │    │ isPrivate        │ │       ┌──────────────────┐    │
     │    │ language         │ │       │      STAR        │    │
     │    │ defaultBranch    │ │       ├──────────────────┤    │
     │    │ gitUrl (UQ)      │ │       │ userId (FK) ─────┼────┤
     │    │ starsCount       │ │       │ repositoryId (FK)│◄───┤
     │    │ forksCount       │ │       └──────────────────┘    │
     │    └────┬─────────────┘ │                               │
     │         │               │       ┌──────────────────┐    │
     │         │               └──────►│      WATCH       │    │
     │         │                       ├──────────────────┤    │
     │         │                       │ userId (FK) ─────┼────┘
     │         │                       │ repositoryId (FK)│
     │         │                       └──────────────────┘
     │         │
     │         ├─────────────┐
     │         │             │         ┌──────────────────┐
     │         │             └────────►│     BRANCH       │
     │         │                       ├──────────────────┤
     │         │                       │ id (PK)          │
     │         │                       │ name             │
     │         │                       │ repositoryId (FK)│
     │         │                       │ sha              │
     │         │                       │ isProtected      │
     │         │                       └──────────────────┘
     │         │
     │         │                       ┌──────────────────┐
     │         │                       │     COMMIT       │
     │         ├──────────────────────►├──────────────────┤
     │         │                       │ id (PK)          │
     ├─────────┼───────────────────────┤ sha (UQ)         │
     │         │                       │ message          │
     │         │                       │ repositoryId (FK)│
     │         │                       │ authorId (FK)    │
     │         │                       │ parentSha        │
     │         │                       └──────────────────┘
     │         │
     │         │                       ┌──────────────────┐
     │         │                       │       TAG        │
     │         └──────────────────────►├──────────────────┤
     │                                 │ id (PK)          │
     │                                 │ name             │
     │                                 │ repositoryId (FK)│
     │                                 │ sha              │
     │                                 │ message          │
     │                                 └──────────────────┘
     │
     │         ┌──────────────────┐
     │         │      ISSUE       │         ┌──────────────────┐
     │         ├──────────────────┤         │  ISSUE_ASSIGNEE  │
     │         │ id (PK)          │◄────────┤ issueId (FK)     │
     ├────────►│ number           │         │ userId (FK) ─────┼────┐
     │         │ title            │         └──────────────────┘    │
     │         │ body             │                                 │
     │         │ state (ENUM)     │         ┌──────────────────┐    │
     │         │ repositoryId (FK)│         │  ISSUE_COMMENT   │    │
     │         │ authorId (FK)    │◄────────┤ issueId (FK)     │    │
     │         │ closedAt         │         │ authorId (FK) ───┼────┤
     │         └────┬─────────────┘         │ body             │    │
     │              │                       └──────────────────┘    │
     │              │                                                │
     │              │                       ┌──────────────────┐    │
     │              │                       │  ISSUE_LABEL     │    │
     │              └──────────────────────►├──────────────────┤    │
     │                                      │ issueId (FK)     │    │
     │                                      │ labelId (FK) ────┼─┐  │
     │                                      └──────────────────┘ │  │
     │                                                           │  │
     │         ┌──────────────────┐                             │  │
     │         │   PULL REQUEST   │         ┌──────────────────┐│  │
     │         ├──────────────────┤         │  PR_ASSIGNEE     ││  │
     │         │ id (PK)          │◄────────┤ pullRequestId    ││  │
     ├────────►│ number           │         │ userId (FK) ─────┼┼──┤
     │         │ title            │         └──────────────────┘│  │
     │         │ body             │                             │  │
     │         │ state (ENUM)     │         ┌──────────────────┐│  │
     │         │ repositoryId (FK)│         │  PR_REVIEW       ││  │
     │         │ authorId (FK)    │◄────────┤ pullRequestId    ││  │
     │         │ headBranch       │         │ reviewerId (FK) ─┼┼──┤
     │         │ baseBranch       │         │ state (ENUM)     ││  │
     │         │ mergedAt         │         │ body             ││  │
     │         │ closedAt         │         └──────────────────┘│  │
     │         └────┬─────────────┘                             │  │
     │              │                       ┌──────────────────┐│  │
     │              │                       │  PR_COMMENT      ││  │
     │              │                       ├──────────────────┤│  │
     │              │                       │ pullRequestId    ││  │
     │              │                       │ authorId (FK) ───┼┼──┤
     │              │                       │ body             ││  │
     │              │                       └──────────────────┘│  │
     │              │                                           │  │
     │              │                       ┌──────────────────┐│  │
     │              │                       │   PR_LABEL       ││  │
     │              └──────────────────────►├──────────────────┤│  │
     │                                      │ pullRequestId    ││  │
     │                                      │ labelId (FK) ────┼┼──┘
     │                                      └──────────────────┘│
     │                                                           │
     │                                      ┌──────────────────┐│
     │                                      │      LABEL       ││
     │                                      ├──────────────────┤│
     │                                      │ id (PK)          │◄┘
     │                                      │ name (UQ)        │
     │                                      │ color            │
     │                                      │ description      │
     │                                      └──────────────────┘
     │
     │         ┌──────────────────┐
     │         │  NOTIFICATION    │
     ├────────►├──────────────────┤
     │         │ id (PK)          │
     │         │ userId (FK)      │
     │         │ type (ENUM)      │
     │         │ title            │
     │         │ message          │
     │         │ isRead           │
     │         │ link             │
     │         └──────────────────┘
     │
     │         ┌──────────────────┐
     │         │    ACTIVITY      │
     └────────►├──────────────────┤
               │ id (PK)          │
               │ userId (FK)      │
               │ repositoryId (FK)│
               │ type (ENUM)      │
               │ metadata (JSON)  │
               │ createdAt        │
               └──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              ENUMS & TYPES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ PermissionLevel: READ | WRITE | ADMIN                                      │
│ IssueState: OPEN | CLOSED                                                  │
│ PullRequestState: OPEN | CLOSED | MERGED                                   │
│ ReviewState: APPROVED | CHANGES_REQUESTED | COMMENTED | DISMISSED          │
│ OrgRole: OWNER | ADMIN | MEMBER                                            │
│ NotificationType: MENTION | ISSUE_ASSIGNED | PR_ASSIGNED | ...             │
│ ActivityType: CREATED_REPO | STARRED_REPO | PUSHED_COMMITS | ...           │
└─────────────────────────────────────────────────────────────────────────────┘

Legend:
  ─────  One-to-Many relationship
  ◄────  Foreign Key reference
  (PK)   Primary Key
  (FK)   Foreign Key
  (UQ)   Unique constraint
```
