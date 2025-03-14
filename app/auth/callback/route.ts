import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'
import { createStripeCustomer } from '@/utils/stripe/api'
import { db } from '@/utils/db/db'
import { usersTable } from '@/utils/db/schema'
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';  // Import UUID generation

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            // Check if user already exists in DB
            const checkUserInDB = await db.select().from(usersTable).where(eq(usersTable.email, user!.email!))
            const isUserInDB = checkUserInDB.length > 0 ? true : false
            if (!isUserInDB) {
                // Create Stripe customer
                const stripeID = await createStripeCustomer(user!.id, user!.email!, user!.user_metadata.full_name)
                
                // Insert a new user record with generated UUID for 'id'
                await db.insert(usersTable).values({
                    id: uuidv4(),  // Generate a new UUID for 'id'
                    name: user!.user_metadata.full_name,
                    email: user!.email!,
                    stripe_id: stripeID,
                    plan: 'none',
                })
            }

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
