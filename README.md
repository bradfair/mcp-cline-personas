# Cline Personas MCP Server

An MCP server for managing `.clinerules` files using shared components and persona templates.

## Features

- **Component Management**: Create, read, update and delete reusable components
- **Persona Templates**: Define persona templates with mustache-style variable substitution
- **Dependency Validation**: Ensure persona templates only reference existing components
- **Activation System**: Activate personas by writing to `.clinerules` file
- **Version Tracking**: Track versions for both components and personas
- **File-based Storage**: Store components and personas as JSON files

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Build the project:
```bash
npm run build
```

## Usage

### Managing Components

```typescript
import { ComponentPersonaService } from './src/service';

const service = new ComponentPersonaService(process.cwd());

// Create a new component
service.setComponent('greeting', 'Welcome message', 'Hello {{name}}!', 1);

// Get a component
const component = service.getComponent('greeting');

// List all components
const components = service.listComponents();
```

### Managing Personas

```typescript
// Create a new persona
service.setPersona(
  'welcome',
  'Welcome persona',
  '{{greeting}}\nPlease enjoy your stay!',
  1
);

// Activate a persona
service.activatePersona('welcome');

// Get active persona
const active = service.getActivePersona();
```

## File Structure

```
.cline-personas/
  components/
    [component-name].json
  personas/
    [persona-name].json
src/
  component.ts    # Component class and operations
  persona.ts      # Persona class and template rendering
  service.ts      # Main service implementation
  index.ts        # MCP server entry point
test/             # Unit tests
```

## API Documentation

### ComponentPersonaService

The main service class providing all operations:

- **Component Operations**:
  - `setComponent(name, description, text, version)`
  - `getComponent(name)`
  - `listComponents()`
  - `deleteComponent(name)`

- **Persona Operations**:
  - `setPersona(name, description, template, version)`
  - `getPersona(name)`
  - `listPersonas()`
  - `deletePersona(name)`
  - `activatePersona(name)`
  - `getActivePersona()`
  - `renderPersona(name)`

## Development

Run tests:
```bash
npm test
```

Build the project:
```bash
npm run build
```

Run the MCP server:
```bash
npm start
