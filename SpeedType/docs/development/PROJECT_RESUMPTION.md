# Enhanced Project Resumption Prompt

## Project Overview
I'm working on SpeedType, a web-based application for typing races similar to TypeRacer. The project uses a React frontend and Node.js backend with Socket.IO for real-time multiplayer functionality. I need assistance to resume development on this project.

## Repository Structure
- `/SpeedType/frontend`: React application using Vite
- `/SpeedType/backend`: Node.js server using Express and Socket.IO
- `/SpeedType/docs`: Documentation
- The main development takes place on the `main` branch

## Development Workflow
1. Create feature branches from `main` using a descriptive naming convention (`feature/feature-name`, `fix/issue-description`, `refactor/component-name`)
2. Make changes and test locally
3. Push branches to origin to create backups
4. Create pull requests to merge changes back into `main`
5. Delete branches after successful merges

## Best Practices
1. **Component Refactoring**: 
   - Split large components into smaller, focused ones
   - Extract reusable logic into custom hooks
   - Implement prop validation using PropTypes
   - Ensure clear separation of concerns

2. **State Management**:
   - Use React hooks appropriately (useState, useEffect, useRef, etc.)
   - Be careful with useEffect dependencies to avoid infinite re-render loops
   - Use useRef for values that need to persist between renders without causing re-renders
   - Share state between components through custom hooks or context

3. **Testing**:
   - Follow Test-Driven Development (TDD) principles:
     - Write failing tests first that define expected behavior
     - Implement the minimum code needed to pass tests
     - Refactor while maintaining passing tests
   - Use existing tests to understand functionality before fixing issues:
     - Analyze e2e tests in the frontend to understand user flows
     - Review test cases to understand expected component behavior
     - Run relevant tests in isolation to reproduce and understand issues
   - Thoroughly investigate using test cases before making changes
   - End-to-end tests with Playwright
   - Run tests with `npm run test:e2e:test-env` for testing in test environment
   - Ensure all tests pass before creating pull requests
   - Add new tests for any new functionality or bug fixes
   - Consider edge cases in test scenarios

4. **Git Workflow**:
   - Make focused, atomic commits with clear messages
   - Use descriptive branch names that reflect the feature or fix
   - Always merge through pull requests for code review
   - Clean up branches after merging

5. **Environment Configuration**:
   - Multiple environment support (development, test, production)
   - Consistent configuration approach across frontend and backend
   - Use environment utilities for shared functionality

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

## Current Project State
- Recently refactored the TypingArea component into smaller components:
  - TextDisplay, TypingInput, CompletionResults
  - Created custom hooks: useTypingState, useProgressCalculation, useWpmCalculation
  - Fixed WPM calculation for accurate speed tracking

- Added proper routing and room handling for multiplayer mode:
  - Implemented React Router for navigation between single player and multiplayer mode
  - Enhanced socket.io room management to support multiple concurrent games
  - Fixed e2e tests for multiplayer functionality
  - Improved connection status display and error handling for better user experience

- Environment configuration has been improved:
  - Extracted common utilities
  - Updated documentation
  
- All end-to-end tests are now passing for both single player and multiplayer mode
- The project is at version v0.7.0

## Immediate Goals
- [Specific feature or enhancement you want to work on]
- [Any bugs that need fixing]
- [Any performance improvements needed]

## Questions
- [Any specific questions about the codebase]
- [Any implementation questions]
- [Any best practices you're unsure about]

## Maintaining This Prompt

To keep this prompt document updated and ensure continuity in the development process, follow these steps after completing a feature or fix:

1. **Update Current Project State**:
   - Before creating a pull request, update the "Current Project State" section
   - Document key changes, new components, or architectural decisions
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
   - Every major version release, conduct a comprehensive review of the entire prompt
   - Ensure all sections remain relevant and accurate
   - Consider if any new sections should be added based on project evolution

6. **Version Tracking**:
   - Update the project version in the prompt when version numbers change
   - Keep the prompt aligned with the current state of the codebase

By consistently following these steps, this prompt will remain an accurate and valuable resource for development continuity, knowledge transfer, and ensuring AI assistants provide relevant and helpful guidance. 