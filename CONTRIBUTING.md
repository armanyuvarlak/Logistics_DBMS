# Contributing to Logistics Calculator Web Application

Thank you for your interest in contributing to the Logistics Calculator Web Application! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

### 🐛 Reporting Bugs
- Use the GitHub Issues tab to report bugs
- Include a clear description of the issue
- Provide steps to reproduce the problem
- Include screenshots if applicable
- Specify your browser and operating system

### ✨ Suggesting Features
- Open a GitHub Issue with the "enhancement" label
- Describe the feature and its benefits
- Explain how it would improve user experience
- Consider implementation feasibility

### 💻 Code Contributions
- Bug fixes
- Feature implementations
- Performance improvements
- UI/UX enhancements
- Documentation updates

## 🚀 Getting Started

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm or yarn
- Git
- Firebase account (for testing)
- Code editor (VS Code recommended)

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/Logistics_DBMS.git
   cd Logistics_DBMS
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/armanyuvarlak/Logistics_DBMS.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up Firebase configuration**
   - Create a test Firebase project
   - Configure `src/firebase/firebaseConfig.js` with test credentials
   - Never commit real production credentials

5. **Start development server**
   ```bash
   npm start
   ```

## 🔄 Development Workflow

### Branch Naming Convention
```
feature/description-of-feature
bugfix/description-of-fix
hotfix/critical-issue-fix
docs/documentation-update
refactor/code-improvement
```

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards (see below)
   - Write meaningful commit messages
   - Test thoroughly

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **Keep your branch updated**
   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

5. **Push and create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Use the following format for commit messages:
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add Google sign-in functionality
fix(calculator): resolve pricing calculation error
docs(readme): update installation instructions
style(sidebar): improve mobile responsiveness
```

## 📋 Coding Standards

### JavaScript/React Guidelines

1. **Component Structure**
   ```jsx
   // Use functional components with hooks
   import React, { useState, useEffect } from 'react'
   
   const ComponentName = ({ prop1, prop2 }) => {
     const [state, setState] = useState(defaultValue)
     
     useEffect(() => {
       // Side effects
     }, [dependencies])
     
     return (
       <div className="component-container">
         {/* JSX content */}
       </div>
     )
   }
   
   export default ComponentName
   ```

2. **Naming Conventions**
   - Components: PascalCase (`UserProfile.jsx`)
   - Functions: camelCase (`getUserData`)
   - Constants: UPPER_SNAKE_CASE (`API_ENDPOINTS`)
   - CSS classes: kebab-case (`user-profile-card`)

3. **File Organization**
   - Group related files in appropriate directories
   - Use index.js files for clean imports
   - Separate concerns (components, services, utils)

### CSS/Styling Guidelines

1. **Use Tailwind CSS**
   ```jsx
   // Preferred
   <div className="bg-blue-500 text-white p-4 rounded-lg">
   
   // Avoid custom CSS unless necessary
   ```

2. **Responsive Design**
   ```jsx
   // Mobile-first approach
   <div className="text-sm md:text-base lg:text-lg">
   ```

3. **Component Styling**
   - Use Tailwind utility classes
   - Create custom components for repeated patterns
   - Maintain consistent spacing and colors

### Firebase Integration

1. **Security Rules**
   - Test security rules thoroughly
   - Follow principle of least privilege
   - Document rule changes

2. **Data Structure**
   - Use consistent naming conventions
   - Optimize for queries
   - Consider data relationships

## 🧪 Testing Guidelines

### Testing Requirements
- Test all new features
- Verify existing functionality isn't broken
- Test responsive design on multiple devices
- Validate Firebase integration

### Manual Testing Checklist
- [ ] User authentication flows
- [ ] Calculator functionality
- [ ] Database operations
- [ ] PDF generation
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## 📖 Documentation

### Code Documentation
- Add JSDoc comments for complex functions
- Document component props and usage
- Include inline comments for complex logic

### README Updates
- Update README.md for new features
- Include screenshots for UI changes
- Update installation or usage instructions

## 🚀 Pull Request Process

### Before Submitting
1. **Code Quality Check**
   - Remove console.logs and debug code
   - Ensure no linting errors
   - Test all functionality

2. **Documentation**
   - Update relevant documentation
   - Add comments for complex code
   - Update changelog if needed

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Tested on mobile
- [ ] Tested Firebase integration

## Screenshots
Include screenshots for UI changes

## Additional Notes
Any additional information
```

### Review Process
1. Automated checks must pass
2. Code review by maintainers
3. Testing by reviewers
4. Approval and merge

## 🌟 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: your-email@example.com for private matters

### Resources
- [React Documentation](https://reactjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📜 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Provide constructive feedback
- Focus on the best outcome for the community
- Show empathy towards other contributors

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing private information

### Enforcement
Violations may result in temporary or permanent bans from the project.

---

Thank you for contributing to the Logistics Calculator Web Application! 🙏

For questions about contributing, please open an issue or contact the maintainers. 