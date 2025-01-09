# MinMax - Focus Timer & Task Manager
#### Video Demo: <https://www.youtube.com/watch?v=FSHsf_zarUw>
#### Description:

MinMax is a web-based application designed to help users manage their tasks while maximizing productivity through focused work sessions. Combining a Pomodoro-style focus timer with a robust task management system, MinMax embodies the core philosophy of "Minimum Effort, Maximum Results." It empowers users to stay on track by creating a structured approach to their work while efficiently organizing tasks.

The application integrates seamlessly into daily routines, promoting deep work and allowing users to track both progress and time spent on individual tasks. It is built using Flask, SQLite, and plain JavaScript, ensuring a clean, fast, and responsive experience.

## Core Features & Implementation

### 1. Focus Timer System
The heart of MinMax is its highly customizable focus timer, which follows the Pomodoro technique. This timer allows users to work in focused intervals, with breaks in between, to maintain peak productivity throughout the day. The key features include:

- **Customizable Session Lengths**: Users can adjust the focus session duration selecting between 25 or 50 minutes intervals.
- **Flexible Break Intervals**: Short breaks (5 minutes) or long breaks (10 minutes).
- **Visual Progress Tracking**: A dynamic progress ring provides visual feedback on session completion.
- **Audio Notifications**: Alerts for both session start and end, ensuring users are aware when to focus and when to take a break.
- **Toast Notifications**: Provides real-time updates when the timer starts, ends, or when the user is notified to take a break.
- **Persistent State**: The timer state persists even after refreshing the page, so users don't lose track of their session.

The timer implementation leverages JavaScript’s `requestAnimationFrame` and `performance.now()` for high-precision timing, ensuring minimal drift and maximum reliability over extended sessions. Drift correction is built into the system, addressing the typical challenges associated with long-duration timers.

### 2. Task Management System
MinMax also includes a flexible task management system, allowing users to easily create, manage, and track their tasks. Features include:

- **Drag-and-Drop Task Reordering**: Tasks can be reordered quickly by dragging them into new positions.
- **Real-Time Updates**: Changes to task data are reflected instantly across the application.
- **Inline Task Editing**: Users can edit task details directly in the task list, making modifications seamless.
- **Position-Based Task Ordering**: Tasks are ordered based on user-defined positions, simplifying task priority management.
- **Completion Tracking**: Each task can be marked as complete, helping users track progress throughout the day.

The backend of the task system uses SQLite, with an efficient position-based ordering system that ensures smooth reordering and minimal data complexity.

### 3. Progress Tracking
MinMax tracks user progress with a variety of metrics to help users visualize their productivity:

- **Daily Focus Metrics**: Overview of completed sessions, total focus time, and breaks.
- **Weekly Visualization**: A detailed chart (using Chart.js) that tracks weekly focus metrics, providing insights into productivity trends.
- **Session Count**: Keeps track of the number of completed focus sessions.
- **Time Tracking**: Total time spent on focus sessions, helping users monitor their effort.

## Technical Architecture

### Backend (Flask)
The backend is built with Flask, which manages the application’s server-side logic. The key components include:

1. **Authentication System**:
   - Secure user registration and login system.
   - Password hashing with bcrypt for enhanced security.
   - Session management ensures a smooth user experience.

2. **Database Architecture**:
   - Users Table: Stores user credentials and metadata.
   - Tasks Table: Manages task data, including position-based ordering.
   - Focus Sessions Table: Tracks individual focus sessions, time spent, and completion status.

3. **API Endpoints**:
   - CRUD operations for tasks, including task creation, updating, deletion, and reordering.
   - Focus session management, including starting, stopping, and tracking session times.
   - Statistics generation, providing data for visualizations.
   - Static file serving, with caching for performance optimization.

### Frontend Architecture

1. **Core JavaScript** (`static/script.js`):
   - **PomodoroTimer Class**: Manages the timer's state, session timing, and transitions.
   - **Task Interaction**: Handles task creation, editing, and interaction with the task list.
   - **Statistics Visualization**: Uses Chart.js to generate progress charts for focus time.
   - **Theme Management**: Provides light/dark mode toggling for user preferences.

