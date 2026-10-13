import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, verifyPassword, hashPassword } from '@/lib/auth';
import { getAdminUser, updateAdminPassword } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 });
    }

    if (newPassword.length < 10) {
      return NextResponse.json({ error: 'New password must be at least 10 characters long' }, { status: 400 });
    }

    if (!/[A-Za-z]/.test(newPassword) || !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'New password must contain both letters and at least one number or special symbol' },
        { status: 400 }
      );
    }

    const admin = await getAdminUser();
    const isValid = verifyPassword(currentPassword, admin.passwordHash, admin.salt);
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    const { hash, salt } = hashPassword(newPassword);
    await updateAdminPassword(hash, salt);

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    if (error.name === 'MongoUnavailableError') {
      return NextResponse.json({ error: 'Database unavailable. Change was not saved.' }, { status: 503 });
    }
    console.error('Password change error:', error?.message || 'Password update failure');
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
