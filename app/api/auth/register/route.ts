import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail, store } from '@/lib/data/store';
import { createToken } from '@/lib/auth';
import { hashSync } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, role } = await req.json();

    if (findUserByEmail(email)) {
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }

    const userRole = role || 'citizen';
    const newUser = {
      id: `usr-${userRole}-${Date.now()}`,
      name,
      email,
      password: hashSync(password, 10),
      phone,
      role: userRole as any,
      createdAt: new Date().toISOString()
    };

    store.users.push(newUser);

    const payload = { userId: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
    const token = await createToken(payload);
    
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return Response.json({ user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } });
  } catch (error) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}