# Implementation Plan - Email Client

- [x] 1. Configure Microsoft authentication and Graph API client
  - [x] 1.1 Update Microsoft OAuth scopes for email access
    - Modify the existing Microsoft login in `app/(auth)/login/page.tsx` to include Graph API scopes
    - Change scopes from "email" to "email Mail.Read Mail.ReadWrite offline_access"
    - Verify Supabase Dashboard has Microsoft provider configured with these scopes
    - _Requirements: 4.1, 4.4_
  
  - [x] 1.2 Create Microsoft Graph API client utility
    - Implement `lib/microsoft/graph-client.ts` with methods for folders, messages, search, and attachments
    - Add TypeScript interfaces for MailFolder, EmailMessage, EmailBody, and Attachment
    - Implement error handling for API responses
    - _Requirements: 1.2, 2.2, 3.3, 4.4, 5.2_
  
  - [x] 1.3 Create token management utility
    - Implement function to extract provider_token from Supabase session
    - Add token refresh logic with fallback to login redirect
    - Handle token expiration scenarios
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. Implement email context and state management
  - [x] 2.1 Create EmailContext provider
    - Implement `contexts/email-context.tsx` with state for folders, emails, selected items, loading, and errors
    - Add actions: selectFolder, selectEmail, searchEmails, refreshFolders, refreshEmails, loadMoreEmails
    - Integrate with Microsoft Graph client
    - _Requirements: 1.1, 1.5, 2.1, 2.5, 3.2, 3.5, 5.1, 6.3_
  
  - [x] 2.2 Add loading and error state management
    - Implement loading states for different operations (folders, emails, search)
    - Add error handling with user-friendly messages
    - Implement retry logic for failed requests
    - _Requirements: 4.5, 6.1, 6.2_

- [x] 3. Build folder sidebar component
  - [x] 3.1 Create FolderSidebar component
    - Implement `components/email/folder-sidebar.tsx` to display folder list on the left
    - Show folder names with unread count badges
    - Highlight selected folder
    - Handle folder click to load emails
    - _Requirements: 1.1, 1.3, 1.4, 1.5_
  
  - [x] 3.2 Style folder sidebar with responsive design
    - Apply consistent styling with app theme
    - Add hover and active states
    - Ensure responsive behavior for mobile
    - _Requirements: 6.5_

- [x] 4. Build email list panel component
  - [x] 4.1 Create EmailListPanel component
    - Implement `components/email/email-list-panel.tsx` with search bar at top
    - Display email list with sender, subject, preview, and date
    - Visually distinguish read vs unread emails
    - Handle email selection
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1_
  
  - [x] 4.2 Implement search functionality
    - Add search input with debouncing (300ms)
    - Integrate with Graph API search endpoint
    - Show search results with highlighted terms
    - Clear search to restore folder view
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 4.3 Add pagination and infinite scroll
    - Implement loadMoreEmails when scrolling to bottom
    - Show loading indicator while fetching more emails
    - Handle pagination with $skip and $top parameters
    - _Requirements: 2.5_

- [x] 5. Build email viewer component
  - [x] 5.1 Create EmailViewer component
    - Implement `components/email/email-viewer.tsx` to display full email content
    - Show email metadata (sender, recipients, date, subject)
    - Render HTML email body safely (sanitize HTML)
    - Mark email as read when opened
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 5.2 Implement attachment handling
    - Display list of attachments with name, type, and size
    - Add download button for each attachment
    - Implement download functionality using Graph API
    - _Requirements: 5.5_

- [x] 6. Integrate components in email page
  - [x] 6.1 Update email page with layout
    - Modify `app/(app)/email/page.tsx` to use EmailProvider
    - Create two-column layout: FolderSidebar (left) and main content (right)
    - Main content shows EmailListPanel and EmailViewer based on selection
    - _Requirements: 1.1, 2.1, 6.3_
  
  - [x] 6.2 Add loading states and error boundaries
    - Show skeleton loaders while fetching data
    - Display error messages with retry buttons
    - Handle empty states (no folders, no emails)
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [x] 6.3 Implement responsive layout
    - Ensure layout works on mobile (stack vertically or use drawer)
    - Test on different screen sizes
    - Add proper spacing and padding
    - _Requirements: 6.5_

---

## Future Enhancements (Optional)

- [ ] 7. Polish and advanced features
  - [ ] 7.1 Implement keyboard navigation
    - Add keyboard shortcuts for navigation (j/k for up/down, enter to open)
    - Support Escape to close email viewer
    - _Requirements: 6.4_
  
  - [ ] 7.2 Add accessibility improvements
    - Add ARIA labels to interactive elements
    - Ensure proper focus management
    - Test with screen readers
    - _Requirements: 6.4_
  
  - [ ] 7.3 Optimize performance with advanced caching
    - Implement React Query for caching folders and emails
    - Add virtual scrolling for large email lists (if needed)
    - Optimize re-renders with React.memo
    - _Requirements: 6.1_
