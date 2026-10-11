Recruitment 2k24 was my first production project. It is the platform Google Developer Student Clubs at JSS Academy of Technical Education, Noida, used to recruit its 2024 batch. Over 500 students registered, picked a domain, took a timed quiz and submitted a project, and the core team shortlisted them from an admin panel. I built it as the chapter's Web Lead between December 2023 and March 2024, and later cut a promo video for it in After Effects.

![A one-minute walkthrough of Recruitment 2k24.](/videos/recruitmentPlatform2024.mp4 "The Recruitment 2k24 promo video")

## Why the club needed it

A recruitment season has a lot of moving parts: hundreds of applications across five domains, a quiz for each domain, a project for each year, and a shortlist for every domain lead. I wanted one place where an applicant could see what was due next and the core team could see every applicant.

## The season

The site carried the whole season on a published timeline:

| Stage | Date |
| --- | --- |
| Registrations open | 20 Feb 2024 |
| Project submissions | 27 Feb 2024 |
| Quiz round | 3 Mar 2024 |
| Interview shortlisting | 5 Mar 2024 |
| Results | 10 Mar 2024 |

![The landing page for Recruitments 2024.](/blog/recruitment-2k24/landing.webp "The landing page")

![The five domains: Programming, Web Club, Android, Design and Machine Learning.](/blog/recruitment-2k24/domains.webp "Choosing a domain")

![The season timeline from registration to results.](/blog/recruitment-2k24/timeline.webp "The published timeline")

## For applicants

- **Registration.** Name, admission number, year, domain, email and password, validated with Zod before anything reaches the API, or a single click with Google through Firebase Auth.
- **Dashboard.** Three cards for the quiz, the project and the interview, each showing whether it is done, pending or not open yet.
- **Projects.** Each domain and year got its own task, with frontend and backend options, judging criteria and bonus points listed. Applicants submitted a link before the deadline.
- **Quiz.** A 30-minute quiz of 20 questions per domain, with a question navigator. The rules warned that switching tabs or windows would disqualify the attempt, and the timer submitted the quiz automatically at zero.
- **Profile.** A photo, resume and links to GitHub, LinkedIn and other portfolios, so interviewers had everything on one page.

![The registration form with inline validation.](/blog/recruitment-2k24/register.webp "Registration with validation")

![An applicant's dashboard with the quiz, project and interview cards.](/blog/recruitment-2k24/dashboard.webp "The applicant dashboard")

![The quiz guidelines: 30 minutes, no switching tabs, 20 questions.](/blog/recruitment-2k24/quiz-guidelines.webp "Quiz rules")

![A quiz question with the timer and the question navigator.](/blog/recruitment-2k24/quiz-question.webp "Taking the quiz")

![The project submission page with frontend and backend tasks and judging criteria.](/blog/recruitment-2k24/project-submission.webp "Project submission")

Every screen has a mobile layout as well.

![Three mobile screens: the dashboard, registration and password reset.](/blog/recruitment-2k24/mobile.webp "The mobile layout")

## For the core team

Each domain lead got a dashboard with counts of registered applicants, submitted projects and shortlisted candidates. The candidates table filters by year, project status and shortlist status, opens a full profile with every submission, and exports everything to an Excel file in one click. Leads also wrote and edited their domain's quiz from the dashboard.

![The admin dashboard for the Web Club domain.](/blog/recruitment-2k24/admin-dashboard.webp "A domain lead's dashboard")

![The candidates table with year, project status, quiz result, interview status and the Excel export.](/blog/recruitment-2k24/admin-candidates.webp "The candidates table")

## Under the hood

The frontend is React 18 on Vite with Tailwind CSS, React Router and Headless UI. Routes are split with loadable components, so a first-time applicant does not download the admin panel. Protected routes keep applicants and admins apart. The landing page uses GSAP ScrollTrigger with Lenis smooth scrolling. The API is Express with MongoDB, and the frontend is deployed on Vercel.

The code is on GitHub at [Recruitment-Platform](https://github.com/RamitVishwakarma/Recruitment-Platform).

## What came next

Running a real season showed me what was missing. The club recruits programmers, and Recruitment 2k24 could not run code. A year later I rebuilt it as [Recruitment Platform V2](/blog/recruitment-platform-v2), with Next.js, Postgres and a coding contest judged by Judge0.

## What I learned

- **Split the bundle by audience.** Applicants never download the admin panel, which keeps the first visit light on a phone.
- **Put the rules in the product.** The timeline, quiz rules and judging criteria lived on the site, so applicants did not have to dig through chat messages for them.
- **Know what the next version needs.** A club that recruits programmers needs a coding round, and that is the reason V2 exists.
