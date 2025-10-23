# JWT & Forms Test Suite - Quick Start

## 🎯 New Test Page Available!

**URL**: `http://localhost:5000/jwt-forms-test.html`

A comprehensive, interactive test suite for all JWT authentication and Forms Management features.

## ✨ Features

### 1. Quick Stats Dashboard
- Server status (online/offline)
- JWT token status (active/not generated)
- Forms count
- API version

### 2. JWT Authentication Tests
- **Generate Token**: Get JWT with practice details embedded
- **Verify Token**: Validate token and check practice status
- **Refresh Token**: Get new access token
- **Decode Token**: View embedded payload
- **Test Expired**: Verify expired token handling

### 3. Forms Management Tests
- **List Forms**: View all forms for authenticated practice
- **Create Form**: Add new form configuration
- **Get Details**: View specific form
- **Update Form**: Modify form properties
- **Delete Form**: Remove form and cascading data

### 4. Field Management
- **Create Field**: Add fields to forms
- **List Fields**: View all fields for a form
- **CRUD Operations**: Full create, read, update, delete

### 5. Field Mapping
- **Create Mapping**: Map fields to CRM entities
- **Configure Transforms**: lowercase, uppercase, trim, etc.
- **View Mappings**: Check field-to-CRM mappings

### 6. Automated Test Suite
- **Full Integration Flow**: End-to-end testing
- **Real-time Logging**: Terminal-style output
- **Success Tracking**: Pass/fail indicators
- **Auto-cleanup**: Test data management

## 🚀 Quick Start

### Method 1: Automated Testing
```
1. Open: http://localhost:5000/jwt-forms-test.html
2. Click: "Run Full Test Suite"
3. Watch: Real-time test log
4. Review: Results and artifacts
```

### Method 2: Manual Testing
```
1. Select API key: tooth-docs-dental
2. Click: "Generate Token"
3. Click: "List Forms"
4. Fill in form details
5. Click: "Create Form"
6. Continue testing...
```

## 📊 What Gets Tested

### Authentication
✅ Token generation with API key
✅ Token verification  
✅ Token refresh
✅ Practice details in JWT
✅ Expired token rejection
✅ Authorization enforcement

### Forms Management
✅ List forms (multi-tenant isolation)
✅ Create forms with validation
✅ Get form details
✅ Update form properties
✅ Delete forms (cascading)

### Fields & Mappings
✅ Create form fields
✅ Field validation rules
✅ CRM field mappings
✅ Transform functions
✅ Display order management

## 🎨 UI Features

- **Color-coded results**: Green (success), Red (error), Yellow (warning)
- **Real-time logging**: Terminal-style with timestamps
- **Auto-enable buttons**: Based on authentication state
- **Collapsible sections**: API reference, token details
- **Quick stats**: Dashboard with key metrics

## 📝 Test Scenarios

### Scenario 1: Basic Flow
```
Generate Token → Verify Token → List Forms → Done!
```

### Scenario 2: Create Form
```
Generate Token → Fill Details → Create Form → Get Details
```

### Scenario 3: Complete Setup
```
Generate Token → Create Form → Add Fields → Create Mappings
```

### Scenario 4: Auth Testing
```
Try Without Auth (fail) → Generate Token → Try Again (success)
```

## 🔧 Configuration

**API Keys Available:**
- `sk_live_abc123` - Example client (abc-123)
- `sk_live_toothdocs123` - Tooth Docs Dental (has seeded data)

**Recommended**: Use `tooth-docs-dental` for testing as it has pre-seeded forms.

## 🐛 Troubleshooting

### 401 Errors
- Click "Generate Token" first
- Check token status shows "Active"
- Verify correct API key selected

### Server Not Responding
```bash
# Check server
curl http://localhost:5000/

# Restart if needed
npm run start:dev
```

### No Forms Showing
- Verify JWT token generated
- Check you're using correct API key
- Try creating a new form

## 📚 Documentation Links

- **API Testing Guide**: `docs/API_TESTING_GUIDE.md`
- **Implementation Details**: `docs/IMPLEMENTATION_COMPLETE.md`
- **User Flow**: `docs/USER_FLOW_WITH_AUTH.md`
- **Quick Reference**: `docs/AUTH_QUICK_REFERENCE.md`
- **Swagger Docs**: `http://localhost:5000/api`

## ✅ Testing Checklist

Before testing:
- [ ] Server running on port 5000
- [ ] Browser open to test page
- [ ] No console errors

JWT Tests:
- [ ] Token generates successfully
- [ ] Token contains practiceId
- [ ] Verification works
- [ ] Refresh works

Forms Tests:
- [ ] List forms works
- [ ] Create form works
- [ ] Update form works
- [ ] Delete form works

Integration:
- [ ] Full test suite passes
- [ ] No errors in log
- [ ] All artifacts created

## 🎉 Success!

The test suite provides comprehensive coverage of all JWT and Forms features with an intuitive, visual interface. Perfect for:

- Development testing
- QA validation
- API demonstrations
- Integration verification
- Debugging issues

**Start testing now**: `http://localhost:5000/jwt-forms-test.html`
