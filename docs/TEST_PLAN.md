
# STEM Challenge Hub – QA Test Plan

**Project:** STEM Challenge Hub  
**Role:** QA & Release Lead  
**Prepared by:** Ojaswi Cheekati  
**Program:** APS Data Technologies Internship – Fall 2026

## 1. Objective

The objective of this test plan is to verify that STEM Challenge Hub functions correctly, meets project requirements, provides a user-friendly experience, and protects student and teacher data.

## 2. Testing Scope

The following areas will be tested:

- User authentication (Teacher and Student).
- User registration (Sign Up), Forgot Password, and Sign Out.
- Role-based access and navigation.
- Teacher class management.
- Challenge creation, editing, and deletion.
- Daily Challenge functionality.
- Student class joining using a join code.
- Student challenge viewing and answer submission.
- Correct and incorrect answer feedback.
- Teacher student progress dashboard.
- Student and class data isolation.
- Teacher-to-teacher data isolation (teachers cannot access or modify another teacher's classes, students, or challenges).
- Grade and subject filtering.
- Accessibility settings, including Color-Blind Mode and Dyslexia-Friendly Font.
- Responsive layout across mobile, tablet, and desktop devices.
- Public application accessibility.

## 3. Testing Types

- Functional Testing
- User Interface (UI) Testing
- Navigation Testing
- Positive and Negative Testing
- Cross-Browser Testing
- Responsive Testing
- Security and Access Control Testing
- Regression Testing
- Accessibility Testing (keyboard-only navigation, visible focus indicators, text contrast, Color-Blind Mode, and Dyslexia-Friendly Font).
- Exploratory Testing (time-boxed testing sessions for individual features).
- Smoke Testing (basic sign-in, open challenge, and answer submission checks after deployments to dev and main).

## 4. Test Environment

| Item | Environment |
|---|---|
| Frontend | React + Vite |
| Backend | Supabase |
| Hosting | Vercel |
| Production URL | To be confirmed by the project team |
| QA Test Deployment URL | To be confirmed by the project team |
| Supabase Test Project | To be confirmed by the backend team |
| Browsers | Google Chrome and Safari (real iPhone/iPad testing if available) |
| Screen Sizes | 375 px (mobile), 768 px (tablet), 1440 px (desktop) |
| Test Accounts | Two teacher accounts and student accounts for each grade band |
| Test Data | Fictional accounts and records only |

## 5. Entry Criteria

Testing can begin when:

- The feature is implemented and available.
- The application is accessible.
- Required test accounts are available.
- Expected functionality is documented.
- The correct test environment and deployment are confirmed.

## 6. Exit Criteria

Testing is considered complete when:

- All planned test cases have been executed.
- Critical and high-priority defects are resolved or formally reviewed before release.
- Major functionality works as expected.
- Regression testing is completed.
- Remaining issues are documented.
- Release-blocking issues are resolved or formally accepted by the project team.

## 7. Defect Reporting

Every identified defect should include:

- Bug ID
- Bug Description
- Steps to Reproduce
- Expected Result
- Actual Result
- Priority (P1, P2, P3)
- Status
- Device and Browser
- Build or Commit Version
- Screenshot or Screen Recording
- Linked Test Case ID

All identified bugs will be logged and tracked in the project's Asana QA task board.

## 8. Test Documentation

Test cases and execution results will be maintained in the repository's `/docs` folder.

The QA checklist will record:

- Test Case ID
- Feature
- Test Steps
- Expected Result
- Actual Result
- Pass/Fail Status
- Device and Browser
- Execution Date

The following test execution statuses will be used:

- Not Tested
- Pass
- Fail
- Blocked
- Retest

## 9. QA Responsibilities

The QA & Release Lead is responsible for:

- Preparing test plans and test cases.
- Reviewing application functionality.
- Executing planned tests.
- Identifying and reporting defects.
- Performing regression testing.
- Supporting final release readiness.
- Verifying fixes and performing retesting.
- Communicating testing progress and release risks to the project team.

## 10. Important Testing Notes

- Only fictional student and teacher data will be used.
- Student accounts must not access teacher-only functionality.
- Students must not access another class's private information.
- Teachers must not access or modify another teacher's private classes, students, or challenges.
- Security testing must be repeated after relevant changes.
- Accessibility features, including Color-Blind Mode and Dyslexia-Friendly Font, will be tested when the integrated implementation is available.
- Features not yet implemented will be tested when available.
- Smoke testing will be performed after deployments to the dev and main branches.
- Testing must use the designated test environment and fictional data, not production student information.

## 11. Backend and Security Test Scenarios

The following additional scenarios will be included in QA testing:

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| TC-20 | Student Answer Key Security | Students cannot view or access correct answer keys before or after submitting an answer. |
| TC-21 | Invalid and Duplicate Class Joining | An invalid join code displays an appropriate error. Joining the same class twice does not create duplicate enrollment records. |
| TC-22 | Unpublished Challenge Visibility | Unpublished challenges are not visible or accessible to students. |
| TC-23 | Signed-Out User Access | Signed-out users cannot access class, challenge, or submission data. |
| TC-24 | Written Answer Review | Written answers are not automatically graded, and teacher comments are visible to students when provided. |
| TC-25 | Teacher-to-Teacher Data Isolation | Teacher 2 cannot view, access, or modify Teacher 1's classes, students, or challenges. |

These scenarios will be tested using fictional demo accounts and data. Security tests will verify that access restrictions are enforced by the backend, not only by the user interface.

## 12. Accessibility Test Scenarios

The following accessibility features will be verified when the integrated implementation is available:

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| TC-26 | Color-Blind Mode | The application displays information in a way that does not rely on color alone, and the Color-Blind Mode setting works as expected. |
| TC-27 | Dyslexia-Friendly Font | The font setting can be enabled and text remains readable throughout the application. |
| TC-28 | Keyboard Navigation | Users can navigate important application features using a keyboard. |
| TC-29 | Visible Focus Indicators | Interactive elements show a visible focus indicator during keyboard navigation. |
| TC-30 | Text Contrast | Text and background combinations provide sufficient contrast for readability. |

## 13. Responsive and Browser Testing

The application will be tested at the following screen widths:

- 375 px – Mobile
- 768 px – Tablet
- 1440 px – Desktop

Browser testing will include:

- Google Chrome.
- Safari on a real iPhone or iPad, if available.
- Additional browser testing when devices are available.

The application should display correctly, remain usable, and provide access to important features across supported screen sizes and browsers.

## 14. Smoke and Exploratory Testing

### Smoke Testing

After deployments to the dev and main branches, basic smoke testing will include:

- Sign in with a valid test account.
- Open an available challenge.
- Submit an answer.
- Verify that the application responds as expected.

### Exploratory Testing

Time-boxed exploratory testing sessions will be performed for individual features to identify unexpected behavior, usability issues, and defects not covered by existing test cases.

## 15. QA Release Readiness

Before release, the QA & Release Lead will:

- Review completed test cases.
- Verify that critical and high-priority defects are resolved or formally reviewed.
- Perform regression testing on affected functionality.
- Confirm that important security and data isolation checks pass.
- Document outstanding defects and known limitations.
- Share the QA status with the project team.
- Support the final release readiness decision.

