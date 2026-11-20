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
- Role-based access and navigation.
- Teacher class management.
- Challenge creation, editing, and deletion.
- Student class joining using a join code.
- Student challenge viewing and answer submission.
- Correct and incorrect answer feedback.
- Teacher student progress dashboard.
- Student and class data isolation.
- Responsive layout across devices.
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

## 4. Test Environment

| Item | Environment |
|---|---|
| Frontend | React + Vite |
| Backend | Supabase |
| Hosting | Vercel |
| Browsers | Chrome and Safari |
| Devices | Mobile, Tablet, Desktop |
| Test Data | Fictional accounts and records |

## 5. Entry Criteria

Testing can begin when:

- The feature is implemented and available.
- The application is accessible.
- Required test accounts are available.
- Expected functionality is documented.

## 6. Exit Criteria

Testing is considered complete when:

- All planned test cases have been executed.
- Critical and high-priority defects are resolved or formally reviewed before release.
- Major functionality works as expected.
- Regression testing is completed.
- Remaining issues are documented.

## 7. Defect Reporting

Every identified defect should include:

- Bug ID
- Bug Description
- Steps to Reproduce
- Expected Result
- Actual Result
- Priority (P1, P2, P3)
- Status

## 8. Test Documentation

Test cases and execution results will be maintained in the repository's `/docs` folder.

The QA checklist will record:

- Test case ID
- Feature
- Test steps
- Expected result
- Actual result
- Pass/Fail status
- Device and browser

## 9. QA Responsibilities

The QA & Release Lead is responsible for:

- Preparing test plans and test cases.
- Reviewing application functionality.
- Executing planned tests.
- Identifying and reporting defects.
- Performing regression testing.
- Supporting final release readiness.

## 10. Important Testing Notes

- Only fictional student and teacher data will be used.
- Student accounts must not access teacher-only functionality.
- Students must not access another class's private information.
- Security testing must be repeated after relevant changes.
- Features not yet implemented will be tested when available.
  
## 11. Backend and Security Test Scenarios

The following additional scenarios will be included in QA testing:

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| TC-20 | Student Answer Key Security | Students cannot view or access correct answer keys before or after submitting an answer. |
| TC-21 | Invalid and Duplicate Class Joining | An invalid join code displays an appropriate error. Joining the same class twice does not create duplicate enrollment records. |
| TC-22 | Unpublished Challenge Visibility | Unpublished challenges are not visible or accessible to students. |
| TC-23 | Signed-Out User Access | Signed-out users cannot access class, challenge, or submission data. |
| TC-24 | Written Answer Review | Written answers are not automatically graded, and teacher comments are visible to students when provided. |

These scenarios will be tested using fictional demo accounts and data. Security tests will verify that access restrictions are enforced by the backend, not only by the user interface.

