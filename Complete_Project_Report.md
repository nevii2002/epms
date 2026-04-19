# Employee Performance Evaluation System (SEPES)
**Techznap Innovative Solutions**

---

## Chapter 1: Introduction

### 1.1 Project Overview
The Employee Performance Evaluation System (SEPES) is developed for Techznap Innovative Solutions to streamline and modernize their performance appraisal processes. SEPES transitions the company from traditional, manual evaluations to a centralized digital framework, empowering the administration, HR team, managers, and employees to securely interact in a collaborative environment.

### 1.2 Objectives
The primary goal is to provide a robust platform for tracking, evaluating, and improving employee performance across the organization. Key objectives include:
- Establishing a centralized Employee Profile Management and Role-Based Access Control (RBAC) module.
- Managing Key Performance Indicators (KPIs) and assigning structured performance targets.
- Implementing a transparent dual-evaluation approach involving employee self-evaluations and managerial ratings.
- Providing real-time analytics, dashboards, and automated report generation.

---

## Chapter 2: System Requirements

### 2.1 Functional Requirements

#### 1. Administration & Security
- **User & Role Management:** Create user accounts and assign specific roles (Admin, HR, Manager, Employee, CEO).
- **Granular Permissions:** Specific CRUD (Create, Read, Update, Delete) rights based on user type and resource.
- **Security & Audits:** Secure authentication (hashing), session management, and automated audit logging of critical operations.
- **Data Backup:** Scheduled automated database backups and manual restoration options.

#### 2. HR Management
- **Employee Profiles:** Centralized maintenance of staff records, contact info, hire dates, promotions, and transfers.
- **KPI Management:** Define, edit, and assign KPIs with specific measurement units and weights to roles/departments.
- **Target Setting:** Assign measurable, time-bound targets to monitor organizational goals.
- **Historical Data:** Manual entry of past performance metrics to enable long-term trend analysis.
- **Policy Management:** Centralized repository for HR policies available to all staff.

#### 3. Dual-Evaluation Module
- **Phase 1 - Self-Evaluation:** Staff submit their own performance ratings and comments against assigned KPIs.
- **Phase 2 - Managerial Rating:** Managers review self-assessments and provide the Official Rating, comparing expectations to self-perception.
- **Phase 3 - Automated Scoring:** Final performance scores are generated automatically based on weighted KPIs and manager-approved ratings.

#### 4. Monitoring, Analytics & Reporting
- **Dashboards:** Real-time visual tracking of company-wide averages, target progress, and top performers.
- **Underperformer Identification:** Data filters to flag employees not meeting specific thresholds for corrective coaching.
- **Reports & Exports:** Detailed performance summaries by individual or team, exportable to PDF or Excel formats.
- **Notifications:** Automated system alerts (and emails) for deadlines, assigned KPIs, and evaluation feedback.

### 2.2 Non-Functional Requirements
- **Performance:** System architecture capable of handling up to 30 concurrent users effortlessly without degradation.
- **Reliability:** Guaranteed 95% system uptime during standard working hours.
- **Usability:** User-friendly, highly accessible interface tailored for easy navigation by employees with varying levels of technical proficiency.
- **Platform Support:** Deployable across Windows and Linux environments for localized desktop access.

---

## Chapter 3: System Design and Calculated Logic

### 3.1 Role-Based Access Control (RBAC)
The overarching security structure relies on Admins to govern access privileges. HR configures the assessment guidelines while Managers execute the coaching and evaluation of the general Employees, establishing a hierarchical review structure.

### 3.2 Evaluation Math and Logic
To implement the dual-rating feature effectively, SEPES relies on automated, comparative mathematics:
- **Final Achieved Score** = `(Manager Rating × KPI Weight)`
- **Evaluation Gap Dashboard Metric** = `(Manager Rating - Self Rating)`

This calculation highlights discrepancies in performance expectations versus reality, promoting productive review conversations and ensuring objective reviews.

---

## Chapter 4: Implementation Highlights

### 4.1 Secure Administration & Compliance
The backend provides robust protection, hashing user credentials for system login. The automated audit log systematically traces all adjustments to targets, feedback, and user profiles, satisfying basic compliance principles. Automated database backups protect the organization from data loss.

### 4.2 Interactive Assessment
The employee interface encourages descriptive feedback during the Self-Evaluation cycle. Managers are provided contextual awareness of how an employee perceives their work, resolving "invisible friction" prior to finalized evaluations.

### 4.3 Data Visualization
Real-time dashboards visually aggregate multiple data points (e.g. tracking "Sign 3 new customers" target). The "Needs Attention" analytical tool empowers HR and the CEO to dynamically support struggling departments.

