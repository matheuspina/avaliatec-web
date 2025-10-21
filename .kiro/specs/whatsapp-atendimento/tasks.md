# Implementation Plan

- [x] 1. Setup environment and database schema
  - Configure Evolution API environment variables in .env.local
  - Create Supabase migration for WhatsApp tables (instances, contacts, messages, quick_messages, instance_settings, auto_reply_log)
  - Apply migration and verify table creation
  - Create database indexes for performance optimization
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement Evolution API client service
  - Create evolutionApiClient.ts with base configuration and authentication
  - Implement createInstance method with webhook configuration
  - Implement connectInstance and getConnectionState methods
  - Implement sendTextMessage and sendWhatsAppAudio methods
  - Implement setSettings and getSettings methods for instance configuration
  - Implement deleteInstance method
  - Add error handling and retry logic for API calls
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3, 2.6, 4.1, 4.2, 11.2, 11.6_

- [x] 3. Implement WhatsApp business service layer
  - Create whatsappService.ts with core business logic
  - Implement processIncomingMessage method for webhook data processing
  - Implement syncContact method to create/update contacts
  - Implement matchContactWithClient method for automatic client association
  - Implement normalizePhoneNumber utility for phone number comparison
  - Implement replaceMessageVariables method for quick message variable substitution
  - Implement shouldSendAutoReply and sendAutoReply methods
  - Create availabilityChecker.ts utility for schedule validation
  - _Requirements: 3.1, 3.2, 3.3, 6.3, 6.4, 7.1, 7.2, 7.6, 9.4, 9.5_

- [x] 4. Create API route for instance management
  - Create /api/whatsapp/instances route with GET handler to list instances
  - Implement POST handler to create new instance with Evolution API
  - Create /api/whatsapp/instances/[id] route with GET, PUT, DELETE handlers
  - Create /api/whatsapp/instances/[id]/connect route for connection initiation
  - Create /api/whatsapp/instances/[id]/disconnect route for disconnection
  - Add authentication middleware to all routes
  - Add error handling and validation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.1, 10.2, 10.6_

- [x] 5. Create API route for webhook handling
  - Create /api/webhooks/evolution route with POST handler
  - Implement MESSAGES_UPSERT event processing for incoming messages
  - Implement CONNECTION_UPDATE event processing for connection status
  - Implement QRCODE_UPDATED event processing for QR code updates
  - Implement CONTACTS_UPSERT event processing for contact updates
  - Implement MESSAGES_UPDATE event processing for message status updates
  - Add webhook signature validation for security
  - Add idempotency handling to prevent duplicate processing
  - Ensure response within 5 seconds as per requirement
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [x] 6. Create API routes for contact management
  - Create /api/whatsapp/contacts route with GET handler for listing contacts
  - Implement filtering by instance, contact type, and search query
  - Create /api/whatsapp/contacts/[id] route with GET and PUT handlers
  - Implement contact type update and client association in PUT handler
  - Add unread message count calculation in contact list
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 7. Create API routes for message management
  - Create /api/whatsapp/messages route with GET handler for message history
  - Implement pagination with cursor-based approach
  - Implement POST handler for sending text messages
  - Implement audio message sending support
  - Add message status tracking (pending, sent, delivered, read, failed)
  - Add quoted message support for replies
  - Store sent messages in Supabase immediately
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 8. Create API routes for quick messages
  - Create /api/whatsapp/quick-messages route with GET handler
  - Implement POST handler to create new quick message
  - Create /api/whatsapp/quick-messages/[id] route with PUT and DELETE handlers
  - Add validation for shortcut format (must start with /)
  - Add validation for unique shortcuts
  - _Requirements: 6.1, 6.2, 6.5, 6.6_

- [x] 9. Create API routes for instance settings
  - Create /api/whatsapp/settings/[instanceId] route with GET handler
  - Implement PUT handler to update settings
  - Sync settings with Evolution API using setSettings endpoint
  - Store settings locally in Supabase for reference
  - Support all configuration options (rejectCalls, ignoreGroups, alwaysOnline, etc.)
  - _Requirements: 9.1, 9.2, 9.3, 9.6, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 10. Implement WhatsApp context and state management
  - Create WhatsAppContext with React Context API
  - Implement state for instances, selected instance, contacts, and messages
  - Implement selectInstance and selectContact actions
  - Implement sendMessage action with optimistic updates
  - Implement refreshContacts and refreshMessages actions
  - Add loading and error states
  - Set up real-time subscriptions for messages and contacts
  - _Requirements: 2.5, 4.5, 5.1, 5.2, 10.3, 3.1, 3.2, 12.3, 12.5_

- [x] 11. Create WhatsAppConnectionModal component
  - Create modal component with QR code display
  - Implement real-time QR code updates using polling
  - Show connection status (connecting, qr_code, connected)
  - Auto-close modal on successful connection
  - Add error handling for connection failures
  - _Requirements: 2.2, 2.4, 2.5_

