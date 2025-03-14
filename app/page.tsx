import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Star, Check, Coins, UserCheck, Database } from "lucide-react";
import Stripe from 'stripe';

// Types
interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  features: string[];
  price: Stripe.Price | null; // Updated to allow null prices
}

// This makes the page dynamic instead of static
export const revalidate = 3600; // Revalidate every hour

async function getStripeProducts(): Promise<StripeProduct[]> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
  });

  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
  });

  return products.data.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    features: product.metadata?.features ? JSON.parse(product.metadata.features) : [],
    price: product.default_price ? product.default_price : null, // Ensure price is either Stripe.Price or null
  }));
}

export default async function LandingPage() {
  const products = await getStripeProducts();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-white border-b fixed border-b-slate-200 w-full">
        <Link className="flex items-center justify-center" href="#">
          <Image src="/logo.png" alt="logo" width={50} height={50} />
          <span className="sr-only">Acme Inc</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <a className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </a>
          <a className="text-sm font-medium hover:underline underline-offset-4" href="#testimonials">
            Testimonials
          </a>
          <a className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
            Pricing
          </a>
        </nav>
        <Button className="mx-2 md:mx-4 lg:mx-6 xl:mx-10">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Get Started
          </Link>
        </Button>
      </header>

      <main className="flex-1">
        <section className="w-full py-20 lg:py-32 xl:py-40">
          <div className="container px-4 md:px-6 flex flex-col md:flex-row">
            <div className="flex flex-col space-y-4 md:w-1/2 w-full">
              <div className="space-y-2">
                <h1 className="text-2xl tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl/none">
                  Saas Template with Supabase, Stripe, Databases
                </h1>
                <p className="text-muted-foreground md:text-xl">
                  NextJS Boilerplate with everything required to build your next SAAS Product
                </p>
              </div>
              <div className="space-x-4">
                <Button>Get Started</Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
            <div className="w-full md:w-1/2 flex justify-center">
              <Image src="/hero.png" alt="Hero" width={500} height={500} priority />
            </div>
          </div>
        </section>

        <section className="w-full py-10 md:py-20 lg:py-32 bg-muted" id="features">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-4">Our Features</h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {product.price
                        ? `$${(product.price.unit_amount / 100).toFixed(2)}`
                        : 'Custom'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
