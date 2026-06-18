/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ClientStoreInviteProps {
  storeName?: string
  partnerName?: string
  plan?: string
  acceptUrl?: string
}

const ClientStoreInviteEmail = ({
  storeName = 'Your Store',
  partnerName = 'Your partner',
  plan = 'Starter',
  acceptUrl = '#',
}: ClientStoreInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your new Pic To Cart store {storeName} is ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>Pic To Cart</Heading>
        <Heading style={h1}>Your new store "{storeName}" is ready!</Heading>
        <Text style={text}>
          {partnerName} has built a complete online store for you on Pic To Cart — India's fastest
          e-commerce builder for small sellers.
        </Text>
        <Section style={highlight}>
          <Text style={highlightText}>
            Plan: <strong>{plan}</strong>
          </Text>
          <Text style={highlightSub}>
            Click below to set your password and take ownership of the store. Once you're in, you can
            start adding products, accepting orders, and growing your business.
          </Text>
        </Section>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={acceptUrl} style={button}>
            Set password & open my store
          </Button>
        </Section>
        <Text style={muted}>
          This link expires in 14 days. If you didn't expect this email, please ignore it.
        </Text>
        <Text style={footer}>— The Pic To Cart Team<br/>support@pictocart.in</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ClientStoreInviteEmail,
  subject: (d: Record<string, any>) => `Your new Pic To Cart store "${d.storeName || 'Store'}" is ready`,
  displayName: 'Client store invite',
  previewData: {
    storeName: 'Sharma General Store',
    partnerName: 'Acme Digital',
    plan: 'Starter',
    acceptUrl: 'https://pictocart.in/store-invite/accept?token=demo',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px 40px' }
const brand = { fontSize: '14px', fontWeight: 700 as const, color: '#F97316', letterSpacing: '1px', textTransform: 'uppercase' as const, margin: '0 0 12px' }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: '#0F172A', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 18px' }
const highlight = { backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', padding: '20px', margin: '20px 0' }
const highlightText = { fontSize: '16px', color: '#9A3412', margin: '0 0 8px', lineHeight: '1.4' }
const highlightSub = { fontSize: '13px', color: '#9A3412', margin: 0, lineHeight: '1.5' }
const button = { backgroundColor: '#F97316', color: '#ffffff', fontSize: '15px', fontWeight: 600 as const, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none' as const, display: 'inline-block' as const }
const muted = { fontSize: '13px', color: '#64748B', lineHeight: '1.6', margin: '24px 0 0' }
const footer = { fontSize: '12px', color: '#94A3B8', lineHeight: '1.6', margin: '32px 0 0', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }
