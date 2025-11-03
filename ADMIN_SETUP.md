# Admin User Setup Instructions

## Creating the First Admin Account

### Method 1: Via Supabase Dashboard (Recommended)

1. **Create User in Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **Authentication** > **Users**
   - Click **Add user** button
   - Enter details:
     - Email: `admin@figureit.com` (or your preferred email)
     - Password: (set a secure password)
     - Auto Confirm User: **YES** (check this box)
   - Click **Create user**

2. **Grant Admin Privileges**
   - Go to **SQL Editor** in Supabase Dashboard
   - Run this command (replace email with your admin email):
   ```sql
   UPDATE public.user_profiles
   SET role = 'admin',
       is_approved = TRUE
   WHERE email = 'admin@figureit.com';
   ```

3. **Verify Admin Access**
   - Go to your app's `/login` page
   - Sign in with the admin credentials
   - You should now have admin access

### Method 2: Direct Database Creation (Advanced)

If you need to create admin without using the dashboard:

```sql
SELECT create_first_admin('admin@figureit.com', 'YourSecurePassword123!', 'Admin Name');
```

Note: This requires running in Supabase SQL Editor with proper permissions.

## How Users Are Created

### Admin Creates Users (Only Method Available)

1. **Admin logs in** to the application
2. **Navigate to** `/create-user` page
3. **Fill in user details**:
   - Full Name
   - Email
   - Role (User or Admin)
   - Click "Generate" for temporary password or enter manually
4. **Save the temporary password** - share it securely with the new user
5. **User receives** email and temporary password from admin
6. **User signs in** for the first time with temporary password
7. **User changes password** after first login

### Self-Registration is Disabled

- Users cannot register themselves
- The `/register` page displays a message directing users to contact admin
- Only admins can create new user accounts

## Managing Users

### Admin Role
- Can view all user profiles
- Can approve/reject users
- Can view all assets
- Can delete any assets
- Automatically approved (is_approved = TRUE)

### User Role
- Must be approved by admin before uploading assets
- Can only view their own assets
- Can upload, update, and delete their own assets
- Cannot see other users' data

## Security Features

1. **No Cascade Delete**: User deletion is restricted (ON DELETE RESTRICT)
   - If a user has assets, they cannot be deleted
   - Admin must first reassign or delete assets manually

2. **User Approval Required**: New users cannot upload until approved
   - Registration creates account but sets is_approved = FALSE
   - Only admins can set is_approved = TRUE

3. **Row Level Security**: All tables have RLS enabled
   - Users can only access their own data
   - Admins have full access via RLS policies

## Troubleshooting

**Issue**: Can't sign in after creating admin
- **Solution**: Make sure you ran the `create_admin_user()` function

**Issue**: Regular users can't upload
- **Solution**: Admin needs to approve them via SQL or admin panel

**Issue**: Assets still visible after user delete attempt
- **Solution**: This is by design (ON DELETE RESTRICT). Delete assets first.