---

## Chapter 5: Conclusion and Future Recommendations

### 5.1 Degree of Objectives Met
SEPES successfully fulfills its mandate to digitize Techznap Innovative Solutions' appraisal structure. The transparent dual-rating module automates mathematical scoring rules, HR gains comprehensive employee tracking, and management receives distinct, actionable analytics regarding staff goals.

### 5.2 Usability and Reliability
Through standardized scoring interfaces and continuous monitoring, the system provides high reliability. It requires minimal active technical administration while protecting data via logging and backups.

### 5.3 Future Modifications and Extensions
While current features solve immediate needs, future iterations of SEPES could involve:
- **Capacity Scaling:** Upgrading server capabilities to effortlessly maintain functionality for >100+ concurrent scaling enterprise users.
- **Payroll System API:** Direct integration communicating performance scores to automated payroll and bonus disbursement platforms.
- **Machine Learning Analysis:** Predicting future employee turnover risks or identifying promotion tracks based on long-term data trends.

### 5.4 Summary
The Employee Performance Evaluation System successfully operates as the pivotal HR application for Techznap Innovative Solutions. By providing objective performance tracking metrics, secure employee profile management, and granular analytical capabilities, SEPES drives continuous organizational improvement.

---

## Chapter 6: Detailed Function Descriptions

This section outlines the core technical functions implemented within the SEPES backend controllers, categorized by their primary modules.

### 6.1 Authentication & Profile Management (`authController.js`)
- **`register`**: Activates a pending user account by setting their password (hashed via `bcrypt`). Validates that the email exists in the system (invited by Admin/HR) and is currently in a 'Pending' state before allowing activation.
- **`login`**: Authenticates a user by comparing the provided password with the hashed stored password. If successful, generates and returns a JSON Web Token (JWT) valid for 24 hours, alongside basic user details.
- **`forgotPassword`**: Initiates the password recovery process. Generates a short-lived (15 min) JWT and utilizes `nodemailer` to send a reset link to the user's registered email address.
- **`resetPassword`**: Validates the recovery token. If valid, hashes the new password and updates the user record, restoring account access.
- **`getProfile`**: Retrieves the securely authenticated user's profile information, explicitly excluding sensitive fields like the password hash.
- **`updateProfile`**: Allows authenticated users to update their personal information, such as their username, mobile number, and job position.
- **`changePassword`**: Facilitates secure password changes for logged-in users by first verifying their current password before applying the new hashed password.
- **`uploadProfilePicture`**: Handles `multipart/form-data` to securely upload and store an employee's profile image on the server filesystem, returning the generated URL for frontend rendering.

### 6.2 Staff & HR Management (`staffController.js`)
- **`getAllStaff`**: Retrieves a comprehensive list of all employees. Includes built-in security logic to sanitize sensitive compensation data (salary, bonuses) when non-managerial staff query the team directory.
- **`getStaffById`**: Fetches detailed information for a specific staff member based on their unique ID.
- **`createStaff`**: Allows HR/Admins to invite a new employee to the system. Creates a 'Pending' user record with no password, requiring the user to complete registration. Prevents duplicate email invitations.
- **`updateStaff`**: Updates core staff attributes (role, job category, basic salary) based on administrative input.
- **`deleteStaff`**: Permanently removes a user record from the system.
- **`getEmployeeKPIs`**: Retrieves the specific Key Performance Indicators (KPIs) currently assigned to a targeted employee, including custom weights and bonus targets.
- **`assignKPIs`**: Core HR function for linking KPIs to staff. Includes complex validation logic to ensure that a single KPI's total weighted distribution across all employees does not exceed 100%. Handles bulk destruction and recreation of `EmployeeKPI` pivot records.
- **`getMyKPIs`**: An optimized endpoint allowing an authenticated employee to quickly retrieve their own assigned targets and weights without needing elevated privileges.

### 6.3 KPI Configuration (`kpiController.js`)
- **`getAllKPIs`**: Retrieves the master list of all organizational Key Performance Indicators available for assignment.
- **`createKPI`**: Defines a new KPI template, standardizing its title, unit of measurement, category, target value, and applicable job role.
- **`updateKPI`**: Modifies the attributes of an existing KPI template to adapt to changing organizational goals.
- **`deleteKPI`**: Removes a KPI template from the system's available pool.

