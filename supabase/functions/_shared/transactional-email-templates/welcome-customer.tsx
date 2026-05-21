/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface WelcomeCustomerProps {
  storeName?: string
  name?: string
  storeUrl?: string
}

const WelcomeCustomerEmail = ({
  storeName = 'our store',
  name,
  storeUrl = '#',
}: WelcomeCustomerProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {storeName} 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {storeName}!</Heading>
        <Text style={text}>{name ? `Hi ${name},` : 'Hi there,'}</Text>
        <Text style={text}>
          Thanks for creating an account with <strong>{storeName}</strong>.
          You're all set to shop, track orders, save your favourites and check
          out faster on every visit.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={storeUrl} style={button}>
            Start shopping
          </Button>
        </Section>
        <Text style={muted}>
          If you didn't create this account, you can safely ignore this email.
        </Text>
        <Text style={footer}>— The {storeName} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeCustomerEmail,
  subject: (data: Record<string, any>) =>
    `Welcome to ${data?.storeName || 'our store'} 🎉`,
  displayName: 'Customer welcome',
  previewData: {
    storeName: 'Indilipi',
    name: 'Aarav',
    storeUrl: 'https://indilipi.shop',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px 40px' }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: '#0F172A', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 18px' }
const button = {
  backgroundColor: '#F97316',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none' as const,
  display: 'inline-block' as const,
}
const muted = { fontSize: '13px', color: '#64748B', lineHeight: '1.6', margin: '24px 0 0' }
const footer = { fontSize: '12px', color: '#94A3B8', lineHeight: '1.6', margin: '32px 0 0', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }
