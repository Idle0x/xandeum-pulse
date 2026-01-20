// schemas.ts
import { z } from 'zod';

// 1. RPC Node Schema (The raw data from Xandeum RPCs)
// We use .transform() to automatically fix bad data (e.g. converting "100" string to 100 number)
export const RawNodeSchema = z.object({
  address: z.string().default(''),
    pubkey: z.string().or(z.undefined()).transform(val => val || 'Unknown'),
      public_key: z.string().optional(), // Handle the alternate key name
        version: z.string().nullable().optional().transform(v => v || '0.0.0'),
          uptime: z.union([z.number(), z.string()]).transform(v => Number(v) || 0),
            last_seen_timestamp: z.number().optional().default(0),
              is_operator: z.boolean().optional().default(false),
                storage_committed: z.union([z.number(), z.string()]).transform(v => Number(v) || 0),
                  storage_used: z.union([z.number(), z.string()]).transform(v => Number(v) || 0),
                    // Allow extra fields without crashing
                    }).passthrough();

                    // 2. Credits Schema
                    export const CreditItemSchema = z.object({
                      pod_id: z.string().optional(),
                        pubkey: z.string().optional(),
                          node: z.string().optional(),
                            amount: z.union([z.string(), z.number()]).optional(),
                              credits: z.union([z.string(), z.number()]).optional(),
                              });

                              export const CreditsResponseSchema = z.object({
                                pods_credits: z.array(CreditItemSchema).optional(),
                                }).or(z.array(CreditItemSchema)); // Handle if API returns direct array

                                // 3. Helper to unify Pubkey extraction
                                export const extractPubkey = (node: any) => node.pubkey || node.public_key || 'Unknown';