### 6.4 Performance Evaluation (`evaluationController.js`)
- **`createEvaluation`**: Facilitates the submission of a new performance evaluation (e.g., self-assessment or managerial rating). Prevents duplicate submissions for the same period and securely records individual KPI ratings and narrative comments.
- **`getEvaluations`**: A flexible retrieval function. For standard employees, it strictly returns their own evaluations. For Managers/Admins, it can fetch all company-wide evaluations or filter them by a specific employee ID.
- **`getEvaluationById`**: Fetches the deep details of a specific evaluation record, joining the related Employee, Evaluator, and the specific KPI scoring details.
- **`getDashboardStats`**: A complex, role-aware analytical function. Constructs the primary dashboard visualizations:
  - Calculates dynamically averaged performance scores (out of 100%).
  - Generates distribution metrics for star ratings (1-5).
  - Determines the 'Employee of the Month' using a complex SQL `GROUP BY` and `AVG` aggregation to find the highest-rated staff member.
  - Tailors the returned statistics securely based on whether the requester is an standard Employee or a Manager.

### 6.5 Financial & Bonus Tracking (`bonusController.js`)
- **`createBonus`**: Awards a financial bonus to a specific employee, securely recording the amount, justification (reason), and the date given.
- **`getBonusesByEmployee`**: Retrieves the historical timeline of all bonuses awarded to a specific staff member.
- **`getAllBonuses`**: An administrative function to view the comprehensive ledger of all bonuses issued across the entire organization, joined with employee details.
- **`deleteBonus`**: Allows administrators to revoke or correct a previously issued bonus record.

### 6.6 Policy Repository (`policyController.js`)
- **`uploadPolicy`**: Securely accepts PDF/document uploads from HR/Admins. Saves the physical file to the server and creates a database record tracking the policy title and the uploader's identity. Automatically handles file cleanup if the upload transaction fails validation.
- **`getPolicies`**: Retrieves the directory of all published company HR policies, ordering them by the most recently published.
- **`deletePolicy`**: Removes a policy from the system. Crucially, it manages both the deletion of the database record and the secure unlinking (deletion) of the physical file from the server's filesystem to prevent storage bloat.

### 6.7 Data Analytics (`analyticsController.js`)
- **`getDashboardData`**: A specialized data aggregation endpoint for higher-level organizational charts. Uses Sequelize aggregation functions (`COUNT`, `SUM`, `GROUP BY`) to rapidly calculate:
  - Job category distributions (e.g., Full-time vs. Contract).
  - User role distributions.
  - Overall evaluation completion statuses.
  - Financial footprint of bonuses categorized by the reason for the award.

---

## Chapter 7: Quality Assurance & Best Practices

To ensure SEPES remains a secure, reliable, and user-friendly platform, several industry-standard best practices and quality assurance methodologies were integrated throughout the development lifecycle:

### 7.1 Backend Security & Data Protection
- **Password Encryption:** All user passwords are encrypted using `bcryptjs` with a high salt round configuration before database storage. Plain text passwords are never stored or logged.
- **Stateless Authentication:** JSON Web Tokens (JWT) are utilized for API authentication, eliminating server-side session overhead. Tokens are strictly scoped with role-based claims and practical expiration times (e.g., 24 hours for login, 15 minutes for password resets).
- **Data Sanitization:** Controller endpoints consistently strip highly sensitive data (like password hashes or executive salaries) from JSON responses before transmitting data to the client, preventing accidental data leaks.

### 7.2 Robust Validation & Error Handling
- **Business Logic Constraints:** Complex operations, such as KPI assignments, incorporate thorough validation logic. For instance, the system actively queries existing records to prevent a single KPI from being over-allocated (exceeding 100% total weight) before saving an update.
- **Graceful Error Management:** All asynchronous controller methods are wrapped in distinct `try-catch` blocks. Unhandled exceptions are logged server-side for debugging while generalized, user-friendly HTTP error codes (400, 404, 500) and messages are returned to the client to prevent exposing stack traces.

### 7.3 Data Integrity & ORM Usage
- **Object-Relational Mapping (ORM):** Relational data mappings are handled through `Sequelize` and models, preventing SQL injection vulnerabilities inherent in directly writing backend queries.
- **Relational Integrity:** Endpoints inherently manage relational cascading. Utilizing methods such as `bulkCreate` guarantees complex interrelated operational records remain continuously synchronized and atomic.

### 7.4 Application Architecture
- **Separation of Concerns:** The backend consistently adheres to an MVC-like routing structure. HTTP routing, authentication middleware, and business logic (Controllers) are strictly separated to maximize code readability and maintainability.
- **Asynchronous Processing:** Slower operations, such as generating database calculations and transmitting notifications via `nodemailer`, are processed asynchronously to avoid blocking the primary Node.js event thread, thereby guaranteeing the API remains highly responsive for concurrent user activity.
