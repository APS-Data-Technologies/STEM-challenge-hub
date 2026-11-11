# STEM Challenge Hub – QA Testing Checklist

**Project:** STEM Challenge Hub  
**Role:** QA & Release Lead  
**Purpose:** To test project features and record whether they work correctly.

## Testing Instructions

1. Test each feature using the steps below.
2. Compare the actual result with the expected result.
3. Mark the status as Pass, Fail, or Not Tested.
4. If something fails, report the problem in Asana.
5. Record the device and browser used for testing.

## Test Checklist

| Test ID | Feature | Steps to Test | Expected Result | Actual Result | Status | Device / Browser |
|---|---|---|---|---|---|---|
| TC-01 | Teacher Login | Sign in using a valid teacher account. | Teacher logs in and sees the teacher dashboard. | Not yet recorded. | Not Tested | |
| TC-02 | Student Login | Sign in using a valid student account. | Student logs in and sees My Challenges. | Student login succeeded and My Challenges displayed. | Pass | Desktop / Chrome |
| TC-03 | Invalid Login | Enter incorrect login details. | An appropriate error message appears. | Not yet recorded. | Not Tested | |
| TC-04 | Create Class | Sign in as a teacher and create a class. | Class is created successfully. | Not yet recorded. | Not Tested | |
| TC-05 | Join Class | Enter a valid class join code as a student. | Student joins the correct class. | Not yet recorded. | Not Tested | |
| TC-06 | Invalid Join Code | Enter an incorrect class code. | An error appears and the student does not join a class. | Not yet recorded. | Not Tested | |
| TC-07 | Create Challenge | Create a challenge as a teacher. | Challenge is saved successfully. | Not yet recorded. | Not Tested | |
| TC-08 | Edit Challenge | Edit an existing challenge. | Updated information is displayed. | Not yet recorded. | Not Tested | |
| TC-09 | Delete Challenge | Delete a challenge as a teacher. | Challenge is removed successfully. | Not yet recorded. | Not Tested | |
| TC-10 | View Challenges | Open the student challenge page. | Published challenges for the student's class appear. | Student dashboard displayed 4 challenges. | Pass | Desktop / Chrome |
| TC-11 | Submit Correct Answer | Submit the correct multiple-choice answer. | Correct feedback appears. | Not yet recorded. | Not Tested | |
| TC-12 | Submit Incorrect Answer | Submit an incorrect multiple-choice answer. | Try again or incorrect feedback appears. | Not yet recorded. | Not Tested | |
| TC-13 | Short Answer | Submit and update a short-text answer. | Answer is saved and visible to the teacher. | Paper tower answer was submitted, updated, persisted after refresh, and displayed to the teacher. | Pass | Desktop / Chrome |
| TC-14 | Teacher Progress and Review | Open teacher progress and test Correct and Needs revision actions. | Progress is displayed, and review actions update the answer status. | Teacher dashboard and View answer worked. Both review actions showed no visible response. After refresh, status remained Awaiting review and review count remained 1. | Fail – review actions | Desktop / Chrome |
| TC-15 | Student Data Security | Try accessing another class's student information. | Access is denied and private information is not displayed. | Not yet recorded. | Not Tested | |
| TC-16 | Answer Key Security | Try accessing the correct answer key as a student. | Student cannot access the answer key. | Not yet recorded. | Not Tested | |
| TC-17 | Responsive Design | Open the website on phone, tablet and laptop. | Website displays correctly on all devices. | Not yet recorded. | Not Tested | |
| TC-18 | Browser Compatibility | Open the website using Chrome and Safari. | Website works correctly in both browsers. | Not yet recorded. | Not Tested | |
| TC-19 | Public Vercel Link | Open the public Vercel URL in a browser. | Website opens successfully and loads without errors. | Preview URL opened successfully. Public production deployment not yet confirmed. | Not Tested | Desktop / Chrome |

## Bug Reporting

If a test fails, record the following information in Asana:

- Bug title:
- Test ID:
- Steps to reproduce:
- Expected result:
- Actual result:
- Device and browser:
- Priority: P1 / P2 / P3
- Screenshot (if available):

### Current QA Finding

**Bug title:** Teacher short-answer review actions do not respond.

**Test ID:** TC-14

**Steps to reproduce:**
1. Sign in as a teacher.
2. Open Class progress.
3. Find a student short-answer submission.
4. Click Correct.
5. Repeat with Needs revision.
6. Refresh the page and check the answer status.

**Expected result:** The selected review action should update the answer's review status and the review count

**Actual result:** Neither action produced a visible response. After refreshing, the answer remained Awaiting review and the review count remained 1.

**Device and browser:** Desktop / Chrome.

**Priority:** Pending team assessment.

## Testing Summary

- Total test cases: 19
- Passed: 3
- Failed: 1
- Not tested: 15
- Blocked: 0

**Note:** TC-14 is marked Fail because the review actions did not work, although the teacher dashboard and View answer feature worked. TC-19 remains Not Tested because the public production deployment has not been confirmed. Only fictional demo accounts and data were used.
