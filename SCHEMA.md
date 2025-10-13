# Database Schema Documentation

## 📊 Schema Overview

The database schema is designed to support a full-featured GitHub-like platform with the following main entities:

---

## 🗂️ Entity Relationships

### **1. User System**

- **User** - Core user accounts
- **Follow** - User following relationships

### **2. Repository System**

- **Repository** - Code repositories
- **Star** - Repository stars
- **Watch** - Repository watchers
- **Collaborator** - Repository collaborators with permissions
- **Fork Relationship** - Self-referencing for forked repos

### **3. Git System**

- **Branch** - Repository branches
- **Commit** - Commit history
- **Tag** - Git tags/releases

### **4. Issue System**

- **Issue** - Bug reports & feature requests
- **IssueAssignee** - Assigned users
- **IssueLabel** - Issue categorization
- **IssueComment** - Discussion threads
- **Label** - Reusable labels

### **5. Pull Request System**

- **PullRequest** - Code review requests
- **PullRequestAssignee** - Assigned reviewers
- **PullRequestLabel** - PR categorization
- **PullRequestReview** - Code reviews
- **PullRequestComment** - PR discussions

### **6. Organization System**

- **Organization** - Team/company accounts
- **OrganizationMember** - Organization members with roles

### **7. Activity System**

- **Notification** - User notifications
- **Activity** - Activity feed/timeline

---

## 📋 Model Details

### **User Model**

```prisma
Fields:
- id (UUID, Primary Key)
- username (Unique, Indexed)
- email (Unique, Indexed)
- password (Hashed)
- name, bio, location, website, avatarUrl, company
- isVerified (Boolean)
- createdAt, updatedAt (Timestamps)

Relations:
- repositories (one-to-many)
- followers/following (many-to-many via Follow)
- stars, watches (many-to-many)
- issues, pullRequests (one-to-many)
- commits, notifications, activities
```

### **Repository Model**

```prisma
Fields:
- id (UUID, Primary Key)
- name, description
- isPrivate (Boolean, Indexed)
- language (Indexed)
- defaultBranch (default: "main")
- gitUrl (Unique)
- Counters: starsCount, forksCount, watchersCount
- ownerId, forkedFromId, organizationId
- createdAt, updatedAt

Relations:
- owner (User)
- forkedFrom (self-reference for forks)
- branches, commits, tags
- stars, watchers, issues, pullRequests
- collaborators
```

### **Issue Model**

```prisma
Fields:
- id (UUID)
- number (Int, auto-increment per repo)
- title, body
- state (OPEN/CLOSED, Indexed)
- repositoryId, authorId
- closedAt, createdAt, updatedAt

Relations:
- repository, author
- assignees, labels, comments
```

### **PullRequest Model**

```prisma
Fields:
- id (UUID)
- number (Int, auto-increment per repo)
- title, body
- state (OPEN/CLOSED/MERGED, Indexed)
- headBranch, baseBranch
- mergedAt, closedAt, createdAt, updatedAt

Relations:
- repository, author, head branch
- assignees, labels, reviews, comments
```

---

## 🔑 Key Features

### **1. Unique Constraints**

```
- User: username, email
- Repository: [ownerId, name], gitUrl
- Follow: [followerId, followingId]
- Star/Watch: [userId, repositoryId]
- Issue: [repositoryId, number]
- PullRequest: [repositoryId, number]
```

### **2. Indexes for Performance**

```
- User: username, email
- Repository: ownerId, name, language, isPrivate
- Issue: repositoryId, authorId, state
- PullRequest: repositoryId, authorId, state
- Activity: userId, repositoryId, createdAt
- Notification: userId, isRead
```

### **3. Cascade Deletions**

```
All relations use onDelete: Cascade to maintain referential integrity:
- Deleting a user removes their repos, stars, issues, etc.
- Deleting a repo removes branches, commits, issues, PRs, etc.
- Deleting an issue removes assignees, labels, comments
```

### **4. Enums for Type Safety**

```typescript
- PermissionLevel: READ, WRITE, ADMIN
- IssueState: OPEN, CLOSED
- PullRequestState: OPEN, CLOSED, MERGED
- ReviewState: APPROVED, CHANGES_REQUESTED, COMMENTED, DISMISSED
- OrgRole: OWNER, ADMIN, MEMBER
- NotificationType: MENTION, ISSUE_ASSIGNED, PR_ASSIGNED, etc.
- ActivityType: CREATED_REPO, STARRED_REPO, PUSHED_COMMITS, etc.
```

---

## 📊 Statistics & Counts

The schema includes denormalized counters for performance:

- **Repository**: starsCount, forksCount, watchersCount, issuesCount, pullRequestsCount

These should be updated via transactions when the related entities change.

---

## 🔍 Query Patterns

### **Common Queries**

1. **User's Repositories**

```typescript
const repos = await prisma.repository.findMany({
  where: { ownerId: userId },
  include: { stars: true, watchers: true },
});
```

2. **Repository with Issues**

```typescript
const repo = await prisma.repository.findUnique({
  where: { id: repoId },
  include: {
    issues: {
      include: { author: true, assignees: true, labels: true },
    },
  },
});
```

3. **User Activity Feed**

```typescript
const activities = await prisma.activity.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

4. **Pull Requests for Review**

```typescript
const prs = await prisma.pullRequest.findMany({
  where: {
    state: 'OPEN',
    assignees: { some: { userId } },
  },
  include: { repository: true, author: true },
});
```

---

## 🎯 Migration Commands

```bash
# Create a new migration
npx prisma migrate dev --name <migration_name>

# Apply migrations in production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## 📈 Schema Statistics

- **Total Models**: 21
- **Enums**: 7
- **Relations**: 40+
- **Unique Constraints**: 15+
- **Indexes**: 30+
- **Cascade Deletions**: All relations

---

## 🔒 Security Considerations

1. **Password Storage**: Never query or expose user passwords
2. **Private Repositories**: Always filter by `isPrivate` and check permissions
3. **SQL Injection**: Prisma provides parameterized queries by default
4. **Rate Limiting**: Implement at API level for expensive queries
5. **Data Access**: Use row-level security for multi-tenant scenarios

---

## 🚀 Next Steps

1. Create seed data for testing
2. Implement repository services
3. Add full-text search
4. Set up database backups
5. Monitor query performance
