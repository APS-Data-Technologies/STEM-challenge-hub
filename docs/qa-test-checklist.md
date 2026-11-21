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
| TC-01 | Teacher Login | Sign in using a valid teacher account. | Teacher logs in and sees the teacher dashboard. | | Not Tested | |
| TC-02 | Student Login | Sign in using a valid student account. | Student logs in and sees My Challenges. | | Not Tested | |
| TC-03 | Invalid Login | Enter incorrect login details. | An appropriate error message appears. | | Not Tested | |
| TC-04 | Create Class | Sign in as a teacher and create a class. | Class is created successfully. | | Not Tested | |
| TC-05 | Join Class | Enter a valid class join code as a student. | Student joins the correct class. | | Not Tested | |
| TC-06 | Invalid Join Code | Enter an incorrect class code. | An error appears and the student does not join a class. | | Not Tested | |
| TC-07 | Create Challenge | Choose two individual challenges, save one multiple-choice question and one short-answer question. Repeat and cancel after saving the first. | Each challenge is saved separately; cancelling preserves the one already saved. | | Not Tested | |
| TC-08 | Edit Challenge | Edit an existing challenge. | Updated information is displayed. | | Not Tested | |
| TC-09 | Delete Challenge | Delete a challenge as a teacher. | Challenge is removed successfully. | | Not Tested | |
| TC-10 | View Challenges | Open the student challenge page. | Published challenges for the student's class appear. | | Not Tested | |
| TC-11 | Submit Correct Answer | Submit the correct multiple-choice answer. | Correct feedback appears. | | Not Tested | |
| TC-12 | Submit Incorrect Answer | Submit an incorrect multiple-choice answer. | Try again or incorrect feedback appears. | | Not Tested | |
| TC-13 | Short Answer | Submit a short-text answer. | Answer is saved for the teacher. | | Not Tested | |
| TC-14 | Teacher Progress | Open the teacher progress dashboard. | Student progress is displayed correctly. | | Not Tested | |
| TC-15 | Student Data Security | Try accessing another class's student information. | Access is denied and private information is not displayed. | | Not Tested | |
| TC-16 | Answer Key Security | Try accessing the correct answer key as a student. | Student cannot access the answer key. | | Not Tested | |
| TC-17 | Responsive Design | Open the website on phone, tablet and laptop. | Website displays correctly on all devices. | | Not Tested | |
| TC-18 | Browser Compatibility | Open the website using Chrome and Safari. | Website works correctly in both browsers. | | Not Tested | |
| TC-19 | Public Vercel Link | Open the public Vercel URL in a browser. | Website opens successfully and loads without errors. | | Not Tested | |
| TC-20 | Teacher navigation | Open a grade group, select a class, and switch between Challenges and Class progress. Return to all classes and select another class. | The group list is labeled with its grade group; the selected class and current page are clear, and each class shows its own data. | | Not Tested | |
| TC-21 | Student navigation | Join a class with its code, then switch between enrolled classes. Search for a challenge that does not exist. | The selected class name and its challenges are shown; an unmatched search suggests changing the search or filter. | | Not Tested | |
| TC-22 | Account role | Sign in as each role, including selecting the opposite role; then create accounts with each role. | Matching roles open the appropriate workspace; mismatched sign-ins are rejected; sign-up uses the selected role. | | Not Tested | |
| TC-23 | Class order | In a grade group with several classes, move a class with the arrows, open a class, and select All classes. Also reopen the grade group. | The arrows allow a custom order; reopening the list restores grade order without changing other grade groups. | | Not Tested | |
| TC-24 | Daily program setup | As a teacher, create a daily plan, add 1–10 questions per day with the planned difficulty totals, and publish it. | The plan shows its schedule and question counts; publishing succeeds only when each day and total is valid. | | Not Tested | |
| TC-25 | Daily program student flow | As an enrolled student, open a published program before and after a day's scheduled opening, then answer its questions. | Future questions remain unavailable; unlocked questions accept answers and show feedback and progress. | | Not Tested | |
| TC-26 | Daily program review | As a teacher, review a student's short answer and view their progress and streak. Try editing the program after an answer. | The review and progress appear correctly; edits after answers are blocked. | | Not Tested | |

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

## Testing Summary

- Total test cases: 26
- Passed:
- Failed:
- Not tested:
- Blocked:

**Note:** All test cases should remain Not Tested until the actual website has been tested. Use fictional demo accounts and data only.