- [x] 12. Create WhatsAppInstanceSelector component
  - Create dropdown/selector for switching between instances
  - Display instance name and connection status
  - Show phone number when available
  - Add visual indicator for active instance
  - Trigger context update on instance selection
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13. Create WhatsAppContactList component
  - Create scrollable list of contacts with search input
  - Implement contact type filter (cliente, lead, profissional, prestador)
  - Display contact avatar, name, last message preview
  - Show unread message count badge
  - Highlight selected contact
  - Format last message timestamp (relative time)
  - _Requirements: 5.1, 7.3, 8.4, 8.5_

- [x] 14. Create WhatsAppChatView component
  - Create message list with infinite scroll for pagination
  - Differentiate sent vs received messages visually
  - Display message timestamps
  - Show message status indicators (sent, delivered, read)
  - Implement audio player for voice messages
  - Add loading state for message history
  - Auto-scroll to bottom on new messages
  - Group messages by date with separators
  - _Requirements: 3.5, 3.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 15. Create WhatsAppMessageInput component
  - Create text input with send button
  - Implement audio recording button with recording UI
  - Add quick message autocomplete on "/" trigger
  - Implement variable substitution preview for {nome_cliente}
  - Show "typing" indicator to other party
  - Handle Enter key to send (Shift+Enter for new line)
  - Disable input when instance is disconnected
  - _Requirements: 4.1, 4.2, 6.1, 6.2, 6.3, 6.4_

- [x] 16. Create WhatsAppContactInfoPanel component
  - Create side panel with contact details
  - Display contact type selector with options
  - Show client association status
  - Add button to associate with existing client
  - Add button to create new client from contact
  - Display contact phone number and profile picture
  - _Requirements: 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.6_

- [x] 17. Create WhatsAppSettingsPanel component
  - Create settings form for instance configuration
  - Add toggle for reject calls with message input
  - Add toggle for ignore groups
  - Add toggle for always online
  - Add toggle for read messages automatically
  - Add toggle for read status automatically
  - Add availability schedule editor (days and time ranges)
  - Add auto-reply toggle with message input
  - Save settings to API on change
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 18. Create WhatsAppQuickMessagesManager component
  - Create list of existing quick messages
  - Add form to create new quick message
  - Implement edit functionality for existing messages
  - Implement delete functionality with confirmation
  - Show shortcut and message text in list
  - Add description field for documentation
  - Validate shortcut format (starts with /)
  - _Requirements: 6.5, 6.6_

- [x] 19. Update atendimento page with WhatsApp UI
  - Replace placeholder content with WhatsApp interface
  - Add instance selector at top
  - Add "Connect Number" button when no instances exist
  - Implement three-column layout (contacts, chat, info panel)
  - Add settings button to open settings panel
  - Add quick messages button to open manager
  - Wrap page with WhatsAppContext provider
  - Add loading states for initial data fetch
  - _Requirements: 2.1, 2.2, 10.3, 10.4_

- [x] 20. Implement automatic client matching
  - Create background job or webhook handler for client matching
  - Normalize phone numbers for comparison (remove formatting)
  - Query clients table for matching phone number
  - Update whatsapp_contacts with client_id when match found
  - Update contact name from client name when matched
  - _Requirements: 7.1, 7.2, 7.6, 8.3_

- [x] 21. Implement auto-reply functionality
  - Check availability schedule when message is received
  - Query auto_reply_log to prevent duplicate auto-replies
  - Send auto-reply message if outside availability hours
  - Log auto-reply in auto_reply_log table
  - Respect one auto-reply per conversation per unavailability period
  - _Requirements: 9.4, 9.5_

- [x] 22. Add error handling and user feedback
  - Implement toast notifications for success/error messages
  - Add error boundaries for component error handling
  - Show user-friendly error messages for API failures
  - Add retry mechanism for failed message sends
  - Log errors to console for debugging
  - Handle Evolution API connection errors gracefully
  - _Requirements: 4.6, 12.8_

- [x] 23. Add environment variables documentation
  - Update .env.example with EVOLUTION_API_BASE_URL
  - Update .env.example with EVOLUTION_API_KEY
  - Add comments explaining each variable
  - Document webhook URL format for Evolution API
  - _Requirements: 1.1, 1.2_

- [x] 24. Implement security measures
  - Add webhook signature validation
  - Implement rate limiting on message sending (1 msg/sec per instance)
  - Add input sanitization for message content
  - Validate phone number format before processing
  - Add RLS policies for WhatsApp tables
  - Ensure only authenticated users can access WhatsApp features
  - _Requirements: 12.2_

- [x] 25. Performance optimizations
  - Add database indexes for frequently queried columns
  - Implement message pagination with cursor-based approach
  - Add caching for instance settings
  - Optimize contact list queries with proper joins
  - Lazy load contact profile pictures
  - Debounce search input in contact list
  - _Requirements: 5.6_

- [ ] 27. Create database migration script
  - Write complete SQL migration file
  - Include all table definitions
  - Include all indexes
  - Include RLS policies
  - Include triggers for updated_at columns
  - Add rollback script for migration
  - Test migration on clean database
  - _Requirements: 1.1, 1.2_
