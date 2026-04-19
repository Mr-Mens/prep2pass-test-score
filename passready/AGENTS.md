# PassReady — instructions for AI agents

## Purpose
PassReady estimates whether a learner is ready to pass their driving test. It produces:

- A pass probability score  
- Top risk areas  
- A personalised improvement plan  

## Philosophy
Keep the system simple and fast. Ship value quickly. Avoid unnecessary complexity.

## User flow (MVP)
1. Homepage  
2. Assessment form  
3. Payment (£4.99)  
4. AI-generated report  

## MVP features
- Input form  
- AI analysis (server-side)  
- Payment integration  
- Result display page  

## AI output style
- Reads like a professional driving instructor  
- Simple, clear, actionable language  
- No generic advice — tie guidance to specific inputs and likely failure modes  

## Performance
- Aim for snappy APIs (order of ~2s where feasible for the AI step; optimise prompts and payloads)  
- Architecture should tolerate many concurrent users (stateless app routes, sensible rate limits)  

## Security & privacy
- Protect user data; never leak secrets or sensitive internals  
- Follow GDPR-minded practices: minimise data, document purpose, consider retention  

## Longer-term vision (out of scope for MVP unless asked)
Instructor SaaS, driving analytics, deeper AI coaching.

## Development approach
Build the MVP, validate with real users, improve from feedback. See `cursor.rules` for stack and engineering constraints.
