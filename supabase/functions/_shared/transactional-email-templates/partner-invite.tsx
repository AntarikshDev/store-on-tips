/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface PartnerInviteProps {
  partnerName?: string
  licenseCount?: number
  acceptUrl?: string
  partnerType?: string
}

const PartnerInviteEmail = ({
  partnerName = 'Partner',
  licenseCount = 1,
  acceptUrl = '#',
  partnerType = 'agency',
}: PartnerInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to the Pic To Cart Partner Program</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>Pic To Cart</Heading>
        <Heading style={h1}>Welcome to the Partner Program, {partnerName}!</Heading>
        <Text style={text}>
          You have been invited as a <strong>{partnerType}</strong> partner on Pic To Cart, India's
          fastest e-commerce builder for small sellers.
        </Text>
        <Section style={highlight}>
          <Text style={highlightText}>
            <strong>{licenseCount}</strong> client license{licenseCount === 1 ? '' : 's'} have been allocated to your account.
          </Text>
          <Text style={highlightSub}>
            Each license lets you build and launch one complete client store — products, payments, shipping, branding, the works.
          </Text>
        </Section>
        <Text style={text}>
          Click the button below to set your password and access your partner dashboard.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={acceptUrl} style={button}>
            Accept invite & set password
          </Button>
        </Section>
        <Text style={muted}>
          This invite link expires in 7 days. If you didn't expect this email, please ignore it.
        </Text>
        <Text style={footer}>— The Pic To Cart Team<br/>partners@pictocart.in</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PartnerInviteEmail,
  subject: 'You\'re invited to the Pic To Cart Partner Program',
  displayName: 'Partner invite',
  previewData: {
    partnerName: 'Acme Digital',
    licenseCount: 10,
    acceptUrl: 'https://pictocart.in/partner/accept?token=demo',
    partnerType: 'agency',
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
