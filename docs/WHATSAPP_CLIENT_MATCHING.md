# WhatsApp Automatic Client Matching

This document describes the automatic client matching functionality for WhatsApp contacts in the Avaliatec system.

## Overview

The automatic client matching feature automatically associates WhatsApp contacts with existing clients in the system based on phone number matching. This helps maintain data consistency and provides better context during customer interactions.

## Features

- **Automatic Phone Number Normalization**: Handles different phone number formats (with/without country codes, formatting characters)
- **Background Job Processing**: Can run as scheduled tasks or background jobs
- **Batch Processing**: Processes contacts in configurable batches to avoid system overload
- **Real-time Matching**: New contacts are automatically matched when created
- **Manual Triggering**: Can be triggered manually via API or CLI
- **Statistics and Monitoring**: Provides detailed statistics about matching success rates

## How It Works

### Phone Number Normalization

The system normalizes phone numbers by:
1. Removing all non-digit characters
2. Handling Brazilian country code (55)
3. Adding missing mobile digit (9) for Brazilian numbers
4. Removing leading zeros
5. Ensuring minimum 10 digits for valid numbers

### Matching Process

1. **Contact Creation**: When a new WhatsApp contact is created, the system attempts to match it with existing clients
2. **Phone Comparison**: Normalized phone numbers are compared between contacts and clients
3. **Association**: If a match is found, the contact is associated with the client and marked as type "cliente"
4. **Name Update**: If the contact doesn't have a name, it's updated with the client's name

## Usage

### Automatic Matching

Automatic matching happens in the following scenarios:

1. **New Message Received**: When processing incoming messages via webhook
2. **Contact Updates**: When contact information is updated via Evolution API
3. **Background Jobs**: Scheduled tasks that process unmatched contacts

### Manual Triggering

#### Via API

```bash
# Match all unmatched contacts
curl -X POST "https://your-app.com/api/whatsapp/match-clients" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Match contacts for specific instance
curl -X POST "https://your-app.com/api/whatsapp/match-clients" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "your-instance-id"}'

# Match specific contact
curl -X POST "https://your-app.com/api/whatsapp/match-clients" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contactId": "contact-id"}'

# Get matching statistics
curl -X GET "https://your-app.com/api/whatsapp/match-clients" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Via CLI Script

```bash
# Match all unmatched contacts
npm run whatsapp:match-clients

# Match contacts for specific instance
npm run whatsapp:match-clients -- --instance-id abc123

# Get statistics only
npm run whatsapp:match-stats

# Custom batch size and delay
node scripts/match-clients.js --batch-size 20 --delay 200

# Show help
node scripts/match-clients.js --help
```

#### Via Background Job API

```bash
# Run background job (for cron/scheduled tasks)
curl -X POST "https://your-app.com/api/whatsapp/jobs/match-clients" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceId": "optional-instance-id",
    "batchSize": 10,
    "delayBetweenBatches": 100,
    "maxRetries": 3
  }'

# Get job statistics
curl -X GET "https://your-app.com/api/whatsapp/jobs/match-clients" \
  -H "X-Cron-Secret: YOUR_CRON_SECRET"
```

## Configuration

### Environment Variables

```env
# Optional: Secret for cron job authentication
CRON_SECRET=your-secure-cron-secret

# Required: Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Job Configuration Options

- **instanceId**: Limit matching to specific WhatsApp instance
- **batchSize**: Number of contacts to process in each batch (default: 10)
- **delayBetweenBatches**: Delay in milliseconds between batches (default: 100)
- **maxRetries**: Maximum number of retry attempts (default: 3)

## Scheduling

### Using Cron (Linux/macOS)

Add to your crontab to run every hour:

```bash
# Edit crontab
crontab -e

# Add this line to run every hour
0 * * * * curl -X POST "https://your-app.com/api/whatsapp/jobs/match-clients" -H "X-Cron-Secret: YOUR_CRON_SECRET" -H "Content-Type: application/json" -d '{}'
```

### Using Node.js Scheduled Tasks

```javascript
const { scheduleClientMatchingJob } = require('./lib/services/clientMatchingJob')

// Schedule to run every 5 minutes
const stopScheduler = scheduleClientMatchingJob(5 * 60 * 1000, {
  batchSize: 20,
  delayBetweenBatches: 200
})

// Stop scheduler when needed
// stopScheduler()
```

