# WorkIQ HRMS

WorkIQ HRMS is a comprehensive Human Resources Management System that leverages Artificial Intelligence to streamline various HR processes, from recruitment and employee development to daily operations and analytics.

## Features

### AI-Powered Features

WorkIQ HRMS integrates several AI capabilities, primarily through Supabase functions, to enhance efficiency and provide intelligent insights.

- **Resume Analysis (analyze-candidate-resume, analyze-resume):**

  - *What it does:* Analyzes candidate resumes to extract key information, skills, and qualifications.
  - *How it's done:* Processes resume text to identify relevant data points.
  - *AI API Used (Inferred):* Natural Language Processing (NLP) API (e.g., OpenAI GPT, Google Cloud Natural Language API, AWS Comprehend).

- **Employee Career Analysis (analyze-employee-career):**

  - *What it does:* Evaluates employee career paths, identifies growth opportunities, and suggests development plans.
  - *How it's done:* Analyzes employee data, performance reviews, and skill sets.
  - *AI API Used (Inferred):* Natural Language Processing (NLP) and/or Machine Learning (ML) API for data analysis and recommendations.

- **Career Coach Chat (career-coach-chat):**

  - *What it does:* Provides an AI-powered chatbot for employees seeking career advice and guidance.
  - *How it's done:* Engages in conversational interactions to answer career-related questions.
  - *AI API Used (Inferred):* Conversational AI / Chatbot API (e.g., OpenAI GPT, Google Dialogflow, AWS Lex).

- \*\*General Chat Assistant (chat-assistant):

  - *What it does:* Offers a general-purpose AI assistant for various HR-related queries and tasks.
  - *How it's done:* Responds to user inputs with relevant information and assistance.
  - *AI API Used (Inferred):* Conversational AI / Chatbot API (e.g., OpenAI GPT, Google Dialogflow, AWS Lex).

- **Candidate Comparison (compare-candidates):**

  - *What it does:* Compares multiple candidates based on their resumes, interview performance, and other relevant data.
  - *How it's done:* Processes and scores candidate profiles against job requirements.
  - *AI API Used (Inferred):* Natural Language Processing (NLP) and/or Machine Learning (ML) API for comparative analysis.

- **Employee Profile Creation (create-employee-profile):**

  - *What it does:* Assists in creating comprehensive employee profiles by extracting and organizing information.
  - *How it's done:* Automates data entry and structuring for new employee records.
  - *AI API Used (Inferred):* Natural Language Processing (NLP) API for data extraction and entity recognition.

- **Response Evaluation (evaluate-response):**

  - *What it does:* Evaluates responses, potentially from interviews or surveys, for relevance and quality.
  - *How it's done:* Analyzes text-based responses against predefined criteria.
  - *AI API Used (Inferred):* Natural Language Processing (NLP) API for sentiment analysis and content evaluation.

- **Interview Question Generation (generate-interview-questions):**

  - *What it does:* Generates relevant interview questions based on job descriptions and desired skills.
  - *How it's done:* Creates tailored questions to assess candidate suitability.
  - *AI API Used (Inferred):* Text Generation AI API (e.g., OpenAI GPT, Google PaLM).

- **Recruitment Insights (recruitment-insights):**

  - *What it does:* Provides analytical insights into recruitment processes, identifying trends and areas for improvement.
  - *How it's done:* Processes recruitment data to generate reports and visualizations.
  - *AI API Used (Inferred):* Data Analysis / Machine Learning (ML) API for predictive analytics and reporting.

- **Speech Synthesis (synthesize-speech):**

  - *What it does:* Converts text into natural-sounding speech.
  - *How it's done:* Generates audio output from text input.
  - *AI API Used (Inferred):* Text-to-Speech (TTS) API (e.g., Google Cloud Text-to-Speech, AWS Polly).

- **Audio Transcription (transcribe-audio):**

  - *What it does:* Converts spoken audio into text.
  - *How it's done:* Processes audio input to produce a written transcript.
  - *AI API Used (Inferred):* Speech-to-Text (STT) API (e.g., Google Cloud Speech-to-Text, AWS Transcribe).

### Dashboards

WorkIQ HRMS provides tailored dashboards for different user roles, offering relevant information and functionalities.

- **Admin Dashboard (AdminDashboard.tsx):**

  - *Features:* Comprehensive overview of the entire HRMS, user management, system configuration, access to all modules, high-level analytics, and administrative controls.

- **Employee Dashboard (EmployeeDashboard.tsx):**

  - *Features:* Personal information, leave requests and status, access to career development resources, internal job postings, performance reviews, and communication tools.

- **HR Dashboard (HRDashboard.tsx):**

  - *Features:* Recruitment pipeline management, employee records, leave management approvals, performance management, training and development tracking, and HR analytics.

- **Manager Dashboard (ManagerDashboard.tsx):**

  - *Features:* Team performance overview, direct report management, approval of leave requests, access to team-specific analytics, and tools for employee feedback.

- **Notifications List (NotificationsList.tsx):**

  - *Features:* Displays system notifications, alerts, and reminders relevant to the logged-in user. This component is likely integrated into the various dashboards.


Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```
This project is built with:

- Frontend - Vite + React, Tailwind CSS, shadcn-ui
- Backend - TypeScript, Express.js , Node.js 
- Database - PostgreSQL
