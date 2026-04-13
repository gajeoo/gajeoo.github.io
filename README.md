# WarehouseRide - Complete Transportation Business Platform

A fully-developed website for WarehouseRide transportation business with customer authentication, admin dashboard, email integration, and live chat support.

## Project Structure

```
├── index.html              # Main website homepage
├── signin.html             # Customer sign-in page
├── signup.html             # Customer registration page
├── forgot-password.html    # Password recovery page
├── account.html            # Customer dashboard
├── admin.html              # Admin management dashboard
├── server.js               # Express.js backend server
├── script.js               # Frontend/auth JavaScript
├── chat-widget.js          # Embedded chat widget
├── styles.css              # Styling
├── logo.svg                # WarehouseRide logo
├── package.json            # Node.js dependencies
└── .env                    # Configuration (create from .env.example)
```

## Features

### Customer Features
- **User Authentication**: Sign up, sign in, password recovery
- **Secure Passwords**: Bcrypt hashing for data security
- **Customer Dashboard**: View account information and enquiries
- **Service Enquiries**: Request transport services (passenger/cargo)
- **Live Chat Widget**: Real-time communication with support team
- **Responsive Design**: Works on desktop, tablet, and mobile

### Admin Features
- **Admin Dashboard**: Manage customers and enquiries
- **Customer Management**: View customer details, chat history, enquiries
- **Enquiry Tracking**: Update enquiry status (new → in-progress → resolved)
- **Statistics**: Real-time customer and enquiry counts
- **Secure Login**: Admin-only access to sensitive data

### Technical Features
- **SQLite Database**: Persistent data storage
- **REST API**: Complete backend API for all operations
- **Email Notifications**: Send welcome emails, password reset links, enquiry confirmations
- **Chat System**: Persistent messaging between customers and support
- **CORS Enabled**: Ready for frontend-backend integration

## Setup Instructions

### Prerequisites
- Node.js 14+ (download from https://nodejs.org)
- npm (comes with Node.js)

### Installation Steps

1. **Navigate to project folder**
   ```bash
   cd "C:\Users\gajeo\Dropbox\PC\Documents\shop"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (Optional - for email)
   ```bash
   Copy .env.example to .env
   Add your Gmail or email service credentials
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```
   
   The server will start on `http://localhost:5000`

5. **Open the website**
   ```
   Open index.html in your web browser
   (or open http://localhost:5000 if serving with backend)
   ```

## Using the Platform

### Customer Flow
1. Open `index.html`
2. Click "Sign Up" to create account
3. Fill in name, email, password
4. Sign in with your credentials
5. Submit transport enquiries via the contact form
6. Use the chat widget (bottom-right) to communicate with support

### Admin Access
1. Open `admin.html` (or `http://localhost:5000/admin.html`)
2. **Default Credentials**:
   - Username: `*****`
   - Password: `********`
3. View all customers and enquiries
4. Click "View" to see detailed customer information
5. Update enquiry status
6. Monitor chat conversations

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new customer
- `POST /api/auth/signin` - Customer login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Enquiries
- `POST /api/enquiries` - Submit new enquiry
- `GET /api/enquiries/:customerId` - Get customer enquiries

### Chat
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/:customerId` - Get chat history

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/customers` - List all customers
- `GET /api/admin/enquiries` - List all enquiries
- `GET /api/admin/customers/:customerId` - Get customer details
- `PATCH /api/admin/enquiries/:enquiryId` - Update enquiry status

## Email Configuration

### Using Gmail with App Passwords
1. Go to https://myaccount.google.com/apppasswords
2. Generate an app-specific password
3. Copy to `.env` file:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```
4. Restart server

### Without Email Service
Leave email configuration empty or use default. Server will skip email errors gracefully.

## Chat Widget

The chat widget is automatically embedded on all pages via `chat-widget.js`. It:
- Appears in bottom-right corner
- Requires customer email to start chat
- Persists messages in database
- Supports multiple customers simultaneously
- Collapsible/expandable interface

## Database

SQLite database (`warehouseride.db`) is created automatically with:
- **customers** table: User accounts
- **enquiries** table: Service requests
- **chat_messages** table: Support conversations
- **admin_users** table: Admin accounts
- **password_resets** table: Password recovery tokens

## Troubleshooting

### Server fails to start
```bash
Error: EADDRINUSE: address already in use :::5000
```
Solution: Change PORT in .env or kill process using port 5000

### Chat widget is empty
- Confirm backend is running on port 5000
- Check browser console for API errors
- Email must exist to start chat

### Sign in fails
- Verify backend is running
- Check email/password are correct
- Check backend console for errors

### Email not sending
- Email service is optional - system works without it
- If enabled, check Gmail app password setup
- See email configuration section above

## File Descriptions

| File | Purpose |
|------|---------|
| `server.js` | Express backend, database, API endpoints |
| `script.js` | Frontend auth & enquiry handling |
| `chat-widget.js` | Floating chat interface |
| `admin.html` | Admin management dashboard |
| `styles.css` | Dark theme styling (shared across pages) |
| `*.html` | Frontend pages (responsive UI) |

## Security Notes

- Passwords are hashed with bcryptjs
- Admin panel accepts default credentials (change in production!)
- Email configuration should never be committed
- SQL injection protected via parameterized queries

## Next Steps for Production

1. Change default admin password
2. Set up proper email service
3. Add HTTPS/SSL certificates
4. Implement API authentication tokens
5. Add rate limiting
6. Set up database backups
7. Deploy to production server

## Support

For issues or customizations, check:
- Browser console (F12) for errors
- Server console output
- `warehouseride.db` file (SQLite database)

---

**WarehouseRide** - Reliable transport solutions for your business.
