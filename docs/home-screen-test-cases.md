
# STEM Challenge Hub – Home Screen QA Test Cases

**Project:** STEM Challenge Hub  
**Module:** Home Screen / Login  
**Prepared by:** QA & Release Lead  
**Purpose:** Verify Home Screen navigation, role selection, STEM card interactions, and accessibility.

## Testing Instructions

1. Execute each test using fictional demo accounts.
2. Compare actual results with expected results.
3. Record Pass, Fail, or Pending Retest.
4. Report confirmed defects with steps to reproduce.

## Home Screen Test Cases

| Test ID | Feature | Steps to Test | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| HS-01 | Home Screen Loading | Open the public website. | Home Screen loads without errors. | | Not Tested |
| HS-02 | Teacher Selection | Select Teacher on the login screen. | Teacher role is visibly selected. | | Not Tested |
| HS-03 | Student Selection | Select Student on the login screen. | Student role is visibly selected. | | Not Tested |
| HS-04 | Teacher Login | Select Teacher and sign in with teacher credentials. | Teacher Workspace opens. | | Not Tested |
| HS-05 | Student Login | Select Student and sign in with student credentials. | Student Workspace opens. | | Not Tested |
| HS-06 | Role Mismatch | Select Teacher and enter student credentials. | App asks the user to select the correct role. | | Pending Retest |
| HS-07 | Science Card | Click the Science card. | Science illustration changes as intended. | | Pending Retest |
| HS-08 | Technology Card | Click the Technology card. | Technology illustration changes as intended. | | Pending Retest |
| HS-09 | Engineering Card | Click the Engineering card. | Engineering illustration changes as intended. | | Pending Retest |
| HS-10 | Maths Card | Click the Maths card. | A different maths problem is displayed. | | Pending Retest |
| HS-11 | Keyboard Accessibility | Navigate STEM cards using the keyboard. | Cards can be focused and activated using the keyboard. | | Pending Retest |
| HS-12 | Create Account Navigation | Click Create Account. | Registration screen opens. | | Not Tested |
| HS-13 | Password Visibility | Use Show and Hide on the password field. | Password visibility changes correctly. | | Not Tested |
| HS-14 | Forgot Password | Click Forgot Password. | Password recovery flow responds as designed. | | Needs Investigation |

## Additional Notes

- Retest updated Home Screen behavior after the latest version is deployed.
- Confirm requirements with the UX/UI designer before reporting unexpected behavior as a defect.
- Record browser, device, actual result, and screenshots for failures.
- Do not treat planned or unfinished features as confirmed defects.
