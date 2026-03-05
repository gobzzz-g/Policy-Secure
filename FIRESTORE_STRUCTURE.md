# Firestore Database Structure

## Collections Overview

### 📄 users
User profiles and authentication data

```javascript
{
  userId: "auto-generated-id",
  email: "user@example.com",
  full_name: "John Doe",
  phone: "+1234567890",
  role: "policyholder" | "claims_officer" | "fraud_investigator" | "admin",
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- role (ascending)

---

### 📋 policies
Insurance policies

```javascript
{
  policyId: "auto-generated-id",
  userId: "user-id-ref",
  policyNumber: "POL-2024-001",
  policyType: "auto" | "health" | "home" | "life" | "business",
  coverageAmount: 100000,
  premium: 1500,
  startDate: "2024-01-01",
  endDate: "2025-01-01",
  status: "active" | "expired" | "cancelled",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- userId + status (compound)
- status (ascending)

---

### 🎫 claims
Insurance claims

```javascript
{
  claimId: "auto-generated-id",
  userId: "user-id-ref",
  policyId: "policy-id-ref",
  claimType: "auto" | "health" | "home" | "life" | "business",
  incidentDate: "2024-03-01",
  description: "Detailed incident description",
  estimatedAmount: 5000,
  location: "123 Main St, City",
  witnesses: ["Name 1", "Name 2"],
  status: "submitted" | "under_review" | "approved" | "rejected" | "closed",
  fraudRisk: "low" | "medium" | "high" | "critical" | "pending",
  fraudScore: 0-100,
  fraudIndicators: ["indicator1", "indicator2"],
  fraudAnalyzedAt: Timestamp,
  settlementAmount: 4500,
  settlementCalculatedAt: Timestamp,
  approvedAt: Timestamp,
  notes: [
    {
      text: "Note text",
      addedBy: "user-id",
      addedAt: "ISO-8601-timestamp"
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Subcollection
  timeline: [
    {
      timelineId: "auto-generated-id",
      action: "created" | "status_changed" | "updated",
      description: "Claim submitted",
      status: "submitted",
      timestamp: Timestamp,
      user: "user-id",
      previousStatus: "previous-status"
    }
  ]
}
```

**Indexes:**
- userId + createdAt (compound, descending)
- status + createdAt (compound, descending)
- fraudRisk + createdAt (compound, descending)

---

### 🚨 fraud_reports
Fraud investigation reports

```javascript
{
  reportId: "auto-generated-id",
  claimId: "claim-id-ref",
  userId: "user-id-ref",
  riskLevel: "high" | "critical",
  fraudScore: 0-100,
  indicators: [
    "Inconsistent timeline",
    "Unusually high claim amount",
    "Missing documentation"
  ],
  recommendations: [
    "Conduct in-person interview",
    "Verify incident location",
    "Request additional documentation"
  ],
  analyzedBy: "investigator-user-id",
  status: "pending_review" | "under_investigation" | "confirmed" | "dismissed",
  action: "approve" | "reject" | "request_more_info",
  notes: [
    {
      text: "Investigation note",
      addedBy: "user-id",
      addedAt: "ISO-8601-timestamp"
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  updatedBy: "user-id"
}
```

**Indexes:**
- claimId + createdAt (compound, descending)
- status + createdAt (compound, descending)

---

### 💰 settlement_results
Settlement calculations and approvals

```javascript
{
  settlementId: "auto-generated-id",
  claimId: "claim-id-ref",
  userId: "user-id-ref",
  policyId: "policy-id-ref",
  recommendedAmount: 4500,
  finalAmount: 4200,
  breakdown: {
    baseClaim: 5000,
    deductible: -500,
    adjustments: -300
  },
  factors: [
    "Policy coverage limit",
    "Deductible applied",
    "Fraud risk adjustment"
  ],
  aiConfidence: "low" | "medium" | "high",
  calculatedBy: "officer-user-id",
  status: "pending_approval" | "approved" | "rejected",
  approvedBy: "officer-user-id",
  approvedAt: Timestamp,
  approvalNotes: "Settlement adjusted based on...",
  createdAt: Timestamp
}
```

**Indexes:**
- claimId (ascending)
- userId + createdAt (compound, descending)

---

### 📎 documents
Document metadata (actual files in Cloud Storage)

```javascript
{
  documentId: "auto-generated-id",
  claimId: "claim-id-ref",
  userId: "user-id-ref",
  fileName: "claim_evidence.pdf",
  fileType: "application/pdf",
  fileSize: 1024576,
  storagePath: "claims/claim-id/documents/filename.pdf",
  uploadedBy: "user-id",
  uploadedAt: Timestamp,
  category: "medical" | "damage_photo" | "police_report" | "other",
  verified: false,
  verifiedBy: "user-id",
  verifiedAt: Timestamp
}
```

**Indexes:**
- claimId + uploadedAt (compound, descending)
- userId (ascending)

---

### 📊 analytics
System-wide analytics (read-only for most users, written by Cloud Functions)

```javascript
{
  analyticsId: "auto-generated-id",
  type: "daily_summary" | "monthly_summary",
  date: "2024-03-05",
  metrics: {
    totalClaims: 150,
    approvedClaims: 120,
    rejectedClaims: 20,
    pendingClaims: 10,
    totalClaimAmount: 750000,
    totalSettlementAmount: 680000,
    avgSettlementTime: 48, // hours
    fraudRate: 0.13 // 13%
  },
  createdAt: Timestamp
}
```

**Indexes:**
- date (descending)
- type + date (compound)

---

## Security Rules Summary

### users
- Read: Own data + admins
- Write: Own data + admins
- Create: Anyone (registration)

### policies
- Read: Policy owner + officers + admins
- Write: Officers + admins

### claims
- Read: Claim owner + officers + investigators + admins
- Write: Claim owner (limited) + officers + admins

### fraud_reports
- Read: Investigators + admins only
- Write: Officers + investigators + admins

### settlement_results
- Read: Claim owner + officers + admins
- Write: Officers + admins only

### documents
- Read: Document owner + officers + admins
- Write: Authenticated users
- Delete: Admin + document owner

### analytics
- Read: Officers + admins
- Write: Cloud Functions only

---

## Sample Data

### Sample User (Policyholder)
```json
{
  "email": "john@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "policyholder",
  "active": true
}
```

### Sample Policy
```json
{
  "userId": "abc123",
  "policyNumber": "POL-2024-001",
  "policyType": "auto",
  "coverageAmount": 100000,
  "premium": 1500,
  "startDate": "2024-01-01",
  "endDate": "2025-01-01",
  "status": "active"
}
```

### Sample Claim
```json
{
  "userId": "abc123",
  "policyId": "policy123",
  "claimType": "auto",
  "incidentDate": "2024-03-01",
  "description": "Rear-ended at traffic light",
  "estimatedAmount": 5000,
  "location": "Main St & 1st Ave",
  "witnesses": [],
  "status": "submitted",
  "fraudRisk": "low",
  "fraudScore": 15
}
```

---

## Querying Examples

### Get all claims for a user
```javascript
db.collection('claims')
  .where('userId', '==', userId)
  .orderBy('createdAt', 'desc')
  .get()
```

### Get high-risk fraud claims
```javascript
db.collection('claims')
  .where('fraudRisk', 'in', ['high', 'critical'])
  .orderBy('createdAt', 'desc')
  .get()
```

### Get active policies for a user
```javascript
db.collection('policies')
  .where('userId', '==', userId)
  .where('status', '==', 'active')
  .get()
```

### Get pending fraud reports
```javascript
db.collection('fraud_reports')
  .where('status', '==', 'pending_review')
  .orderBy('createdAt', 'desc')
  .get()
```

---

## Migration from SQLAlchemy

If migrating from the existing FastAPI + SQLAlchemy backend:

1. Export existing data to JSON
2. Transform to Firestore format
3. Import using Firebase Admin SDK or Firebase Console
4. Update application code to use Firestore SDK
5. Test thoroughly before going live

---

## Best Practices

1. **Use subcollections** for related data (e.g., claim timeline)
2. **Denormalize** frequently accessed data
3. **Index** commonly queried fields
4. **Paginate** large query results
5. **Use transactions** for atomic operations
6. **Batch writes** when updating multiple documents
7. **Cache** frequently accessed data on client
8. **Monitor** usage and costs regularly

---

For more information, see:
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
