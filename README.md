# Modernized Events App

A comprehensive event planning platform built with Next.js, Supabase, and modern web technologies.

## Features

- Multi-user type support (Regular, Professional, Vendor)
- Event planning and management
- Real-time chat system
- Interactive maps and seating arrangements
- Budget tracking
- Professional dashboard
- Vendor management

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install` or `pnpm install`
3. Set up your Supabase project and update the configuration in `lib/supabase.ts`
4. Run the development server: `npm run dev` or `pnpm dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Troubleshooting

### "Invalid Refresh Token: Refresh Token Not Found" Error

This error typically occurs when:
- The refresh token has expired
- Browser storage was cleared
- Multiple Supabase instances are conflicting
- The token is corrupted

#### Quick Fixes:

1. **Clear Authentication State**: Visit `/auth/debug` and click "Clear All Auth Data"
2. **Manual Browser Clear**: 
   - Open Developer Tools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage and Session Storage
   - Refresh the page
3. **Hard Refresh**: Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to clear cache
4. **Incognito Mode**: Try accessing the app in an incognito/private window

#### Prevention:

The app now includes automatic error handling that will:
- Detect refresh token errors
- Clear corrupted authentication state
- Redirect users to login
- Provide helpful error messages

#### Debug Page:

Access `/auth/debug` to:
- Check current authentication status
- View stored authentication keys
- Clear authentication data
- Refresh sessions manually

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks and Supabase real-time subscriptions

## Project Structure

```
modernized-events-app/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── components/        # Shared components
│   ├── dashboard/         # User dashboard
│   ├── professional/      # Professional user features
│   └── vendor/           # Vendor features
├── components/            # UI components
├── lib/                  # Utilities and configurations
└── scripts/              # Database scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
