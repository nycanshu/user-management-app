import { NextResponse } from 'next/server';

export async function POST() {
  const params = new URLSearchParams();
  params.append('client_id', 'admin-cli');
  params.append('username', 'admin');
  params.append('password', 'admin');
  params.append('grant_type', 'password');

  try {
    const res = await fetch('http://localhost:8080/realms/master/protocol/openid-connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json({ token: data.access_token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
