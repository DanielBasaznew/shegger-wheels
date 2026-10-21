AGENTS.md# Sheggar Wheels — Project Instructions

## Project Goal
Build Sheggar Wheels, a responsive peer-to-peer car rental marketplace for Addis Ababa, following the capstone specification already present in this repository.

## Working Roles
- The user is the project owner.
- ChatGPT acts as project manager and reviewer.
- Antigravity executes one explicitly approved task at a time.

## Mandatory Workflow
1. Read the capstone specification before implementing related requirements.
2. Inspect existing files before modifying them.
3. Follow the approved Google Stitch designs once available.
4. Implement only the current task. Do not silently begin future tasks.
5. Preserve existing working functionality and configuration.
6. Prefer small, understandable changes that fit the existing Next.js setup.
7. Keep business logic and browser-storage operations in appropriate reusable modules.
8. Never claim a test passed unless it was actually run successfully.
9. Report changed files, checks performed, results, and remaining limitations.
10. Stop and wait for the project owner’s approval after each task.

## Technical Constraints
- Follow the capstone's frontend-only scope: no database.
- Use localStorage for persistent demo records and sessionStorage for temporary demo session state.
- Never collect real passwords, payment credentials, or financial information.
- Clearly label simulated payments and tracking.
- Validate stored data and recover gracefully from malformed storage.
- Check role, ownership, and valid booking status before every protected mutation.
- Do not describe frontend demo checks as production security.
- Use the existing dependencies and taught concepts where practical. Ask before introducing significant new dependencies.
- Preserve accessibility, responsive behavior, and clear error, empty, loading, and success states.

## Git Workflow
- Make one focused, reviewable commit per approved task.
- Use a descriptive conventional commit message.
- Never commit or push without the user's approval.
- Do not overwrite unrelated user changes.
- Keep local-only instructions and the private capstone PDF out of GitHub.

## Final Report
At the end of every task, report:
- What was implemented
- Files created or modified
- Checks actually performed and their results
- Known limitations or approval decisions
- A proposed commit message

Do not proceed to another task until the user approves the current result.