In April 2025, about 500 students applied to Google Developer Groups at JSS Academy of Technical Education, Noida (GDSC JSSATEN) through one platform I built myself. Recruitment Platform V2 took each applicant from sign-up through a quiz, a domain task, a live coding contest and an interview. I spent four months building it, and on the evening before launch I had to rebuild its Postgres migrations from scratch.

## Why I built it

V2 grew out of my first production-level project. After learning frontend, I built [Recruitment 2k24](https://github.com/RamitVishwakarma/Recruitment-Platform) for GDSC on React, Express and MongoDB, with quizzes, task submissions and an admin panel. It could not run code. A club that recruits programmers needed a real coding contest, and V2 was the rebuild that added one.

For 2025 I wanted the whole recruitment cycle in one product:

- **One journey for every applicant.** Sign up once with email or Google, choose a domain, then move through every round from a single dashboard.
- **My own coding judge.** Programming applicants solve timed problems in the browser, and the code runs against my own test cases.
- **A new stack.** Next.js 15 with TypeScript on the frontend, and Postgres through Prisma on the backend, replacing MongoDB.
- **Less manual work for the core team.** Statuses, shortlists and Excel exports are all in one admin dashboard.

Work started on 13 December 2024 with the first backend commit. The frontend followed on 5 January 2025.

## How it helps people

Applicants go through every round on their own from one dashboard, and the core team reviews all of them from an admin dashboard. Applicants pick one of five domains: Web Development, App Development, Machine Learning, Design or Programming.

For applicants, the dashboard shows four steps, and each one unlocks on its date:

1. **Knowing You.** A timed aptitude quiz. Each applicant gets a random set of questions for their year of study.
2. **Task Round.** A domain task matched to their year, with the judging criteria and bonus points listed. For example, first-year Android applicants built a three-screen quiz app.
3. **Coding Contest.** Programming applicants solve timed problems in an in-browser Monaco editor. The judge runs their code against hidden test cases and scores each submission.
4. **Personal Interview.** The final conversation with the team.

Applicants also get email updates, browser push notifications and a profile page with their resume and social links.

For the core team, the admin dashboard lists every candidate by domain. Admins can open a full profile with quiz answers, move a candidate through each status (aptitude, project, review, shortlist, interview) and export everything to Excel. They also write the quiz questions in the dashboard, so nobody touches the code between recruitment seasons.

## Under the hood

V2 is two repositories. The first is a Next.js 15 frontend, [RecruitmentPlatformV2Frontend](https://github.com/RamitVishwakarma/RecruitmentPlatformV2Frontend), deployed on Vercel. The second is an Express API, [RecruitmentPlatformV2](https://github.com/RamitVishwakarma/RecruitmentPlatformV2), running in Docker against Postgres.

![Architecture: applicants and the core team use a Next.js frontend on Vercel, which talks to an Express API in Docker. The API is backed by PostgreSQL, Judge0, AWS S3, and email plus web push.](/blog/recruitment-platform-v2/architecture.svg)

The API handles every round. It hands out quiz questions, stores task links, sends contest code to Judge0 and checks the output against test cases kept in the repo. Prisma defines the data in 11 models, including `User`, `Question` and `ContestSubmission`. Swagger documents the API at `/docs`.

## The Postgres evening before launch

On 12 April 2025, about six hours before the quiz opened at midnight, the production database would not migrate. The fix took about 90 minutes and seven commits. The commit messages show how the evening went better than I can.

The problem came from four months of migrations. Between December and April I had collected 32 Prisma migrations, including two both named `init`, `is_deleted_addition` followed by `is_deleted_addition_again`, and two called `password_not_optional`. The day before launch, one of them dropped the `quizTitle` column while the schema still declared an index on it. The schema and the migration history no longer matched, and the production database would not migrate. Here is the backend log for that evening, in order:

| Time (IST) | Commit | What it did |
| --- | --- | --- |
| 16:23 | `fixed schema` | Dropped an index on `Question.quizTitle` from the Prisma schema |
| 17:08 | `removed all the migrations added new ones` | Moved all 32 old migrations into a `not-using/` folder and generated a single 253-line baseline migration |
| 17:15 | `Fixed prisma` | A whitespace fix to `WORKDIR` in the Dockerfile |
| 17:41 | `FIxed fuckers` | Commented out the entire Postgres service in `docker-compose.yml` |
| 17:43 | `Fixed` | Commented out the API's `depends_on` health check for the database |
| 17:50 | `fixed u mf` | Deleted the old migration files for good |
| 17:51 | `Another fix` | Put the Postgres service, health check and volume back exactly as they were |

I left the messages unedited. At 17:41 I tried running the API without its database container. Ten minutes later I put the container back.

Squashing the history fixed it. I replaced 32 incremental migrations with one baseline migration and applied it to an empty database. With the `pg_isready` health check back in place, the API waited until the database was ready.

I made two follow-ups:

- **15 April, 09:09 to 10:50.** Contest scoring needed two new columns, `score` and `timeElapsed`. I regenerated the baseline and added a `deploy.sh` script that runs `prisma generate`, starts the containers and waits for migrations. I also added a `migration` service to Docker Compose that runs `npx prisma migrate deploy` once Postgres reports healthy. After that, the deploy ran migrations itself, and I stopped running them by hand.
- **28 August 2025.** I redeployed the backend to EC2 against a database that sleeps when idle, so I added a `/wakeDb` endpoint that runs `SELECT 1` through Prisma. I redeployed the frontend to call it on load, so the database wakes up before the first real request. That night took three more commits, including `Fixed the prisma import`.

## 500 students in six days

About 500 students used the platform during the April 2025 recruitment drive, and every round from quiz to interview ran on it. The whole cycle fit into six days:

| Round | Opened | Closed |
| --- | --- | --- |
| Knowing You (aptitude quiz) | 13 Apr, 00:00 | 14 Apr, 00:00 |
| Task Round | 14 Apr, 00:00 | 16 Apr, 15:30 |
| Coding Contest (Programming) | 15 Apr, 14:15 | 15 Apr, 15:30 |
| Personal Interview | 17 Apr | 18 Apr, 03:00 |

The build took about 470 commits across the two repositories and 109 merged pull requests. The backend got 22 commits on 12 April, the day before the quiz opened.

> Coming soon: a domain-wise breakdown, from registrations to selections.

## What Vercel Analytics showed

The frontend shipped with Vercel Web Analytics and Speed Insights, so Vercel collected page views and Core Web Vitals during recruitment week.

> Coming soon: visitors, page views, the peak day and top pages for 12 to 18 April 2025.

## Where V2 fits in my journey

These are my projects so far, in order:

1. **Recruitment 2k24 (V1).** My first production-level project after learning frontend.
2. **Course 21.** A freelance build for a client.
3. **A startup, working on CloudX.**
4. **Recruitment Platform V2.** Live for about 500 students, with the coding contest V1 never had.
5. **Outlier.** Contract projects.

## What I learned

- **Treat migrations as production code.** Thirty-two migrations with names like `is_deleted_addition_again` worked on my laptop and failed in production. Squash early, and run `prisma migrate deploy` in CI or in a migration container from day one.
- **Deploy to staging first.** A staging deploy a week earlier would have caught every problem from 12 April.
- **Make health checks explicit.** Postgres with `pg_isready` plus `depends_on: service_healthy` kept the API from starting before the database was ready.
- **Plan for idle databases.** A `/wakeDb` ping costs one query and saves a candidate from a cold-start timeout.

> Coming soon: screenshots of the landing page, the applicant dashboard, the coding contest editor and the admin dashboard.