2. **User Interface**:
   - The application interface is designed with responsiveness in mind using CSS Grid and Flexbox.
   - Supports both dark and light themes, providing users with customizable visual experiences.
   - Keyboard shortcuts for advanced users, making task management and timer control more efficient.
   - Toast notifications for real-time updates on task and timer changes.

The main interface (`templates/index.html`) offers a streamlined workspace, where tasks are listed with actionable buttons to edit or mark them as complete. The landing page (`templates/landing.html`) introduces users to the application’s features.

## Design Decisions

### 1. Technology Stack
The choice to use Flask, SQLite, and vanilla JavaScript was based on the need for simplicity and performance along with the fact that I'm more familiar with these technologies due to my experience with CS50:

**Advantages**:
- **Minimal dependencies**: Reduces the complexity and ensures fast development.
- **Ease of Deployment**: Flask's minimal setup allows for easy hosting and maintenance.
- **Performance**: The stack is lightweight and ensures a smooth user experience, even with minimal hardware.

**Alternatives Considered**:
- **Django**: Considered but deemed too heavy for the needs of this project.
- **React**: While React offers advanced features, it introduced unnecessary complexity for the project’s scope.
- **MongoDB**: Was overkill for the task and focus session data, which can be efficiently managed with SQLite.

### 2. Timer Implementation
The timer underwent several refinements before arriving at its current state:

- **Initial Version**: Basic countdown using `setInterval`, without precision handling.
- **Current Version**: Refined to use `requestAnimationFrame`, which provides high-precision timing and drift correction, ensuring consistency even over long focus periods.

The timer ensures a smooth experience even if the user refreshes the page, with all session data retained due to built-in state persistence.

### 3. Task Ordering System
The position-based task ordering system was chosen due to its simplicity and efficiency:

- **Efficient Reordering**: Allows for quick reordering of tasks without complex operations.
- **Minimal Data Structure**: Position-based ordering reduces the overhead of managing more complex systems like linked lists or timestamps.

### 4. User Interface
The design prioritizes clarity and ease of use:

- **Minimalist Approach**: Focused on reducing distractions and making the interface intuitive.
- **Responsive Design**: Ensures that users have an optimal experience across all devices.
- **Keyboard Shortcuts**: Added for power users to quickly manage tasks and the timer.

## Development Insights

### Technical Challenges Overcome
1. **Timer Accuracy**: 
   - Ensured precise timing by integrating drift correction and high-precision functions.
   - Addressed issues related to browser throttling by optimizing performance.

2. **State Management**:
   - Managed session recovery and edge cases with local storage, ensuring user data isn't lost during page refreshes.

3. **Performance Optimization**:
   - Ensured that tasks could be reordered efficiently without performance issues.
   - Optimized animations and added throttling to improve the user experience during high-interaction scenarios.

## Future Enhancements
1. **Task Management**:
   - Adding support for task categories, tags, and priority levels.
   - Implementing due dates and recurring tasks for enhanced flexibility.
   - Adding a calendar system to track tasks across multiple days.
   - Task prioritization system to help users focus on the most important tasks.
   - Specifying the ammount of pomodoros needed to complete a task, keeping the user on track with their goals.

2. **Focus Timer**:
   - Offering customizable timer durations for more personalized user experience.
   - Extending statistics features, including session notes and export options.

3. **Collaboration Features**:
   - Enabling team workspaces for collaborative task management.
   - Real-time updates on shared tasks and progress visualization.
   - Cross-platform integration with other apps such as Google Calendar, Microsoft To Do, etc.

## Credits
- **Font Awesome** for the icons
- **Chart.js** for the statistics visualization
- **Animate.css** for the smooth animations
- **SpinKit** for the loading indicators
- **CS50** for the amazing course along with the amazing staff
- **AdeMir** for the initial steps of building a simple to do app