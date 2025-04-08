# Comprehensive Project Resumption Prompt

## Project Overview
I'm working on a web application with a React frontend and Node.js backend. The application uses [key technologies like Socket.IO, Redux, etc.] for [core functionality]. I need assistance to resume development on this project.

## Repository Structure
- `/frontend`: React application using [bundler/framework]
- `/backend`: Node.js server using [framework]
- `/docs`: Documentation
- The main development takes place on the `main` branch
- [Any other important directories or branches]

## Development Workflow
1. Create feature branches from `main` using a descriptive naming convention (`feature/feature-name`, `fix/issue-description`, `refactor/component-name`)
2. Make changes and test locally
3. Push branches to origin to create backups
4. Create pull requests to merge changes back into `main`
5. Delete branches after successful merges
6. [Any CI/CD processes]

## Best Practices

### Component Architecture
- Split large components into smaller, focused ones
- Use composition over inheritance
- Extract reusable logic into custom hooks
- Implement prop validation using PropTypes or TypeScript
- Ensure clear separation of concerns
- Follow the single responsibility principle

### State Management
- Use appropriate state management based on complexity:
  - Local state with useState for simple components
  - Context API for shared state across component trees
  - Redux/MobX for complex global state
- Be careful with useEffect dependencies to avoid infinite re-render loops
- Use useRef for values that need to persist between renders without causing re-renders
- Consider using state machines for complex UI states

### Testing
- Follow Test-Driven Development (TDD) principles:
  - Write failing tests first that define expected behavior
  - Implement the minimum code needed to pass tests
  - Refactor while maintaining passing tests
- Use existing tests as documentation:
  - Review test cases to understand expected component behavior
  - Run relevant tests in isolation to reproduce and understand issues
  - Use tests to map out dependencies and interactions between components
- Comprehensive testing approach:
  - Unit tests with Jest and React Testing Library
  - Integration tests for component interactions
  - End-to-end tests with Cypress or Playwright
  - API tests for backend functionality
- Test-first issue investigation:
  - Analyze failing tests to understand the root cause
  - Create new test cases that reproduce reported bugs
  - Use debug mode in tests to step through problematic code
- Implement integration tests for critical user flows
- Test business logic separately from UI
- Aim for good test coverage of core functionality
- Run tests before creating pull requests
- Document test scenarios in comments or test descriptions

## Git Workflow
- Make focused, atomic commits with clear messages
- Use descriptive branch names that reflect the feature or fix
- Follow conventional commits format (feat:, fix:, docs:, etc.)
- Always merge through pull requests for code review
- Require at least one approval before merging
- Clean up branches after merging
- Rebase feature branches on main to maintain a clean history

## Environment Configuration
- Support multiple environments (development, test, production)
- Use environment variables for configuration
- Keep secrets out of the codebase
- Implement feature flags for gradual rollouts
- Use consistent configuration approach across frontend and backend
- Document required environment variables
- Provide sensible defaults where appropriate

## Issue Investigation Process

Before implementing changes to fix an issue or add a feature, follow this thorough investigation process:

1. **Test-Based Analysis**:
   - Run relevant e2e tests to understand behavior and reproduce issues
   - Review test cases in both frontend and backend to understand expected functionality
   - Create or modify tests to demonstrate the issue

2. **Code Inspection**:
   - Examine the component hierarchy and data flow
   - Review hooks and their dependencies
   - Analyze event handling and state updates
   - Check the network requests and responses

3. **Contextual Understanding**:
   - Understand how the affected components fit into the larger application
   - Identify potential side effects of changes
   - Review related documentation and comments

4. **Root Cause Determination**:
   - Identify the exact cause of the issue rather than just addressing symptoms
   - Confirm the root cause through targeted testing
   - Document findings for future reference

5. **Solution Planning**:
   - Design a solution that follows established patterns and practices
   - Consider performance implications
   - Plan for backward compatibility when needed
   - Create new tests that will validate the solution

This process helps ensure that changes are well-understood, targeted, and maintainable.

## Recent Work Summary
- [Component/feature] has been refactored:
  - [List key changes]
  - [New components or patterns introduced]
  - [Performance improvements achieved]

- [Area of the application] has been improved:
  - [Specific changes made]
  - [Issues addressed]
  
- Current test status: [passing/failing]
- The project is at version [version number]

## Immediate Goals
- [Specific feature or enhancement you want to work on]
- [Any bugs that need fixing]
- [Any performance improvements needed]
- [Technical debt to address]

## Questions
- [Any specific questions about the codebase]
- [Any implementation questions]
- [Any architectural decisions you're considering]
- [Any best practices you're unsure about]

## Additional Context
- [Key business requirements]
- [User stories or acceptance criteria]
- [Related documentation or links]
- [Design considerations]

## Maintaining This Prompt

To keep this prompt document updated and ensure continuity in the development process, follow these steps after completing a feature or fix:

1. **Update Recent Work Summary**:
   - Before creating a pull request, update the "Recent Work Summary" section
   - Document key changes, new patterns, or architectural decisions
   - Note any lessons learned or best practices discovered

2. **Review and Update Best Practices**:
   - If you've discovered new effective patterns, add them to the appropriate section
   - Remove outdated practices that no longer apply
   - Provide context for why certain practices are recommended

3. **Update Workflow Documentation**:
   - If your development process has evolved, update the workflow section
   - Document any new tools or processes introduced

4. **Include Prompt Update in PR**:
   - Include the updated prompt document in your pull request
   - Mention specific updates in the PR description
   - Request reviewers to evaluate prompt changes alongside code changes

5. **Periodic Full Review**:
   - Every [time period or milestone], conduct a comprehensive review of the entire prompt
   - Ensure all sections remain relevant and accurate
   - Consider if any new sections should be added based on project evolution

6. **Version Tracking**:
   - Update the project version in the prompt when version numbers change
   - Consider tracking the prompt document's own version separately if significant changes are made

By consistently following these steps, this prompt will remain an accurate and valuable resource for development continuity, knowledge transfer, and onboarding new team members. 