Zealicon is the annual techno-cultural fest of JSS Academy of Technical Education, Noida. For Zealicon 2025, as lead of the college's Google Developer Groups chapter, I built the platform behind it: the website where students browse events and buy merch, the paid Zeal ID that gets them through the gate, and the API, payments and deploys underneath. From 9 to 16 May 2025 the site had 4,971 visitors and 14,010 page views, and it used so much bandwidth that Vercel paused my account.

![Vercel Web Analytics for zealicon2025.in, 9 to 16 May 2025: 4,971 visitors, 14,010 page views and a 52% bounce rate.](/blog/zealicon-2025/analytics-may-9-16.webp "Vercel Web Analytics for fest week, 9 to 16 May 2025")

## What the platform did

- **Zeal IDs.** Every attendee needed a Zeal ID to get in. Students signed up with an email OTP, uploaded a photo and their college ID card, paid 300 rupees through Razorpay and got their Zeal ID straight away.
- **Pass checks.** Looking up a Zeal ID returns the holder's name, photo and college ID card, which is how a pass gets checked at the gate.
- **Events.** Cultural and technical event listings with enrollment, and an admin export of everyone enrolled in each event.
- **Merch.** A store with sizes, paid orders and an admin page for updating order status.
- **Admin.** Organisers created, edited and removed events and merch from an admin panel without touching code.

## The stack

The site is Next.js with Redux Toolkit, Formik, GSAP and Lenis, deployed on Vercel at zealicon2025.in. The API is Express and MongoDB, split into auth, events, Zeal ID and merch routes. Photos and ID cards upload straight from the browser to Cloudinary using a signature from the API, so the files never pass through the server. Email goes out through ZeptoMail. The API runs in Docker on AWS EC2, and every route sits behind a rate limiter.

## Payments I could prove

Money is the one part that cannot go wrong, so a Zeal ID is issued only when the server can prove the payment happened. There are three steps.

1. **Checkout.** The API creates a Razorpay order for 300 rupees, tags it as a registration and stores the order ID on the user. A user who already has a Zeal ID gets a 403 instead of a second order.
2. **Verification.** After payment the browser sends back the payment ID, order ID and signature. The API recomputes the HMAC-SHA256 signature with its secret, then fetches the payment from Razorpay to confirm it was captured or authorized. Only then does it issue the Zeal ID.
3. **Webhook.** Razorpay also calls a webhook, signed with a separate secret. If the student closed the tab mid-payment, the webhook still issues the Zeal ID. If the browser got there first, the webhook sees the existing ID and does nothing. Merch orders are marked paid the same way.

I tested the whole flow with real one-rupee payments before setting the price back to 300.

![Backend logs during a test payment: the Razorpay webhook arrives, a Zeal ID is issued, and the duplicate webhook is ignored. Order and user IDs are blurred.](/blog/zealicon-2025/razorpay-webhook-logs.webp "A test payment going through the webhook")

## A deploy on every merge

A GitHub Actions pipeline installs, builds and packages the API as a Docker image on every push. When a change lands on main, a second job connects to the EC2 instance over SSH, pulls the code, rebuilds the image and replaces the running container. The build job took 41 seconds, so a fix reached production minutes after it was merged, which mattered during fest week.

![GitHub Actions run 11 of the Zealicon25 CI/CD Pipeline on 9 May 2025, with build-and-test and deploy both passing.](/blog/zealicon-2025/ci-cd-run.webp "The pipeline the night the order bug was fixed")

## Fest week from the dashboards

Traffic started on 9 May and peaked on 12 May at about 1,800 visitors in a single day. I checked the dashboard through the week, and the seven-day totals grew like this:

| Checked | Visitors, last 7 days | Page views, last 7 days |
| --- | --- | --- |
| 11 May | 393 | 1,318 |
| 12 May, 1 PM | 1,849 | 5,405 |
| 12 May, 8 PM | 2,456 | 7,392 |
| 13 May | 3,207 | 10,037 |
| 14 May | 3,762 | 11,362 |
| 16 May | 4,971 | 14,010 |

88% of visitors were on a phone, mostly Android, and 99% were in India. Instagram sent more than half of all referred visitors and Google another 30%. After the home page, the most visited pages were events, the team page and merch.

![Pages, referrers, countries, devices and operating systems for 9 to 16 May 2025.](/blog/zealicon-2025/audience.webp "Who visited and how")

![Referrers for fest week: Instagram 54%, Google 30%, then Android search, Bing and others.](/blog/zealicon-2025/referrers.webp "Where visitors came from")

## The week Vercel paused my account

On 12 May the site served 58 GB in twelve hours, and Vercel's firewall counted 25,500 requests in a single hour. That day Vercel told me the free team had used its whole 100 GB Fast Data Transfer allowance. By 16 May usage had reached 300%, and Vercel paused the team.

![Vercel Observability for the last 12 hours on 12 May 2025: 58 GB of outgoing data and edge requests peaking near 10,000.](/blog/zealicon-2025/observability-58gb.webp "58 GB served in twelve hours")

![Vercel Firewall for one hour on 12 May 2025: 25.5k requests, all allowed.](/blog/zealicon-2025/firewall-25k.webp "25,500 requests in one hour")

![Vercel notifications on 16 May 2025: the free team had used 300% of its 100 GB Fast Data Transfer allowance.](/blog/zealicon-2025/transfer-300-percent.webp "300% of the free transfer allowance")

The API barely noticed. Its EC2 instance stayed under 5% CPU all week. The limit I hit was bandwidth on the frontend host, not compute.

![CloudWatch for the API instance from 9 to 15 May 2025. CPU peaked at 4.87%.](/blog/zealicon-2025/cloudwatch.webp "The API server during fest week")

## Bots show up before users do

Within days of going live, the API logs filled with bots asking for `/.env`, `/.git/config`, `/.aws/credentials` and PHPUnit's `eval-stdin.php`. Every one got a 404, because the API answers only the routes it defines and serves nothing from disk.

![API logs on 9 May 2025: bots probing for .env files and git config, every request answered with a 404.](/blog/zealicon-2025/bot-scans.webp "Bots probing the API for secrets")

## What I learned

- **Prove every payment on the server.** Check the signature, then ask the payment provider directly. A signed webhook covers the students who close the tab.
- **Make payment handlers idempotent.** The browser and the webhook race each other, and webhooks can arrive twice. Issuing a Zeal ID only when none exists made duplicates harmless.
- **Budget bandwidth, not only compute.** The server idled at 5% CPU while the free tier ran out of transfer. Large media belongs on a CDN with its own budget, sized before launch.
- **Set trust proxy on purpose.** Behind a proxy, express-rate-limit warns when `trust proxy` is off, because every user looks like one IP, and again when it is `true`, because anyone can fake their IP. The right value is the number of proxies in front of the app.
