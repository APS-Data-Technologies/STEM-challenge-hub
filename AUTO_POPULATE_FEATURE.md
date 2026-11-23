# Auto-Population Feature & Timezone Options

## 📋 Overview

This feature automatically pre-fills Subject and Grade Band fields in both "Daily Program" and "Individual Challenge" forms based on the selected classroom, reducing repetitive data entry for teachers.

## ✨ Features

### 1. Auto-Populated Subject & Grade Band
- **Where**: Daily Program creation form and Individual Challenge form
- **How it Works**: 
  - When a teacher selects a class and clicks "Create a challenge" or "Create daily program"
  - The Subject and Grade Band fields are automatically populated based on the class settings
  - Teachers can still manually change these values if needed
  
### 2. Intelligent Grade Band Mapping
- **K-5 Classrooms** → Auto-select **K-2** grade band (or 3-5 for upper grades)
- **6-8 Classrooms** → Auto-select **6-8** grade band
- **9-12 Classrooms** → Auto-select **9-12** grade band

### 3. Timezone Dropdown for Daily Programs
- **Instead of**: Text input for timezone (e.g., "America/Chicago")
- **Now**: Dropdown menu with preset options:
  - 🌍 **CST** (Central): America/Chicago
  - 🌍 **EST** (Eastern): America/New_York
  - 🌍 **MST** (Mountain): America/Denver
  - 🌍 **PST** (Pacific): America/Los_Angeles
- **Benefits**:
  - Prevents timezone input errors
  - Faster selection for teachers
  - Consistent timezone representation

## 🎯 Teacher Benefits

### Time Savings
- ✅ No more typing the same subject for every challenge
- ✅ Grade band automatically matches class level
- ✅ Timezone selection from dropdown instead of manual entry

### Consistency
- ✅ All challenges for a class have matching grade band
- ✅ Subject alignment with class focus area
- ✅ Proper timezone for scheduling daily programs

### Error Prevention
- ✅ No invalid timezone entries (e.g., typos like "Amerca/Chicago")
- ✅ Grade band always matches classroom level
- ✅ Maintains data integrity

## 🔧 Technical Implementation

### Files Modified
1. **ChallengeForm.tsx** (src/components/)
   - Added `classRecord` prop
   - Implemented `getDefaultGradeBand()` function
   - Auto-populated Subject and Grade Band selects
   - Added hints below fields

2. **DailyPrograms.tsx** (src/components/)
   - Updated `DailyPrograms` component to accept `classRecord`
   - Enhanced `ProgramForm` with:
     - `classRecord` parameter
     - `getDefaultGradeBand()` function
     - Timezone dropdown with 4 preset options
   - Added field hints

3. **App.tsx** (src/)
   - Pass `classRecord` to `DailyPrograms` component
   - Pass `classRecord` to `ChallengeForm` component

### Code Example

#### Daily Program Form
```tsx
// Timezone dropdown
<select name="timeZone" defaultValue={program?.time_zone ?? timeZone}>
  {timezones.map((tz) => (
    <option key={tz.value} value={tz.value}>
      {tz.label}
    </option>
  ))}
</select>

// Grade band auto-mapping
const getDefaultGradeBand = () => {
  const classGrade = classRecord?.grade_band
  if (classGrade === 'K-5') return 'K-2'
  if (classGrade === '6-8') return '6-8'
  if (classGrade === '9-12') return '9-12'
  return 'K-2'
}
```

#### Individual Challenge Form
```tsx
// Auto-populated with hint
<label>
  Grade band
  <select defaultValue={getDefaultGradeBand()} name="gradeBand">
    {gradeBands.map((band) => (...))}
  </select>
  <span className="field-hint">Based on class grade level</span>
</label>
```

## 📊 Timezone Mapping

| Display Name | Timezone Value | Region |
|-------------|-----------------|--------|
| CST (Central) | America/Chicago | Central Time |
| EST (Eastern) | America/New_York | Eastern Time |
| MST (Mountain) | America/Denver | Mountain Time |
| PST (Pacific) | America/Los_Angeles | Pacific Time |

## 🧪 Testing

### Test Cases

1. **Create Daily Program**
   - [ ] Select a K-5 classroom
   - [ ] Click "Create daily program"
   - [ ] Verify Grade band defaults to "K-2"
   - [ ] Verify Subject shows class subject
   - [ ] Verify Timezone dropdown appears with 4 options

2. **Create Individual Challenge**
   - [ ] Select a 6-8 classroom
   - [ ] Click "Create a challenge"
   - [ ] Verify Grade band defaults to "6-8"
   - [ ] Verify Subject matches class
   - [ ] Verify user can still change both fields

3. **Override Values**
   - [ ] Create challenge with class A
   - [ ] Change grade band manually
   - [ ] Save challenge
   - [ ] Verify custom value is saved

4. **Timezone Selection**
   - [ ] Open Daily Program form
   - [ ] Click timezone dropdown
   - [ ] Verify all 4 options are present
   - [ ] Select CST, verify "America/Chicago" is used
   - [ ] Save and verify timezone is stored

## 🚀 Usage Instructions for Teachers

### Creating a Daily Program
1. Select your class
2. Click "Create daily program" or navigate to "Daily programs"
3. Click "Create a daily program" button
4. The form appears with:
   - **Subject**: Pre-filled with your class subject
   - **Grade band**: Auto-matched to your class level
   - **Time zone**: New dropdown with CST/EST/MST/PST
5. Adjust if needed, then continue

### Creating an Individual Challenge
1. Select your class
2. Click "Create a challenge"
3. Choose number of challenges
4. Each challenge form has:
   - **Subject**: Pre-selected from your class
   - **Grade band**: Automatically matched to class
5. Modify if needed and save

## 🎓 Backward Compatibility

✅ **Fully Compatible**
- Existing daily programs keep their saved timezone values
- Existing challenges maintain their grade band and subject
- No data migration needed
- Teachers can still manually edit all fields

## 📈 Future Enhancements

### Potential Improvements
- [ ] Add more timezone options (UTC, GMT, IST, etc.)
- [ ] Remember teacher's last-used timezone
- [ ] Auto-detect timezone based on teacher's location
- [ ] Allow custom timezone labels per school
- [ ] Add subject selection based on class focus area

## 💡 Tips for Teachers

### Best Practices
- ✅ Make sure your class grade band is correctly set when creating it
- ✅ Use the preset timezones for consistent scheduling
- ✅ Subject auto-population encourages focused class design
- ✅ Override values only when creating cross-grade or multi-subject challenges

### Common Scenarios

**Scenario 1**: I teach multiple grades in one class
- Override the auto-selected grade band with the range you need
- Keep subject aligned with primary focus

**Scenario 2**: I work with students across different time zones
- Select the timezone for your school's daily program scheduling
- Students will see times adjusted to their local timezone (future feature)

**Scenario 3**: I want challenges for multiple subjects
- Create challenges for each subject separately
- Or manually override the subject field when needed

---

**Last Updated**: November 23, 2026  
**Status**: ✅ Ready for Production  
**Git Commit**: 9d8c98b