### Using Vercel Cron Jobs

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/whatsapp/jobs/match-clients",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Monitoring

### Statistics

The system provides detailed statistics about client matching:

- **Total Contacts**: Total number of WhatsApp contacts
- **Matched Contacts**: Number of contacts associated with clients
- **Unmatched Contacts**: Number of contacts without client association
- **Matching Percentage**: Percentage of contacts successfully matched

### Logging

The system logs all matching activities:

```
Starting automatic client matching process...
Found 15 unmatched contacts
Matched contact 5511999999999 with client João Silva
Matched contact 5511888888888 with client Maria Santos
Automatic client matching completed. Matched 2 contacts.
```

### Error Handling

- **Database Errors**: Logged but don't stop the process
- **API Errors**: Retried with exponential backoff
- **Validation Errors**: Skipped with logging
- **Critical Errors**: Logged and reported

## Best Practices

### Performance

1. **Batch Processing**: Use appropriate batch sizes (10-50 contacts)
2. **Rate Limiting**: Add delays between batches to avoid overwhelming the database
3. **Indexing**: Ensure proper database indexes on phone number columns
4. **Monitoring**: Monitor execution times and success rates

### Data Quality

1. **Phone Number Formats**: Ensure consistent phone number formats in client data
2. **Duplicate Prevention**: Handle duplicate phone numbers gracefully
3. **Manual Review**: Periodically review unmatched contacts manually
4. **Data Validation**: Validate phone numbers before storing

### Security

1. **Authentication**: Always require authentication for API endpoints
2. **Rate Limiting**: Implement rate limiting on public endpoints
3. **Logging**: Log all matching activities for audit purposes
4. **Access Control**: Restrict access to sensitive matching operations

## Troubleshooting

### Common Issues

1. **No Matches Found**
   - Check phone number formats in client database
   - Verify normalization logic is working correctly
   - Review client phone number data quality

2. **Performance Issues**
   - Reduce batch size
   - Increase delay between batches
   - Check database indexes

3. **Authentication Errors**
   - Verify API tokens are valid
   - Check cron secret configuration
   - Ensure proper permissions

### Debug Mode

Enable debug logging by setting environment variable:

```env
DEBUG=whatsapp:matching
```

### Manual Verification

Check matching results manually:

```sql
-- Check unmatched contacts
SELECT 
  wc.phone_number,
  wc.name,
  wc.contact_type,
  wc.client_id
FROM whatsapp_contacts wc
WHERE wc.client_id IS NULL
ORDER BY wc.created_at DESC;

-- Check matched contacts
SELECT 
  wc.phone_number,
  wc.name as contact_name,
  c.name as client_name,
  wc.contact_type
FROM whatsapp_contacts wc
JOIN clients c ON wc.client_id = c.id
ORDER BY wc.updated_at DESC;
```

## API Reference

### POST /api/whatsapp/match-clients

Runs client matching for contacts.

**Request Body:**
```json
{
  "instanceId": "optional-instance-id",
  "contactId": "optional-specific-contact-id"
}
```

**Response:**
```json
{
  "success": true,
  "matchedCount": 5,
  "message": "Successfully matched 5 contacts with clients"
}
```

### GET /api/whatsapp/match-clients

Gets client matching statistics.

**Query Parameters:**
- `instanceId`: Optional instance ID filter

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalContacts": 100,
    "matchedContacts": 85,
    "unmatchedContacts": 15,
    "matchingPercentage": 85
  },
  "unmatchedContacts": [...]
}
```

### POST /api/whatsapp/jobs/match-clients

Runs background job for client matching.

**Headers:**
- `Authorization: Bearer TOKEN` or `X-Cron-Secret: SECRET`

**Request Body:**
```json
{
  "instanceId": "optional",
  "batchSize": 10,
  "delayBetweenBatches": 100,
  "maxRetries": 3
}
```

**Response:**
```json
{
  "success": true,
  "matchedCount": 8,
  "totalProcessed": 8,
  "executionTime": 1250,
  "errors": [],
  "message": "Successfully matched 8 contacts with clients"
}
```