# Scheduler Tool

A modern, Calendly-inspired scheduling tool built with Next.js and React. This is an independent booking system that can be deployed to a separate subdomain and integrated with your main application via API calls.

## 🚀 Features

- **Modern UI**: Clean, Calendly-inspired interface with smooth animations
- **JWT Authentication**: Secure token-based authentication
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Multi-step Booking**: Date selection → Time selection → Details → Confirmation
- **Admin Panel**: Optional admin interface for managing bookings
- **API Integration**: Ready to connect with your main app's API
- **Independent Deployment**: Can be deployed to a separate subdomain

## 📁 Project Structure

```
scheduler-tool/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Admin panel for managing bookings
│   ├── globals.css           # Global styles with Tailwind CSS
│   ├── layout.tsx            # Root layout component
│   └── page.tsx              # Main booking page
├── components/
│   ├── BookingForm.tsx       # Main booking form component
│   └── Unauthorized.tsx      # Unauthorized access component
├── lib/
│   ├── auth.ts               # JWT authentication utilities
│   └── api.ts                # API integration functions
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🛠️ Installation

1. **Clone or create the project**:
   ```bash
   # If you're creating this as a new project
   mkdir scheduler-tool
   cd scheduler-tool
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.local.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://api.mycompany.com
   NEXT_PUBLIC_SCHEDULER_DOMAIN=scheduler.mycompany.com
   JWT_SECRET=your-jwt-secret-here
   JWT_EXPIRES_IN=24h
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for your main app's API | `https://api.mycompany.com` |
| `NEXT_PUBLIC_SCHEDULER_DOMAIN` | Domain where scheduler will be deployed | `scheduler.mycompany.com` |
| `JWT_SECRET` | Secret for JWT token validation | Required |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` |

### API Integration

The scheduler tool expects your main app to provide these API endpoints:

1. **GET** `/api/scheduler/slots` - Get available booking slots
2. **POST** `/api/scheduler/book` - Submit a booking request
3. **GET** `/api/scheduler/link/{token}` - Validate booking link token

See `lib/api.ts` for the expected request/response formats.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set up custom domain**:
   - Go to your Vercel dashboard
   - Select the scheduler project
   - Go to Settings → Domains
   - Add your custom domain: `scheduler.mycompany.com`

### Deploy to Netlify

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `.next`
   - Add your custom domain in Netlify settings

### Deploy to Other Platforms

The project is configured to work with any platform that supports Next.js:

- **Railway**: Connect GitHub repo and deploy
- **Render**: Connect GitHub repo and deploy
- **DigitalOcean App Platform**: Connect GitHub repo and deploy

## 🔗 Integration with Main App

### 1. Update Your Main App's Vendor Page

In your main app's vendor page, update the "Open Link" button to point to the scheduler:

```tsx
// In your vendors page
<Button 
  size="sm" 
  variant="outline"
  onClick={() => window.open(`https://scheduler.mycompany.com?token=${link.link_token}`, '_blank')}
>
  <Link className="w-4 h-4 mr-2" />
  Open Scheduler
</Button>
```

### 2. Generate JWT Tokens

Your main app should generate JWT tokens for booking links. Example:

```javascript
// In your main app
import jwt from 'jsonwebtoken';

const generateBookingToken = (bookingLinkId, eventId) => {
  return jwt.sign(
    {
      sub: bookingLinkId,
      event_id: eventId,
      type: 'booking_link',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    },
    process.env.JWT_SECRET
  );
};
```

### 3. API Endpoints

Implement these endpoints in your main app:

```javascript
// GET /api/scheduler/slots
app.get('/api/scheduler/slots', (req, res) => {
  const { start_date, end_date, event_id } = req.query;
  // Return available slots
  res.json({
    success: true,
    slots: [
      { date: '2024-02-15', times: ['09:00 AM', '10:00 AM', '11:00 AM'] }
    ]
  });
});

// POST /api/scheduler/book
app.post('/api/scheduler/book', (req, res) => {
  const bookingData = req.body;
  // Save booking to database
  res.json({
    success: true,
    booking_id: 'generated-id',
    message: 'Booking submitted successfully'
  });
});

// GET /api/scheduler/link/:token
app.get('/api/scheduler/link/:token', (req, res) => {
  const { token } = req.params;
  // Validate token and return booking link details
  res.json({
    success: true,
    link: { /* booking link details */ }
  });
});
```

## 🔒 Security Considerations

1. **HTTPS Only**: Always deploy with HTTPS enabled
2. **JWT Validation**: Implement proper JWT token validation
3. **CORS**: Configure CORS properly for cross-domain requests
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Input Validation**: Validate all user inputs on both client and server

## 🎨 Customization

### Styling

The tool uses Tailwind CSS. You can customize the design by:

1. Modifying `tailwind.config.js` for colors and fonts
2. Updating `app/globals.css` for custom styles
3. Modifying component classes in the React components

### Branding

Update the following files to match your brand:

- `app/layout.tsx` - Update title and meta tags
- `components/BookingForm.tsx` - Update header text and colors
- `components/Unauthorized.tsx` - Update branding

### Time Slots

Modify the time slots in `components/BookingForm.tsx`:

```typescript
const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', // ... your preferred times
];
```

## 🐛 Troubleshooting

### Common Issues

1. **JWT Token Issues**:
   - Ensure JWT_SECRET is set correctly
   - Check token expiration
   - Verify token format

2. **API Connection Issues**:
   - Check CORS configuration
   - Verify API endpoints are accessible
   - Check network connectivity

3. **Deployment Issues**:
   - Ensure environment variables are set
   - Check build logs for errors
   - Verify domain configuration

### Development Tips

1. **Local Development**:
   ```bash
   # Run with specific port
   npm run dev -- -p 3001
   ```

2. **Environment Variables**:
   - Use `.env.local` for local development
   - Set production variables in your deployment platform

3. **Debug Mode**:
   - Add `console.log` statements in components
   - Use browser dev tools to inspect network requests

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:

1. Check the troubleshooting section above
2. Review the API integration documentation
3. Open an issue in the repository

---

**Note**: This is a standalone scheduling tool designed to work independently from your main application. It connects via API calls and can be deployed to a separate subdomain for better separation of concerns. 