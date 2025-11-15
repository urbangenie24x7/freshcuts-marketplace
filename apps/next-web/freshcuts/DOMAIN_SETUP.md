# Domain Setup for FreshCuts

## Custom Domain Added ✅
**Domain:** freshcuts.urbangenie24x7.com
**Status:** Pending DNS Configuration

## DNS Configuration Required

### Option A: A Record (Recommended)
Add this A record to your DNS provider:

```
Type: A
Name: freshcuts
Value: 76.76.21.21
TTL: 300 (or default)
```

### Option B: CNAME Record (Alternative)
If A record doesn't work, use CNAME:

```
Type: CNAME  
Name: freshcuts
Value: cname.vercel-dns.com
TTL: 300 (or default)
```

## DNS Provider Instructions

### For Namecheap/GoDaddy:
1. Go to DNS Management
2. Add new A record:
   - Host: freshcuts
   - Value: 76.76.21.21
   - TTL: Automatic

### For Cloudflare:
1. Go to DNS settings
2. Add A record:
   - Name: freshcuts
   - IPv4 address: 76.76.21.21
   - Proxy status: DNS only (gray cloud)

## Verification
- DNS changes take 5-60 minutes to propagate
- Vercel will automatically verify and issue SSL certificate
- You'll receive email confirmation when ready

## Final URLs
- **Production:** https://freshcuts.urbangenie24x7.com
- **Current:** https://freshcuts-marketplace-q2zs3drhm-santoshs-projects-dec33082.vercel.app

## Multi-Vertical Strategy
This sets up the subdomain structure for:
- freshcuts.urbangenie24x7.com (Meat marketplace)
- grocery.urbangenie24x7.com (Future)
- health.urbangenie24x7.com (Future)
- services.urbangenie24x7.com (Future)