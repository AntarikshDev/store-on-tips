/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface CustomerPasswordResetProps {
  storeName?: string
  name?: string
  resetUrl?: string
}

const CustomerPasswordResetEmail = ({
  storeName = 'our store',
  name,
  resetUrl = '#',
}: CustomerPasswordResetProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your {storeName} password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>{name ? `Hi ${name},` : 'Hi there,'}</Text>
        <Text style={text}>
          We received a request to reset the password for your{' '}
          <strong>{storeName}</strong> account. Tap the button below to choose
          a new password — the link is valid for the next hour.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={resetUrl} style={button}>
            Reset my password
          </Button>
        </Section>
        <Text style={muted}>
          Didn't request this? You can safely ignore this email — your password
          will stay the same.
        </Text>
        <Text style={footer}>— The {storeName} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CustomerPasswordResetEmail,
  subject: (data: Record<string, any>) =>
    `Reset your ${data?.storeName || 'store'} password`,
  displayName: 'Customer password reset',
  previewData: {
    storeName: 'Indilipi',
    name: 'Aarav',
    resetUrl: 'https://indilipi.shop/store/indilipi/reset-password#access_token=...',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const container = { padding: '32px 24px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '0 0 24px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const muted = { fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: '24px 0 0' }
const footer = { fontSize: '13px', color: '#94A3B8', margin: '24px 0 0' }
const button = {
  backgroundColor: '#0F172A',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block',
}
