# Ashish Gurav — Flask DevOps Portfolio

A responsive Cloud & DevOps portfolio built with **Python + Flask**, with a JSON API and Docker support.

## Tech stack

- Python
- Flask
- HTML5
- CSS3
- JavaScript
- Docker
- Git/GitHub

## Run locally with Python

```bash
python -m venv .venv
```

Activate the environment:

**macOS/Linux**
```bash
source .venv/bin/activate
```

**Windows**
```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the app:

```bash
python app.py
```

Open:

`http://localhost:5000`

Health check:

`http://localhost:5000/health`

API:

`http://localhost:5000/api/projects`

## Run with Docker

Build:

```bash
docker build -t ashish-portfolio .
```

Run:

```bash
docker run --rm -p 5000:5000 ashish-portfolio
```

Open:

`http://localhost:5000`

Stop the container with `Ctrl+C`.

## AI chat widget ("Ask about Ashish")

There's a chat bubble in the bottom-right corner that answers visitor
questions about your skills, services, and projects using the Anthropic API,
called server-side so your key is never exposed to the browser.

Turn it on by setting:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."   # from https://console.anthropic.com/settings/keys
export CHAT_MODEL="claude-haiku-4-5-20251001"   # optional, this is the default
```

With Docker:

```bash
docker run --rm -p 5000:5000 \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  ashish-portfolio
```

Without a key set, the widget tells visitors it isn't switched on yet and
points them to the contact form instead — nothing breaks.

The assistant only knows what's in the `PROFILE`, `SERVICES`, `PROJECTS`,
`SKILLS`, `CERTIFICATIONS`, and `EXPERIENCE` dicts in `app.py` (it's told not
to invent anything else), so update those and the assistant's answers update
with them. A basic per-IP rate limit (20 messages/hour) and a 600-character
message cap are built in to keep costs predictable.

## Contact form (sends you a real email)

The "Send message" form on the site posts to `/contact`. To have it actually
email you, set these environment variables before running the app (locally,
in Docker, or on your host):

```bash
export MAIL_USERNAME="yourname@gmail.com"        # a Gmail address you control
export MAIL_APP_PASSWORD="xxxxxxxxxxxxxxxx"      # a 16-char Gmail App Password, not your login password
export MAIL_TO="ashishgurav.work@gmail.com"       # optional, defaults to MAIL_USERNAME
```

Create an App Password at https://myaccount.google.com/apppasswords (requires
2-Step Verification on the Gmail account). If these variables aren't set, the
form still works for visitors — it automatically falls back to opening their
own email client with the message pre-filled to you.

With Docker, pass them at `docker run` time:

```bash
docker run --rm -p 5000:5000 \
  -e MAIL_USERNAME="yourname@gmail.com" \
  -e MAIL_APP_PASSWORD="xxxxxxxxxxxxxxxx" \
  -e MAIL_TO="ashishgurav.work@gmail.com" \
  ashish-portfolio
```

## Project image sliders

Each project card has an image slider: it auto-changes every ~4 seconds, jumps to
the next image and speeds up when you hover, and supports dots, swipe and tap on
phones. Images are listed per project in `PROJECTS[...]["images"]` in `app.py`
(paths are relative to `static/`).

The included slides are illustrated SVGs. To use real screenshots, drop
`.png`/`.jpg`/`.webp` files (16:9 works best) into `static/img/projects/` and
update the `images` list for that project. Add as many as you like.

## Before publishing

Your email, location, LinkedIn, and GitHub links live in the `PROFILE` dict at
the top of `app.py` — edit them there rather than in the template. The same
file also holds `STATS`, `SERVICES`, `PROJECTS`, `EXPERIENCE`, `SKILLS`, and
`CERTIFICATIONS`, so all site content can be updated in one place without
touching HTML.

Review the stats and highlight numbers in particular and keep only figures
you're comfortable being asked about — they're the first thing a visitor or
interviewer will anchor on.

## Resume project entry

**Cloud & DevOps Portfolio Web Application | Python, Flask, Docker**

- Developed a responsive personal portfolio using Python Flask, HTML, CSS and JavaScript.
- Implemented server-side project/service rendering and a JSON REST-style project endpoint.
- Containerized the application with Docker and added a health-check endpoint for deployment readiness.
- Designed the UI to work across desktop and mobile screen sizes.

## Suggested Git workflow

```bash
git init
git add .
git commit -m "Build Flask DevOps portfolio"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

Deployment can be added after local Docker testing is complete.
