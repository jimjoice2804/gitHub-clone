import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...\n');

    // Clean existing data (dev only)
    console.log('🧹 Cleaning existing data...');
    await prisma.activity.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.pullRequestComment.deleteMany();
    await prisma.pullRequestReview.deleteMany();
    await prisma.pullRequestLabel.deleteMany();
    await prisma.pullRequestAssignee.deleteMany();
    await prisma.pullRequest.deleteMany();
    await prisma.issueComment.deleteMany();
    await prisma.issueLabel.deleteMany();
    await prisma.issueAssignee.deleteMany();
    await prisma.issue.deleteMany();
    await prisma.label.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.commit.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.collaborator.deleteMany();
    await prisma.watch.deleteMany();
    await prisma.star.deleteMany();
    await prisma.organizationMember.deleteMany();
    await prisma.repository.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Existing data cleaned\n');

    // Create users
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user1 = await prisma.user.create({
        data: {
            username: 'johndoe',
            email: 'john@example.com',
            password: hashedPassword,
            name: 'John Doe',
            bio: 'Full-stack developer passionate about open source',
            location: 'San Francisco, CA',
            website: 'https://johndoe.dev',
            isVerified: true,
        },
    });

    const user2 = await prisma.user.create({
        data: {
            username: 'janedoe',
            email: 'jane@example.com',
            password: hashedPassword,
            name: 'Jane Doe',
            bio: 'Software engineer and tech enthusiast',
            location: 'New York, NY',
            isVerified: true,
        },
    });

    const user3 = await prisma.user.create({
        data: {
            username: 'bobsmith',
            email: 'bob@example.com',
            password: hashedPassword,
            name: 'Bob Smith',
            bio: 'DevOps engineer',
            location: 'Austin, TX',
        },
    });

    console.log(`✅ Created ${3} users\n`);

    // Create follows
    console.log('🔗 Creating follow relationships...');
    await prisma.follow.create({
        data: {
            followerId: user1.id,
            followingId: user2.id,
        },
    });

    await prisma.follow.create({
        data: {
            followerId: user2.id,
            followingId: user1.id,
        },
    });

    await prisma.follow.create({
        data: {
            followerId: user3.id,
            followingId: user1.id,
        },
    });

    console.log('✅ Created follow relationships\n');

    // Create repositories
    console.log('📦 Creating repositories...');
    const repo1 = await prisma.repository.create({
        data: {
            name: 'awesome-project',
            description: 'An awesome web application built with React and Node.js',
            language: 'TypeScript',
            ownerId: user1.id,
            gitUrl: '/repos/johndoe/awesome-project.git',
            defaultBranch: 'main',
            starsCount: 0,
            forksCount: 0,
        },
    });

    const repo2 = await prisma.repository.create({
        data: {
            name: 'python-scripts',
            description: 'Collection of useful Python automation scripts',
            language: 'Python',
            ownerId: user2.id,
            gitUrl: '/repos/janedoe/python-scripts.git',
            defaultBranch: 'main',
            isPrivate: false,
        },
    });

    await prisma.repository.create({
        data: {
            name: 'devops-tools',
            description: 'DevOps automation toolkit',
            language: 'Shell',
            ownerId: user3.id,
            gitUrl: '/repos/bobsmith/devops-tools.git',
            defaultBranch: 'main',
        },
    });

    console.log(`✅ Created ${3} repositories\n`);

    // Create branches
    console.log('🌿 Creating branches...');
    await prisma.branch.createMany({
        data: [
            {
                name: 'main',
                repositoryId: repo1.id,
                sha: 'abc123',
                isProtected: true,
            },
            {
                name: 'develop',
                repositoryId: repo1.id,
                sha: 'def456',
            },
            {
                name: 'main',
                repositoryId: repo2.id,
                sha: 'xyz789',
                isProtected: true,
            },
        ],
    });

    console.log('✅ Created branches\n');

    // Create stars and watches
    console.log('⭐ Creating stars and watches...');
    await prisma.star.createMany({
        data: [
            { userId: user2.id, repositoryId: repo1.id },
            { userId: user3.id, repositoryId: repo1.id },
            { userId: user1.id, repositoryId: repo2.id },
        ],
    });

    await prisma.watch.createMany({
        data: [
            { userId: user2.id, repositoryId: repo1.id },
            { userId: user1.id, repositoryId: repo2.id },
        ],
    });

    // Update star counts
    await prisma.repository.update({
        where: { id: repo1.id },
        data: { starsCount: 2, watchersCount: 1 },
    });

    await prisma.repository.update({
        where: { id: repo2.id },
        data: { starsCount: 1, watchersCount: 1 },
    });

    console.log('✅ Created stars and watches\n');

    // Create labels
    console.log('🏷️  Creating labels...');
    const bugLabel = await prisma.label.create({
        data: {
            name: 'bug',
            color: '#d73a4a',
            description: 'Something is not working',
        },
    });

    const featureLabel = await prisma.label.create({
        data: {
            name: 'enhancement',
            color: '#a2eeef',
            description: 'New feature or request',
        },
    });

    await prisma.label.create({
        data: {
            name: 'documentation',
            color: '#0075ca',
            description: 'Improvements or additions to documentation',
        },
    });

    console.log('✅ Created labels\n');

    // Create issues
    console.log('🐛 Creating issues...');
    const issue1 = await prisma.issue.create({
        data: {
            number: 1,
            title: 'Fix login bug',
            body: 'Users are unable to login with their credentials',
            state: 'OPEN',
            repositoryId: repo1.id,
            authorId: user2.id,
        },
    });

    const issue2 = await prisma.issue.create({
        data: {
            number: 2,
            title: 'Add dark mode support',
            body: 'Implement dark mode theme for better user experience',
            state: 'OPEN',
            repositoryId: repo1.id,
            authorId: user3.id,
        },
    });

    // Add labels to issues
    await prisma.issueLabel.createMany({
        data: [
            { issueId: issue1.id, labelId: bugLabel.id },
            { issueId: issue2.id, labelId: featureLabel.id },
        ],
    });

    // Add assignees
    await prisma.issueAssignee.create({
        data: {
            issueId: issue1.id,
            userId: user1.id,
        },
    });

    console.log('✅ Created issues with labels and assignees\n');

    // Create issue comments
    console.log('💬 Creating issue comments...');
    await prisma.issueComment.createMany({
        data: [
            {
                body: 'I can help with this! Let me investigate.',
                issueId: issue1.id,
                authorId: user1.id,
            },
            {
                body: 'Great idea! This would be very useful.',
                issueId: issue2.id,
                authorId: user1.id,
            },
        ],
    });

    console.log('✅ Created issue comments\n');

    // Create commits
    console.log('📝 Creating commits...');
    await prisma.commit.createMany({
        data: [
            {
                sha: 'a1b2c3d4e5f6',
                message: 'Initial commit',
                repositoryId: repo1.id,
                authorId: user1.id,
            },
            {
                sha: 'f6e5d4c3b2a1',
                message: 'Add README',
                repositoryId: repo1.id,
                authorId: user1.id,
                parentSha: 'a1b2c3d4e5f6',
            },
        ],
    });

    console.log('✅ Created commits\n');

    // Create activities
    console.log('📊 Creating activities...');
    await prisma.activity.createMany({
        data: [
            {
                userId: user1.id,
                repositoryId: repo1.id,
                type: 'CREATED_REPO',
                metadata: { repoName: repo1.name },
            },
            {
                userId: user2.id,
                repositoryId: repo1.id,
                type: 'STARRED_REPO',
                metadata: { repoName: repo1.name },
            },
            {
                userId: user1.id,
                type: 'FOLLOWED_USER',
                metadata: { targetUsername: user2.username },
            },
        ],
    });

    console.log('✅ Created activities\n');

    console.log('✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: 3`);
    console.log(`   - Repositories: 3`);
    console.log(`   - Issues: 2`);
    console.log(`   - Stars: 3`);
    console.log(`   - Follows: 3`);
    console.log(`   - Activities: 3`);
    console.log('\n🔐 Login credentials:');
    console.log('   - john@example.com / password123');
    console.log('   - jane@example.com / password123');
    console.log('   - bob@example.com / password123\n');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
