InternShield — Project Log

About the Project

InternShield is a website that helps students identify fake internships and job offers. Students can paste a recruitment message into the website, and it analyses the message to find possible scam signs.

The system looks for warning signs such as registration fees, unrealistic salaries, urgent payment requests, and suspicious recruiter details. It uses predefined rules and AI to analyse the message and generate a risk score. The result shows whether the offer is likely safe, suspicious, or likely a scam, along with explanations and safety tips.

The website also supports community reporting, helping students identify recruiters who have been reported previously. InternShield aims to make internship hunting safer and help students avoid recruitment fraud. However, users should always verify a company before trusting an offer.

How is the Risk Score Calculated?

InternShield calculates a risk score from 0 to 100 using predefined rules and AI analysis. The rule-based system checks for scam signs and assigns points according to their severity:

High severity: 25 points

Medium severity: 12 points

Low severity: 6 points

The rule-based score is capped at 100. When AI analysis is available, the final score is calculated using 70% of the AI score and 30% of the rule-based score. Certain serious warning signs can also enforce a minimum score of 75.

0–34: Likely Safe

35–64: Suspicious

65–100: Likely Scam

Database Integration

InternShield uses Supabase (PostgreSQL) to store and check community reports of suspicious recruiters. The backend connects to the database using environment variables and checks whether recruiter details match previously reported information.

Tech Stack

Next.js 14: Used to build the website and handle backend operations.

React 18: Used to create interactive website components.

JavaScript and JSX: Used to write the application's logic and interface.

Tailwind CSS 3: Used to design and style the website.

Node.js: Used for server-side functionality.

Anthropic API: Used for AI-based scam analysis.

Supabase: Used to store and check community reports.

PostgreSQL: Used as the database technology.

Vercel: Used to host and deploy the website.

PostCSS and Autoprefixer: Used for CSS processing and browser compatibility.
